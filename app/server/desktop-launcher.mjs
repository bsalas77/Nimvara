import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { ready, server } from "./index.mjs";

const version = "0.4.0-dev";
const localData = process.env.LOCALAPPDATA || process.cwd();
const profile = path.join(localData, "Nimvara", "UserData");
const candidates = [
  path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
  path.join(process.env.PROGRAMFILES || "", "Microsoft", "Edge", "Application", "msedge.exe")
];
const edge = candidates.find(existsSync);
if (!edge) {
  console.error("Microsoft Edge is required for this development shell.");
  process.exitCode = 2;
  server.close();
} else {
  await ready;
  const child = spawn(edge, [
    "--app=http://127.0.0.1:4317",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-features=msEdgeSidebarV2"
  ], { stdio: "ignore", windowsHide: true });
  child.once("exit", () => server.close(() => process.exit(0)));
  child.once("error", (error) => {
    console.error(`Nimvara ${version} could not open its application window: ${error.message}`);
    server.close(() => process.exit(3));
  });
}
