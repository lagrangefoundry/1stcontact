---
uid: report-2f20a0de
id: REPORT-1587
type: report
title: 'Capability-Intent Alignment: site_colour_census_and_retrofit (level=uat)'
created_by: xgd
created_at: '2026-08-07T16:42:33.225928+00:00'
updated_at: '2026-08-07T16:42:33.225928+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-e382c142
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: site_colour_census_and_retrofit
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

CAP-83 (capability-e382c142) carries `merged_into: capability-b4ac88fc` (CAP-89,
"Site Materials & Starting Point"), and its single story STORY-97
(story-5e7eb0c5) now records `capability_uid: capability-b4ac88fc`. The story
tree is therefore reached through the merge target; the subject UID of this check
is the pre-merge alias.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 (bundle-0385746c) — BUG-31 + REQ-114 + REQ-116 | free_and_reconciled | merged at `cd8f98c8`, 2026-08-06 | The bundle carrying STORY-97's originating intent | YES |
| REQ-114 (request-3cd338cd) — L1 palette colour model + retrofit existing sites | free_and_reconciled | bundled in BUNDLE-14 | §3 retrofit (alpha collapse first, then ramp grouping, unclustered keeps own entry), §5 tooling (repeatable colour census; fold stays literal-only, assignment a separate re-runnable pass); intent ACs 3, 5, 6, 7 | YES |
| BUG-31, REQ-116 (same bundle) | free_and_reconciled | 2026-08-06 | Sandbox R2 namespacing; edit render channel. Unrelated to this capability's colour surface. | YES (out of subject) |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`, and none
retires behaviour previously asked of this capability. The model half of REQ-114
(§1 schema, §2 renderer, §4 legacy-palette retirement) is owned by STORY-80
(story-c490f1cf) under CAP-70 (capability-ae9d65d6) — explicitly out of scope in
STORY-97's body, so it is not measured here.

Per the level cascade, AC bodies are the working reference at `uat`. No AC read
as suspicious against its story body or against REQ-114 §3/§5, so no escalation
to intent history was required for any finding.

## Alignment Ledger

STORY-97 (story-5e7eb0c5, `story_kind: feature`, status `completed`) carries 9
ACs. Each has exactly one UAT, all in
`tests/reconciliation-colour-census-and-retrofit.test.ts`.

Verified by execution, not by inspection alone:
`npx vitest run tests/reconciliation-colour-census-and-retrofit.test.ts`
→ **1 file passed, 9 tests passed, 19.06s**. Every test drives a real entry
point — the shipped `1c` launcher as a subprocess for the ACs that speak about
stdout/stderr/exit status, and the real `cmdColors` / `cmdColorsAssign` /
`cmdRender` / `cmdRepro` handlers over real on-disk site trees for the rest. No
structural/AST-only checks; no internal mocking.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-939 (acceptance_criterion-681fa4dd) → `test_UAT_AC939_census_reports_literals_counts_alpha_families_and_writes_nothing` | REQ-114 §5, AC7 | aligned (one warning, below) |
| AC-940 (acceptance_criterion-63d8463e) → `test_UAT_AC940_census_json_is_one_parseable_document_agreeing_with_the_human_form` | REQ-114 §5 | aligned |
| AC-941 (acceptance_criterion-48360aec) → `test_UAT_AC941_assign_writes_palette_rewrites_pages_and_reports_counts_and_files` | REQ-114 §3, AC6 | aligned |
| AC-942 (acceptance_criterion-62c0b208) → `test_UAT_AC942_one_rgb_at_three_opacities_becomes_one_entry` | REQ-114 §3 (alpha collapse), AC5 | aligned |
| AC-943 (acceptance_criterion-3f7e1894) → `test_UAT_AC943_ramps_group_vivid_and_neutral_split_isolates_stand_alone` | REQ-114 §3 (ramp grouping; unclustered keeps own entry) | aligned |
| AC-944 (acceptance_criterion-3127e56f) → `test_UAT_AC944_render_is_byte_identical_before_and_after_the_retrofit` | REQ-114 AC3 (pixel-identical conversion) | aligned |
| AC-945 (acceptance_criterion-66e919f9) → `test_UAT_AC945_unprovable_retrofit_exits_nonzero_diagnoses_and_writes_nothing` | REQ-114 §3 (lossless-or-refuse) | aligned |
| AC-946 (acceptance_criterion-c9cc59fc) → `test_UAT_AC946_derived_names_describe_colours_and_rename_to_role_vocabulary` | REQ-114 §3 (naming) | aligned |
| AC-947 (acceptance_criterion-e7d18852) → `test_UAT_AC947_repro_carries_literals_and_re_assignment_reproduces_the_palette` | REQ-114 §5 (fold stays literal-only; assignment a separate re-runnable pass) | aligned |

