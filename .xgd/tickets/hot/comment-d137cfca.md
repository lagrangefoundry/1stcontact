---
uid: comment-d137cfca
id: COMMENT-1545
type: comment
title: Comment on doc DOC-39
created_by: xgd
created_at: '2026-08-31T01:12:40.285832+00:00'
updated_at: '2026-08-31T01:12:40.285832+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: doc-d88e2e1c
  kind: note
---

## Implementation record — the `prompt` → `description` rename

Raised from this document's §2: the field's name asserted something the code did
not do. Confirmed by reading the component (three `.prompt` references in `src/`,
both consumers build-time, in `landscape.js`), then carried through three repos.

| Repo | Ticket | Commit | Version |
|---|---|---|---|
| lagrange-framework | REQ-109 (`request-5fb20cc9`) | `ecf0585a9af93efcbfdf861464c65418120a1cdb` | 0.0.170 |
| xgd | REQ-826 (`request-c72f1660`) | `b8061aed6fca74bca989e2fa084fd62c39836719` | 0.15.413 |
| 1stcontact | DOC-39 (this ticket) | `020ec406100d…`, `d4eff1a96779…` | 0.2.18 |

**Framework** — both language peers (`config`, `landscape`, `__init__`), the
`build-shipped-kb` CLI flag (`--prompt` → `--description`), the shared
conformance fixtures, `ai_knowledge`'s `kb_config_mapping` round-trip, the
showcase (`SYSTEM_PROMPT` → `SYSTEM_KB_DESCRIPTION`), READMEs and every test.
`describePrompt` / `describe_prompt` / `mechanicalDescribe(prompt)` untouched —
those are the LLM describe prompt, which genuinely is one. Suites green:
knowledge 45 JS / 203 py, ai_knowledge 32 JS / 36 py.

**xgd** — `kb_config.yaml` (both KBs), `knowledge_bridge/build.py`,
`bin/build_system_kb`, and the vendored `lagrangefoundry/knowledge/` re-synced
via `bin/vendor-lagrangefoundry-py`. `tests/test_UAT_FC_REQ-769_build_shipped_kb.py`
green (6 passed).

**1stcontact** — `kb/knowledge_bases.json`, `tools/generate/src/cli/kb.ts`
(`ensureConfig`'s scaffolded declaration + two comments), four test suites.
`tsc --noEmit -p tools/generate` clean; the config parses against the renamed
component's own `parseKbConfig` read from the framework checkout.

### Outstanding operator step

The shared JS artifact store is refreshed only by a deliberate operator command
(framework `bin/install`: *"UPDATES ARE DELIBERATE"*). Until it runs, the
installed `@lagrangefoundry/knowledge` still declares `prompt` and `1c kb` fails
with `unknown key(s) description (valid keys: prompt, …)`:

    lagrange-framework/bin/install --lang js --component knowledge --no-deps

`--no-deps` is deliberate: without it the install also re-packs `ticketing`,
advancing it three commits (REQ-104 attachments/BlobStore, REQ-107 port scoping)
that have nothing to do with this rename. This session's sandbox denies writes to
the store's parent directory, so it could not be run here.

### No compatibility alias

`KB_KEYS` rejects unknown keys rather than ignoring them, so a stale config fails
loudly with an error naming its own fix. Carrying both names would have meant a
second code path across three repos to retire a transition that lasts one install.
