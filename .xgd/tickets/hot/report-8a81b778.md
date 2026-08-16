---
uid: report-8a81b778
id: REPORT-2083
type: report
title: 'UAT Coverage: Structured Copy Editing: One Validated, Atomic Write Path'
created_by: xgd
created_at: '2026-08-16T06:58:01.283797+00:00'
updated_at: '2026-08-16T06:58:01.283797+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-f753cecd
  violations: 1
  warnings: 8
  needs_review_count: 0
---

# UAT Coverage Assessment: Structured Copy Editing: One Validated, Atomic Write Path

**Result**: FAIL
**AC verdicts**: 33 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 0 pass, 1 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Scope: CAP-86 (`capability-f753cecd`) → STORY-100 (`story-37a3921b`, `story_kind:
upgrade`) → **33 active acceptance criteria** → **43 UAT functions** across six files:

| File | UATs | ACs discharged |
|---|---|---|
| `tests/reconciliation-copy-edit-write-path.test.ts` | 13 | 980–992 |
| `tests/reconciliation-copy-edit-image-selection.test.ts` | 9 | 1024–1027 (+981, 986, 988, 991, 992) |
| `tests/reconciliation-copy-edit-background-selection.test.ts` | 5 | 1045–1049 |
| `tests/reconciliation-copy-edit-typography.test.ts` | 9 | 1117–1122 (+980, 988, 991) |
| `tests/reconciliation-copy-edit-image-framing.test.ts` | 6 | 1129–1132 (+1121, 1122) |
| `tests/reconciliation-copy-edit-field-format.test.ts` | 1 | 1111 |

**Every AC passes. The capability fails on a story-level gap that no AC enumerates**
— which is the case the independent story judgment exists for. See finding 1.

**Execution caveat.** The 43 UATs were **read, not run**: every test-runner
invocation available to this session was refused by its permission mode
(`npx vitest run …` denied), `.xgd/quality_history/` is empty and
`.xgd/uat_index.json` is `{"acs": {}}`, so there is no recorded run to fall back
on. Every judgment below is grounded in reading the test bodies against the AC
bodies and, where a rule was in question, against the production code
(`tools/generate/src/cli/index.ts`, `packages/site-schema/src/l1/edit.ts`) — not
in observed green. This level certifies *evidence adequacy*, not a passing suite;
green must come from the regression run's own quality gate.

## Cumulative Intent Considered

Every status below was re-queried directly during this check rather than
inherited from REPORT-2080/2081/2082.

| Intent ID | UID | Status | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-117 | `request-395b67e6` | free_and_reconciled (2026-07-31) | Created the surface: strict address + one resolution rule, `copy get`/`copy set`, one-map-one-diff, shared whole-definition validator, empty field list, module-slot scoping, no raw code | YES |
| REQ-118 | `request-66e4c630` | free_and_reconciled (2026-07-31) | Image selection as the same surface: `src` + `alt`, closed list, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | `request-64864801` | free_and_reconciled (2026-07-31) | Request-time draft/edit renders in the control app — moved the **origin-facing** observables off stored artifacts. Explicitly leaves the command line rendering both channels | YES |
| REQ-126 | `request-d9407f80` | free_and_reconciled (2026-08-08) | L1 control-surface API + error taxonomy — the refusal envelope this surface reuses | YES (silent) |
| REQ-128 | `request-de67e1a1` | free_and_reconciled (2026-08-08) | A painted panel's `backgroundImageUrl` through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-132 | `request-5946d045` | free_and_reconciled (2026-08-12) | `format: 'image'` on both picker fields — a hint, never a constraint | YES |
| REQ-135 | `request-a8ccd0dd` | free_and_reconciled (2026-08-12) | Phase A typography: size as a proportional track write, weight from declared faces ∪ current, italic locked on positive evidence of absence, "a bound binds a change, never the status quo" | YES |
| REQ-136 | `request-8a132869` | free_and_reconciled (2026-08-12) | Thirteen framing/shape/colour-adjustment controls, identity removes the axis, no empty bags, shape list ∪ current, nothing touches a file | YES |
| REQ-138 | `request-1ff09fab` | free_and_reconciled (2026-08-12) | Live parameter preview in the modal — client only; the write path is unchanged | YES (silent) |
| REQ-133 | `request-8467b1a3` | ready_to_reconcile | Palette popup — the blocker STORY-100 names for colour | imminent |
| REQ-137 | `request-d2980a95` | bundled | L1 palette `shade` on the reference | imminent (silent) |
| REQ-139 | `request-3f57cd0c` | ready_to_reconcile (2026-08-12) | Generalises `locked` to `{locked, reason}`; restates the shipped rule "a lock refuses a CHANGE, never the status quo" | imminent |
| REQ-140 | `request-3c0fec69` | ready_to_reconcile (2026-08-15) | Colour on this surface: a `'color'` descriptor, palette options, palette-membership refusal | imminent |
| REQ-134 | `request-ba3e3fba` | abandoned | An image-generation component | NO |

