const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function loadExtensions(list, status) {
  try {
    const items = await window.nimvaraApi("/api/extensions");
    list.innerHTML = items.length ? items.map((item) => `<li><strong>${escapeHtml(item.name)}</strong> <small>${escapeHtml(item.version)} · ${escapeHtml(item.status)}</small> <button type="button" data-extension="${escapeHtml(item.id)}" data-enabled="${!item.enabled}">${item.enabled ? "Disable" : "Enable"}</button></li>`).join("") : "<li>No extensions registered.</li>";
    list.querySelectorAll("button[data-extension]").forEach((button) => { button.onclick = async () => { try { await window.nimvaraApi("/api/extensions/toggle", { method: "POST", body: JSON.stringify({ id: button.dataset.extension, enabled: button.dataset.enabled === "true" }) }); await loadExtensions(list, status); status.textContent = "Extension state updated. New extensions remain permission-limited."; } catch (error) { status.textContent = error.message || String(error); } }; });
  } catch (error) { status.textContent = error.message || String(error); }
}

function mountExtensions() {
  if (document.getElementById("extensionManager")) return;
  const anchor = document.querySelector(".inspector section:last-of-type"); if (!anchor) return;
  const section = document.createElement("section"); section.id = "extensionManager"; section.innerHTML = '<h2>Extensions</h2><p>Extensions are local, permission-limited, and disabled until you explicitly enable them. Unsigned builds are development-only.</p><label for="extensionTrustedKey">Trusted Ed25519 public key (PEM)</label><textarea id="extensionTrustedKey" rows="4" placeholder="-----BEGIN PUBLIC KEY-----"></textarea><button id="trustExtensionKey" class="secondary">Trust key for this session</button><p id="trustedKeyList" class="muted"></p><label for="extensionManifest">Manifest JSON</label><textarea id="extensionManifest" rows="5" placeholder="{&quot;id&quot;:&quot;example.reader&quot;,&quot;name&quot;:&quot;Example Reader&quot;,&quot;version&quot;:&quot;1.0.0&quot;,&quot;permissions&quot;:[&quot;notes:read&quot;]}"></textarea><div class="actions compact"><button id="registerExtension">Register</button><button id="refreshExtensions" class="secondary">Refresh</button></div><p id="extensionStatus" class="status" role="status"></p><ul id="extensionList"></ul>';
  anchor.after(section);
  const list = document.getElementById("extensionList"), status = document.getElementById("extensionStatus");
  document.getElementById("registerExtension").onclick = async () => { try { const manifest = JSON.parse(document.getElementById("extensionManifest").value); const result = await window.nimvaraApi("/api/extensions/register", { method: "POST", body: JSON.stringify(manifest) }); status.textContent = `${result.name} registered disabled by default.`; document.getElementById("extensionManifest").value = ""; await loadExtensions(list, status); } catch (error) { status.textContent = error.message || String(error); } };
  document.getElementById("refreshExtensions").onclick = () => loadExtensions(list, status);
  document.getElementById("trustExtensionKey").onclick = async () => { try { const result = await window.nimvaraApi("/api/extensions/trusted-keys", { method: "POST", body: JSON.stringify({ publicKey: document.getElementById("extensionTrustedKey").value }) }); document.getElementById("extensionTrustedKey").value = ""; document.getElementById("trustedKeyList").textContent = `Trusted key ${result.fingerprint}… for this session.`; status.textContent = "Trusted key added; signed extensions were rechecked."; await loadExtensions(list, status); } catch (error) { status.textContent = error.message || String(error); } };
  loadExtensions(list, status);
}

new MutationObserver(mountExtensions).observe(document.body, { childList: true, subtree: true });
mountExtensions();
