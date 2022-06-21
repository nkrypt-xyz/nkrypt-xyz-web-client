import { Writable, writable } from "svelte/store";

export let bucketList = writable([]);

export let currentBucket = writable(null);

export let exploredStack = writable([]);