No intent in the ledger retires a behaviour this capability's ACs describe, so no
AC is deprecated. No AC describes behaviour the ledger is silent about, so none is
`needs_review`. No UAT reaches ahead of REQ-139/REQ-140: the descriptor union the
tests assert is still `string | enum | integer | boolean`, no test reads a `reason`
field, and no colour-of-text or panel-fill control is read or written.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-100 | REQ-117, REQ-118, REQ-119, REQ-126, REQ-128, REQ-132, REQ-135, REQ-136, REQ-138 | **aligned but under-covered** | Every behaviour the body describes is intent-supported and none is retired — no staleness. One in-scope claim ("From the command line the edit re-renders both and reports where each was written") is enumerated by no AC and asserted by no test. Verdict `fail`: ac-add + uat-add, not a body edit |

**AC-by-AC coverage** (all 33 `pass` — each has at least one UAT that drives a real
entry point: `run(argv)` through the real `1c` CLI or a live builder origin over
HTTP via `startBuilder`, observing the bytes of the draft page document, the
rendered page on disk, `1c status`, or the origin's own response. Nothing internal
is stubbed in any of the six files; no AC is discharged by a structural or
source-text check):

- **AC-980** (write-path:215, typography:299) — first field exactly
  `{name:'text',label:'Text',type:'string'}`, value character-equal to `home.json`
  read independently off disk, `widget:'textarea'` present for a long/newline run
  and absent for a short one.
- **AC-981** (write-path:250, image-selection:367) — success + exit 0 + `fields: []`
  + the human "no editable copy" line on a painted container and a module instance,
  with the copy/image contrasts.
- **AC-982** (write-path:302) — draft holds the new words, the rendered page contains
  them and not the old, `changed`/`rendered` reported, identical re-submit →
  `changed: []` + "No change".
- **AC-983** (write-path:326) — publishes a base so `status` can count; a mixed map
  leaves zero modified/added/removed; a well-formed map moves exactly
  `pages/home.json`.
- **AC-984** (write-path:353) — four refusal classes plus the whole-definition-invalid
  case, each byte-asserted against a pre-render snapshot of draft *and* render.
- **AC-985** (write-path:394) — `SCHEMA_INVALID`, a path naming region **and** field,
  a hint naming the next action (`copy get`), exit 2, plus the success side.
- **AC-986** (image-selection:584, write-path:417) — a violation planted at `[0.0.1]`;
  copy edit, image edit and `config set` refuse with identical code, message and
  path. The image-selection member is the complete evidence (see W2).
- **AC-987** (write-path:448) — nine malformed forms refused on read and write with
  `data` undefined (proving no coercion), the empty address refused, three
  well-formed-but-absent addresses `NOT_FOUND` with the re-read hint.
- **AC-988** (write-path:491, image-selection:527, typography:635) — complementary,
  not duplicated: JSON scalars, the closed-list/wrong-kind/hostile-scheme refusals,
  and the full per-field shape matrix plus the read-only arm.
- **AC-989** (write-path:523) — both slot shapes (carousel repeated `slide`,
  contact-form single `form`), read + write + rendered output, and the
  instance-rooted-without-slot refusal.
- **AC-990** (write-path:572) — the entire string returned (value *and* length
  asserted) with the textarea control requested.
- **AC-991** (write-path:593, typography:721, image-selection:626) — the payload inert
  in the rendered DOM as a run's text and as an `alt` attribute, then every stamped
  region swept: four shapes only, every enum non-empty, every integer carrying
  `min`/`max`, and a witness that all four shapes were actually seen.
- **AC-992** (image-selection:705, write-path:718) — origin read equals CLI read, a
  4xx client fault carrying identical code/path/hint/message, both channels current
  after a save, for a change of words and a change of image.
- **AC-1024** (image-selection:265) — `['src','alt']` first and in order, `src` enum +
  required, options exactly the site's images (no `.woff2`, no `.css`), deduplicated,
  sorted, stable; every following field a bounded integer or a non-empty closed pick,
  both shapes present.
