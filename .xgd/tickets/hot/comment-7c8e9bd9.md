---
uid: comment-7c8e9bd9
id: COMMENT-1049
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T02:33:15.322542+00:00'
updated_at: '2026-08-16T02:33:15.322542+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-97baa7a9
  kind: note
---

**Assessment complete — REPORT-2050 (`report-97baa7a9`): PASS** (0 violations, 2 warnings, 0 needs_review).

## What I checked

CAP-93 has one story (STORY-106, `story-189fc1ac`, kind `feature`) with 12 active ACs (AC-1083…AC-1094). All 12 have a `test_UAT_AC<n>_*` test, all in `tests/reconciliation-page-composition-surface.test.ts`, and all 12 are substantive — they drive the real toolbox, the real declaration JSON, the real draft bytes on disk, the real renderer, and the real `/api/copy` transport. Nothing is mocked and none is a structural/AST-only check.

I read every test body against its AC's verification clause and confirmed each asserted symbol exists in production code (`toolbox.ts:466/239/64/69`, `l1-surface.json:145/212/457/514`, `instances.json:6`). `get_copy`/`set_copy` appear nowhere in the declaration, confirming the retirement AC-1092 asserts.

## Findings

Two warnings, both assertion-strengthening inside existing tests — neither needs a new UAT, an AC edit, or a production change:

1. **AC-1092** (`:620`) — the AC requires the *retired pair* absent from the session manual; the test checks only `set_copy` there. A manual still describing `get_copy` would pass.
2. **AC-1093** (`:691`) — the AC asks that the returned fields be *the fields that kind exposes*; the test asserts only `fields[0].name === 'text'`. A regression dropping the REQ-135 typography descriptors on assistant-authored nodes would still pass.

Plus two `info` entries recorded as ledger context: the FC/reconciliation suite overlap (repo-wide pattern, reconciliation suite is strictly stronger — not redundant), and REQ-137 (`bundled`) changing palette-reference shape, which AC-1085 won't break on but won't cover until REQ-137 reconciles.

## Two things worth flagging about this session

- **Tests were not run.** The runner (`npx vitest`) was denied by the session's permission mode, so every finding rests on static verification. I stated this in the report; no finding depends on or claims a test outcome.
- **The report nearly couldn't be filed.** Under don't-ask mode, `Write`, heredocs, and long or multi-line `xgd report create` invocations were all denied; the only path that worked was a single-line `printf ... | xgd report create --body-file -`, which forced me to compress the body. If this workflow runs unattended, that same denial would silently block report creation — worth an allowlist entry for `xgd report create`.
