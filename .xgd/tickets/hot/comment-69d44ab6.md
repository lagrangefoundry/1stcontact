---
uid: comment-69d44ab6
id: COMMENT-1260
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T04:55:24.334940+00:00'
updated_at: '2026-08-20T04:55:24.334940+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-68170dfc
  kind: note
---

Report filed: **REPORT-2372** (`report-68170dfc`) — **FAIL**, 17 violations, 1 warning, 0 needs_review.

## Verdict

Sixteen of 63 active ACs have no AC-linked UAT, plus one AC whose test is narrower than its criterion.

The ac cycle handed forward "eleven ACs with no test at all." I re-derived the mapping mechanically rather than trusting it, and the handoff was wrong in both directions:

- **It undercounted** — 16, not 11. STORY-116's five ACs (AC-1285…1289) were never in the list; they were created earlier in the same run, so the ac cycle enumerated only the ACs *it* had authored.
- **It mischaracterized the gap** — 13 of the 16 behaviours *are* substantively tested, under the free-coded `test_UAT_FC_<TICKET-ID>_*` convention. The two indexes don't interoperate (`^test_UAT_AC\d+_` at `quality/test_naming.py:24` vs intent-UID resolution at `quality/scope.py:390-417`), so those tests are invisible to every AC-keyed mechanism.

So the repair is **13 renames, 3 new tests, and 1 extension** — not 16 new tests.

## Where the real risk is

Only three ACs are genuinely unproven, and two are the dangerous ones:

- **AC-1307** — `hexifyGradient` (`extract.ts:334`, called at `:846` and `:1132`) has *zero* test references repo-wide. Unhexified stops make the gradient capture as `135° []`, and an empty stop list reads as a clean match against any reproduction — the capability's animating invariant inverted.
- **AC-1308** — `surfaceGradientOf` (`extract.ts:840-846`), likewise zero test references. Its own AC body calls it "the one place capture can be silently wrong in a way the diff cannot detect."

Both are capture-side, both are defended by nothing. I flagged these as the priority if the fix loop can only do part of the work.

## Two things worth your attention

**AC-638 was the predicted trap, and it's real.** Its `uat_coverage` still reads `pass` while the test omits half its criterion — including the palette-role rejection that is the entire point of the REQ-114 repair. I verified against source that the code *does* reject both cases (`validate.ts:101-107`, `:116-125`), so this is `uat-edit`, not a code bug. I didn't use the `uat_coverage` field as a filter at all: AC-1285 carries no such key whatsoever, so a filtering cycle would have missed it too.

**The one-sided-repair pattern is now two-for-two.** The ac cycle correctly diagnosed its predecessor as editing story bodies without discharging the AC obligation — then reproduced the same shape one level down, authoring ACs without discharging the UAT obligation. Worth naming as a process issue rather than fixing case-by-case.

One caveat I recorded as a warning: the FC evidence for AC-1310/1314/1316 is mostly `it.runIf(browserOk)`, so a naive port yields ACs that report covered while contributing nothing headless.

Note: the report committed locally but the git push failed (`Broken pipe` — offline). The ticket is intact; it just hasn't reached the remote.
