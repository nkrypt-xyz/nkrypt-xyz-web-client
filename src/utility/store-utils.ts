export const setLocalStorageItem = (key, value) => {
  value = JSON.stringify(value);
  localStorage.setItem(key, value);
};

export const getLocalStorageItem = (key) => {
  let value = localStorage.getItem(key);
  if (value) {
    return JSON.parse(value);
  }
  return value;
};

export const setTabStorageItem = (key, value) => {
  value = JSON.stringify(value);
  sessionStorage.setItem(key, value);
};

export const getTabStorageItem = (key) => {
  let value = sessionStorage.getItem(key);
  if (value) {
    return JSON.parse(value);
  }
  return value;
};
