export const isRequired = (value) => {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
};

export const isEmail = (value) => {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
};

export const isPhone = (value) => {
  if (!value) return false;
  return /^[0-9]{10,15}$/.test(String(value).replace(/[^0-9]/g, ""));
};

export const isNumber = (value) => {
  if (value === "" || value === null || value === undefined) return false;
  return !Number.isNaN(Number(value));
};

export const inRange = (value, min, max) => {
  if (!isNumber(value)) return false;
  const num = Number(value);
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};

export const isFileTypeAllowed = (file, allowedTypes) => {
  if (!file) return false;
  if (!Array.isArray(allowedTypes) || allowedTypes.length === 0) return true;
  return allowedTypes.includes(file.type);
};

export const isFileSizeAllowed = (file, maxBytes) => {
  if (!file) return false;
  if (!maxBytes) return true;
  return file.size <= maxBytes;
};

export const buildFieldErrors = (rules) => {
  const errors = {};
  Object.entries(rules).forEach(([field, checks]) => {
    const failed = checks.find((check) => !check.isValid);
    if (failed) errors[field] = failed.message;
  });
  return errors;
};
