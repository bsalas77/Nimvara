export type Note = { path: string; content: string; hash: string; modifiedAt: string };
export type SearchResult = { path: string; snippet: string };
export type Checkpoint = { id: string; path: string; hash: string; reason: string; createdAt: string };
export type Snapshot = { id: string; path: string; createdAt?: string; verified: boolean; files?: unknown[] };
export type SafetyState = { workspace: { status: string; path: string }; localSave: string; externalChange: string; sync: string; backup: string; checkpoint: string; checkpointCount: number; watchMode: string; signature: string; note: { path: string; hash: string; modifiedAt: string; missing?: boolean } | null; recovery: { reload: boolean; restoreCheckpoint: boolean; saveCopy: boolean } };
export type WorkspaceFile = { path: string; kind: "markdown" | "attachment"; extension: string; bytes: number; modifiedAt: string };

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
  save: (path: string, content: string, expectedHash: string | null) => request<{ hash: string; unchanged: boolean }>("/api/file", { method: "PUT", body: JSON.stringify({ path, content, expectedHash }) }),
  search: (query: string) => request<SearchResult[]>("/api/search", { method: "POST", body: JSON.stringify({ query }) }),
  history: (path: string) => request<Checkpoint[]>(`/api/history?path=${encodeURIComponent(path)}`),
  restoreHistory: (checkpointId: string, expectedHash: string) => request<{ hash: string }>("/api/history/restore", { method: "POST", body: JSON.stringify({ checkpointId, expectedHash }) }),
  snapshot: (destination: string) => request<Snapshot>("/api/snapshots", { method: "POST", body: JSON.stringify({ destination }) }),
  snapshots: (destination: string) => request<Snapshot[]>(`/api/snapshots?destination=${encodeURIComponent(destination)}`),
  restoreSnapshot: (snapshotPath: string, destination: string) => request<{ destination: string; files: number; verified: boolean }>("/api/snapshots/restore", { method: "POST", body: JSON.stringify({ snapshotPath, destination }) }),
  safety: (path?: string | null) => request<SafetyState>(`/api/safety${path ? `?path=${encodeURIComponent(path)}` : ""}`)
};
