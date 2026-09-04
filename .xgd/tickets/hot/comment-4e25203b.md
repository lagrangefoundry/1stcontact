---
uid: comment-4e25203b
id: COMMENT-2266
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T02:58:06.531018+00:00'
updated_at: '2026-09-04T02:58:06.531018+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-900a9b04
  kind: note
---

All 21 of the story's ACs now have a UAT — 18 from prior iterations of this loop, 3 written now.

```
UATs generated for story story-c4f329d3 (plan item 3 of 15)

Story: story-c4f329d3
Test file(s) created:
  - tests/reconciliation-system-knowledge-base-bundle.test.ts

Tests written: 3
Tests passed: 3
Tests failed: 0

test_files_created:
  - "tests/reconciliation-system-knowledge-base-bundle.test.ts"
```

**What I found and did.** 18 of the story's 21 ACs (AC-1291…1306, AC-1500, AC-1501) already had UATs in `tests/reconciliation-system-knowledge-base.test.ts` and `…-corpus-integrity.test.ts`. The three added by the REQ-158 reconciliation pass had none, so the new file covers exactly those:

- `test_UAT_AC1514_…` — builds a corpus through the release path (real export off a stubbed `xgd` store, real `bindKb`, real `buildIndex`/`buildChunkIndex`), reads it back via `kbBundle`, and asserts both index directories travel file-for-file under upstream's own `INDEX_FILES`, the embeddings decode **byte-identically** to the bytes on disk (with a guard proving the payload is *not* valid UTF-8, so a text round trip could not satisfy the equality), the corpus text is carried whole, and each document carries its own `mtime` — five files given five distinct stamps, five distinct stamps carried.
- `test_UAT_AC1515_…` — `writeKbModule` into a checkout with no `kb/`: the module is written anyway, `export const KB = null`, `kb.d.ts` beside it, and it **resolves** under a real dynamic import; `kbBundle` on the same tree returns `null` rather than throwing. Then both report renderings from those two *real* reports — the absent line names the KB as not built and names `1c kb build`, the built line reports the document count and size, and the two differ.
- `test_UAT_AC1516_…` — exactly one module in either half declares `SYSTEM_KB`/`SHIPPED_SOURCE`/`CORPUS_TYPE` (asserted as a one-element array over every `.ts` in `tools/generate/src` and `apps/control-app/src`), the build's binding and the Worker's `systemKb()` agree on name and source, the packed bundle opens through the Worker's own `systemKnowledge`, its corpus resolves to exactly the planted documents through the searching half's `bundleStore`, and a static import walk from `system-knowledge.ts` reaches `kb-model.ts` and no filesystem module.

**Two things worth flagging, neither caused by this file:**

1. **Pre-existing failures from a drifted shared component.** The installed `@lagrangefoundry/knowledge` in this environment has moved ahead of the repo: `search` now requires an `indexes` map keyed by source (`KnowledgeConfigError: … 'shipped', which this host has no index for`), and a `KnowledgeChanges` tool has appeared. This already fails 4 tests in `reconciliation-system-knowledge-base.test.ts` (AC1293, AC1299, AC1305, AC1306 — all via `buildKb`'s map step) and 3 in `test_UAT_FC_REQ-123_session_knowledge.test.ts`, before I touched anything. It is the shared store outside the sandbox, which `bin/install` cannot repair here. I built my fixture from the release path's own steps *minus* the map/search calls so the new UATs assert their own criteria rather than re-failing on this; the map and ranked-search criteria are AC-1303/1301/1302's and are asserted in the sibling file.

2. **A coverage gap inside an existing AC I could not close.** AC-1291 was sharpened by the REQ-158 pass to add a second verification — that the command writing the generated artefacts reports only work that actually finished. The existing `test_UAT_AC1291_*` covers only the `kb build` half. Closing it means running the real asset build, which in this worktree would overwrite `apps/control-app/src/generated/*` (copied from the main checkout to work around worktree resolution) and `dist-assets`, breaking other suites. I left it rather than take that risk or duplicate an AC number into a file I'm allowed to create; it needs either a repo-copy fixture or an edit to the existing test file.
