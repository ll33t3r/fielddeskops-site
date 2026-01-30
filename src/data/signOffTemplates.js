/**
 * Default contract templates, form types, and variable keys for SignOff.
 * Merged with user templates from DB in loadAllData.
 */

export const formTypes = [
  "Standard",
  "Parts Order",
  "Return Work Order",
];

export const baseVarKeys = [
  "[JOB_NAME]",
  "[DATE]",
  "[JOB_STATUS]",
  "[JOB_ADDRESS]",
  "[ESTIMATE_TOTAL]",
  "[ESTIMATE_SERVICE]",
  "[LABOR_COST]",
  "[MATERIALS_COST]",
];

/** Default contract templates merged with DB templates in loadAllData. */
export const defaultSignOffTemplates = [
  {
    id: "d1",
    label: "WORK AUTHORIZATION",
    body: "I, [CUSTOMER], authorize [CONTRACTOR] to proceed with [JOB_NAME].\n\nTERMS: Payment due upon completion.\nESTIMATED COST: [ESTIMATE_TOTAL]",
    is_pinned: true,
    category: "AUTHORIZATION",
  },
  {
    id: "d2",
    label: "LIABILITY WAIVER",
    body: "[CONTRACTOR] is not responsible for damages resulting from pre-existing conditions discovered during [JOB_NAME].",
    is_pinned: true,
    category: "LEGAL",
  },
  {
    id: "d3",
    label: "CHANGE ORDER",
    body: "The following additional work is authorized for [JOB_NAME]:\n\nORIGINAL ESTIMATE: [ESTIMATE_TOTAL]\nADDITIONAL COST: $______\n\nNEW TOTAL: $______",
    is_pinned: true,
    category: "CHANGE",
  },
  {
    id: "d4",
    label: "FINAL ACCEPTANCE",
    body: "I, [CUSTOMER], confirm that [CONTRACTOR] has completed [JOB_NAME] to my satisfaction.\n\nCOMPLETION DATE: [DATE]\nFINAL AMOUNT: [ESTIMATE_TOTAL]",
    is_pinned: true,
    category: "COMPLETION",
  },
];

export { defaultSignOffTemplates as templates };