- **AC-1025** (image-selection:344) — a remote handle asserted absent from the assets
  directory still appears among the options and is the reported value; an alt-only
  save leaves `src` where it was.
- **AC-1026** (image-selection:403) — new handle in draft and render, old absent;
  identical re-submit → `changed: []`; `src`+`alt` in one call → both changed, exactly
  one modified document; origin save leaves both channels current.
- **AC-1027** (image-selection:457) — full asset fingerprint (contents, size, mtime)
  unchanged for a handle change *and* for a framing/shape/colour change; node
  deep-equal apart from the named fields; `axes`/`mask` asserted exactly.
- **AC-1045** (background:284) — exactly one field; same option list as an image
  region's picker; no other paint axis offered though the panel demonstrably carries
  six; the picker absent from an image and a copy region that each carry a background
  of their own; origin parity.
- **AC-1046** (background:457) — one parameter changed, draft carries it, render paints
  it, every other axis byte-identical, no asset byte moved, and the shared-validator
  arm asserted by consequence against `config set`.
- **AC-1047** (background:421) — a handle no file mirrors appears exactly once
  alongside the site's own, stable order; the in-store case appears once not twice;
  re-saving the selected value is a no-op, not a swap.
- **AC-1048** (background:528) — four off-list values (absent handle, wrong-kind asset,
  empty string, `javascript:`) each refused with a field-scoped path, draft **and**
  rendered page byte-identical, and the identical refusal over the origin.
- **AC-1049** (background:365) — both the no-background and empty-handle panels answer
  `fields: []`/`values: {}` with the human line; the picker carries no empty option and
  is `required`; a write that would *add* a background is refused, panel untouched.
- **AC-1111** (field-format:218) — `format:'image'` on both picker fields and
  demonstrably absent (`Object.hasOwn` false) from the alt text beside one and from a
  run's words; option lists unchanged by the declaration; membership still refused;
  origin parity.
- **AC-1117** (typography:328) — the five fields in order, size `integer` with inclusive
  bounds, weight/capitalisation closed, italic boolean, representative (widest) size
  reported, no colour/family/geometry offered though the run carries them, the
  withheld-size and single-weight cases, and the module-slot case reading the page's
  own faces.
- **AC-1118** (typography:506) — 72→96 scales all three keyframes ×4/3, widths unmoved,
  both cheaper alternatives explicitly refuted, and a flat run acquires no rule.
- **AC-1119** (typography:421) — first-family match asserted against a four-name stack
  (the guaranteed-miss case), the run's own undeclared weight (600) present and
  reported, a second family's own faces, an off-list weight refused naming the value,
  an offered one applied.
- **AC-1120** (typography:465) — locked only where faces exist without an italic one,
  live for a no-faces family and for one declaring italic, offered rather than dropped,
  a differing posted value refused, and turning it off removes `fontStyle`. Positive
  half of the shipped rule unevidenced — see W6.
- **AC-1121** (typography:546, framing:453) — the pair is required rather than redundant:
  the 160px run re-saves and 200/4 are refused unclamped; the 9999px corner rounding
  re-saves and three control families refuse unclamped.
- **AC-1122** (typography:577, framing:499) — named parameter moves alone, identity
  removes rather than writes, the emptied group goes with it, whole-form no-op reports
  `changed: []` and leaves the draft byte-identical, including from the fractional
  folded-capture starting state.
- **AC-1129** (framing:400) — centre reported for an undeclared position, both-or-neither
  write seeded from the reported value, render carries `object-position: 50% 15%`,
  centre removes the pair and the emptied `axes`, and the half-named case on an
  already-panned picture.
- **AC-1130** (framing:344) — bounded integer percentages, three adjustments in one map →
  one modified document, stored as browser fractions, render carries the filter,
  untouched controls never written, per-control identity removes, last removal takes
  the group.
- **AC-1131** (framing:302) — geometric set with the carried `featherBottom` appended,
  re-save with own shape reports only the alt text and preserves `featherPx`, a chosen
  shape writes the shape alone, `rectangle` removes the mask outright.