### Consistency — each test exercises what its AC claims

Checked clause by clause against each AC's Criterion and Verification sections:

- **AC-939** — header counts with `rgbCount <= literalCount` and strict collapse;
  one parsed line per distinct literal matching the header count; ordering
  asserted as monotonically non-increasing use count; opacity annotated on
  `#2e86a3a6` (α 0.65) and absent on `#2e86a3`; alpha-families line
  `#2e86a3 at α 1.00, 0.65, 0.33`; zero-colour site censuses at 0/0 without
  failing; read-only proved by full `sha256` tree comparison of both sites.
- **AC-940** — `JSON.parse` of the whole stdout stream (so trailing prose would
  throw), slug, per-literal `literal`/`rgb`/`alpha` 0–255 byte/`count` with types
  and ranges, lower-case normalisation, `distinctRgb` cross-checked against the
  record set, alpha families, and the header of the human form reconstructed from
  the JSON numbers.
- **AC-941** — before/after counts parsed from the report header and the "before"
  cross-checked against an independent census; `entryCount < literalCount / 2`;
  palette present on `site.json` with that entry count; each entry's name, base
  value and step count found in stdout; `wrote N file(s)`; zero colour literals
  left in any page; the changed-file set proved *exactly* equal to
  `site.json` + every page by hashing the draft tree before and after; the
  machine-readable palette document compared to the stored palette.
- **AC-942** — exactly one entry carries the family's RGB (base or step); every
  stored value, base and step, matches `^#[0-9a-f]{6}$` (no entry-level opacity);
  every reference on disk resolved through `resolveL1Color` and the three
  translucent literals recovered.
- **AC-943** — all four Criterion bullets plus determinism: a 5-colour teal ramp
  → one entry with 4 steps; the vermilion isolate → its own step-less entry; the
  vivid `#1447e6` and the near-grey `#e2e8f0` 11° away → different entries;
  `#ffffff`/`#fffefe`/`#010002`/`#000000` → a single `neutral` entry; an
  independent second derivation over the same colours yields a deep-equal palette.
- **AC-944** — a reproduced site (asserted palette-free, literal-bearing) rendered
  through `cmdRender`, retrofitted, rendered again, compared file-for-file with
  `Buffer.equals`; independently, `resolveL1Palette(converted, palette)` asserted
  deep-equal to the pre-conversion page, with a non-zero-refs guard against a
  vacuous pass.
- **AC-945** — all three named causes: missing draft (non-zero exit, `/no draft/i`
  naming the slug, nothing created); a forced round-trip failure via colliding
  `--names` (non-zero exit, `/not lossless/i` naming a hex); an invalid converted
  definition via a non-kebab name (non-zero exit, `/invalid definition/i` plus
  the `/palette/NotKebab` path). Each asserts full-tree hash equality, which is
  also the proof that no partial write occurred.
- **AC-946** — every derived name matched against the kebab-case rule *and* a
  descriptive-vocabulary set; uniqueness asserted; the numeric disambiguation
  suffix asserted to actually occur; a two-family rename asserted to change names
  only (renamed entries deep-equal their derived originals, the remainder of the
  palette deep-equal), and the resolved literal multiset asserted identical across
  the renamed and un-renamed runs; an unknown-family mapping leaves the palette
  deep-equal to the derived one.
