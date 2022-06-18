<script lang="ts">
  // Core
  import { onMount } from "svelte";
  // UI Library Item
  import Button, { Label, Icon } from "@smui/button";
  import type { TopAppBarComponentDev } from "@smui/top-app-bar";
  import TopAppBar, {
    Row,
    Section,
    Title,
    AutoAdjust,
  } from "@smui/top-app-bar";
  import IconButton from "@smui/icon-button";
  import Drawer, {
    AppContent,
    Content,
    Header,
    Title as DrawerTitle,
    Subtitle,
    Scrim,
  } from "@smui/drawer";
  import List, { Item, Text } from "@smui/list";
  // Routing
  import Router, { replace, location, push } from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  // Pages
  import LoginPage from "./page/LoginPage.svelte";
  import DashboardPage from "./page/DashboardPage.svelte";
  import CreateBucketPage from "./page/CreateBucketPage.svelte";
  // Components
  import ObtrusiveLoader from "./lib/ObtrusiveLoader.svelte";
  import AlertDialog from "./lib/AlertDialog.svelte";
  import ConfirmationDialog from "./lib/ConfirmationDialog.svelte";
  import Footer from "./lib/Footer.svelte";
  // Stores
  import { currentUser } from "./store/user.js";
  import { currentSession } from "./store/session.js";
  import { bucketList } from "./store/content.js";
  // Integrations
  import { callBucketListApi } from "./integration/content-apis.js";
  import { callUserLogoutApi } from "./integration/user-apis.js";
  // Local Misc
  import { CommonConstant } from "./constant/common-constants.js";
  import { createDebouncedMethod } from "./utility/misc-utils.js";
  import {
    decrementActiveGlobalObtrusiveTaskCount,
    incrementActiveGlobalObtrusiveTaskCount,
  } from "./store/ui.js";

  let topAppBar: TopAppBarComponentDev;

  let isLeftDrawerOpen = false;

  let active = "";

  function setActive(value: string) {
    active = value;
  }

  const loadBucketList = createDebouncedMethod(async () => {
    incrementActiveGlobalObtrusiveTaskCount();
    let response = await callBucketListApi({});
    // handle error
    bucketList.set(response.bucketList);
    decrementActiveGlobalObtrusiveTaskCount();
  }, 100);

  const logoutClicked = async () => {
    incrementActiveGlobalObtrusiveTaskCount();
    let response = await callUserLogoutApi({
      message: "Manually pressed logout button",
    });
    console.log(response);
    currentUser.set(null);
    currentSession.set(null);
    replace("/");
    decrementActiveGlobalObtrusiveTaskCount();
  };

  const conditionRequiresAuthentication = async (detail) => {
    if ((detail.userData as any).requiresAuthentication) {
      console.log($currentUser);

      if (!$currentUser || !$currentSession) {
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

  const loginRoute = wrap({
    component: LoginPage,
  });

  const routes = {
    "/dashboard": dashboardRoute,
    "/": dashboardRoute,
    "/login": loginRoute,
    "/bucket/create": createBucketRoute,
  };

  // Handles the "conditionsFailed" event dispatched by the router when a component can't be loaded because one of its pre-condition failed
  function conditionsFailed(event) {
    console.error("conditionsFailed event", event.detail);
    let data = event.detail.userData as any;

    if (data.requiresAuthentication && !data.isUserLoggedIn) {
      delete data.isUserLoggedIn;
      replace("/login");
    }
  }

  // Handles the "routeLoaded" event dispatched by the router when a component was loaded
  function routeLoaded(event) {
    console.log("routeLoaded event", event.detail);
  }

  onMount(async () => {
    if ($currentSession) {
      loadBucketList();
    }
  });

  currentSession.subscribe((session) => {
    if (session) {
      loadBucketList();
    }
  });

  const createBucketClicked = async () => {
    push("/bucket/create");
    isLeftDrawerOpen = false;
  };
</script>

<main>
  <ObtrusiveLoader />
  <ConfirmationDialog />
  <AlertDialog />
  {#if $currentSession || $currentUser}
    <Drawer variant="modal" bind:open={isLeftDrawerOpen}>
      <Header>
        <DrawerTitle>Encrypted Buckets</DrawerTitle>
        {#if $bucketList.length === 0}
          <Subtitle>Create one to get started</Subtitle>
        {:else}
          <Subtitle>Select one to explore</Subtitle>
        {/if}
      </Header>
      <Content>
        {#if $bucketList.length > 0}
          <List>
            {#each $bucketList as bucket, i}
              <Item
                href="javascript:void(0)"
                on:click={() => setActive(bucket._id)}
                activated={active === bucket._id}
              >
                <Text>{bucket.name}</Text>
              </Item>
            {/each}
          </List>
        {/if}

        <div class="create-bucket-container">
          <Button on:click={createBucketClicked}>
            <Icon class="material-icons">add</Icon>
            <Label>Create a bucket</Label>
          </Button>
        </div>

        <div class="nk-left-bar-footer">
          You are: {$currentUser.displayName}
          <br />
          <Button on:click={logoutClicked}>
            <Icon class="material-icons">logout</Icon>
            <Label>Logout</Label>
          </Button>
          <br />
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

  .nk-left-bar-footer {
    position: fixed;
    bottom: 0px;
  }

  .create-bucket-container {
  }
</style>
