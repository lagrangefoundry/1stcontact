---
uid: comment-fa1f1f11
id: COMMENT-2449
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T03:36:53.714150+00:00'
updated_at: '2026-09-10T03:36:53.714150+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a169f749
  kind: note
---

**REPORT-3650 (`report-a169f749`) — FAIL: 1 violation, 1 warning, 0 needs_review.**

## What I checked

The capability has one story (STORY-122, `feature`) with 10 ACs. Its `intent_uid` is `bundle-b3b7c399` (BUNDLE-20, `free_and_reconciled`, merged at `eef7a8b4`). No standalone REQ-151/152/153 tickets exist — they survive only as sections of the bundle body, and no AC carries its own `intent_uid`/`updated_by`. So the ledger is a single reconciled intent with nothing retired downstream, which makes cumulative intent simply REQ-151 + REQ-153 as written.

## Findings

**Violation (coverage, AC-1428, `ac-edit`).** The story states an affirmative behavior no AC pins: *"Currency and timezone take no such care… the default country answers for them or nothing does."* AC-1428 owns the undeclared site but asserts only the language half (`lang="en"`, `dir="ltr"`). Nothing states that `resolveSiteLocale({})` returns `country: 'US'`, `currency: 'USD'`, `timezone: 'America/New_York'` — which it does, at `packages/site-schema/src/locale.ts:267-281`. This is the deliberate asymmetry REQ-151 singles out as a decision, and it's the part a reader would mispredict: the capability's "an unstated fact stays unstated" property implies an unstated country, and the code reports `US`. The gap cascades — `tests/test_UAT_FC_REQ-151_site_locale.test.ts:126-134` asserts only `.locale`.

**Warning (coverage, AC-1433, `ac-edit`).** The story draws a line — locale validation is well-formedness, not registry membership, because an unrecognised subtag is likelier a real minority language than a typo. AC-1433 pins only the refusal side, so the rule could tighten to registry membership with no AC failing. The slug half of this same story pins its boundary from both sides (AC-1436 refuses, AC-1437 admits near-misses); the locale half doesn't.

**Info.** AC-1428 and AC-1437 both reach for stored sites; AC-1428 subsumes AC-1437's closing clause. Different criteria, cheap redundancy — recorded, not raised.

## What passed

No consistency violations: every concrete value the ACs assert matches the landed derivation table (IE, GB, US, IL, AE all verified against `locale.ts:46-131`). The three reconciliation decisions in STORY-122 landed correctly as AC-1435, AC-1436 and AC-1428's second paragraph — each goes beyond REQ-151/153's literal text, and each is authorised by a named decision in the story body. Step 2.5 wasn't reached: no story or AC text names a delivery-vehicle ticket, so there was no stale-citation case to adjudicate.

Both findings are additive repairs — no AC needs deprecating, no story body needs editing.
