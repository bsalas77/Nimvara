import { execFile } from "node:child_process";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function packageStaticExport(sourcePath, archivePath) {
  const source = path.resolve(String(sourcePath));
  const archive = path.resolve(String(archivePath));
  const info = await stat(source).catch(() => null);
  if (!info?.isDirectory()) throw new Error("EXPORT_SOURCE: source must be an existing export folder.");
  if (source === archive || archive.startsWith(`${source}${path.sep}`)) throw new Error("EXPORT_DESTINATION: archive must be outside the export folder.");
  if (await access(archive).then(() => true).catch(() => false)) throw new Error("EXPORT_DESTINATION: archive already exists; choose a new path.");
  const tar = process.platform === "win32" ? "tar.exe" : "tar";
  try {
    await execFileAsync(tar, ["-a", "-c", "-f", archive, "-C", source, "."], { windowsHide: true, maxBuffer: 1024 * 1024 });
  } catch (error) {
    throw new Error(`EXPORT_ARCHIVE_UNAVAILABLE: ${error.code === "ENOENT" ? "tar is not available on this host." : error.message}`);
  }
  const output = await stat(archive).catch(() => null);
  if (!output?.isFile() || output.size === 0) throw new Error("EXPORT_ARCHIVE: archive was not created safely.");
  return { archive, bytes: output.size, format: "zip" };
}

if (process.argv.length >= 4) {
  const [source, archive] = process.argv.slice(2);
  if (!source || !archive) { console.error("Usage: node tools/package-static-export.mjs <export-folder> <archive.zip>"); process.exitCode = 2; }
  else packageStaticExport(source, archive).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
