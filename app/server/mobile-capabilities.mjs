export const mobileCapabilities = {
  schema: 1,
  supported: false,
  reason: "Mobile binaries require platform document-provider, lifecycle, accessibility, and real-device qualification.",
  platforms: {
    android: { binary: false, capture: false, offlineQueue: false, providerSync: false, requiredQualification: ["document-picker", "share-sheet", "camera", "process-kill", "permission-revocation", "two-device-conflict"] },
    ipados: { binary: false, capture: false, offlineQueue: false, providerSync: false, requiredQualification: ["Files-provider", "security-scoped-access", "share-sheet", "background-suspension", "provider-eviction", "two-device-conflict"] }
  },
  sharedGuarantees: ["Markdown-authority", "atomic-save", "conflict-refusal", "verified-restore", "untrusted-content-sanitization"]
};

export function getMobileCapabilities() { return JSON.parse(JSON.stringify(mobileCapabilities)); }
