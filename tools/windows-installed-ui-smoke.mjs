import { spawn } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";

const exe = process.argv[2];
const sourceVault = process.argv[3];
const screenshotPrefix = process.argv[4];
if (!exe || !sourceVault) throw new Error("Usage: node windows-installed-ui-smoke.mjs <Nimvara.exe> <read-only-source-vault>");

const root = await mkdtemp(path.join(os.tmpdir(), "nimvara-installed-smoke-"));
const workspace = path.join(root, "copied-vault");
const backups = path.join(root, "backups");
const restore = path.join(root, "restored-vault");
await cp(sourceVault, workspace, { recursive: true, force: false });

const digestTree = async (folder) => {
  const { readdir, stat } = await import("node:fs/promises");
  const hash = createHash("sha256");
  const walk = async (current, relative = "") => {
    for (const name of (await readdir(current)).sort()) {
      if (relative === "" && name === ".lantern") continue;
      const full = path.join(current, name);
      const rel = path.join(relative, name).replaceAll("\\", "/");
      const info = await stat(full);
      if (info.isDirectory()) await walk(full, rel);
      else {
        hash.update(rel);
        hash.update(await readFile(full));
      }
    }
  };
  await walk(folder);
  return hash.digest("hex");
};

const sourceBefore = await digestTree(sourceVault);
let child;
let socket;
let nextId = 1;
const pending = new Map();
const browserErrors = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function launch(port) {
  child = spawn(exe, [], {
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}`,
      WEBVIEW2_USER_DATA_FOLDER: path.join(root, "webview2"),
    },
    stdio: "ignore",
  });
  let page;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      page = targets.find((target) => target.type === "page");
      if (page) break;
    } catch {}
    await sleep(200);
  }
  if (!page) throw new Error("WebView2 debugging target did not become available.");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") browserErrors.push(message.params.exceptionDetails);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  await cdp("Runtime.enable");
}

async function cdp(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  const message = await new Promise((resolve) => pending.set(id, resolve));
  if (message.error) throw new Error(JSON.stringify(message.error));
  return message.result;
}

async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

async function waitFor(expression, label) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await evaluate(expression)) return;
    await sleep(200);
  }
  const state = await evaluate(`({status: document.querySelector('#welcomeStatus')?.textContent, api: typeof window.nimvaraApi, openHandler: typeof document.querySelector('#open')?.onclick})`);
  throw new Error(`Timed out waiting for ${label}: ${JSON.stringify({state, browserErrors})}`);
}

async function stop() {
  try { socket?.close(); } catch {}
  if (child && !child.killed) child.kill();
  await sleep(500);
}

async function firstMarkdown(folder, relative = "") {
  for (const name of (await readdir(path.join(folder, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path.join(relative, name.name);
    if (name.isDirectory()) {
      const found = await firstMarkdown(folder, child);
      if (found) return found;
    } else if (name.isFile() && name.name.toLowerCase().endsWith(".md")) return child.replaceAll("\\", "/");
  }
  return null;
}

const notePath = await firstMarkdown(workspace);
if (!notePath) throw new Error("The smoke source vault must contain at least one Markdown note.");
const noteFullPath = path.join(workspace, notePath);
const originalCopy = await readFile(noteFullPath, "utf8");
const productivityPath = path.join(workspace, "Nimvara Productivity Smoke.md");
await writeFile(productivityPath, "---\ntype: test\nstatus: active\n---\n\n# Productivity smoke\n\n> [!warning] Safe preview\n> Scripts must remain text.\n\n- [ ] Complete safely\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n$E=mc^2$[^n]\n\n[^n]: Local footnote\n\n```mermaid\nflowchart TD\nA[Start] --> B[Finish]\n```\n\n![[Embedded Smoke#Section]]\n\n<script>alert('never')</script>\n", "utf8");
await writeFile(path.join(workspace, "Embedded Smoke.md"), "# Embedded\n\n## Section\n\nRead-only transclusion works.\n\n## Other\n\nExcluded.", "utf8");
await writeFile(path.join(workspace, "Nimvara Smoke.canvas"), JSON.stringify({ nodes: [{ id: "a", type: "text", text: "Canvas safe", x: 0, y: 0, width: 220, height: 100 }, { id: "b", type: "file", file: "Embedded Smoke.md", x: 320, y: 100, width: 220, height: 100 }], edges: [{ id: "e", fromNode: "a", toNode: "b" }] }), "utf8");
const marker = `\n\nNimvara recovery smoke ${Date.now()}`;
const report = { executableSha256: createHash("sha256").update(await readFile(exe)).digest("hex"), sourceVaultMutated: null, copiedVault: workspace, checks: {} };

try {
  await launch(9331);
  await waitFor(`typeof document.querySelector("#open")?.onclick === "function"`, "first-run UI handlers");
  await evaluate(`document.querySelector("#workspacePath").value=${JSON.stringify(workspace)}; document.querySelector("#open").click();`);
  await waitFor(`!document.querySelector("#shell").classList.contains("hidden")`, "workspace shell");
  report.checks.workspaceOpen = await evaluate(`document.querySelectorAll("#files button").length >= 1`);
  report.checks.fileTree = await evaluate(`document.querySelectorAll("#files details").length > 0`);
  report.checks.quietShell = await evaluate(`document.querySelector("#toggleTools").getAttribute("aria-expanded")==="false" && getComputedStyle(document.querySelector(".inspector")).display==="none" && document.querySelector("#content").getBoundingClientRect().height>300`);
  await evaluate(`document.querySelector("#toggleTools").click()`);
  report.checks.toolsReachable = await evaluate(`document.querySelector("#toggleTools").getAttribute("aria-expanded")==="true" && !document.querySelector(".inspector").inert && document.activeElement.id==="toolCategory"`);
  await evaluate(`document.querySelector("#toolCategory").value="organize";document.querySelector("#toolCategory").dispatchEvent(new Event("change"))`);
  report.checks.toolGrouping = await evaluate(`!document.querySelector("#propertyQuery").closest(".tool-group-hidden") && Boolean(document.querySelector("#aiMode").closest(".tool-group-hidden"))`);
  await evaluate(`document.querySelector("#toolCategory").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})); document.querySelector("#toggleFocus").click()`);
  report.checks.focusMode = await evaluate(`getComputedStyle(document.querySelector(".sidebar")).display==="none" && document.querySelector("#toggleFocus").getAttribute("aria-pressed")==="true"`);
  await evaluate(`document.querySelector("#toggleFocus").click()`);
  report.checks.accessibility = await evaluate(`(() => {
    const controls=[...document.querySelectorAll("input,textarea,button")];
    const unnamed=controls.filter(el => !Boolean(el.getAttribute("aria-label") || (el.id && document.querySelector('label[for="'+el.id+'"]')) || el.closest("label") || (el.tagName==="BUTTON" && el.textContent.trim())));
    const named=unnamed.length===0;
    return document.documentElement.lang==="en" && named && document.querySelectorAll('[role="status"][aria-live]').length>=2 && Boolean(document.querySelector(".skip-link"));
  })()`);
  report.unnamedControls = await evaluate(`Array.from(document.querySelectorAll('input,textarea,button')).filter(el=>!Boolean(el.getAttribute('aria-label')||(el.id&&document.querySelector('label[for="'+el.id+'"]'))||el.closest('label')||(el.tagName==='BUTTON'&&el.textContent.trim()))).map(el=>({tag:el.tagName,id:el.id}))`);
  await evaluate(`document.querySelector("#showTasks").click()`);
  await waitFor(`document.querySelector("#tasks").textContent.includes("Complete safely")`, "native task dashboard");
  await evaluate(`[...document.querySelectorAll("#tasks .task-row")].find(row=>row.textContent.includes("Complete safely")).querySelector("[data-task-toggle]").click()`);
  await waitFor(`!document.querySelector("#taskReview").classList.contains("hidden")`, "task review");
  await evaluate(`document.querySelector("#approveTaskChange").click()`);
  await waitFor(`document.querySelector("#footerStatus").textContent.includes("Task change checkpointed")`, "task checkpoint save");
  report.checks.taskDashboard = (await readFile(productivityPath, "utf8")).includes("- [x] Complete safely");
  report.checks.nativeBridge = await evaluate(`Boolean(window.__TAURI__?.core?.invoke)`);
  const savedBoard = await evaluate(`window.__TAURI__.core.invoke("native_save_kanban_board", {board:{id:"work",name:"Work",columns:["backlog","doing","done"]}})`);
  const boards = await evaluate(`window.__TAURI__.core.invoke("native_list_kanban_boards")`);
  report.checks.kanbanBoards = savedBoard.id === "work" && boards.length === 1 && boards[0].columns.join(",") === "backlog,doing,done";
  await evaluate(`document.querySelector("#closeTasks").click()`);

  await evaluate(`document.querySelector('[data-path="${encodeURIComponent("Nimvara Productivity Smoke.md")}"]').click()`);
  await waitFor(`document.querySelector("#notePath").textContent==="Nimvara Productivity Smoke.md"`, "productivity note");
  await evaluate(`document.querySelector("#previewView").click()`);
  await waitFor(`!document.querySelector("#markdownPreview").classList.contains("hidden")`, "Markdown preview");
  report.checks.themeContrast = true;
  for (const theme of ["dark", "light", "high-contrast"]) {
    await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    const contrastPass = await evaluate(`(() => {
      const rgb = s => s.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
      const lum = s => {const c=rgb(s);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
      return ['.sidebar','.callout-warning','.math-inline'].every(selector=>{
        const el=document.querySelector(selector);let parent=el;let bg;
        while(parent){bg=getComputedStyle(parent).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')break;parent=parent.parentElement;}
        const a=lum(getComputedStyle(el).color),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5;
      });
    })()`);
    report.checks.themeContrast &&= contrastPass;
  }
  await evaluate(`document.documentElement.dataset.theme="dark"`);
  await cdp("Emulation.setDeviceMetricsOverride", { width: 900, height: 700, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector("#toggleTools").click()`);
  report.checks.narrowToolsReachable = await evaluate(`getComputedStyle(document.querySelector(".inspector")).display!=="none" && document.querySelector(".inspector").getBoundingClientRect().right<=innerWidth && document.querySelector(".editor").getBoundingClientRect().width>=300`);
  await evaluate(`document.querySelector("#toggleTools").click()`);
  await cdp("Emulation.clearDeviceMetricsOverride");
  if (screenshotPrefix) {
    for (const theme of ["dark", "light"]) {
      await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
      await sleep(100);
      const capture = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(`${screenshotPrefix}-${theme}.png`, Buffer.from(capture.data, "base64"));
    }
    await evaluate(`document.documentElement.dataset.theme="dark"`);
  }
  report.checks.safePreview = await evaluate(`document.querySelector("#markdownPreview .callout-warning") && document.querySelector("#markdownPreview table") && document.querySelector("#markdownPreview .math-inline") && document.querySelector("#markdownPreview .mermaid-diagram") && !document.querySelector("#markdownPreview script") && document.querySelector("#markdownPreview").textContent.includes("alert('never')")`);
  const sourceTaskLine = (await readFile(productivityPath, "utf8")).split(/\r?\n/).findIndex(line => line.includes("- [x] Complete safely")) + 1;
  report.checks.previewTaskLine = await evaluate(`Number(document.querySelector("#markdownPreview [data-preview-task-line]").dataset.previewTaskLine) === ${sourceTaskLine}`);
  await evaluate(`document.querySelector("#markdownPreview [data-preview-embed]").click()`);
  await waitFor(`document.querySelector("#markdownPreview .transclusion")`, "read-only transclusion");
  report.checks.transclusion = await evaluate(`document.querySelector("#markdownPreview .transclusion").textContent.includes("Read-only transclusion works") && !document.querySelector("#markdownPreview .transclusion").textContent.includes("Excluded")`);
  await evaluate(`document.dispatchEvent(new KeyboardEvent("keydown",{key:"k",ctrlKey:true,bubbles:true}))`);
  await waitFor(`document.querySelector("#commandPalette").open`, "command palette");
  report.checks.commandPalette = await evaluate(`document.querySelectorAll("#commandResults button").length >= 6`);
  await evaluate(`document.querySelector("#commandPalette").close(); document.querySelector("#editView").click()`);
  await evaluate(`document.querySelector("#propertyKey").value="owner"; document.querySelector("#propertyValue").value="local"; document.querySelector("#previewPropertyEdit").click()`);
  await waitFor(`!document.querySelector("#propertyEditReview").classList.contains("hidden")`, "property review");
  await evaluate(`document.querySelector("#approvePropertyEdit").click(); document.querySelector("#save").click()`);
  await waitFor(`document.querySelector("#saveState").textContent==="Saved"`, "property save");
  report.checks.propertyEdit = (await readFile(productivityPath, "utf8")).includes("owner: local");
  await evaluate(`document.querySelector("#propertyViewMode").value="table"; document.querySelector("#propertyQuery").value="type:test"; document.querySelector("#runPropertyView").click()`);
  await waitFor(`document.querySelector("#propertyResults table")`, "structured property table");
  report.checks.structuredView = await evaluate(`document.querySelector("#propertyResults table").textContent.includes("status")`);

  await evaluate(`document.querySelector("#calendarDate").value="2099-01-02"; document.querySelector("#openDate").click()`);
  await waitFor(`document.querySelector("#notePath").textContent==="Daily/2099-01-02.md"`, "calendar daily note");
  report.checks.calendarDaily = await readFile(path.join(workspace, "Daily", "2099-01-02.md"), "utf8").then((content) => content.includes("2099-01-02"), () => false);
  await evaluate(`document.querySelector("#runCompatibility").click()`);
  await waitFor(`!document.querySelector("#compatibilityResults").classList.contains("hidden")`, "compatibility report");
  report.checks.compatibilityScan = await evaluate(`document.querySelector("#compatibilityResults").textContent.includes("Read-only compatibility summary")`);
  await evaluate(`document.querySelector("#canvasPath").value="Nimvara Smoke.canvas"; document.querySelector("#openCanvas").click()`);
  await waitFor(`document.querySelector("#canvasViewer svg")`, "read-only Canvas viewer");
  report.checks.canvasViewer = await evaluate(`document.querySelector("#canvasViewer svg").textContent.includes("Canvas safe")`);
  await evaluate(`document.querySelector('[data-path="${encodeURIComponent(notePath)}"]').click()`);
  await waitFor(`document.querySelector("#notePath").textContent===${JSON.stringify(notePath)}`, "recovery source note");
  await evaluate(`document.querySelector("#content").value += ${JSON.stringify(marker)}; document.querySelector("#content").dispatchEvent(new Event("input",{bubbles:true}));`);
  await waitFor(`document.querySelector("#saveState").textContent==="Draft protected"`, "recovery journal");
  report.checks.recoveryJournal = true;
  await stop();

  await launch(9332);
  await waitFor(`typeof document.querySelector("#open")?.onclick === "function"`, "restarted UI handlers");
  await evaluate(`document.querySelector("#workspacePath").value=${JSON.stringify(workspace)}; document.querySelector("#open").click();`);
  await waitFor(`!document.querySelector("#recovery").classList.contains("hidden")`, "recovery prompt");
  await evaluate(`document.querySelector("#recoverDraft").click(); document.dispatchEvent(new KeyboardEvent("keydown",{key:"s",ctrlKey:true,bubbles:true}));`);
  await waitFor(`document.querySelector("#saveState").textContent==="Saved"`, "recovered save");
  report.checks.crashRecovery = (await readFile(noteFullPath, "utf8")).endsWith(marker);

  const searchCount = await evaluate(`window.__TAURI__.core.invoke("native_search",{query:"Nimvara recovery smoke"}).then(r=>r.length)`);
  report.checks.search = searchCount >= 1;
  const importSource = path.join(root, "Capture café 日本語.txt");
  const importBytes = Buffer.from("Nimvara ingestion smoke searchable original café 日本語\n", "utf8");
  await writeFile(importSource, importBytes);
  const beforePreview = await digestTree(workspace);
  const preview = await evaluate(`window.__TAURI__.core.invoke("native_preview_local",{path:${JSON.stringify(importSource)}})`);
  report.checks.ingestionPreviewReadOnly = beforePreview === await digestTree(workspace);
  await evaluate(`window.__TAURI__.core.invoke("native_commit_ingestion",{previewId:${JSON.stringify(preview.id)},destinationFolder:"Imports",noteName:"Capture café 日本語",allowDuplicate:false})`);
  const importedText = await readFile(path.join(workspace, "Imports", "Capture café 日本語.md"), "utf8");
  report.checks.ingestionProvenance = importedText.includes(preview.provenance.originalHash) && importedText.includes("Source provenance") && (await readFile(importSource)).equals(importBytes);
  report.checks.ingestionSearch = await evaluate(`window.__TAURI__.core.invoke("native_search",{query:"Nimvara ingestion smoke"}).then(r=>r.length>0)`);
  const duplicate = await evaluate(`window.__TAURI__.core.invoke("native_preview_local",{path:${JSON.stringify(importSource)}})`);
  report.checks.ingestionDuplicate = Boolean(duplicate.duplicate) && await evaluate(`window.__TAURI__.core.invoke("native_commit_ingestion",{previewId:${JSON.stringify(duplicate.id)},destinationFolder:"Imports",noteName:"Duplicate",allowDuplicate:false}).then(()=>false,e=>String(e).includes("DUPLICATE_FOUND"))`);
  await evaluate(`window.__TAURI__.core.invoke("native_cancel_ingestion",{previewId:${JSON.stringify(duplicate.id)}})`);
  report.checks.ingestionCancel = await evaluate(`window.__TAURI__.core.invoke("native_commit_ingestion",{previewId:${JSON.stringify(duplicate.id)},destinationFolder:"Imports",noteName:"Cancelled",allowDuplicate:false}).then(()=>false,e=>String(e).includes("PREVIEW_NOT_FOUND"))`);
  const snapshot = await evaluate(`window.__TAURI__.core.invoke("native_create_snapshot",{destination:${JSON.stringify(backups)}})`);
  const restored = await evaluate(`window.__TAURI__.core.invoke("native_restore_snapshot",{snapshotPath:${JSON.stringify(snapshot.path)},destination:${JSON.stringify(restore)}})`);
  report.checks.backupRestore = restored.verified && (await digestTree(workspace)) === (await digestTree(restore));

  const migrationDestination = path.join(root, "migrated-vault");
  const beforeMigration = await digestTree(workspace);
  const migration = await evaluate(`window.__TAURI__.core.invoke("native_migrate_workspace",{source:${JSON.stringify(workspace)},destination:${JSON.stringify(migrationDestination)}})`);
  report.checks.migration = migration.files.length > 0
    && (await readFile(path.join(migrationDestination, ".nimvara-migration.json"), "utf8")).includes('"schema": 1')
    && !((await readdir(migrationDestination)).includes(".lantern"))
    && beforeMigration === await digestTree(workspace);

  const disk = await evaluate(`window.__TAURI__.core.invoke("native_read_note",{path:${JSON.stringify(notePath)}})`);
  await writeFile(noteFullPath, `${originalCopy}\nexternal OneDrive-style change`, "utf8");
  const conflict = await evaluate(`window.__TAURI__.core.invoke("native_save_note",{path:${JSON.stringify(notePath)},content:"unsafe overwrite",expectedHash:${JSON.stringify(disk.hash)}}).then(()=>false,()=>true)`);
  report.checks.externalConflict = conflict && (await readFile(noteFullPath, "utf8")).includes("external OneDrive-style change");
  await stop();
  report.sourceVaultMutated = sourceBefore !== await digestTree(sourceVault);
  report.browserErrors = browserErrors;
  report.passed = !report.sourceVaultMutated && browserErrors.length === 0 && Object.values(report.checks).every(Boolean);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed) process.exitCode = 1;
} finally {
  await stop();
  await rm(root, { recursive: true, force: true });
}
