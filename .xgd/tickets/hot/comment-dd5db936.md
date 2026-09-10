---
uid: comment-dd5db936
id: COMMENT-2456
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-09-10T04:05:17.222887+00:00'
updated_at: '2026-09-10T04:05:17.222887+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9e768107
  kind: note
---

Done — both violations closed, capability report filed.

## What was wrong

The story body already claimed the slug reservation matches "against the **entire** ISO 639-1 language registry," but nothing made that falsifiable. Every code the ten existing UATs exercise (`de`, `fr`, `en`, `ga`, `pt`, `es`) is a top-twenty language — an implementation carrying only those would have passed all ten green, while leaving `/ki` or `/nv` publishable into an immutable revision that a later locale prefix can break but not move.

## What I did

**AC-1618** (new, under STORY-122) — states the reservation consults the complete registry, framed as *membership* not shape, and records why pinning ISO 639-1 is safe where pinning the country table's breadth would not be.

**`test_UAT_AC1618_the_reservation_consults_the_whole_iso_639_1_registry`** in `tests/reconciliation-site-locale-identity.test.ts`, through the real `validateSite` path:
- sweeps all 676 two-letter segments and asserts the refused set **equals** a canonical ISO 639-1 list transcribed into the test from the standard — deliberately not imported from `locale.ts`, since a test reading the module's own list would agree with a curated subset just as happily
- the assessor's suggested `184` count anchor
- `ki`, `nv`, `io`, `cu`, `za` refused at `/pages/0/slug` with the same message as `de`, each paired against a same-shaped non-code (`kx`, `nq`, …) that validates

## Falsifiability, verified rather than asserted

I temporarily cut the registry in `packages/site-schema/src/locale.ts:292` to ten curated codes and re-ran: **1 failed / 10 passed** — the new UAT was the only test that noticed. Restored the file (`git diff` on it is empty) and re-ran: **11 passed / 11**.

No production code changed — the registry was already complete, so this was purely an evidence gap. Finding 3 (the vacuous published-revision half of AC-1428) left untouched as the warning directed, and I left the country table's breadth unpinned per the assessor's explicit rejection of that near-finding.

`AC-1618` and `STORY-122` set to `uat_coverage: pass`; I left the capability field for the re-check. Report: **REPORT-3657** (`report-9e768107`).
