<template>
  <q-page class="bg-primary window-height window-width row justify-center items-center">
    <div class="column" style="margin-bottom: 120px">
      <div class="row">
        <q-card square bordered class="std-small-card q-pa-lg shadow-1">
          <q-card-section>
            <q-form class="q-gutter-md" ref="loginForm" @submit="loginClicked">
              <q-input
                square
                filled
                v-model="loginData.username"
                :rules="validation.username"
                type="text"
                label="User Name"
              />
              <q-input
                square
                filled
                v-model="loginData.password"
                :rules="validation.password"
                type="password"
                label="Password"
              />
            </q-form>
          </q-card-section>
          <q-card-actions class="q-px-md">
            <q-btn
              unelevated
              color="light-green-7"
              size="lg"
              class="full-width"
              label="Login"
              @click="loginClicked"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { CommonMixin } from "./common-mixin";

export default {
  name: "Login",

  mixins: [CommonMixin],

  data() {
    return {
      loginData: {
        username: "",
        password: ""
      }
    };
  },

  created() {
    this.setApiKey(null);
  },

  methods: {
    async loginClicked() {
      if (!(await this.$refs.loginForm.validate())) return;

      let res = await this.callApi("user-login", this.loginData, {
        auth: false
      });
      if (res.hasError) return;

      this.setApiKey(res.apiKey);
      this.$router.replace({ path: "/" });
    }
  }
};
</script>


<style lang="scss" scoped>

</style>