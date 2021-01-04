<template>
  <q-page class="std-page window-height window-width row justify-center items-center">
    <div class="column" style="margin-bottom: 120px">
      <div class="row">
        <q-card square bordered class="std-small-card q-pa-lg shadow-1">
          <q-card-section>
            <q-form class="q-gutter-md" ref="passphraseForm" @submit="proceedClicked">
              <div class="text-caption" v-if="isNewRoot">
                Please enter a memorable but secure passphrase. This is separate from your login password. All your data and metadata will be encrypted using
                this passphrase.<br />
              </div>

              <q-input square filled v-model="passphraseData.passphrase" :rules="validation.password" type="password" label="Passphrase">
                <template v-slot:hint v-if="!isNewRoot"> Remember that this is different from your password. </template>
              </q-input>

              <div class="text-caption" v-if="isNewRoot" style="margin-top: 6px">
                Make sure to backup your passphrase somewhere safe. Their is no way to access your data without it.
              </div>
            </q-form>
          </q-card-section>
          <q-card-actions class="q-px-md">
            <q-btn unelevated color="light-green-7" size="lg" class="full-width" label="Proceed" @click="proceedClicked" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { CommonMixin } from "./common-mixin";
import { CryptoMixin } from "./crypto-mixin";
import { LogicMixin } from "./logic-mixin";

export default {
  name: "CollectPassphrase",

  mixins: [CommonMixin, CryptoMixin, LogicMixin],

  data() {
    return {
      isNewRoot: false,
      passphraseData: {
        passphrase: "",
      },
    };
  },

  created() {
    this.removeStoredPassphrase();
  },

  async mounted() {
    this.isNewRoot = !(await this.detectIfRootExists());
  },

  methods: {
    async proceedClicked() {
      if (!(await this.$refs.passphraseForm.validate())) return;
      this.storePassphrase(this.passphraseData.passphrase);

      if (this.isNewRoot) {
        let done = await this.initalizeNewRootDir();
        if (!done) return;
      }

      let { node } = await this.fetchAndDecryptTextNode({ key: this.getRootDirKey() });
      if (!node) return;

      this.$router.replace({ path: "/" });
    },
  },
};
</script>


<style lang="scss" scoped>
</style>