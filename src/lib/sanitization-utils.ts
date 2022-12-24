// TODO strip unsupported characters
const sanitizeFileName = (_fileName) => {
  return String(_fileName).trim();
};

export { sanitizeFileName };
