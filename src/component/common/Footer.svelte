<script lang="ts">
  import { CommonConstant } from "../../constant/common-constants.js";
</script>

<div class="copyright">
  <div>
    2022 © <a href={CommonConstant.COPYRIGHT_HREF} target="_blank" rel="noreferrer">
      {CommonConstant.COPYRIGHT_HREF}
    </a>
  </div>
  <div style="margin-top: 4px;">
    App v. {CommonConstant.APP_VERSION}
  </div>
</div>

<style>
  .copyright {
    border-top: 1px solid rgb(228, 228, 228);
    text-align: center;
    font-size: 12px;
    color: rgb(155, 155, 155);
    padding-bottom: 8px;
    padding-top: 8px;
  }
</style>