- **AC-947** — the reproduction path asserted to produce literals and zero refs
  and no palette; censuses before and after the retrofit asserted deep-equal on
  `colors`, `distinctRgb` and `alphaFamilies`; a second `cmdColorsAssign`
  asserted to yield a deep-equal palette and identical before/after counts.

### Coverage — every active AC has a substantive UAT

9 of 9. No AC is uncovered, and none is covered only by a structural check.

### Exclusivity — no redundant tests within this capability

Each of the 9 UATs targets a distinct AC and a distinct scenario. Overlap with
CAP-70's `tests/reconciliation-colour-palette-overlay.test.ts` was examined and
judged legitimate — see the info entry below.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-939 / `test_UAT_AC939_census_reports_literals_counts_alpha_families_and_writes_nothing` (`tests/reconciliation-colour-census-and-retrofit.test.ts:251-254`) | uat-edit | AC-939 requires the alpha-families section be "present only when the site has at least one such family". The negative case uses `harbor-cafe`, which censuses at **zero colour literals** — so it is simultaneously the AC's separate "site with no colour literals at all" case, and the absence of the section is equally explained by having no colours. The discriminating case (a site with colour literals but no RGB used at more than one opacity) is not exercised. The AC's own Verification text ("one carrying none") is satisfied literally, so this is a narrowing, not a divergence. | Add a third census over a site painted with two or more fully-opaque, distinct colours and assert the header reports a non-zero literal count while stdout contains no `alpha families` section |
| 2 | info | exclusivity | `test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours` / `test_UAT_AC930_one_rgb_at_several_alphas_collapses_to_one_entry_exactly` (CAP-70, story-c490f1cf) vs AC-941/942/944 here | — | Both files drive `cmdColors` / `cmdColorsAssign`, so the overlap is real at the setup level. Assessed as **not** redundant: AC-930 proves the *model's* alpha exactness across all 255 alpha bytes, where AC-942 proves the *retrofit* collapses a measured family to one entry; AC-932 proves REQ-114 AC6 on the four real `storage/sites/*` (exact entry counts 6 and 8, and the two vacuously-retrofitted sites), where AC-941 proves the command's report and write contract on a sandbox copy. Different assertions, different intent clauses. | none |
| 3 | info | — | CAP-83 (capability-e382c142) | — | The subject capability carries `merged_into: capability-b4ac88fc` and no `intent_uid` of its own; STORY-97 now records `capability_uid: capability-b4ac88fc`. The tree is reachable and internally consistent; recorded so a future check is not surprised that the subject UID is a pre-merge alias. | none |

## Notes for the Editor

- **This level is clean.** Zero violations, zero needs_review. Finding 1 is a
  single-assertion opportunistic improvement and does not gate the level.
- **Evidence is executed, not asserted.** The 9 UATs were run during this check
  and all pass in 19s. Anyone repairing finding 1 should re-run
  `npx vitest run tests/reconciliation-colour-census-and-retrofit.test.ts`
  (note: `--reporter=basic` no longer resolves under vitest 4.1.9; use the
  default reporter).
- **Two observations in STORY-97's Technical Context were checked and hold.**
  (a) The census reproduces DOC-23 §5.3's *method*, not its frozen 17/15 counts —
  no AC or UAT hard-codes the historical numbers; AC-939/940/941 all measure the
  definition as it stands. (b) `1stcontact` and `harbor-cafe` census at zero
  colour literals and are vacuously retrofitted — no UAT in this capability reads
  "every site carries a palette" into the retrofit, and CAP-70's AC-932 covers the
  two zero-colour sites explicitly.
- **No intent in the ledger retires behaviour** that this capability's ACs or UATs
  still describe, and no reconciled/imminent intent asks for behaviour at the
  colour-census/retrofit surface that has no UAT. The two REQ-114 clauses easiest
  to lose in a retrofit — "the fold continues to emit literals only" and
  "assignment is a separate, re-runnable pass" — are both directly exercised by
  `test_UAT_AC947_*` through the real `cmdRepro` path.
