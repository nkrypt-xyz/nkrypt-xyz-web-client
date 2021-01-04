<template>
  <q-page class="page">
    <!-- top bar - start -->
    <div class="row items-center q-ma-sm q-gutter-sm">
      <div class="col row items-center selected-date-div">
        <q-btn
          round
          class="q-ma-sm"
          size="sm"
          color="primary"
          icon="keyboard_arrow_up"
          @click="goToParentDirClicked"
          :disabled="directoryHierarchyList.length <= 1"
        >
          <!-- <q-tooltip content-class="bg-accent">Go to parent directory.</q-tooltip> -->
        </q-btn>

        <q-btn round class="q-ma-sm" size="sm" color="primary" icon="cached" @click="reloadCurrentDirClicked">
          <q-tooltip content-class="bg-accent">Reload current directory.</q-tooltip>
        </q-btn>

        <q-breadcrumbs>
          <q-breadcrumbs-el
            class="breadcrumb"
            :label="directoryHierarchy.name"
            v-for="directoryHierarchy in directoryHierarchyList"
            :key="directoryHierarchy.name"
          />
        </q-breadcrumbs>
      </div>

      <div class="main-page-button-group">
        <q-btn class="q-ma-sm" icon="attachment" color="primary" label="Upload file" @click="uploadFileClicked" />
        <input type="file" ref="hiddenFilePicker" multiple style="display: none" @change="fileSelectedToUpload" />
        <q-btn class="q-ma-sm" icon="add_box" color="primary" label="Add folder" @click="addDirClicked" />
      </div>
    </div>
    <!-- top bar - end -->

    <!-- directory contents - start -->
    <div class="q-ma-sm">
      <q-table
        title="Contents"
        :data="displayChildList"
        :columns="columns"
        row-key="key"
        :pagination.sync="pagination"
        no-data-label="Upload a file or create a folder to get started."
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props" style="max-width: 400px; white-space: normal; word-wrap: break-word">
              {{ props.row.name }}
            </q-td>
            <q-td key="type" :props="props" style="max-width: 200px; white-space: normal; word-wrap: break-word">
              {{ props.row.type }}
            </q-td>
            <q-td key="size" :props="props">
              {{ props.row.stats.size }}
            </q-td>
            <q-td key="ctime" :props="props">
              {{ toDatetimeString(props.row.stats.ctime) }}
            </q-td>
            <q-td key="mtime" :props="props">
              {{ toDatetimeString(props.row.stats.mtime) }}
            </q-td>
            <q-td key="action" :props="props">
              <q-btn class="q-ma-sm" icon="folder" rounded color="primary" label="Open" @click="openDirClicked(props.row)" v-if="props.row.type === 'dir'" />
              <q-btn
                class="q-ma-sm"
                icon="get_app"
                rounded
                color="primary"
                label="Download"
                @click="downloadFileClicked(props.row)"
                v-if="props.row.type !== 'dir'"
              />
              <q-btn class="q-ma-sm" icon="create" rounded color="secondary" label="Rename" @click="renameChildClicked(props.row)" />
              <q-btn class="q-ma-sm" icon="delete_forever" rounded color="negative" label="" @click="removeChildClicked(props.row)" />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
    <!-- directory contents - end -->
  </q-page>
</template>

<script>
import { CommonMixin } from "./common-mixin";
import { CryptoMixin } from "./crypto-mixin";
import { LogicMixin } from "./logic-mixin";

