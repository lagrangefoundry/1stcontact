---
uid: request-53c276dd
id: REQ-11
type: request
title: '1c structured-edit commands: validated page/config/asset CRUD + get + status
  (AI tool surface)'
created_by: xgd
created_at: '2026-06-30T21:22:22.178162+00:00'
updated_at: '2026-07-02T00:19:10.068226+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  story_points: 3
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: a1dea251794eb9e2a8df397ff13a79ceb7f2d367
    reconcile_sha: null
    main_sha: null
  version: 0.0.7
---

## Scope

Add the **structured-edit command surface** to the `1c` CLI: validated, AI-legible commands to read and mutate a site's **draft** — pages, config/metadata, and assets — plus `1c status`. These are the file-based precursor to the future AI builder tool surface; they are **designed to be driven by an AI**, so machine-readable output and **clear, actionable failure messages** are first-class requirements, not afterthoughts.

Design discussion: see [[DOC-12]] (storage/versioning/rendering model) and [[DOC-7]] §6 (powerful structured language).

## Why free-coded

A cohesive command surface over the storage layer and schema validator that already exist after REQ-9 / REQ-3. No new design — translates the locked model into commands.

## Dependencies

- **Depends on:** REQ-9 (the `1c` CLI, storage layer, render/publish lifecycle), REQ-3 (`@1stcontact/site-schema` validator).
- All commands operate on the **draft** of a site (default root `sites/`, or `sandbox/` via `--sandbox`).

## Design principles (AI-first)

1. **Structured output.** Every command supports `--json`. In `--json` mode, success and failure are both structured envelopes (below). Human-readable output is the default for interactive use.
2. **Clear, actionable failures.** Every failure returns a specific error: a stable `code`, a human-readable `message`, a `path` (JSON-pointer) for schema errors or the offending reference for integrity errors, and a `hint` on how to fix it. No bare stack traces, no generic "invalid input".
3. **Stable exit codes** (same in `--json` and human mode): `0` success · `2` validation/schema error · `3` not found · `4` referential-integrity violation · `5` conflict (duplicate id/path) · `1` unexpected/internal.
4. **Atomic.** Validate the resulting draft against `@1stcontact/site-schema` *before* writing. On any error, the draft is left **byte-unchanged**.
5. **No revisions, no history rewrite.** These mutate the draft only; `publish` (REQ-9) remains the sole creator of revisions. Pending changes are *derived*, not logged (see `1c status`).

## Commands

### Read
- `1c page get  <slug> <pageId>` — emit the page definition.
- `1c page list <slug>` — list pages (id, title, path).
- `1c asset get  <slug> <assetName>` — emit an asset's metadata/reference (addressed by name, not page).
- `1c asset list <slug>` — list assets.
- `1c config get <slug> [<key>]` — emit metadata/config (whole object or one key).
- `1c status <slug>` — **derived** pending changes: diff `draft/` against the latest revision (added/modified/removed paths). No stored log; nothing written.

### Write (draft only; validated + atomic)
- `1c page add    <slug> <pageId> [--title …] [--path …]` — create page; enforce unique `pageId` and `path`.
- `1c page update <slug> <pageId> [--title …] [--path …]` — update page fields.
- `1c page rm     <slug> <pageId>` — refuse if a nav entry targets it (integrity error naming the entry); `--force` also removes the nav entries.
- `1c config set  <slug> <key> <value>` — set a metadata/theme/nav field; validated.
- `1c asset add   <slug> <file> [--as <name>]` — copy into `draft/assets/` and register; reject duplicate name.
- `1c asset rm    <slug> <assetName>` — refuse if a page/module references it (integrity error naming the referrer); `--force` overrides.

Module-instance editing (modules live inline in page files) is **out of scope** here — handled via `page update` for now; a dedicated `1c module …` surface is a later ticket.

## Failure-message contract

`--json` envelope:

```jsonc
// success
{ "ok": true, "data": { /* command result */ } }
// failure
{ "ok": false, "error": {
    "code": "SCHEMA_INVALID",
    "message": "Page 'home' module #2: 'heading' must be a string",
    "path": "/pages/home/modules/2/content/heading",
    "hint": "Provide a string, or remove the field if optional."
} }
```

Error codes: `SCHEMA_INVALID` (2), `NOT_FOUND` (3), `REFERENTIAL_INTEGRITY` (4), `CONFLICT` (5), `INTERNAL` (1).

## UATs (`test_UAT_FC_REQ-11_*`)

- `test_UAT_FC_REQ-11_page_get_returns_definition` — `page get` emits the page; `--json` is well-formed.
- `test_UAT_FC_REQ-11_get_missing_returns_not_found` — `page get`/`asset get` on a missing id → `NOT_FOUND`, exit 3, clear message.
- `test_UAT_FC_REQ-11_page_add_validates_schema` — adding an invalid page → `SCHEMA_INVALID` with a JSON-pointer `path`, exit 2, draft unchanged.
- `test_UAT_FC_REQ-11_page_add_rejects_duplicate` — duplicate `pageId`/`path` → `CONFLICT`, exit 5.
- `test_UAT_FC_REQ-11_page_rm_blocked_by_nav` — removing a nav-referenced page → `REFERENTIAL_INTEGRITY` naming the nav entry; `--force` succeeds and cleans nav.
- `test_UAT_FC_REQ-11_asset_rm_blocked_by_reference` — removing a referenced asset → `REFERENTIAL_INTEGRITY` naming the referrer.
- `test_UAT_FC_REQ-11_config_set_validates` — invalid config value → `SCHEMA_INVALID` with `path`, exit 2.
- `test_UAT_FC_REQ-11_status_derives_pending_changes` — after edits, `status` reports added/modified/removed vs latest revision; creates no revision and writes nothing.
- `test_UAT_FC_REQ-11_failed_command_is_atomic` — a command that fails validation leaves the draft byte-identical.
- `test_UAT_FC_REQ-11_json_envelope_shape` — every command in `--json` mode emits the `{ok,...}` envelope; failures carry `code` + `message`.

## Out of scope

- Module-instance edit commands (`1c module …`) — later ticket.
- Persisted per-edit changelog — pending changes are derived via `status` ([[DOC-12]]: no redundant state).
- D1/AI-builder wiring — these commands are the *file-based precursor*; the AI builder is a separate, later concern.

-