- **AC-1132** (framing:251) — every framing/shape/colour field present with a
  browser-painted whole-number value, none blank or null, and the whole reported form
  saved back reports `changed: []` leaving `axes`/`mask`/`transform` undefined and the
  draft byte-identical.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | **violation** | story | STORY-100 | ac-add + uat-add | **The command line's two-channel re-render is claimed and unevidenced.** The story body's "Making the change visible" bullet says the edit is visible "in **both** the editable rendering and the plain draft rendering" and that "From the command line the edit re-renders both and **reports where each was written**". The code does exactly that (`tools/generate/src/cli/index.ts:1080-1085` renders `edit` then `draft` and emits `rendered` + `renderedDraft`), and its comment records why the alternative is invisible: "Re-rendering only `edit` leaves the draft showing whatever the last `1c render` produced … nothing signals the staleness, because a stale draft looks like a working page, just an old one." No AC states the CLI's two-channel claim (AC-982 and AC-1026 say "the re-rendered output", singular; AC-992's both-views claim is scoped to the origin) and **no test anywhere in the repo reads `renderedDraft` or `storage/dist/sites/acme/draft` after a `copy set`** — `renderedBytes(cwd, 'edit')` is the only disk observation, and every "both channels" loop (write-path:758, image-selection:449/771, background:588) fetches `/preview/…` from the origin, which since REQ-119 renders on request and so exercises none of the CLI's render step. Deleting line 1081 leaves all 43 UATs green. Intent-supported: the two-channel CLI render was introduced under this story's own bundle (`bundle-15c1f647`, commit `b1a51a3f`) and REQ-119 explicitly leaves the command line rendering both | Add one AC to STORY-100 for the CLI claim ("a save from the command line re-renders both channels and reports where each was written"), and one UAT beside `test_UAT_AC982_…`: save new words, assert `data.rendered` **and** `data.renderedDraft` are reported and distinct, and that `index.html` under **both** `storage/dist/sites/acme/edit` and `…/draft` contains the new words and not the old |
| 2 | warning | uat | AC-981 → `test_UAT_AC981_a_region_that_exposes_nothing_answers_with_an_empty_field_list` (`tests/reconciliation-copy-edit-image-selection.test.ts:367`) | uat-edit | Same scenario, same shape as the write-path member (`:250`): both drive `copy get` over a container and a module instance, assert success + exit 0 + `fields: []` + the human line, then contrast a copy and an image region. The write-path member is the superset (it also asserts the image field *types*, that the enum contains the current handle, and the exact `values`). Carried unrepaired from REPORT-1744 W1 / REPORT-2082 W1 | Delete the image-selection copy, or reduce it to the assertion its fixture uniquely motivates and take AC-981 out of its name |
| 3 | warning | uat | AC-986 → `test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition` (`tests/reconciliation-copy-edit-write-path.test.ts:417`) | uat-edit | Strict subset of the image-selection member (`:584`). Both plant the same `fontSizePx: 9999` violation at `[0.0.1]` and compare `copy set` against `config set`; only the image-selection member adds the image-edit arm AC-986's verification explicitly requires. Named as if it discharges AC-986 while omitting an arm the AC names | Delete the write-path copy; the image-selection member is the complete evidence |
| 4 | warning | uat | AC-991 → `test_UAT_AC991_every_control_is_plain_text_or_a_pick_from_a_list_the_surface_supplied` (`tests/reconciliation-copy-edit-image-selection.test.ts:626`) | uat-edit | Three UATs of the same shape now carry AC-991. Two earn their place — write-path (`:593`) is the only one sweeping both module-slot shapes, typography (`:721`) the only one asserting all four shapes were seen *and* that every `integer` field carries `min`/`max` (the clause AC-991's verification names). The image-selection member adds nothing either does not | Delete the image-selection copy. Keep the other two: neither is a superset of the other |
| 5 | warning | uat | AC-992 → `test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike` (`tests/reconciliation-copy-edit-write-path.test.ts:718`) | uat-edit | Strict subset of the image-selection member (`:705`), which does the same read/refusal/both-channels assertions for a change of words **and** a change of image — which is what AC-992's "the same single endpoint for a change of words and a change of image" requires | Delete the write-path copy; the image-selection member is the complete evidence |
| 6 | warning | uat | AC-980 → write-path:215 + typography:299 | uat-edit | Both assert `fields[0]` equals the same descriptor, the value character-equal to the draft read off disk, and the textarea rule. Neither is a strict subset: write-path uniquely covers the newline-broken run, typography uniquely covers first-ness across six differently-parameterised runs and `fields.length > 1` — the half REQ-135 made load-bearing | Merge into one: keep typography's member, fold in write-path's newline case, drop the write-path copy |
| 7 | warning | uat | AC-988 + AC-1120 → typography:635, typography:465 | uat-add | The shipped read-only rule is **refuse on change, never on presence** (`packages/site-schema/src/l1/edit.ts`, `field.locked && value !== derived.values[name]`). Both UATs post `{italic: true}` on `A_HEADLINE`, whose derived value is `false`, so only the refusing half is evidenced; **no UAT posts a locked field's own reported value and asserts it passes**. The one whole-form no-op save that would have caught it (typography:626) is deliberately run on `A_FULL`, where nothing is locked. A regression to presence-based refusal — which would make a run with a non-italic webfont unsavable at all — leaves all 43 UATs green. Not a violation today because AC-988 and AC-1120 as written state the rule on presence; that wording is REPORT-2081 findings 1–2, pending repair | In the same pass that repairs AC-988/AC-1120: add to the AC-1120 UAT a whole-form save of `A_HEADLINE` echoing the reported `italic: false`, asserting success and that only the intended field is reported changed |
| 8 | warning | ac | AC-992 + AC-1026 | ac-edit | Both verification sections still say the origin-facing claim is observed **on disk** ("assert both the editable and plain rendered outputs on disk reflect it"), and AC-992's criterion still says a save re-renders both "before reporting success". Since REQ-119 the draft-side channels render **on request**, so the UATs fetch `/preview/acme/{edit,draft}/` from the running origin instead. The substance is fully proven; the observation point named in the AC text is stale | Restate both verification clauses (and AC-992's "before reporting success") in terms of the origin serving each channel from the definition at request time. The UATs need no change |
| 9 | warning | uat | AC-1024, AC-1045, AC-1046, AC-1048, AC-1111 UATs vs the AC-992 UAT | uat-edit | Five UATs re-assert origin parity that AC-992's UAT owns (image-selection:335-341, background:355-362, image-selection:441-454, background:563-593, field-format:284-295). Each is correct against its AC as written, so this is strictly downstream of REPORT-2081 finding 4 and must not be repaired before it | When that finding drops the origin clauses from those five ACs, drop the corresponding assertion blocks in the same commit, leaving the AC-992 UAT sole owner |

