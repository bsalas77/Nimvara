import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NimvaraError } from "./lantern-core.mjs";

const filePath = (root) => path.join(root, ".lantern", "kanban-boards.json");
const cleanBoard = (input) => {
  const id = String(input?.id || "").trim();
  const name = String(input?.name || "").trim();
  const columns = Array.isArray(input?.columns) ? [...new Set(input.columns.map((value) => String(value).trim().toLowerCase()))] : [];
  if (!/^[a-z][a-z0-9_-]{2,31}$/.test(id) || !name || name.length > 120 || columns.length < 2 || columns.length > 20 || columns.some((column) => !/^[a-z][a-z0-9_-]{1,31}$/.test(column))) throw new NimvaraError("KANBAN_BOARD", "Board id, name, or columns are invalid.");
  return { id, name, columns };
};

export async function listKanbanBoards(root) {
  try {
    const parsed = JSON.parse(await readFile(filePath(root), "utf8"));
    return Array.isArray(parsed) ? parsed.map(cleanBoard) : [];
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return [];
    throw new NimvaraError("KANBAN_BOARD", "Kanban board configuration could not be read.");
  }
}

export async function saveKanbanBoard(root, input) {
  const board = cleanBoard(input);
  const boards = (await listKanbanBoards(root)).filter((item) => item.id !== board.id);
  boards.push(board);
  await mkdir(path.dirname(filePath(root)), { recursive: true });
  await writeFile(filePath(root), `${JSON.stringify(boards.slice(-50), null, 2)}\n`, { flag: "w" });
  return board;
}

