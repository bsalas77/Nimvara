export function parseMindMap(markdown, fallbackTitle = "Untitled") {
  const root = { id: "root", label: fallbackTitle.replace(/\.md$/i, ""), level: 0, line: 1, children: [] };
  const stack = [root];
  let fenced = false;
  let sequence = 0;
  const linked = new Set();
  for (const [index, raw] of String(markdown).split(/\r?\n/).entries()) {
    if (/^\s*(```|~~~)/.test(raw)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const heading = raw.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    const list = raw.match(/^(\s*)[-*+]\s+(?:\[[ xX]\]\s+)?(.+?)\s*$/);
    if (heading) {
      const level = heading[1].length;
      const node = makeNode(cleanLabel(heading[2]), level, index + 1, ++sequence);
      while (stack.length > 1 && stack.at(-1).level >= level) stack.pop();
      stack.at(-1).children.push(node); stack.push(node);
    } else if (list) {
      const level = 7 + Math.floor(list[1].replace(/\t/g, "  ").length / 2);
      const node = makeNode(cleanLabel(list[2]), level, index + 1, ++sequence);
      while (stack.length > 1 && stack.at(-1).level >= level) stack.pop();
      stack.at(-1).children.push(node); stack.push(node);
    }
    for (const match of raw.matchAll(/!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g)) {
      const target = match[1].trim();
      if (!target || linked.has(target.toLowerCase())) continue;
      linked.add(target.toLowerCase());
      root.children.push({ ...makeNode((match[2] || target).trim(), 1, index + 1, ++sequence), target });
    }
  }
  if (!root.children.length) root.children.push(makeNode("No headings or list items", 1, 1, ++sequence));
  return root;
}

function makeNode(label, level, line, id) { return { id: `node-${id}`, label, level, line, children: [] }; }
function cleanLabel(value) { return value.replace(/!?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, alias) => alias || target).replace(/[*_`~]/g, "").trim() || "Untitled"; }

export function layoutMindMap(root) {
  const nodes = [], edges = [];
  let row = 0;
  function visit(node, depth, parent = null) {
    const current = { ...node, x: 32 + depth * 230, y: 36 + row++ * 64, depth };
    nodes.push(current);
    if (parent) edges.push({ from: parent.id, to: current.id });
    for (const child of node.children) visit(child, depth + 1, current);
  }
  visit(root, 0);
  return { nodes, edges, width: Math.max(720, 280 + Math.max(...nodes.map((node) => node.depth)) * 230), height: Math.max(360, 72 + nodes.length * 64) };
}

export function proposeCanvasNodeMove(canvasJson, nodeId, x, y) {
  let document;
  try { document = JSON.parse(String(canvasJson)); } catch { throw new Error("Canvas source is not valid JSON."); }
  if (!document || !Array.isArray(document.nodes)) throw new Error("Canvas source has no node list.");
  const node = document.nodes.find((item) => String(item.id) === String(nodeId));
  if (!node) throw new Error("Canvas node was not found.");
  const nextX = Number(x), nextY = Number(y);
  if (!Number.isFinite(nextX) || !Number.isFinite(nextY) || Math.abs(nextX) > 100000 || Math.abs(nextY) > 100000) throw new Error("Canvas coordinates are out of bounds.");
  const before = { x: node.x, y: node.y };
  node.x = nextX; node.y = nextY;
  return { content: `${JSON.stringify(document, null, 2)}\n`, before, after: { x: nextX, y: nextY }, nodeId: String(nodeId) };
}
