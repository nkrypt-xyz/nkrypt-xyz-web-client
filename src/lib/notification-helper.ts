import { toast } from "@zerodevx/svelte-toast";

export const showToast = (message) => {
  toast.push(message);
};
