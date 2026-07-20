# Manboard contributor notes

- Work directly on the current branch. Do not create a worktree unless the user explicitly asks for one.
- Keep the repository workflow lightweight: no required Comet, OpenSpec, Superpowers, or CodeGraph process.
- For frontend visual or interaction work, use the project-local `ui-ux-pro-max` skill. For behavior changes, debugging, and completion checks, use the local TDD, systematic-debugging, and verification skills as appropriate.
- Before claiming a change is complete, run `./scripts/verify.sh`.
- Keep `data/` private. Do not commit local data, backups, virtual environments, or assistant-tool state.
- This is a single-user, local-first JSON-backed application. Do not add deployment or multi-user infrastructure unless requested.
