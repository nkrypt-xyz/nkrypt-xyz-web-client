<script lang="ts">
  // Core
  import { onMount } from "svelte";
  // UI / Framework Library Item
  import Button, { Icon, Label } from "@smui/button";
  import Drawer, {
    Content,
    Header,
    Scrim,
    Subtitle,
    Title as DrawerTitle,
  } from "@smui/drawer";
  import IconButton from "@smui/icon-button";
  import List, { Item, Text } from "@smui/list";
  import type { TopAppBarComponentDev } from "@smui/top-app-bar";
  import TopAppBar, {
    AutoAdjust,
    Row,
    Section,
    Title,
  } from "@smui/top-app-bar";
  // Routing
  import Router, { push, replace } from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  // Pages
  import CreateBucketPage from "./component/page/CreateBucketPage.svelte";
  import DashboardPage from "./component/page/DashboardPage.svelte";
  import ExplorePage from "./component/page/ExplorePage.svelte";
  import LoginPage from "./component/page/LoginPage.svelte";
  // Components
  import Footer from "./component/common/Footer.svelte";
  import ObtrusiveLoader from "./component/common/ObtrusiveLoader.svelte";
  import AlertDialog from "./component/dialog/AlertDialog.svelte";
  import BucketPasswordDialog from "./component/dialog/BucketPasswordDialog.svelte";
  import ConfirmationDialog from "./component/dialog/ConfirmationDialog.svelte";
  import PromptDialog from "./component/dialog/PromptDialog.svelte";
  // Stores
  import { activeBucket, bucketList } from "./store/content.js";
  import { storedSession } from "./store/session.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
  } from "./store/ui.js";
  import { storedUser } from "./store/user.js";
  // Integrations
  import { callBucketListApi } from "./integration/content-apis.js";
  // Local Misc
  import { handleAnyError } from "./lib/error-handling.js";
  import { performUserLogout } from "./lib/session.js";
  import { createDebouncedMethod } from "./utility/misc-utils.js";
  import ProfilePage from "./component/page/ProfilePage.svelte";
  import UsersPage from "./component/page/UsersPage.svelte";
  import BucketsPage from "./component/page/BucketsPage.svelte";
  import SettingsPage from "./component/page/SettingsPage.svelte";

  let topAppBar: TopAppBarComponentDev;

  let isLeftDrawerOpen = false;

  let _activeBucket = null;
  activeBucket.subscribe((value) => {
    _activeBucket = value;
  });

  const loadBucketList = createDebouncedMethod(async () => {
    incrementActiveGlobalObtrusiveTaskCount();
    try {
      let response = await callBucketListApi({});
      bucketList.set(response.bucketList);
      decrementActiveGlobalObtrusiveTaskCount();
    } catch (ex) {
      return await handleAnyError(ex);
    }
  }, 100);

  const logoutClicked = async () => {
    performUserLogout();
  };

  const conditionRequiresAuthentication = async (detail) => {
    if ((detail.userData as any).requiresAuthentication) {
      if (!$storedUser || !$storedSession) {
        detail.userData.isUserLoggedIn = false;
        return false;
      }
    }
    return true;
  };

  const dashboardRoute = wrap({
    component: DashboardPage,
    userData: {
      requiresAuthentication: true,
    },
    conditions: [conditionRequiresAuthentication],
  });

  const createBucketRoute = wrap({
    component: CreateBucketPage,
    userData: {
      requiresAuthentication: true,
    },
    conditions: [conditionRequiresAuthentication],
  });

  const exploreRoute = wrap({
    component: ExplorePage,
    userData: {
      requiresAuthentication: true,
    },
    conditions: [conditionRequiresAuthentication],
  });

  const profileRoute = wrap({
    component: ProfilePage,
    userData: {
      requiresAuthentication: true,
    },
    conditions: [conditionRequiresAuthentication],
  });

  const usersRoute = wrap({
    component: UsersPage,
    userData: {
      requiresAuthentication: true,
    },
    conditions: [conditionRequiresAuthentication],
  });

  const bucketsRoute = wrap({
    component: BucketsPage,
    userData: {
      requiresAuthentication: true,
    },
    conditions: [conditionRequiresAuthentication],
  });

  const settingsRoute = wrap({
    component: SettingsPage,
    userData: {
      requiresAuthentication: true,
    },
    conditions: [conditionRequiresAuthentication],
  });

  const loginRoute = wrap({
    component: LoginPage,
  });

  const routes = {
    "/dashboard": dashboardRoute,
    "/": dashboardRoute,
    "/login": loginRoute,
    "/profile": profileRoute,
    "/users": usersRoute,
    "/buckets": bucketsRoute,
    "/settings": settingsRoute,
    "/bucket/create": createBucketRoute,
    "/explore/*": exploreRoute,
  };

  // Handles the "conditionsFailed" event dispatched by the router when a component can't be loaded because one of its pre-condition failed
  function conditionsFailed(event) {
    console.debug("conditionsFailed:", event.detail);
    let data = event.detail.userData as any;

    if (data.requiresAuthentication && !data.isUserLoggedIn) {
      delete data.isUserLoggedIn;
      replace("/login");
    }
  }

  // Handles the "routeLoaded" event dispatched by the router when a component was loaded
  function routeLoaded(event) {
    let { detail } = event;
    console.debug("routeLoaded:", event);

    // housekeeping
    if (detail.route !== "/explore/*") {
      activeBucket.set(null);
    }
  }

  onMount(async () => {
    if ($storedSession) {
      loadBucketList();
    }
  });

  storedSession.subscribe((session) => {
    if (session) {
      loadBucketList();
    }
  });

  const dashboardClicked = async () => {
    push("/");
    isLeftDrawerOpen = false;
  };

  const profileClicked = async () => {
    push("/profile");
    isLeftDrawerOpen = false;
  };

  const usersClicked = async () => {
    push("/users");
    isLeftDrawerOpen = false;
  };

  const bucketsClicked = async () => {
    push("/buckets");
    isLeftDrawerOpen = false;
  };

  const settingsClicked = async () => {
    push("/settings");
    isLeftDrawerOpen = false;
  };

  const createBucketClicked = async () => {
    push("/bucket/create");
    isLeftDrawerOpen = false;
  };

  const bucketClicked = async (bucketId: string) => {
    push(`/explore/${bucketId}`);
    isLeftDrawerOpen = false;
  };
