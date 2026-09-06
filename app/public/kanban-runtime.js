import { desktopRequest } from "./desktop-request.js";
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const classify = (task) => task.completed ? "done" : /\(([^()]+)\)\s*$/.test(task.text) ? task.text.match(/\(([^()]+)\)\s*$/)[1].toLowerCase().replaceAll(" ", "_") : "backlog";
  window.runKanban = async function runKanban() {
    const board = document.getElementById("kanbanBoard");
    if (!board) return;
    board.classList.remove("hidden");
    let dashboard;
    try { dashboard = await desktopRequest("/api/workspace-dashboard"); }
    catch (error) { board.innerHTML = `<p role="alert">${esc(error.message)}</p>`; return; }
    let filter = document.getElementById("kanbanFilter");
    if (!filter) { filter = document.createElement("input"); filter.id = "kanbanFilter"; filter.placeholder = "Filter tasks"; filter.setAttribute("aria-label", "Filter Kanban tasks"); document.getElementById("openKanban")?.after(filter); filter.oninput = () => window.runKanban(); }
    const query = filter.value.trim().toLowerCase();
    const tasks = (dashboard.tasks || []).filter((task) => !query || `${task.text} ${task.path}`.toLowerCase().includes(query));
    const configured = Array.isArray(window.nimvaraKanbanColumns) ? window.nimvaraKanbanColumns : [];
    const defaults = configured.length ? configured : ["backlog", "doing", "review", "done"];
    const columns = [...new Set([...defaults, ...tasks.map(classify)])];
    board.innerHTML = columns.map((column) => `<section class="kanban-column" aria-labelledby="kanban-${esc(column)}"><h3 id="kanban-${esc(column)}">${esc(column.replaceAll("_", " "))}</h3>${tasks.filter((task) => classify(task) === column).map((task) => `<article class="kanban-card"><strong>${esc(task.text)}</strong><small>${esc(task.path)} · line ${task.line}</small></article>`).join("") || "<p>No tasks.</p>"}</section>`).join("");
  };
