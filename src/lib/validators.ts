export function minlength(n) {
  return (value) => {
    return { valid: value.length >= n, name: "min" };
  };
}