</script>

<main class="nk-main">
  <ObtrusiveLoader />
  <ConfirmationDialog />
  <AlertDialog />
  <BucketPasswordDialog />
  <PromptDialog />
  {#if $storedSession || $storedUser}
    <Drawer variant="modal" bind:open={isLeftDrawerOpen}>
      <Header>
        <DrawerTitle>Encrypted Buckets</DrawerTitle>
        {#if $bucketList.length === 0}
          <Subtitle>Create one to get started</Subtitle>
        {:else}
          <Subtitle>Select one to explore</Subtitle>
        {/if}
      </Header>
      <Content class="nk-bucket-list-master-container">
        {#if $bucketList.length > 0}
          <List class="nk-bucket-list">
            {#each $bucketList as bucket, i}
              <Item
                href="javascript:void(0)"
                on:click={() => bucketClicked(bucket._id)}
                activated={_activeBucket && _activeBucket._id === bucket._id}
              >
                <Text>{bucket.name}</Text>
              </Item>
            {/each}
          </List>
        {/if}

        <div class="nk-left-bar-footer">
          <Button
            class="nk-left-bar-footer-button"
            on:click={createBucketClicked}
          >
            <Icon class="material-icons">add</Icon>
            <Label>Create a bucket</Label>
          </Button>

          <Button class="nk-left-bar-footer-button" on:click={dashboardClicked}>
            <Icon class="material-icons">home</Icon>
            <Label>Dashboad</Label>
          </Button>

          <Button class="nk-left-bar-footer-button" on:click={usersClicked}>
            <Icon class="material-icons">group</Icon>
            <Label>Users</Label>
          </Button>

          <Button class="nk-left-bar-footer-button" on:click={bucketsClicked}>
            <Icon class="material-icons">folder_zip</Icon>
            <Label>Buckets</Label>
          </Button>

          <div class="logged-in-as">
            Logged-in as: {$storedUser.displayName}
          </div>

          <div class="spacer" />

          <Button class="nk-left-bar-footer-button" on:click={profileClicked}>
            <Icon class="material-icons">person</Icon>
            <Label>Profile</Label>
          </Button>

          <Button class="nk-left-bar-footer-button" on:click={settingsClicked}>
            <Icon class="material-icons">settings</Icon>
            <Label>Settings</Label>
          </Button>

          <Button class="nk-left-bar-footer-button" on:click={logoutClicked}>
            <Icon class="material-icons">logout</Icon>
            <Label>Logout</Label>
          </Button>
        </div>
      </Content>
    </Drawer>

    <Scrim />

    <TopAppBar bind:this={topAppBar} variant="standard" class="nk-top-bar">
      <Row>
        <Section>
          <IconButton
            class="material-icons"
            on:click={() => (isLeftDrawerOpen = !isLeftDrawerOpen)}
            >menu</IconButton
          >
          <Title>nkrypt.xyz</Title>
        </Section>
        <Section align="end" toolbar />
      </Row>
    </TopAppBar>
    <AutoAdjust {topAppBar}>
      <Router
        {routes}
        on:conditionsFailed={conditionsFailed}
        on:routeLoaded={routeLoaded}
      />
    </AutoAdjust>
    <Footer />
  {:else}
    <Router
      {routes}
      on:conditionsFailed={conditionsFailed}
      on:routeLoaded={routeLoaded}
    />
  {/if}
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  .nk-main :global(.nk-bucket-list) {
    height: calc(100% - 331px - 32px);
    overflow: scroll;
  }

  .nk-left-bar-footer {
    padding-top: 8px;
    background-color: rgb(233, 245, 237);
    padding-bottom: 8px;
    height: 331px;
  }

  .nk-main :global(.bucket-list-master-container) {
    max-height: 50vh;
  }

  .nk-main :global(.nk-left-bar-footer-button) {
    margin-left: 12px;
    display: block;
  }

  .logged-in-as {
    font-size: 12px;
    margin-right: 12px;
    text-align: right;
  }

  .spacer {
    background-color: rgb(30, 100, 102);
    width: calc(100% - 8px - 8px);
    height: 1px;
    margin-top: 8px;
    margin-bottom: 8px;
    margin-left: 8px;
    margin-right: 8px;
  }
</style>
