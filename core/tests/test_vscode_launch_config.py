"""Regression checks for the committed VS Code development launch settings."""

import json
from pathlib import Path
import unittest


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
VSCODE_DIR = REPOSITORY_ROOT / ".vscode"


def read_json(filename: str) -> dict:
    with (VSCODE_DIR / filename).open(encoding="utf-8") as file:
        return json.load(file)


class VSCodeLaunchConfigurationTests(unittest.TestCase):
    def test_tasks_start_the_api_and_dashboard_servers(self):
        tasks = read_json("tasks.json")["tasks"]
        by_label = {task["label"]: task for task in tasks}

        api = by_label["Manboard: 启动 API"]
        self.assertEqual(api["command"], "${workspaceFolder}/core/.venv/bin/python")
        self.assertEqual(api["args"], ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"])
        self.assertEqual(api["options"]["cwd"], "${workspaceFolder}/core")
        self.assertEqual(
            api["options"]["env"]["MANBOARD_DATA_FILE"],
            "${workspaceFolder}/data/threads.json",
        )

        dashboard = by_label["Manboard: 启动 Dashboard"]
        self.assertEqual(dashboard["command"], "npm")
        self.assertEqual(dashboard["args"], ["run", "dev", "--", "--host", "localhost"])
        self.assertEqual(dashboard["options"]["cwd"], "${workspaceFolder}/dashboard")

    def test_frontend_launch_uses_a_terminal_and_opens_the_browser_without_debugging(self):
        configurations = read_json("launch.json")["configurations"]
        by_name = {configuration["name"]: configuration for configuration in configurations}

        dashboard = by_name["启动 Dashboard（并打开浏览器）"]
        self.assertEqual(dashboard["type"], "node")
        self.assertEqual(dashboard["request"], "launch")
        self.assertEqual(dashboard.get("program"), "${workspaceFolder}/scripts/start-dashboard.mjs")
        self.assertEqual(dashboard.get("console"), "integratedTerminal")
        self.assertNotIn("runtimeExecutable", dashboard)

    def test_one_click_launch_uses_terminal_processes_instead_of_debugpy(self):
        configurations = read_json("launch.json")["configurations"]
        by_name = {configuration["name"]: configuration for configuration in configurations}

        one_click_launch = by_name["启动 Manboard（前后端）"]
        self.assertEqual(one_click_launch["type"], "node")
        self.assertEqual(one_click_launch["request"], "launch")
        self.assertEqual(one_click_launch.get("program"), "${workspaceFolder}/scripts/start-manboard.mjs")
        self.assertEqual(one_click_launch.get("console"), "integratedTerminal")
        self.assertNotIn("module", one_click_launch)
        self.assertNotIn("python", one_click_launch["type"])
        self.assertNotIn("serverReadyAction", one_click_launch)



if __name__ == "__main__":
    unittest.main()
