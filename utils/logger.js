const formatError = (error) => {
  if (!error) return null;
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "string") return { message: error };
  return { error };
};

export const logError = (context, error, details = {}) => {
  const formatted = formatError(error);
  const payload = {
    ...details,
    ...(formatted || {}),
    timestamp: new Date().toISOString(),
  };
  console.error(`[FieldDeskOps] ${context}`, payload);
};

export const logInfo = (context, details = {}) => {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[FieldDeskOps] ${context}`, details);
};

export const logWarn = (context, details = {}) => {
  if (process.env.NODE_ENV === "production") return;
  console.warn(`[FieldDeskOps] ${context}`, details);
};
