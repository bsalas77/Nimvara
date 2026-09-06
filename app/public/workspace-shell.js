export function toolCategory(title) {
  if (/\bAI\b|model/i.test(title)) return "ai";
  if (/capture|import|PDF/i.test(title)) return "capture";
  if (/kanban|canvas|properties|publish/i.test(title)) return "organize";
  if (/backup|settings|migration|extension|diagnostic|safety/i.test(title)) return "workspace";
  return "note";
}

export function mountWorkspaceShell() {
  const shell = document.getElementById("shell");
  if (!shell || document.getElementById("toggleTools")) return;
  const inspector = shell.querySelector(".inspector");
  inspector.id = "workspaceTools";
  const header = shell.querySelector("header");
  const actions = document.createElement("div");
  actions.className = "shell-actions";
  const focus = document.createElement("button");
  focus.id = "toggleFocus"; focus.type = "button"; focus.className = "secondary";
  focus.textContent = "Focus"; focus.setAttribute("aria-pressed", "false");
  const toggle = document.createElement("button");
  toggle.id = "toggleTools"; toggle.type = "button"; toggle.className = "secondary";
  toggle.textContent = "Tools"; toggle.setAttribute("aria-controls", inspector.id);
  toggle.setAttribute("aria-expanded", "false");
  actions.append(focus, toggle); header.append(actions);

  const toolHead = document.createElement("div"); toolHead.className = "tools-head";
  const label = document.createElement("label"); label.htmlFor = "toolCategory"; label.textContent = "Workspace tools";
  const picker = document.createElement("select"); picker.id = "toolCategory";
  for (const [value, title] of [["note", "This note"], ["capture", "Capture & import"], ["organize", "Organize & publish"], ["ai", "Private AI"], ["workspace", "Settings & safety"]]) picker.add(new Option(title, value));
  toolHead.append(label, picker); inspector.prepend(toolHead);
  const setTools = (open) => {
    shell.classList.toggle("tools-open", open);
    inspector.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) picker.focus();
  };
  toggle.onclick = () => setTools(!shell.classList.contains("tools-open"));
  focus.onclick = () => {
    const active = shell.classList.toggle("focus-mode");
    focus.setAttribute("aria-pressed", String(active));
    shell.querySelector(".sidebar").inert = active;
    if (active) setTools(false);
  };
  inspector.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !event.target.closest("dialog")) { setTools(false); toggle.focus(); }
  });

  // Keep late-mounted feature modules reachable without putting them all on screen.
  const organize = () => {
    for (const child of inspector.children) {
      if (child === toolHead) continue;
      const title = child.querySelector("h2")?.textContent || child.querySelector("summary")?.textContent || "This note";
      child.classList.toggle("tool-group-hidden", toolCategory(title) !== picker.value);
    }
  };
  picker.onchange = organize;
  new MutationObserver(organize).observe(inspector, { childList: true });
  setTools(false); organize();

  // A diagnostics button formerly occupied an unintended cell after the footer.
  const diagnostics = [...shell.children].find((node) => node.tagName === "BUTTON" && node.textContent === "Export diagnostics");
  const settingsSection = [...inspector.querySelectorAll("section")].find((section) => section.querySelector("h2")?.textContent === "Workspace settings");
  if (diagnostics && settingsSection) settingsSection.append(diagnostics);

  const sidebar = shell.querySelector(".sidebar");
  const closeTasks = document.createElement("button"); closeTasks.id = "closeTasks";
  closeTasks.type = "button"; closeTasks.className = "secondary"; closeTasks.textContent = "Close tasks";
  closeTasks.onclick = () => { document.getElementById("taskDashboard").classList.add("hidden"); document.getElementById("showTasks").focus(); };
  document.getElementById("taskDashboard").prepend(closeTasks);
  const calendar = document.createElement("details"); calendar.className = "sidebar-disclosure";
  const summary = document.createElement("summary"); summary.textContent = "Jump to a date"; calendar.append(summary);
  const dateLabel = sidebar.querySelector('label[for="calendarDate"]');
  dateLabel.before(calendar); calendar.append(dateLabel, sidebar.querySelector(".calendar-nav"));
  const cache = document.getElementById("clearIndex"); if (cache && settingsSection) settingsSection.append(cache);
  for (const panel of sidebar.querySelectorAll(":scope > section")) {
    if (panel.querySelector("#folderPath")) {
      const details = document.createElement("details"); details.className = "sidebar-disclosure";
      const title = document.createElement("summary"); title.textContent = "Folder overview"; details.append(title);
      panel.before(details); details.append(panel);
    }
  }
}
