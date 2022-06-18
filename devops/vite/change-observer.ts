import * as pathlib from "path";

// A custom plugin to observe important changes
export function logRelevantFileChanges() {
  const fileRegex = /\.(js|svelte|ts)$/;

  return {
    name: "transform-file",

    transform(src, path) {
      if (path.indexOf("/src") > -1 && fileRegex.test(path)) {
        let relativePath = pathlib.relative("./", path);

        console.log("(Changed)", relativePath);

        return {
          code: src,
          map: null,
        };
      }
    },
  };
}
