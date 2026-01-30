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

export const TEMPLATES = [
  {
    label: "AUTHORIZATION TO PROCEED",
    body: "I, [CUSTOMER], hereby authorize [CONTRACTOR] to proceed with the work described for [JOB_NAME] at [JOB_ADDRESS]. \n\nI understand that the pricing estimates provided are subject to change based on unforeseen conditions. \n\nI grant permission for [CONTRACTOR] to access the property and operate necessary equipment on or after [DATE]. \n\nI further agree to pay for these services in accordance with the standard terms and conditions.",
    category: "PRE_WORK",
    is_pinned: true,
  },
  {
    label: "DAILY SERVICE ACKNOWLEDGEMENT",
    body: "The undersigned acknowledges that the services, labor, and tasks detailed in this report were performed satisfactorily on [DATE] at [JOB_ADDRESS]. \n\nThis signature confirms [CONTRACTOR]'s time on-site and the active progress on [JOB_NAME]. \n\nThis is not a final acceptance of the total project, but a verification of today's production.",
    category: "PROGRESS",
    is_pinned: true,
  },
  {
    label: "CHANGE ORDER REQUEST",
    body: "This document authorizes a deviation from the original scope of [JOB_NAME]. \n\n[CUSTOMER] agrees to the additional costs and/or timeline adjustments listed above to be performed by [CONTRACTOR]. \n\nI understand that these changes are necessary to complete the project or were explicitly requested by me. \n\nPayment for these additional items will be due upon completion of the work.",
    category: "SCOPE_CHANGE",
    is_pinned: true,
  },
  {
    label: "MATERIAL & EQUIPMENT RECEIPT",
    body: "I acknowledge receipt of the materials, equipment, and/or supplies listed in this manifest delivered to [JOB_ADDRESS] on [DATE]. \n\nI have inspected the items and confirm they have been delivered in good condition. \n\n[CUSTOMER] assumes full responsibility for the security and protection of these items from this point forward.",
    category: "DELIVERY",
    is_pinned: true,
  },
  {
    label: "CERTIFICATE OF COMPLETION",
    body: "I certify that all work for [JOB_NAME] has been completed to my satisfaction by [CONTRACTOR]. \n\nI have inspected the finished project at [JOB_ADDRESS] and accept it as complete as of [DATE]. \n\nThis signature triggers the final invoice and initiates the warranty period (if applicable). \n\nI understand that any future service requests will be treated as new work orders.",
    category: "COMPLETION",
    is_pinned: true,
  },
];
