const id = (value) => document.getElementById(value);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function showProposal(viewer, canvas, node, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 100000 || Math.abs(y) > 100000) return;
  const next = structuredClone(canvas);
  const target = next.nodes.find((item) => String(item.id) === String(node.id));
  if (!target) return;
  const before = { x: target.x, y: target.y };
  target.x = x; target.y = y;
  const panel = document.createElement("section");
  panel.className = "preview canvas-edit-review";
  panel.setAttribute("role", "region"); panel.setAttribute("aria-label", "Canvas move review");
  panel.innerHTML = `<strong>Canvas move proposal</strong><p>${escapeHtml(node.id)}: (${before.x}, ${before.y}) → (${x}, ${y})</p><p>No canvas file has been changed.</p>`;
  const download = document.createElement("button"); download.className = "secondary"; download.textContent = "Download proposal";
  download.onclick = () => { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([`${JSON.stringify(next, null, 2)}\n`], { type: "application/json" })); link.download = `${String(canvas.path || "canvas").split("/").at(-1)}.proposal.json`; link.click(); URL.revokeObjectURL(link.href); };
  const approve = document.createElement("button"); approve.textContent = "Approve and save";
  approve.onclick = async () => { approve.disabled = true; try { await window.nimvaraApi("/api/canvas/save", { method: "POST", body: JSON.stringify({ path: canvas.path, canvas: next, expectedHash: canvas.hash }) }); panel.innerHTML = "<strong>Canvas saved and verified.</strong><p>The edit was checkpointed by the conflict-safe native path.</p>"; } catch (error) { panel.innerHTML = `<strong role="alert">Save refused.</strong><p>${escapeHtml(error.message || error)}</p>`; } };
  panel.append(download, approve); viewer.querySelector(".canvas-edit-review")?.remove(); viewer.append(panel);
}

async function wireCanvas() {
  const viewer = id("canvasViewer"), svg = viewer?.querySelector("svg"), path = id("canvasPath")?.value.trim();
  if (!viewer || !svg || !path || viewer.dataset.canvasWired === path) return;
  viewer.dataset.canvasWired = path;
  let canvas;
  try { const response = await fetch(`/api/canvas?path=${encodeURIComponent(path)}`); if (!response.ok) return; canvas = await response.json(); } catch { return; }
  [...svg.querySelectorAll("g")].forEach((group, index) => {
    const node = canvas.nodes[index]; if (!node) return;
    group.setAttribute("tabindex", "0"); group.setAttribute("role", "button"); group.setAttribute("aria-label", `Move canvas node ${String(node.text || node.file || node.type || "Node").slice(0, 60)}`);
    let start = null;
    group.addEventListener("pointerdown", (event) => { start = { x: event.clientX, y: event.clientY }; group.setPointerCapture?.(event.pointerId); });
    group.addEventListener("pointerup", (event) => { if (!start) return; const scaleX = svg.viewBox.baseVal.width / Math.max(1, svg.clientWidth), scaleY = svg.viewBox.baseVal.height / Math.max(1, svg.clientHeight); showProposal(viewer, canvas, node, Number(node.x) + (event.clientX - start.x) * scaleX, Number(node.y) + (event.clientY - start.y) * scaleY); start = null; });
    group.addEventListener("pointercancel", () => { start = null; });
    group.addEventListener("keydown", (event) => { const step = event.shiftKey ? 20 : 5; const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0; const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0; if (!dx && !dy) return; event.preventDefault(); showProposal(viewer, canvas, node, Number(node.x) + dx, Number(node.y) + dy); });
  });
}

new MutationObserver(wireCanvas).observe(document.body, { childList: true, subtree: true });
wireCanvas();
