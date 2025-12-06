// Utility functions (placeholder for helpers like logging or data processing)
const logMessage = (message) => {
  console.log(`[LOG]: ${message}`);
};

const validateInput = (input) => {
  return input && typeof input === "string";
};

export { logMessage, validateInput };
