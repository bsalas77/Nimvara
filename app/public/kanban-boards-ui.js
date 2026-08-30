const $ = (id) => document.getElementById(id);

async function loadBoards(select) {
  try {
    const response = await fetch("/api/kanban/boards");
    if (!response.ok) return;
    const boards = await response.json();
    select.replaceChildren(new Option("Workspace boards…", ""), ...boards.map((board) => new Option(`${board.name} (${board.columns.join(" · ")})`, board.id)));
  } catch { /* UI remains usable with local saved views when the native bridge is unavailable. */ }
}

function wireBoards() {
  const open = $("openKanban"), board = $("kanbanBoard");
  if (!open || !board || board.dataset.boardsWired) return;
  board.dataset.boardsWired = "true";
  const select = document.createElement("select"); select.id = "kanbanBoards"; select.setAttribute("aria-label", "Workspace Kanban board");
  const name = document.createElement("input"); name.id = "kanbanBoardName"; name.placeholder = "Board name"; name.setAttribute("aria-label", "New board name");
  const columns = document.createElement("input"); columns.id = "kanbanBoardColumns"; columns.value = "backlog,doing,done"; columns.setAttribute("aria-label", "Board columns");
  const save = document.createElement("button"); save.type = "button"; save.className = "secondary"; save.textContent = "Save workspace board";
  open.after(select, name, columns, save);
  loadBoards(select);
  select.onchange = () => { const value = select.options[select.selectedIndex]?.textContent || ""; if (value && value !== "Workspace boards…") { const parts = value.match(/^(.+) \((.+)\)$/); if (parts) { name.value = parts[1]; columns.value = parts[2].replaceAll(" · ", ","); } } };
  save.onclick = async () => {
    const cleanName = name.value.trim(), cleanColumns = columns.value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    if (!cleanName || cleanColumns.length < 2) return;
    const id = cleanName.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
    try {
      const response = await fetch("/api/kanban/boards", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, name: cleanName, columns: cleanColumns }) });
      if (!response.ok) throw new Error("Board could not be saved.");
      await loadBoards(select); select.value = id; save.textContent = "Board saved"; setTimeout(() => { save.textContent = "Save workspace board"; }, 1200);
    } catch (error) { save.textContent = error.message; setTimeout(() => { save.textContent = "Save workspace board"; }, 1800); }
  };
}

new MutationObserver(wireBoards).observe(document.body, { childList: true, subtree: true });
wireBoards();
