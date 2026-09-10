---
uid: comment-212975ee
id: COMMENT-2448
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T03:33:06.215731+00:00'
updated_at: '2026-09-10T03:33:06.215731+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7cc895e6
  kind: note
---

**PASS** — REPORT-3649 (`report-7cc895e6`), 0 violations, 1 warning, 0 needs_review.

## What I checked

The capability has exactly one story (STORY-122, `feature`, completed), whose `intent_uid` is BUNDLE-20 — a ten-member bundle. Only two members touch this capability: **REQ-151** (locale identity + rendered `lang`/`dir`) and **REQ-153** (locale-shaped slug reservation), both `free_and_reconciled`. I swept all 157 `request` and 38 `bug` tickets for locale/slug/lang/country/currency/timezone/RTL keywords — nothing else touches this surface. REQ-152 (money/time seam) landed under CAP-105/STORY-123, exactly where this capability's "Not in scope" cedes it, so the boundary is clean rather than merely asserted. REQ-7 mentions slug validation but is `abandoned`.

**Coverage**: all 7 REQ-151 ACs and all 3 REQ-153 ACs are expressed in the story body and land on AC-1428…AC-1437. No gap. **Exclusivity**: vacuous — one story. **Consistency**: I verified the story's Technical Context claims against the code rather than taking them on trust, since the intent bodies don't state them — well-formedness-not-membership for the locale tag (`locale.ts:193` vs `isSupportedCountry:188`), the tz check via `Intl.DateTimeFormat` (`:210`), both render paths calling `resolveSiteLocale` (`render.ts:2505`, `render.ts:153`), `BehaviorProps.locale` (`behavior.ts:183`), the anchored case-insensitive slug regex with numeric-region-in / four-letter-script-out (`:337-351`), and the field-level `superRefine` (`schema.ts:560`). All hold. "plan item 11" resolves too.

## The one finding

STORY-122 says the derivation table covers **66 countries**; `COUNTRY_DEFAULTS` has **65** (Europe 34, Americas 6, Africa/ME 10, Asia-Pacific 15). The story didn't invent it — REQ-151's own implementation record says 66, and the story copied it faithfully. It was never caught because no test asserts a count: the FC test asserts only `arrayContaining(['IE','GB','US'])` and the reconciliation test only `length > 0`.

I filed it as a **warning**, not a violation: the story is faithful to its intent, the drift is intent↔code, and it gates no AC. My suggested fix is to drop the literal count rather than change it to 65 — the story's own text says "adding a country is a one-row data edit", so a hard number just resets the clock on the same defect.

Two notes I left for the editor: don't "fix" this by adding a 66th country, and the three Reconciliation Decisions in the story body are load-bearing (each records where the landed code is *stronger* than the stated ACs) and should survive any edit.

One thing I deliberately did **not** raise as a finding, since it belongs to the `uat` level: `tests/test_UAT_FC_REQ-151_site_locale.test.ts` (9 UATs) and `tests/reconciliation-site-locale-identity.test.ts` (10 AC-named UATs) assert the same scenarios in the same shape. Only the latter is AC-addressable. It's worth an exclusivity judgment there, but it isn't obviously wrong — REQ-151 cites the FC file by name, so deleting it would orphan that citation.
