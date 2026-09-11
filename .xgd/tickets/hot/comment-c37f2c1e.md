---
uid: comment-c37f2c1e
id: COMMENT-2680
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-11T01:51:58.505545+00:00'
updated_at: '2026-09-11T01:51:58.505545+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-95256de0
  kind: note
---

## UAT Coverage: CAP-92 — **PASS**

**Report**: `report-95256de0` (REPORT-3861) — 0 violations, 3 warnings, 0 needs_review.

**Verdicts written**: 14 ACs `pass`, STORY-105 `pass`, capability `pass`.

### What changed since the last round (report-b8a37c51, 2026-08-16)

Three intents that were pending then have landed: **REQ-131** and **REQ-133** (BUNDLE-19, added `list_changes`, `get_palette` + the `ManagePalette` group), and **REQ-146**/**REQ-149** (BUNDLE-20, split the surface into a portable core and a host half, moved the audit onto R2). BUNDLE-20 restated AC-1073 over the *composition* of both halves and added **AC-1411** (durability), which carried no `uat_coverage` value at all before this assessment. No intent retires anything — 0 deprecated, 0 stale, 0 needs_review, so the BUG-1306 impact screen was never reached.

### The evidence actually ran this time

The prior three rounds were static — the runner was refused and `@lagrangefoundry/ai` was missing. Both are fixed here:

- `npm test -- tests/reconciliation-assistant-control-surface.test.ts` → **13 passed (13)**, 471ms.
- AC-1411's four tests are a workerd suite and **cannot run in this sandbox** (`listen EPERM: 127.0.0.1` kills workerd before any test starts). I verified them by reading each case against the shipped code instead: `flushAudit` (`apps/control-app/src/ai.ts:136`) writes one R2 object per record, and `streamTurn` (`apps/control-app/src/router.ts:700-708`) awaits the flush in a `finally` *inside* the stream with its own `catch {}` — exactly the shape the four cases assert. Substantive: real worker `fetch`, real D1/R2, doubles only at the Anthropic boundary and (in one case) the `audit/` R2 prefix.

### The three warnings

All the same shape — a test that proves its criterion's headline but leaves one clause of that criterion's own *Verification* unasserted, where that clause happens to be covered by a differently-named test elsewhere:

1. **AC-1142** — carried unchanged from the last round, unaddressed. The grant-filtering clause is vacuous if the upstream manual renderer ever stops projecting sequences. (It does project them today — `manual.js:136` — but nothing here witnesses it.)
2. **AC-1411** — the concurrency case uses two *different* sessions, so the two flushes never share a key. It doesn't exclude the per-session read-modify-write fold the criterion actually names; the same-session pair is only asserted in the REQ-146 FC test.
3. **AC-1073** — asserts disjointness and union-equality but not "`add_asset` is in the host half and absent from the portable one". With only the first two, an implementation that put `add_asset` back in the core and left the host half empty still passes — the precise REQ-146 regression the AC was rewritten to catch.

None is a coverage gap; each is 2–4 lines and a single pass over the two test files closes all three.

Also flagged for the structural pass (not mine to move): **AC-1411 still carries `status: pending`** while its thirteen siblings are `active`, and `.xgd/uat_index.json` is still regenerating empty, so the prompt's own index lookup reads `MISSING` for all 14 ACs.
