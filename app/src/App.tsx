import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ApiError, api, type Checkpoint, type Note, type SafetyState, type SearchResult, type Snapshot, type WorkspaceFile } from "./api";

function App() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [workspaceInput, setWorkspaceInput] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [draft, setDraft] = useState("");
  const [newPath, setNewPath] = useState("New note.md");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<Checkpoint[]>([]);
  const [backupPath, setBackupPath] = useState("");
  const [restorePath, setRestorePath] = useState("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [message, setMessage] = useState("Local files. No account. AI is not enabled.");
  const [conflict, setConflict] = useState(false);
  const [safety, setSafety] = useState<SafetyState | null>(null);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [quickOpen, setQuickOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem("nimvara.recent") ?? "[]"));
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem("nimvara.favorites") ?? "[]"));
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const dirty = useMemo(() => note !== null && draft !== note.content, [note, draft]);

  const applyMarkdown = (prefix: string, suffix = "") => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = draft.slice(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    setDraft(`${draft.slice(0, start)}${replacement}${draft.slice(end)}`);
    requestAnimationFrame(() => {
      editor.focus();
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + (selected || "text").length;
      editor.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const shortcuts: Record<string, [string, string]> = { b: ["**", "**"], i: ["*", "*"], k: ["[", "](url)"] };
    const shortcut = shortcuts[event.key.toLowerCase()];
    if (!shortcut) return;
    event.preventDefault();
    applyMarkdown(shortcut[0], shortcut[1]);
  };

  useEffect(() => {
    api.status().then((status) => {
      setWorkspaceInput(status.workspace ?? status.sampleWorkspace);
      if (status.workspace) openWorkspace(status.workspace, false);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function showError(error: unknown) {
    const known = error as ApiError;
    setConflict(known.code === "EXTERNAL_CHANGE");
    setMessage(`${known.code ?? "ERROR"}: ${known.message}`);
  }

  async function openWorkspace(path = workspaceInput, create = false) {
    try {
      const opened = await api.openWorkspace(path, create);
      setWorkspace(opened.workspace);
      setWorkspaceInput(opened.workspace);
      setFiles(opened.files);
      setWorkspaceFiles(await api.workspaceFiles());
      setMessage(`Workspace open: ${opened.workspace}`);
      setSafety(await api.safety());
      if (opened.files[0]) await openNote(opened.files[0]);
    } catch (error) { showError(error); }
  }

  async function openNote(path: string) {
    if (dirty && !window.confirm("Discard unsaved edits and open another note?")) return;
    try {
      const loaded = await api.note(path);
      setNote(loaded);
      setDraft(loaded.content);
      setConflict(false);
      setHistory(await api.history(path));
      setSafety(await api.safety(path));
      setMessage(`Loaded ${path}`);
      setRecent((items) => { const next = [path, ...items.filter((item) => item !== path)].slice(0, 12); localStorage.setItem("nimvara.recent", JSON.stringify(next)); return next; });
    } catch (error) { showError(error); }
  }

  async function save() {
    if (!note) return;
    try {
      const result = await api.save(note.path, draft, note.hash);
      const refreshed = await api.note(note.path);
      setNote(refreshed);
      setDraft(refreshed.content);
      setHistory(await api.history(note.path));
      setConflict(false);
      setMessage(result.unchanged ? "No changes to save." : `Saved and verified ${note.path}`);
      setSafety(await api.safety(note.path));
    } catch (error) { showError(error); }
  }

  async function createNote() {
    try {
      await api.save(newPath, `# ${newPath.replace(/\.md$/i, "")}\n\n`, null);
      setFiles(await api.files());
      setWorkspaceFiles(await api.workspaceFiles());
      await openNote(newPath);
    } catch (error) { showError(error); }
  }

  function toggleFavorite(path: string) {
    setFavorites((items) => { const next = items.includes(path) ? items.filter((item) => item !== path) : [path, ...items]; localStorage.setItem("nimvara.favorites", JSON.stringify(next)); return next; });
  }

  async function createDailyNote() {
    const date = new Date().toISOString().slice(0, 10);
    const path = `Daily/${date}.md`;
    try { await api.save(path, `# ${date}\n\n## Notes\n\n`, null); setFiles(await api.files()); setWorkspaceFiles(await api.workspaceFiles()); await openNote(path); setCommandOpen(false); } catch (error) { showError(error); }
  }

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "p") { event.preventDefault(); setCommandOpen(true); } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") { event.preventDefault(); setQuickOpen(true); } if (event.key === "Escape") { setQuickOpen(false); setCommandOpen(false); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function search() {
    try { setResults(await api.search(query)); setMessage(`Search complete for “${query}”.`); }
    catch (error) { showError(error); }
  }

  async function reloadAfterConflict() {
    if (!note) return;
    const loaded = await api.note(note.path);
    setNote(loaded); setDraft(loaded.content); setConflict(false); setMessage("Reloaded external version.");
  }

  async function restoreCheckpoint(item: Checkpoint) {
    if (!note || !window.confirm(`Restore ${item.path} from ${new Date(item.createdAt).toLocaleString()}? Current bytes will be checkpointed.`)) return;
    try {
      await api.restoreHistory(item.id, note.hash);
      await openNote(note.path);
      setMessage("Checkpoint restored and verified.");
    } catch (error) { showError(error); }
  }

  async function createBackup() {
    try {
      const snapshot = await api.snapshot(backupPath);
      setSnapshots(await api.snapshots(backupPath));
      setMessage(`Verified snapshot ${snapshot.id}`);
    } catch (error) { showError(error); }
  }

  async function loadSnapshots() {
    try { setSnapshots(await api.snapshots(backupPath)); }
    catch (error) { showError(error); }
  }

  async function restore(snapshot: Snapshot) {
    try {
      const result = await api.restoreSnapshot(snapshot.path, restorePath);
      setMessage(`Restored and verified ${result.files} files to ${result.destination}`);
    } catch (error) { showError(error); }
  }

  if (!workspace) {
    return <main className="welcome">
      <section className="welcome-card">
        <span className="mark">◐</span>
        <p className="eyebrow">PROJECT LANTERN</p>
        <h1>Your notes stay ordinary files.</h1>
        <p>Open or create a Markdown folder. No account, plugin selection, model download, or proprietary import.</p>
        <label>Workspace folder<input value={workspaceInput} onChange={(e) => setWorkspaceInput(e.target.value)} /></label>
        <div className="actions">
          <button onClick={() => openWorkspace(workspaceInput, false)}>Open folder</button>
          <button className="secondary" onClick={() => openWorkspace(workspaceInput, true)}>Create folder</button>
        </div>
        <p className="status">{message}</p>
      </section>
    </main>;
  }

  return <main className="shell">
    <header>
      <div><span className="mark small">◐</span><strong>Nimvara</strong></div>
      <span className="path">{workspace}</span>
      <div className="badges"><span>AI off</span><span>{dirty ? "Unsaved" : "Saved"}</span></div>
    </header>
    <aside className="sidebar">
      <div className="search-row"><input placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} /><button onClick={search}>Find</button></div>
      {results.length > 0 && <section className="results"><h2>Results</h2>{results.map((result) => <button key={result.path} onClick={() => openNote(result.path)}><strong>{result.path}</strong><small>{result.snippet}</small></button>)}</section>}
      <section><div className="section-head"><h2>Files</h2><button onClick={() => Promise.all([api.files().then(setFiles), api.workspaceFiles().then(setWorkspaceFiles)])}>↻</button></div>{files.map((file) => <div className="file-row" key={file}><button className={note?.path === file ? "active file" : "file"} onClick={() => openNote(file)}>{file}</button><button className="favorite" aria-label={`${favorites.includes(file) ? "Remove" : "Add"} favorite ${file}`} onClick={() => toggleFavorite(file)}>{favorites.includes(file) ? "★" : "☆"}</button></div>)}</section>
      <section className="navigation"><h2>Recent</h2>{recent.filter((item) => files.includes(item)).slice(0, 5).map((item) => <button key={item} onClick={() => openNote(item)}>{item}</button>)}<h2>Favorites</h2>{favorites.filter((item) => files.includes(item)).map((item) => <button key={item} onClick={() => openNote(item)}>★ {item}</button>)}</section>
      <section><h2>Attachments</h2>{workspaceFiles.filter((item) => item.kind === "attachment").length ? workspaceFiles.filter((item) => item.kind === "attachment").map((item) => <div className="attachment" key={item.path}><span>{item.path}</span><small>{item.extension || "file"} · {item.bytes} bytes</small></div>) : <p className="muted">No attachments.</p>}</section>
      <section className="new-note"><input value={newPath} onChange={(e) => setNewPath(e.target.value)} /><button onClick={createNote}>New note</button></section>
    </aside>
    <section className="editor">
      <div className="editor-head"><div><p className="eyebrow">MARKDOWN</p><h1>{note?.path ?? "No note"}</h1></div><button disabled={!dirty} onClick={save}>Save</button></div>
      {conflict && <div className="warning"><strong>External change detected.</strong> Your draft was not written. <button onClick={reloadAfterConflict}>Reload disk version</button></div>}
      <div className="editor-tools" aria-label="Markdown formatting tools">
        <button type="button" onClick={() => applyMarkdown("# ")} aria-label="Heading">H</button>
        <button type="button" onClick={() => applyMarkdown("**", "**")} aria-label="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => applyMarkdown("*", "*")} aria-label="Italic"><em>I</em></button>
        <button type="button" onClick={() => applyMarkdown("- ")} aria-label="Bullet list">• List</button>
        <button type="button" onClick={() => applyMarkdown("[", "](url)")} aria-label="Link">Link</button>
        <span className="editor-hint">Ctrl/Cmd+B bold · Ctrl/Cmd+I italic · Ctrl/Cmd+K link</span>
      </div>
      <textarea ref={editorRef} aria-label="Markdown editor" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleEditorKeyDown} spellCheck />
    </section>
    <aside className="inspector">
      <section className="safety"><div className="section-head"><h2>Safety center</h2><button onClick={() => api.safety(note?.path).then(setSafety)}>↻</button></div>
        <p className="safety-state"><span className="status-dot" />{safety?.localSave === "verified" ? "Saved locally and verified" : "Workspace ready"}</p>
        <dl><div><dt>External changes</dt><dd>{conflict ? "Blocked — review needed" : "Monitored"}</dd></div><div><dt>Sync</dt><dd>{safety?.sync ?? "Not configured"}</dd></div><div><dt>Backup</dt><dd>{safety?.backup ?? "Not verified"}</dd></div><div><dt>Checkpoints</dt><dd>{safety?.checkpointCount ?? history.length}</dd></div><div><dt>Watcher</dt><dd>{safety?.watchMode ?? "Unknown"}</dd></div></dl>
        <p className="hint">Nimvara never silently overwrites an external edit. Sync and backup are separate controls.</p>
      </section>
      <section><h2>History</h2>{history.length ? history.map((item) => <button key={item.id} onClick={() => restoreCheckpoint(item)}><strong>{new Date(item.createdAt).toLocaleString()}</strong><small>{item.reason}</small></button>) : <p>No checkpoints yet.</p>}</section>
      <section><h2>Snapshot backup</h2><label>Destination<input value={backupPath} onChange={(e) => setBackupPath(e.target.value)} placeholder="Separate backup folder" /></label><div className="actions compact"><button onClick={createBackup}>Create</button><button className="secondary" onClick={loadSnapshots}>List</button></div>
        <label>Restore into empty folder<input value={restorePath} onChange={(e) => setRestorePath(e.target.value)} /></label>
        {snapshots.map((snapshot) => <button key={snapshot.path} disabled={!snapshot.verified} onClick={() => restore(snapshot)}><strong>{snapshot.id}</strong><small>{snapshot.verified ? "Verified" : "Invalid"}</small></button>)}
      </section>
    </aside>
    <footer>{message}</footer>
    {quickOpen && <div className="quick-overlay" role="dialog" aria-label="Quick switcher"><div className="quick-card"><input autoFocus aria-label="Quick switcher search" placeholder="Open note…" value={quickQuery} onChange={(e) => setQuickQuery(e.target.value)} />{files.filter((file) => file.toLowerCase().includes(quickQuery.toLowerCase())).slice(0, 12).map((file) => <button key={file} onClick={() => { setQuickOpen(false); setQuickQuery(""); openNote(file); }}>{file}</button>)}<small>Esc to close · Ctrl/Cmd+P to open</small></div></div>}
    {commandOpen && <div className="quick-overlay" role="dialog" aria-label="Command palette"><div className="quick-card"><h2>Command palette</h2><button onClick={() => { setCommandOpen(false); save(); }}>Save current note</button><button onClick={createDailyNote}>Create daily note</button><button onClick={() => { Promise.all([api.files().then(setFiles), api.workspaceFiles().then(setWorkspaceFiles)]); setCommandOpen(false); }}>Refresh workspace</button><button onClick={() => { setCommandOpen(false); setQuickOpen(true); }}>Quick switcher</button><small>Esc to close · Ctrl/Cmd+Shift+P to open</small></div></div>}
  </main>;
}

export default App;