export default {
  name: "Explore",

  mixins: [CommonMixin, CryptoMixin, LogicMixin],

  props: {
    fixtures: Object,
  },

  data() {
    return {
      directoryHierarchyList: [],
      pagination: {
        rowsPerPage: 10, // current rows per page being displayed
      },
      columns: [
        {
          name: "name",
          required: true,
          label: "Name",
          align: "left",
          field: (row) => row.name,
          format: (val) => `${val}`,
          sortable: true,
        },
        { name: "type", align: "center", label: "Type", field: "type", sortable: true },
        { name: "size", align: "center", label: "Size", field: "size", sortable: true },
        {
          name: "ctime",
          align: "center",
          field: "ctime",
          label: "Created",
          sortable: true,
        },
        {
          name: "mtime",
          align: "center",
          field: "mtime",
          label: "Modified",
          sortable: true,
        },
        {
          name: "action",
          align: "right",
          label: "Action",
        },
      ],
    };
  },

  computed: {
    top() {
      return this.directoryHierarchyList[this.directoryHierarchyList.length - 1];
    },
    displayChildList() {
      return this.top ? this.top.dir.childList : [];
    },
    currentDir() {
      return this.top ? this.top.dir : null;
    },
    currentDirKey() {
      return this.top ? this.top.key : null;
    },
  },

  async mounted() {
    this.directoryHierarchyList = [];
    await this.loadDir({ key: this.getRootDirKey(), name: "root" });
  },

  methods: {
    async loadDir({ key, name }) {
      let { node, hasError, error } = await this.fetchAndDecryptTextNode({  key });
      console.log({ node, hasError, error });

      this.directoryHierarchyList.push({
        dir: node,
        key,
        name,
      });
    },

    async reloadCurrentDir() {
      let { node, hasError, error } = await this.fetchAndDecryptTextNode({ key: this.currentDirKey });
      this.directoryHierarchyList[this.directoryHierarchyList.length - 1].dir = node;
    },

    // Utility

    // Actions - Upload / Download

    uploadFileClicked(e) {
      let el = this.$refs.hiddenFilePicker;
      // this.clearInputFile(e.target);
      el.click(e);
    },

    async encryptSelectedFile(file) {
      return new Promise((accept) => {
        let reader = new FileReader();
        reader.onload = async (e) => {
          let data = e.target.result;
          let enc = await this.encryptArrayBuffer(data);
          accept(enc);
        };
        reader.readAsArrayBuffer(file);
      });
    },

    async fileSelectedToUpload(e) {
      let fileList = e.target.files;

      for (let file of fileList) {
        this.addLoadingWorkload();
        let encryptedData = await this.encryptSelectedFile(file);
        this.reduceLoadingWorkload();
        let { type, name, size } = file;
        await this.uploadFileAndUpdateNode({
          currentDir: this.currentDir,
          currentDirKey: this.currentDirKey,
          encryptedData,
          newFileData: { type, name, size },
        });
      }
    },

    // Actions - Other

    async addDirClicked() {
      let name = await this.prompt("New directory", "Name your new folder");
      if (!name) return;
      await this.createDirectoryAndUpdateNode({ currentDir: this.currentDir, currentDirKey: this.currentDirKey, newDirName: name });
      await this.reloadCurrentDir();
    },

    async goToParentDirClicked() {
      this.directoryHierarchyList.pop();
      await this.reloadCurrentDir();
    },

    async reloadCurrentDirClicked() {
      await this.reloadCurrentDir();
    },

    async openDirClicked({ key, name }) {
      await this.loadDir({ key, name });
    },

    async renameChildClicked(child) {
      let newName = await this.prompt("Renaming", `What would you like to rename "${child.name}" to?`, child.name);
      if (!newName) return;

      child.name = newName;
      await this.updateChildInformationAndUpdateNode({
        currentDir: this.currentDir,
        currentDirKey: this.currentDirKey,
        updatedChildData: child,
      });
      await this.reloadCurrentDir();
    },

    async removeChildClicked(child) {
      let agreed = await this.confirm("Delete parmanently", `Are you sure you want to delete "${child.name}" permanently?`);
      if (!agreed) return;

      await this.deleteChildAndUpdateNode({
        currentDir: this.currentDir,
        currentDirKey: this.currentDirKey,
        childKey: child.key,
      });
      await this.reloadCurrentDir();
    },

    async downloadFileClicked(file) {
      let { node, hasError, error } = await this.fetchAndDecryptBinaryNode({ key: file.key, isBinary: true });

      var blob = new Blob([node], { type: file.type });
      var objectUrl = URL.createObjectURL(blob);

      let el = document.createElement("a");
      el.setAttribute("href", objectUrl);
      el.setAttribute("target", "_blank");
      el.setAttribute("download", file.name);
      el.style.display = "none";
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    },
  },
};
</script>

<style scoped lang="scss">
.page {
  background: $pageColor;
}
.main-page-button-group {
  text-align: right;
  margin-top: 8px;
}
.breadcrumb {
  cursor: pointer;
}
.breadcrumb:hover {
  color: blueviolet;
}
</style>