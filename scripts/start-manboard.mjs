import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = resolve(root, "core");
const dashboardDirectory = resolve(root, "dashboard");
const python = resolve(core, ".venv", "bin", "python");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const apiUrl = "http://localhost:8000/health";

let api;
let dashboard;
let stopping = false;

function stop(child, signal = "SIGTERM") {
  if (child && !child.killed) child.kill(signal);
}

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  stop(dashboard);
  stop(api);
  process.exitCode = code;
}

async function waitForApi() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(apiUrl);
      if (response.ok) return;
    } catch {
      // The API is still starting; retry shortly.
    }
    await new Promise((resolveAfterDelay) => setTimeout(resolveAfterDelay, 200));
  }
  throw new Error("API 在 30 秒内没有就绪，请检查 core/.venv 和终端输出。");
}

async function main() {
  api = spawn(python, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"], {
    cwd: core,
    env: { ...process.env, MANBOARD_DATA_FILE: resolve(root, "data", "threads.json") },
    stdio: "inherit",
  });
  api.on("error", (error) => {
    console.error("无法启动 API：", error.message);
    shutdown(1);
  });

  await waitForApi();
  dashboard = spawn(npm, ["run", "dev", "--", "--host", "localhost", "--open"], {
    cwd: dashboardDirectory,
    stdio: "inherit",
  });
  dashboard.on("error", (error) => {
    console.error("无法启动 Dashboard：", error.message);
    shutdown(1);
  });
  dashboard.on("exit", (code) => shutdown(code ?? 0));
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}

main().catch((error) => {
  console.error(error.message);
  shutdown(1);
});
