export type Note = { path: string; content: string; hash: string; modifiedAt: string };
export type SearchResult = { path: string; snippet: string };
export type Checkpoint = { id: string; path: string; hash: string; reason: string; createdAt: string };
export type Snapshot = { id: string; path: string; createdAt?: string; verified: boolean; files?: unknown[] };
export type SafetyState = { workspace: { status: string; path: string }; localSave: string; externalChange: string; sync: string; backup: string; checkpoint: string; checkpointCount: number; watchMode: string; signature: string; note: { path: string; hash: string; modifiedAt: string; missing?: boolean } | null; recovery: { reload: boolean; restoreCheckpoint: boolean; saveCopy: boolean } };
export type WorkspaceFile = { path: string; kind: "markdown" | "attachment"; extension: string; bytes: number; modifiedAt: string };
export type MigrationFile = { path: string; bytes: number; sha256: string };
export type MigrationReport = { schema: number; source: string; destination: string; createdAt: string; files: MigrationFile[] };

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "content-type": "application/json", ...init.headers } : init?.headers
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.error?.code ?? "REQUEST_FAILED", data.error?.message ?? "Request failed.", data.error?.details);
  return data;
}

export const api = {
  status: () => request<{ workspace: string | null; sampleWorkspace: string }>("/api/status"),
  openWorkspace: (path: string, create: boolean) => request<{ workspace: string; files: string[] }>("/api/workspace", { method: "POST", body: JSON.stringify({ path, create }) }),
  files: () => request<string[]>("/api/files"),
  workspaceFiles: () => request<WorkspaceFile[]>("/api/workspace-files"),
  note: (path: string) => request<Note>(`/api/file?path=${encodeURIComponent(path)}`),
  renamePlan: (from: string, to: string) => request<{ source: string; target: string; affectedFiles: string[]; changes: Array<{ path: string; before: string; after: string }>; reviewRequired: boolean }>("/api/file/rename-plan", { method: "POST", body: JSON.stringify({ from, to }) }),
  rename: (from: string, to: string) => request<{ source: string; target: string; affectedFiles: string[]; applied: boolean }>("/api/file/rename", { method: "POST", body: JSON.stringify({ from, to }) }),
  save: (path: string, content: string, expectedHash: string | null) => request<{ hash: string; unchanged: boolean }>("/api/file", { method: "PUT", body: JSON.stringify({ path, content, expectedHash }) }),
  search: (query: string) => request<SearchResult[]>("/api/search", { method: "POST", body: JSON.stringify({ query }) }),
  history: (path: string) => request<Checkpoint[]>(`/api/history?path=${encodeURIComponent(path)}`),
  restoreHistory: (checkpointId: string, expectedHash: string) => request<{ hash: string }>("/api/history/restore", { method: "POST", body: JSON.stringify({ checkpointId, expectedHash }) }),
  snapshot: (destination: string) => request<Snapshot>("/api/snapshots", { method: "POST", body: JSON.stringify({ destination }) }),
  snapshots: (destination: string) => request<Snapshot[]>(`/api/snapshots?destination=${encodeURIComponent(destination)}`),
  snapshotPrunePlan: (destination: string, keep = 5) => request<{ keep: number; retain: string[]; remove: string[] }>("/api/snapshots/prune-plan", { method: "POST", body: JSON.stringify({ destination, keep }) }),
  pruneSnapshots: (destination: string, keep = 5) => request<{ keep: number; retain: string[]; remove: string[] }>("/api/snapshots/prune", { method: "POST", body: JSON.stringify({ destination, keep, confirm: true }) }),
  restoreSnapshot: (snapshotPath: string, destination: string) => request<{ destination: string; files: number; verified: boolean }>("/api/snapshots/restore", { method: "POST", body: JSON.stringify({ snapshotPath, destination }) }),
  migrateWorkspace: (source: string, destination: string) => request<MigrationReport>("/api/migration/copy", { method: "POST", body: JSON.stringify({ source, destination }) }),
  exportStatic: (destination: string, paths: string[] = []) => request<{ destination: string; files: string[]; format: string }>("/api/publishing/export", { method: "POST", body: JSON.stringify({ destination, paths }) }),
  validateExtension: (manifest: unknown) => request<{ id: string; name: string; version: string; permissions: string[]; signed: boolean; status: string }>("/api/extensions/validate", { method: "POST", body: JSON.stringify(manifest) }),
  safety: (path?: string | null) => request<SafetyState>(`/api/safety${path ? `?path=${encodeURIComponent(path)}` : ""}`)
};
