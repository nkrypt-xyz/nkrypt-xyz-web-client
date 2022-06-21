import { Writable, writable } from "svelte/store";

export let bucketList = writable([]);

export let activeBucket = writable(null);
