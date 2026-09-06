const byId = (id) => document.getElementById(id);

async function readProgress(destination) {
  if (!destination) return null;
  const response = await fetch(`/api/migration/status?destination=${encodeURIComponent(destination)}`);
  if (!response.ok) throw new Error("Migration status is unavailable.");
  return response.json();
}

async function requestCancel(destination) {
  const response = await fetch("/api/migration/cancel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ destination })
  });
  if (!response.ok) throw new Error("Migration cancellation could not be requested.");
}

function wireMigrationPanel() {
  const button = byId("migrateWorkspace");
  if (!button || button.dataset.progressWired) return;
  // Native migration is a single verified command. It does not expose a
  // browser-only polling/cancellation endpoint, so do not add controls that
  // would falsely imply they work in the packaged application.
  if (window.__TAURI__?.core?.invoke) return;
  button.dataset.progressWired = "true";
  const destination = byId("migrationDestination");
  const status = byId("migrationStatus");
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "secondary";
  cancel.textContent = "Cancel migration";
  cancel.hidden = true;
  button.after(cancel);
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "secondary";
  retry.textContent = "Retry migration";
  retry.hidden = true;
  cancel.after(retry);
  let polling = null;
  const stopPolling = () => { if (polling) clearInterval(polling); polling = null; cancel.hidden = true; };
  const poll = async () => {
    try {
      const progress = await readProgress(destination.value.trim());
      if (progress) {
        status.textContent = `Migration ${progress.phase}: ${progress.completed} of ${progress.total} file(s) verified.`;
        cancel.hidden = false;
      } else if (polling) {
        status.textContent = "Migration is finishing or has rolled back; recheck the destination before retrying.";
      }
    } catch (error) { status.textContent = error.message; }
  };
  button.addEventListener("click", () => {
    retry.hidden = true;
    cancel.hidden = false;
    if (!polling) { polling = setInterval(poll, 500); poll(); }
  });
  cancel.addEventListener("click", async () => {
    cancel.disabled = true;
    try { await requestCancel(destination.value.trim()); status.textContent = "Cancellation requested. The partial destination will be rolled back safely."; }
    catch (error) { status.textContent = error.message; }
    finally { cancel.disabled = false; }
  });
  retry.addEventListener("click", () => { retry.hidden = true; button.click(); });
  const observer = new MutationObserver(() => {
    if (!button.disabled && polling) { stopPolling(); retry.hidden = false; }
  });
  observer.observe(button, { attributes: true, attributeFilter: ["disabled"] });
}

new MutationObserver(wireMigrationPanel).observe(document.body, { childList: true, subtree: true });
wireMigrationPanel();
