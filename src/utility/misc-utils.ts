function extract(object: any, keyList: string[]) {
  if (typeof object !== "object" || object === null) {
    throw new Error(
      "GENERIC_OBJECT_NOT_OBJECT " + "Expected object to be an object"
    );
  }
  let newObject: any = {};
  for (let key of keyList) {
    if (!object.hasOwnProperty(key)) {
      throw new Error(
        "GENERIC_OBJECT_KEY_MISSING" + `Expected object to have key "${key}"`
      );
    }
    newObject[key] = object[key];
  }
  return newObject;
}

function strip(object: any, keyList: string[]): void {
  if ("object" !== typeof object) {
    return;
  }
  if (Array.isArray(object)) {
    object.forEach((_object) => strip(_object, keyList));
    return;
  }
  for (let key of keyList) {
    if (object.hasOwnProperty(key)) {
      delete object[key];
    }
  }
  return;
}

export { extract, strip };
