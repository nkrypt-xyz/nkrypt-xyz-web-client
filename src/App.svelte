<script lang="ts">
  import logo from "./asset/logo-512-sqr.png";
  import Example from "./lib/Example.svelte";

  import Router, { replace } from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";

  import LoginPage from "./page/LoginPage.svelte";
  import DashboardPage from "./page/DashboardPage.svelte";

  import { currentUser } from "./store/user.js";

  const conditionRequiresAuthentication = async (detail) => {
    if ((detail.userData as any).requiresAuthentication) {
      console.log($currentUser);
      if (!$currentUser) {
        detail.userData.isUserLoggedIn = false;
        return false;
      }
    }
    return true;
  };

  const routes = {
    "/dashboard": wrap({
      component: DashboardPage,
      userData: {
        requiresAuthentication: true,
      },
      conditions: [conditionRequiresAuthentication],
    }),
    "/login": wrap({
      component: LoginPage,
    }),
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
</script>

<main>
  <Router
    {routes}
    on:conditionsFailed={conditionsFailed}
    on:routeLoaded={routeLoaded}
  />
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
</style>
