---
uid: report-25a2e361
id: REPORT-1588
type: report
title: 'UAT Coverage: site_colour_census_and_retrofit'
created_by: xgd
created_at: '2026-08-07T16:51:21.358859+00:00'
updated_at: '2026-08-07T16:51:21.358859+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-e382c142
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: site_colour_census_and_retrofit

**Result**: PASS
**AC verdicts**: 9 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Subject Note — CAP-83 is a pre-merge alias

CAP-83 (capability-e382c142) carries `merged_into: capability-b4ac88fc` (CAP-89,
"Site Materials & Starting Point"), stamped 2026-08-07T15:59Z by this run's
overlap resolution. Its single story STORY-97 (story-5e7eb0c5) now records
`capability_uid: capability-b4ac88fc`. A `--filter fields.capability_uid=...`
query against CAP-83 still returns STORY-97 from a stale index; the ticket
itself does not. The story tree is therefore reached through the merge target,
and CAP-89's body absorbs this capability's scope near-verbatim under the
heading "Site colour census & palette retrofit" — nothing was dropped in the
merge. Warning 2 below records the one piece of the retirement left unapplied.

## Cumulative Intent Considered

Full intent scan: 112 requests (paginated to exhaustion, not the first page) and
31 bugs, filtered on colour/palette/census/retrofit vocabulary.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUG-24 (bug-c50fdfcc) | free_and_reconciled | 2026-07-24 | Colour alpha representable in the captured value set. Antecedent to alpha families; concerns capture, not the census surface | YES (out of subject) |
| REQ-114 (request-3cd338cd) | free_and_reconciled | 2026-07-31, merged in BUNDLE-14 at `cd8f98c8` | The governing intent. §3 retrofit (alpha collapse first, then ramp grouping, unclustered keeps own entry, lossless-or-refuse, naming); §5 tooling (repeatable census; fold stays literal-only; assignment a separate re-runnable pass) | YES |
| BUNDLE-14 (bundle-0385746c) | free_and_reconciled | 2026-08-06 | STORY-97's recorded `intent_uid`; carries REQ-114 alongside BUG-31 and REQ-116 (sandbox R2 namespacing, edit render channel — unrelated surfaces) | YES |
| REQ-14, REQ-67, REQ-72 | free_and_reconciled | 2026-07-01 → 07-18 | Section backgrounds, contact-form dials, gradient-stop capture. Adjacent colour vocabulary, different surface; all predate REQ-114 | YES (out of subject) |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`, and **no
intent retires any behavior this capability's ACs describe.** The model half of
REQ-114 (§1 schema, §2 renderer, §4 legacy-palette retirement) belongs to
STORY-80 (story-c490f1cf) under CAP-70 — explicitly out of scope in STORY-97's
body, so it is not measured here.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-97 (story-5e7eb0c5, `feature`, completed) | REQ-114 §3 + §5, via BUNDLE-14 | aligned | All five in-scope bullets of the story body map onto ACs; no clause unsupported by intent, no intent clause absent from the body |

**Story-level judgment (made independently of the AC verdicts).** STORY-97's
body promises five things. Each maps to covered ACs:

| Story-body claim | ACs | Covered |
|---|---|---|
| Census — literals with counts, distinct RGB, alpha families, `--json` form | AC-939, AC-940 | yes |
| Retrofit — two ordered passes: exact alpha collapse, then hue-family ramp grouping; unclustered keeps its own entry | AC-941, AC-942, AC-943 | yes |
| Lossless or nothing — round-trip proof + definition validates, else abort before touching disk | AC-944, AC-945 | yes |
| Reproducible naming — descriptive derived names, `--names` promotion to role vocabulary | AC-946 | yes |
| Re-runnable — repro carries literals; already-retrofitted site re-censuses and re-assigns identically | AC-947 | yes |

The body's "Technical Context" items (chroma-not-HSL neutrality; vivid/near-neutral
split; the §5.3 counts drifting 17/15 → 18/16; two of four sites vacuously
retrofitted) are recorded implementation notes and observations, not behavioral
promises — the body says so explicitly of the first ("an implementation choice
recorded here, not an AC"). They require no AC and create no gap.

## Coverage Evidence — executed, not inferred

`npx vitest run tests/reconciliation-colour-census-and-retrofit.test.ts`
→ **1 file passed, 9 tests passed, 20.04s**, run during this check.

All 9 UATs live in one file and drive real entry points:
- the shipped `1c` launcher as a **real subprocess** (`tools/generate/bin/1c.mjs`)
  for every AC that speaks about stdout, stderr or exit status;
- the real `cmdColors` / `cmdColorsAssign` / `cmdRender` / `cmdRepro` handlers and
  the real `resolveL1Color` / `resolveL1Palette` resolvers over on-disk site trees
  for the rest.

No internal mocking; no structural/AST-only check; no test that asserts a name
exists. Spot-verified by reading the two gate tests rather than trusting the
prior level's summary:
- **AC-944** renders every page before and after via real `cmdRender` and compares
  with `Buffer.equals` file-for-file, then independently deep-equals
  `resolveL1Palette(converted, palette)` against the pre-conversion page — with a
  `collectRefs(...).length > 0` guard that defeats a vacuous pass on a site with
  no references.
- **AC-945** drives all three named failure causes through the real subprocess
  (missing draft; a forced round-trip failure via colliding `--names`; an invalid
  converted definition via a non-kebab name), asserting non-zero exit, a
  cause-identifying diagnostic, and full-tree hash equality — which is also the
  proof that no partial write occurred.

| AC | Test | Verdict |
|---|---|---|
| AC-939 | `test_UAT_AC939_census_reports_literals_counts_alpha_families_and_writes_nothing` | pass (warning 1) |
| AC-940 | `test_UAT_AC940_census_json_is_one_parseable_document_agreeing_with_the_human_form` | pass |
| AC-941 | `test_UAT_AC941_assign_writes_palette_rewrites_pages_and_reports_counts_and_files` | pass |
| AC-942 | `test_UAT_AC942_one_rgb_at_three_opacities_becomes_one_entry` | pass |
| AC-943 | `test_UAT_AC943_ramps_group_vivid_and_neutral_split_isolates_stand_alone` | pass |
| AC-944 | `test_UAT_AC944_render_is_byte_identical_before_and_after_the_retrofit` | pass |
| AC-945 | `test_UAT_AC945_unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing` | pass |
| AC-946 | `test_UAT_AC946_derived_names_describe_colours_and_rename_to_role_vocabulary` | pass |
| AC-947 | `test_UAT_AC947_repro_carries_literals_and_re_assignment_reproduces_the_palette` | pass |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-939 (`tests/reconciliation-colour-census-and-retrofit.test.ts:249-253`) | uat-edit | AC-939 requires the alpha-families section be "present only when the site has at least one such family". The negative case seeds `harbor-cafe`, which censuses at **zero colour literals** — so it doubles as the AC's separate zero-colour case, and the section's absence is equally explained by there being no colours at all. The discriminating case — literals present, but no RGB used at more than one opacity — is not exercised. Verified independently; the test's own comment concedes it ("because it has no family to report"). A narrowing, not a divergence: the AC's Verification text ("one carrying none") is satisfied literally, and AC-939's other clauses are substantively covered. | Add a third census over a site painted with two or more distinct fully-opaque colours; assert a non-zero literal count in the header and no `alpha families` section in stdout |
| 2 | warning | capability | CAP-83 (capability-e382c142) | capability-retire | The merge into CAP-89 is **half-applied**. `merged_into` was stamped at 15:59Z but `status` was left `active` and no `superseded_by_uid` was written — unlike the two siblings retired by the same run's overlap resolution (CAP-81 → `superseded` + `superseded_by_uid: capability-b4ac88fc` at 15:41Z; CAP-84 → `superseded` + `superseded_by_uid: capability-12fee326` at 16:03Z), and unlike the eight earlier merges which all landed on `deprecated` + `merged_into`. Consequence: an emptied capability stays in the active set and will be re-iterated by every future structural-validation pass. No coverage or behavioral impact. | `xgd ticket update capability-e382c142 --fields '{"status": "superseded", "superseded_by_uid": "capability-b4ac88fc"}'` — matching the CAP-81 precedent set in this run |

Zero violations, zero needs_review → **PASS**. Warnings do not affect pass/fail.

## Notes for the Editor

- **Finding 1 is a duplicate, not a second instance.** REPORT-1587 (the
  uat-level capability-intent alignment check, 16:42Z) raised the same AC-939
  narrowing as its finding 1. I re-derived it independently rather than
  inheriting it, and reached the same conclusion. Fix it once; both reports
  clear together.
- **Finding 2 is the actionable one, and nothing else will catch it.** Every
  other level of this run's structural validation reads CAP-83 as a subject and
  passes through it; the half-applied retirement is only visible by comparing
  CAP-83's frontmatter against its siblings'. It is bookkeeping — mechanically
  determined by the CAP-81 precedent, requiring no operator judgment — which is
  why it is a warning and not `needs_review`.
- **The merge did not launder an uncovered capability.** This was the specific
  risk worth ruling out: a capability emptied by consolidation could carry its
  gaps out of sight. It did not — all 9 ACs are active, covered and passing, and
  they will be re-assessed on their own footing when CAP-89 comes up in the
  iteration (CAP-89 has no `uat_coverage` verdict yet, so it has not been
  assessed and STORY-97 cannot fall through the gap between the two subjects).
- **Do not read the stale index as truth.** `xgd ticket list --type story
  --filter fields.capability_uid=capability-e382c142` still returns STORY-97
  while the ticket records CAP-89. Anyone re-running this assessment should read
  `fields.capability_uid` off the ticket, not the filter result.
