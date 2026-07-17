import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const dashboard = spawn(npm, ["run", "dev", "--", "--host", "localhost", "--open"], {
  cwd: resolve(root, "dashboard"),
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => dashboard.kill(signal));
}

dashboard.on("error", (error) => {
  console.error("无法启动 Dashboard：", error.message);
  process.exitCode = 1;
});

dashboard.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
