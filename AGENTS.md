# Repository Guidelines

## Project Structure & Modules
- `src/`: CLI entry (`main.ts`), commands, utils. Generated GraphQL lives in `src/__codegen__/` (do not edit).
- `test/`: Deno tests (unit, CLI helpers). Use snapshots via task.
- `graphql/`: GraphQL schema source (`schema.graphql`) for codegen.
- `docs/`: Assets (e.g., screencast SVGs).

## Build, Test, and Dev
- `deno task dev`: Run CLI from source with required permissions.
- `deno task install` / `deno task uninstall`: Install/uninstall `linear` globally for local testing.
- `deno task test`: Run tests with necessary env and net permissions.
- `deno task snapshot`: Update test snapshots.
- `deno task check`: Type-check entrypoint and imports.
- `deno task codegen`: Generate typed GraphQL operations into `src/__codegen__/`.
- `deno task sync-schema`: Refresh `graphql/schema.graphql` from Linear API.
- Optional: `just dev` to run `deno -A src/main.ts` if you prefer Just.

## Coding Style & Naming
- Language: Deno + TypeScript.
- Indentation: 2 spaces, LF newlines, final newline enforced (`.editorconfig`).
- Formatting: `deno fmt` (semi-colons disabled per `deno.json`).
- Linting: `deno lint` (run with `--fix` locally when safe).
- Files/dirs: lower-case, descriptive names; group features under `src/commands/<feature>/`.

## Testing Guidelines
- Framework: Deno test runner.
- Location: Mirror `src/` structure under `test/`.
- Snapshots: Keep readable; update with `deno task snapshot` and review diffs.
- Coverage: Prefer tests for CLI parsing, GraphQL client behaviors, and error paths.

## Commits & Pull Requests
- Commits: Conventional style (e.g., `feat:`, `fix:`, `docs:`, `chore:`). Release tagging uses `chore: Release linear-cli version X.Y.Z`.
- Pre-commit hooks: Install once with `deno task lefthook-install` (runs lint/fmt/check/test on staged files).
- PRs: Include a clear description, linked issue (e.g., `ENG-123`), reproduction/usage steps, and screenshots/output when relevant. Note any schema/codegen changes.

## Security & Configuration
- Required env: `LINEAR_API_KEY` in your shell (do not commit secrets). The CLI only calls `api.linear.app`.
- Project setup per repo via `linear config` writes `.linear.toml` (keep in the target repo as needed; exclude secrets).

## Architecture Overview
- CLI built on `@cliffy/command`; GraphQL via `graphql-request` + generated types. `main.ts` wires commands and versioning from `deno.json`.
