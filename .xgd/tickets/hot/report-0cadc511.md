---
uid: report-0cadc511
id: REPORT-3521
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-09-04T07:06:19.101578+00:00'
updated_at: '2026-09-04T07:06:19.101578+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-203b1dc2
---

Both files green, 30 tests, no skips.

## Issues fixed

**Critical 1 — SSRF hole for IPv4-mapped IPv6** (`apps/control-app/src/fetch-guard.ts:126-138`)
The `::ffff:` branch only handled the dotted-quad spelling, which the WHATWG URL parser never emits. Now decodes the compressed-hex pair back to a quad before recursing, keeping the dotted form too. `https://[::ffff:169.254.169.254]/` is refused. UAT extended at `tests/test_UAT_FC_REQ-163_material_pipeline.test.ts:263-289` with the normalised spellings **and** assertions through `assertFetchable` — the real entry point — rather than the predicate alone.

**Critical 2 — REQ-165 UAT threw before asserting** (`tests/test_UAT_FC_REQ-165_projected_reference.test.ts:22,236`)
`searchChunks` takes `indexes`, not `source`. Imported `SHIPPED_SOURCE` and switched to `indexes: { [SHIPPED_SOURCE]: source }`, mirroring `reconciliation-projected-reference.test.ts:357`.

**Warning — stray scratch file**: `ac1489.json` deleted (referenced by nothing but the review itself).

**Warning — 413/400 by substring** (`apps/control-app/src/material.ts:238-252,275`, `router.ts:1061-1067`): `MaterialRejectedError` now carries `tooLarge`; the router reads the flag instead of matching `'the limit is'` in client-facing prose.

### Beyond the fix-it prompt
The reviewer stated every `*.workers.test.ts` was **unverified** because miniflare wouldn't boot in their sandbox. It boots in mine, and those tests were red. Baseline (fixes stashed) vs. now, full suite: **55 → 39 failing tests, 27 → 21 failing files**, no regressions.

- `fetch-guard.ts:191-201` — a refused redirect hop reported `err.url` as the *hop*; now re-thrown with the caller's address (AC1545).
- `material.ts:316` — empty-document refusal was a `MaterialRejectedError`, which has nowhere to carry the address, so the response didn't name it; now a `FetchRefusedError` (AC1537).
- `knowledge.ts:337` — `ProjectKnowledge.search()` passed `source:` where the shared library takes `indexes:`, so **every project-KB search threw `KnowledgeConfigError`**. This is new bundle code (not on `main`), so it is *not* the pre-existing drift the review told me to leave. Fixing it turned four whole files green: `reconciliation-project-knowledge-freshness`, `test_UAT_FC_REQ-159_project_kb`, `reconciliation-project-knowledge-base`, `test_UAT_FC_REQ-163_ingestion`.
- `material.ts:651-668` — a uid naming nothing 500'd instead of 404'ing, making the Library read routes an enumeration oracle. Converts `TicketError.code === 'not_found'` to `NotMaterialError`; other store errors still 500 (AC1570).

I did **not** touch `tools/generate/src/cli/kb.ts:826` or the two named test files, per instruction.

### Remaining failures (all pre-existing, unchanged from baseline)
Two classes: the `@lagrangefoundry/knowledge` upstream drift the review assigned to its own ticket (`reconciliation-system-knowledge-base`, `test_UAT_FC_REQ-123_*`, `REQ-158` workers, `assistant-conversation-knowledge`), and environmental asset-404/miniflare flakes in this worktree (`req115-builder-shell`, `req117-edit-loop`, `public-site`, `builder-workspace-origin`, `REQ-150_plain_vite_bootstrap`) — these shift run to run and are the `dist-assets`/`1c assets` artifact issue, not code.

**Confidence: high** on both criticals — each is verified executably through the production entry point, not just the helper. The main residual risk is the pre-existing shared-library drift: if the re-reviewer can boot workers and counts those failures against the bundle, they'll fail the gate again, but that class was explicitly ruled out of this loop.