## Notes for the Editor

**One violation, and it is a real hole rather than a bookkeeping one.** Finding 1
is the same class of failure the story exists to prevent — an edit that reaches one
rendering and not the other, with nothing to signal the staleness — and it is the
only in-scope bullet of the story body with no evidence behind it. The repair is
one AC and one UAT of roughly ten lines; the observable already exists (`data.rendered`
and `data.renderedDraft` are both emitted, and both channel directories are written
to `storage/dist`). Note that this is *not* an origin claim: REQ-119 moved the
origin's observable, and the five origin-facing UATs prove the origin half
thoroughly. It is the command-line half that nothing watches.

**Findings 2–6 are one mechanical cause and can be batched.** Each reconcile that
widened an AC (REQ-118, then REQ-135, then REQ-136) added a new test file rather
than editing the existing one, so the widened AC ends up with two or three UATs of
the same shape. Five deletions/merges clears it, and the cost grows each cycle:
AC-991 has gone from two members to three, and AC-980 acquired a second in the last
cycle. None of these weakens coverage today — every AC would still pass with the
duplicates gone — so they are warnings, not gating.

**Sequencing.** Finding 1 is independent and should land first. Finding 7 must land
with REPORT-2081 findings 1–2 (those repair the AC prose, this repairs the
evidence; doing one without the other leaves the AC and its UAT stating different
rules again). Finding 8 is an AC-text repair with no test change. Finding 9 must
wait for REPORT-2081 finding 4. Findings 2–6 are independent of all of it.

**Checked and confirmed adequate, not findings.** The four "current value is always
among its own options" UATs (AC-1025 image handle, AC-1047 panel background, AC-1119
weight, AC-1131 shape) each assert the same correctness rule on a different field
with a different fixture and a different consequence-of-omission — specialisation,
not duplication. The two-member sets under AC-1121 and AC-1122 are required by those
ACs' own verification sections ("Repeat both halves on an image"). The three
byte-identical claims each take their baseline *after* a real save rather than from
the seed, each recording why in a comment (the shared write helper re-escapes the
whole document — a known cosmetic defect recorded on the story); that is honest
fixture handling, not a weakened assertion. The AC-1122 framing UAT's folded-capture
arm (`A_FOLDED`) is the strongest single piece of evidence in the capability: the
only test starting from the fractional values a real capture produces, and what
stops a plain echo from reading as a change.
