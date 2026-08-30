const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function wirePublishingPreview() {
  const button = document.getElementById("publishNotes"), destination = document.getElementById("publishDestination");
  if (!button || button.dataset.previewWired) return;
  button.dataset.previewWired = "true";
  const previewButton = document.createElement("button"); previewButton.type = "button"; previewButton.className = "secondary"; previewButton.textContent = "Preview export"; button.before(previewButton);
  const panel = document.createElement("div"); panel.className = "preview hidden"; panel.setAttribute("role", "region"); panel.setAttribute("aria-label", "Static export preview"); button.after(panel);
  previewButton.onclick = () => {
    const content = document.getElementById("content")?.value || "";
    const title = content.split(/\r?\n/).find((line) => line.startsWith("# "))?.slice(2) || "Current note";
    panel.innerHTML = `<strong>Export preview</strong><p>Destination: ${esc(destination.value.trim() || "Not selected")}</p><h3>${esc(title)}</h3><pre>${esc(content.slice(0, 12000))}${content.length > 12000 ? "\n… preview truncated …" : ""}</pre><p>Preview only; no files were written.</p>`;
    panel.classList.remove("hidden");
  };
}

new MutationObserver(wirePublishingPreview).observe(document.body, { childList: true, subtree: true });
wirePublishingPreview();
