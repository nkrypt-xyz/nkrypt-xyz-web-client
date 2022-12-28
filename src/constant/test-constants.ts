export const testConstants = {
  WEAKEN_CRYPTO_FOR_TESTING: false,
  TEST_IV: new Uint8Array([
    1, 240, 129, 77, 139, 24, 34, 249, 37, 144, 177, 111,
  ]),
  TEST_SALT: new Uint8Array([
    211, 249, 108, 207, 85, 200, 216, 152, 218, 125, 181, 230, 230, 65, 174, 95,
  ]),
  STOCK_PASSWORD_FOR_TESTING: import.meta.env.VITE_STOCK_PASSWORD_FOR_TESTING,
};
