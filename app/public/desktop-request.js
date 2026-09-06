const commands = {
  "GET /api/workspace-dashboard": "native_workspace_dashboard",
  "GET /api/kanban/boards": "native_list_kanban_boards",
  "POST /api/kanban/boards": "native_save_kanban_board",
  "GET /api/canvas": "native_read_canvas",
  "POST /api/canvas/save": "native_save_canvas",
  "GET /api/history": "native_list_history",
  "POST /api/history/restore": "native_restore_history",
};

export async function desktopRequest(url, options = {}) {
  const method = options.method || "GET";
  const parsed = new URL(url, "http://nimvara.local");
  const input = options.body ? JSON.parse(options.body) : {};
  const command = commands[`${method} ${parsed.pathname}`];
  if (window.__TAURI__?.core?.invoke) {
    if (!command) throw new Error(`NATIVE_ROUTE_UNAVAILABLE: ${method} ${parsed.pathname} is not available in the desktop application.`);
    if (command === "native_save_kanban_board") return window.__TAURI__.core.invoke(command, { board: input });
    if (command === "native_save_canvas") return window.__TAURI__.core.invoke(command, { path: input.path, canvas: input.canvas, expectedHash: input.expectedHash ?? null });
    if (command === "native_list_history") return window.__TAURI__.core.invoke(command, { path: parsed.searchParams.get("path") });
    if (command === "native_restore_history") return window.__TAURI__.core.invoke(command, { checkpointId: input.checkpointId, expectedHash: input.expectedHash });
    return window.__TAURI__.core.invoke(command);
  }
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`REQUEST_FAILED: ${response.status}`);
  return response.json();
}
