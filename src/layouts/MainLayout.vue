<template>
  <q-layout view="hHh LpR fFr">
    <q-header elevated v-if="apiKey">
      <q-toolbar>
        <q-btn flat round icon="arrow_back" aria-label="Menu" v-if="this.$route.meta.backButton.show" @click="backButtonClicked" />

        <q-icon v-if="this.$route.meta.showLogo" size="sm" name="enhanced_encryption" />

        <q-toolbar-title>{{ this.$route.meta.title }}</q-toolbar-title>

        <q-btn v-if="this.$route.meta.showSaveButton" size="md" icon="save" round flat @click="saveButtonClicked" />
        <q-btn v-else round flat icon="dashboard" style="background: transparent; color: white">
          <q-menu>
            <q-list style="min-width: 100px">
              <q-item clickable v-close-popup @click="homeClicked" v-if="this.$route.name !== 'explore'">
                <q-item-section>
                  <q-item-label>Home</q-item-label>
                </q-item-section>
              </q-item>

              <!-- <q-item clickable v-close-popup @click="profileClicked">
                <q-item-section>
                  <q-item-label>Profile</q-item-label>
                </q-item-section>
              </q-item> -->

              <q-item clickable v-close-popup @click="logoutClicked">
                <q-item-section>
                  <q-item-label>Logout</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container class="page-container">
      <router-view ref="routerView" v-on:api-key-change="apiKeyChanged" v-on:navigate-back="navigateBackRequested" v-bind:fixtures="fixtures" />
    </q-page-container>

    <div class="footer">
      nkrypt.xyz
      <br />2020 &copy; Shafayet
      <br />
      <div class="build-number">build {{ buildInfo().build }}</div>
    </div>
  </q-layout>
</template>

<script>
import { CommonMixin } from "./../pages/common-mixin";
import { LogicMixin } from "./../pages/logic-mixin";

export default {
  name: "MainLayout",

  created() {
    this.apiKeyChanged();
  },

  mixins: [CommonMixin, LogicMixin],

  mounted() {},

  components: {},

  data() {
    return {
      fixtures: {
        universalTagList: [],
      },
      buildInfo: () => {
        {
          ("%__deploy-start");
          return JSON.parse('{"build":1,"datetimeStamp":1608491055389}');
          // ("%__deploy-end");
        }
      },
    };
  },

  methods: {
    apiKeyChanged() {
      this.apiKey = this.getApiKey();
    },

    async homeClicked() {
      this.$router.push({ path: "/" });
    },

    async logoutClicked() {
      await this.callApi("user-logout", {});
      this.removeStoredPassphrase();

      // We don't care much about the result here;
      this.$router.replace({ path: "/login" });
    },

    async backButtonClicked() {
      if (window.__lastRouteName) {
        this.$router.go(-1);
      } else {
        this.$router.replace({ path: this.$route.meta.backButton.fallback });
      }
    },

    profileClicked() {
      this.$router.push({ path: "/profile" });
    },

    saveButtonClicked() {
      this.$refs.routerView.submitClicked();
    },

    navigateBackRequested() {
      this.backButtonClicked();
    },
  },
};
</script>
<style lang="scss" scoped>
.page-container {
  background: $pageColor;
}
.footer {
  text-align: center;
  background: $pageColor;
  font-size: 12px;
  padding-bottom: 12px;
  padding-top: 16px;
  margin-top: -12px;
  color: rgb(168, 168, 168);
}

.build-number {
  font-size: 8px;
}
</style>