import { transformSelection } from "./editor-tools.js";
function mountEditorToolbar() {
  const textarea = document.getElementById("content"); if (!textarea || document.getElementById("editorToolbar")) return;
  const toolbar = document.createElement("div"); toolbar.id = "editorToolbar"; toolbar.className = "actions compact"; toolbar.setAttribute("role", "toolbar"); toolbar.setAttribute("aria-label", "Markdown formatting");
  for (const [action, label] of [["bold", "Bold"], ["italic", "Italic"], ["strike", "Strikethrough"], ["code", "Inline code"], ["link", "Link"], ["heading", "Heading"], ["list", "Bullet list"], ["task", "Task"], ["quote", "Quote"], ["table", "Table"]]) { const button = document.createElement("button"); button.type = "button"; button.className = "secondary"; button.textContent = label; button.setAttribute("aria-label", label); button.onclick = () => { const result = transformSelection(textarea.value, textarea.selectionStart, textarea.selectionEnd, action); textarea.value = result.value; textarea.setSelectionRange(result.start, result.end); textarea.dispatchEvent(new Event("input", { bubbles: true })); textarea.focus(); }; toolbar.append(button); }
  textarea.before(toolbar);
}
new MutationObserver(mountEditorToolbar).observe(document.body, { childList: true, subtree: true });
mountEditorToolbar();
