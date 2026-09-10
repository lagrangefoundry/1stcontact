---
uid: report-6c22789e
id: REPORT-3789
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=ac)'
created_by: xgd
created_at: '2026-09-10T20:09:24.168425+00:00'
updated_at: '2026-09-10T20:09:24.168425+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

> **Position in the cascade.** The story level passed at 19:49Z
> (`report-d9b5dd9e`, 0 violations). The previous ac-level run
> (`report-dffe95a9`, 19:56Z) failed with 2 violations + 1 warning; fix attempt 5
> (`report-9ed77b85`, 20:02Z) claimed all three applied. **All three are verified
> repaired below, from the ticket store rather than from the fix report's word.**
> Per the level-priority rule the four story bodies are this check's working
> reference and were not re-litigated; the intent ledger was re-verified from the
> ticket store because two findings turn on it.
>
> One new warning is raised. It is a **consequence of attempt 5's own repair**:
> narrowing AC-932 to the zero-colour floor case settled a question STORY-97's
> body answers the other way, and the story text was not brought along.

## Cumulative Intent Considered

Statuses re-read this run from `.xgd/tickets/hot/` (not taken from the prior
report). Every row below was confirmed independently.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-101 (`request-b63bbed5`, BUNDLE-11) | free_and_reconciled | 2026-07-26 | Font provenance index; three-state redistribution answer; `distribution` marker; four violation kinds + on-disk scan; actions warn, redistribution blocks | YES |
| REQ-102 (`request-56cb1897`, BUNDLE-11) | free_and_reconciled | 2026-07-26 | `1c new` seeds a complete L1 document; renders/shots unedited; `1c repro` overwrites wholesale; no flag, no mode selection | YES |
| REQ-114 (`request-3cd338cd`, BUNDLE-14) | free_and_reconciled | 2026-07-31 | Census command; retrofit of `storage/sites/*`; retired the theme colour token group. **AC3 guaranteed byte-identity** | YES (AC3 superseded) |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 | `listSiteAssets` — union of registry + asset store merged by handle, `onDisk`/`registered` provenance, one handle vocabulary, derived `kind`, CLI + `/api/assets` | YES |
| REQ-132 (`request-5946d045`) | free_and_reconciled | 2026-08-12 | Image picker becomes a local thumbnail grid; adds no source to the listing | YES (no AC delta) |
| REQ-137 (`request-d2980a95`, BUNDLE-18) | free_and_reconciled | 2026-08-12 | Deletes entry `steps`, adds continuous `shade`; supersedes REQ-114 AC3's byte-identity with a bounded, measured ≤8/255 guarantee | YES — drove the (now repaired) AC-945 finding |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-15 | Async `SiteStore` port, filesystem moved behind it | YES — drove the (now repaired) AC-1018 finding |
| REQ-143 (`request-18a48d63`) | free_and_reconciled | 2026-08-15 | D1/R2 adapter for the same port; both adapters live | YES — same |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder origin | YES (AC-1023 already generic) |
| BUNDLE-11 / BUNDLE-14 / BUNDLE-18 | free_and_reconciled | 2026-08-05 / 08-06 / 08-13 | Carrier bundles for the above; the four stories' `intent_uid`/`updated_by` chain | YES |
| REQ-128, REQ-133, REQ-140, REQ-149, REQ-151–153, REQ-162 | free_and_reconciled | 2026-08 → 09-02 | Downstream/adjacent; no AC delta inside this capability's four scope areas | YES (no delta) |
| REQ-154 (`request-b88b79fe`) | bundled | 2026-08-20 | Browser Rendering driver behind the existing seam | imminent — no AC delta |
| REQ-134 | abandoned | 2026-08-12 | Image generation component | NO |
| REQ-155–161, REQ-163–166 | draft | 2026-08-20 → 08-31 | Capture port, fidelity, KB, Library tab, ingestion, … | NO |

**Step 2.5 checked, does not apply — re-verified independently this run.** A grep
across every `acceptance_criterion-*.md` for `REQ-`/`BUG-`/`DOC-`/`STORY-`/`CAP-`
returns 21 files, **none of which is one of this capability's 38 ACs**. No AC here
names a ticket as its delivery vehicle, so the stale-citation false-positive case
cannot arise and nothing escalates to `needs_review`. (AC-870 and AC-932 do carry
sibling *AC* cross-references — `see AC-873`, `not one of the refusals AC-945
enumerates` — which are internal pointers, not delivery vehicles.)

## Verification of the three findings attempt 5 claimed

Each was re-read from the ticket store, not taken on the fix report's word.

| Prior finding | Element | State now | Verdict |
|---|---|---|---|
| 1 (violation, exclusivity) | AC-932 (`9f1e7baf`) | Retitled "A site with no colour literals retrofits to an empty palette and remains valid". Body is now the zero-colour floor case alone. The "materially smaller palette" claim and the 7/15 figures are gone (AC-941 `48360aec` remains their sole owner); the "no colour lost within the bound" claim is gone (AC-944 `3127e56f` remains its sole owner). Cross-checked both owners' bodies this run | **repaired** |
| 2 (violation, consistency) | AC-945 (`66e919f9`) | Retitled "A retrofit that cannot be proved **within the bound** writes nothing: the command fails with a diagnostic and every file is left untouched". Body unchanged and still correct against STORY-97's "Bounded, reported, or nothing" bullet, clause by clause | **repaired** |
| 3 (warning, consistency) | AC-1018 (`4cd04340`), + sweep AC-1020 (`cd61874f`), AC-1021 (`feaa4db0`) | AC-1018 now reads "the site's asset store" / "a full store beside an empty declared registry", and its Verification "whose asset store holds". AC-1020's Verification reads "whose asset store holds the same file"; AC-1021's reads "whose store holds pictures". AC-1019's "on disk" correctly left alone (entry-flag name) | **repaired, sweep included** |

**Independent tree sweep.** Grepped all `acceptance_criterion-*.md` for
`lossless`, `pixel-identical`, `without moving a pixel`, `draft asset area`,
`asset directory`, `directory holds`. Three hits repo-wide —
`4d4ee569`, `e04ceb33`, `ed355bc1` — **none of them in this capability's 38**.
This capability's AC tree is clean of the retired phrasing. (AC-944's "supersedes
the earlier pixel-identity guarantee" is a deliberate, correct statement of the
supersession and is not a hit.)

## Alignment Ledger

### STORY-93 (`story-86c7c21b`) — the authoring start point — 8 ACs — **aligned**

Working reference: the story body as repaired at 19:43Z. Read in full this run.

| AC | Covers (story body clause) | Outcome |
|---|---|---|
| AC-869 (`2b109b66`) | "a minimal but complete layout document"; validates unedited incl. envelope + behavior-module page rules | aligned |
| AC-870 (`34b88d22`) | "renders … with no editing whatsoever"; colour carried through the render unchanged | aligned — its parenthetical correctly records the theme palette as retired and points at AC-873 |
| AC-871 (`b17420aa`) | "screenshots"; the render-and-look loop | aligned |
| AC-872 (`b211815a`) | "The ladder is the capture ladder" | aligned — asserts derivation from the capture ladder, not a restatement of it |
| AC-873 (`56334082`) | "Colour is stated in the page's own document, as literals"; "Creation declares no palette" | aligned — matches the repaired Technical Context on colour provenance exactly |
| AC-874 (`e48441de`) | "The root is flowed, not pinned" | aligned |
| AC-875 (`ba6fe401`) | "one shape and no opt-in" | aligned |
| AC-876 (`d64f190a`) | "a reproduction import replaces the page document wholesale" | aligned — asserts the *result*, as the story's Technical Context explicitly directs |

Coverage complete: every in-scope clause maps to an AC, and the two clauses the
body assigns elsewhere (the behavior-module seam rule; the layout language) rightly
have none.

### STORY-92 (`story-8685be2d`) — font provenance & licence — 12 ACs — **aligned**

Story body untouched since 2026-08-10; tree re-checked against its In-scope list.

| AC | Covers | Outcome |
|---|---|---|
| AC-857 (`db2202bc`) | "the record's contract and its validation" | aligned |
| AC-858 (`bf0a6404`) | failure way 1 — a referenced family nothing accounts for | aligned |
| AC-859 (`3cdc059e`) | failure way 2 — family recorded, this file not listed | aligned |
| AC-860 (`4d12bd29`) | failure way 3 — bytes on disk nothing records; derived/vendored trees excluded | aligned |
| AC-861 (`2b2e4518`) | failure way 4 — product site, redistribution not settled yes | aligned |
| AC-862 (`0e249010`) | "the distribution marker"; absent ⇒ internal | aligned |
| AC-863 (`3d85c7cc`) | "the advisory warning channel" | aligned |
| AC-864 (`875c0a08`) | "the record's own integrity being a hard error rather than a vacuous pass" | aligned — **distinct from AC-857**, re-verified by reading both bodies this run: AC-857 is the *validator's* contract and error path over the record artifact; AC-864 is the *check command's* refusal to run (absent / unparseable / duplicate family) with a non-zero exit. Different subjects, adjacent only on "structurally invalid" |
| AC-865 (`11047c96`) | project-wide scan incl. the scratch tree; per-tree attribution | aligned |
| AC-866 (`15da3b28`) | reference-form normalisation | aligned |
| AC-867 (`d5fe6862`) | "the report" states its own scope | aligned — asserts a property (counts non-zero), not frozen numbers, as the story's Technical Context requires |
| AC-868 (`fee5470e`) | "and its machine-readable form" | aligned |

Coverage complete. The story's explicit no-AC decisions are honoured: no acquisition
verb is asserted anywhere; the three recorded divergences (invalid site definitions
skipped by the reference join; two of three permissions recorded but not gated; the
under-describing pass line) correctly carry no criterion.

### STORY-102 (`story-c46abfa6`) — the site asset store — 6 ACs — **aligned**

| AC | Covers (story In-scope bullet) | Outcome |
|---|---|---|
| AC-1018 (`4cd04340`) | "an undeclared file is visible as an undeclared file" | aligned — adapter phrasing repaired this cycle |
| AC-1019 (`c15ea16c`) | "a declared asset with no file is visible as a missing one"; one entry per handle | aligned |
| AC-1020 (`cd61874f`) | "One handle vocabulary"; deterministic handle order | aligned |
| AC-1021 (`feaa4db0`) | "A usage kind"; the listing itself narrows nothing | aligned |
| AC-1022 (`bc7cc7f1`) | "Reachable without an editing gesture" — CLI; empty is an answer | aligned |
| AC-1023 (`07e381ca`) | same bullet — builder origin, same list; missing site is a caller fault | aligned |

Coverage complete across all five In-scope bullets. The story's deliberate no-AC
boundary ("The listing carries no label and no thumbnail, by boundary") is honoured
— no AC asserts either. AC-1022/AC-1023 are two entry points to one store, not one
criterion twice; AC-1018/AC-1019 are the two directions of the same disagreement.

### STORY-97 (`story-5e7eb0c5`) — colour census & palette retrofit — 12 ACs — **1 warning**

| AC | Covers (story In-scope bullet) | Outcome |
|---|---|---|
| AC-939 (`681fa4dd`) | "Census" — human-readable; zero-colour census is valid | aligned |
| AC-940 (`63d8463e`) | "A `--json` form makes the measurement scriptable" | aligned |
| AC-941 (`48360aec`) | "Retrofit" — the write, before/after counts, files written | aligned — now sole owner of the materially-smaller-palette claim |
| AC-942 (`62c0b208`) | "exact alpha collapse first" | aligned |
| AC-943 (`3f7e1894`) | "then hue-family fitting"; most-reaching base, rounds, family-change refusal | aligned |
| AC-944 (`3127e56f`) | "Bounded, reported, or nothing" — the 8/255 bound + reported drift | aligned — now sole owner of the no-colour-lost claim |
| AC-945 (`66e919f9`) | same bullet — the abort half | aligned — title repaired this cycle |
| AC-946 (`c9cc59fc`) | "Reproducible naming" + `--names` | aligned |
| AC-947 (`e7d18852`) | "Re-runnable to a fixpoint" | aligned — its "byte-identical" is second-run idempotence, untouched by REQ-137 |
| AC-932 (`9f1e7baf`) | the zero-colour floor case | **warning — finding 1**: the AC is code-correct; STORY-97's Technical Context now contradicts it |
| AC-1146 (`3dc77086`) | "whatever is still unreached … keeps its own entry, as an exact literal" | aligned |
| AC-1147 (`b80e8a70`) | Technical Context: "fits a shade by searching over the *model's own* shade function" | aligned |

**Consistency**: 38 of 38 ACs accurately follow their story bodies. AC-932's text is
correct against the implementation; the drift is in the story prose (finding 1).

**Coverage**: no `ac-add`. All four stories are `feature`/`upgrade` (STORY-97
`upgrade`, the other three `feature`), so all four are in scope for this check, and
each story's behavioural surface is fully mapped above. Every reconciled intent's
asked behaviour lands on a named AC.

**Exclusivity**: **zero duplications remain.** The one genuine duplication that had
survived five checks (AC-932 restating AC-941 and AC-944) is repaired. Every other
adjacent pair was re-checked this run and distinguished: AC-869/870/871 are three
exit points (validates / renders / screenshots) of one scaffold; AC-857/AC-864 are
validator contract vs command refusal; AC-943/AC-1146 are the reachable and
unreachable halves of grouping; AC-944/AC-1147 are the bound itself vs the fit
sharing the model's shade function; AC-940/AC-941 emit different documents;
AC-932/AC-939 are the retrofit's and the census's zero-colour cases respectively;
AC-1022/AC-1023 are two entry points to one listing.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-97 (`story-5e7eb0c5`) Technical Context, vs AC-932 (`acceptance_criterion-9f1e7baf`) | story-body-edit | STORY-97's note reads: *"`1stcontact` and `harbor-cafe` census at zero colour literals, so there is nothing to convert and **no palette is written**. Not a divergence — but a test author should not read 'every site carries a palette' into the retrofit."* AC-932, as rewritten at 19:59Z, says the opposite: the retrofit "writes a site definition carrying a **palette with no entries** — the palette is present and empty". **The AC is the correct one.** Verified from source this run, not inferred: `cmdColorsAssign` has no early return for an empty census — `derivePalette` returns `const palette: L1Palette = {}` (`tools/generate/src/cli/colors.ts:539`), and the write is unconditional at `const nextBase = { ...base, palette }` (`colors.ts:687`) followed by `writeJson(siteJsonPath, nextBase)` (`colors.ts:703`). So `"palette": {}` **is** written. This is exactly the question `report-dffe95a9`'s Notes flagged as needing settlement; attempt 5 settled it in the AC and in the UAT but did not carry it back to the story text. Warning rather than violation because the AC — the element this level owns — is accurate, the behaviour is covered, and the offending text is an observational note rather than a criterion; but the note's own stated audience is "a test author", who is precisely the reader it now misleads | In STORY-97's Technical Context, change "there is nothing to convert and no palette is written" to "there is nothing to convert, so the retrofit writes an empty palette" (or "no palette *entries* are written"). Keep the following sentence's warning — it remains true and useful in the stronger form: every retrofitted site carries a palette key, but a zero-colour site's is empty. Do **not** edit AC-932 back: it matches the code and its UAT (`test_UAT_AC932_a_colourless_site_retrofits_to_an_empty_palette_and_still_validates`) asserts `toBeDefined()` then zero keys |
| 2 | info | exclusivity | AC-932 (`acceptance_criterion-9f1e7baf`) | — | The five-check-old exclusivity violation (`report-34f54ad3` 08-10, `report-42025e18` 08-16, `report-dffe95a9` 09-10) is **closed**. Re-read the body this run: both duplicated claims are gone, not reworded — no "materially smaller", no 7/15 figures, no painted-colour-multiset claim. The narrowing preserved the zero-colour case rather than deprecating it, as prescribed | none |
| 3 | info | consistency | AC-945 (`acceptance_criterion-66e919f9`), AC-1018/1020/1021 | — | The two remaining findings of `report-dffe95a9` are closed, and the AC-tree sweep its Notes demanded was carried out and independently re-confirmed here. No retired phrasing survives anywhere in this capability's 38 ACs | none |
| 4 | info | coverage | all 38 ACs | — | Step 2.5 checked and not triggered: no AC in this capability names a ticket as a delivery vehicle (grep hits 21 AC files repo-wide, none of them these 38). No stale-citation case, nothing escalates to `needs_review` | none |
| 5 | info | consistency | STORY-93, STORY-92 AC trees | — | Both trees re-read in full this run and need no cascade. STORY-93's AC-873 already carried the corrected page-declared colour provenance before the story body did; STORY-92's body has not moved since 2026-08-10 and its 12 ACs still map one-to-one onto its In-scope list | none |

## Notes for the Editor

- **This level passes.** The single finding is a warning and does not gate. It is
  recorded because it is a *newly created* inconsistency — attempt 5 resolved an
  open question in the AC and left the story body asserting the old answer — and
  because it will otherwise be re-found by the next story-level check, which owns
  that text.

- **If finding 1 is repaired, it is a one-sentence story-body edit.** Do not touch
  AC-932, its UAT, or `colors.ts`. The code is right, the AC is right, the UAT is
  right; only the note is stale.

- **Two items forwarded by attempt 5 belong to the uat level, not here, and were
  not re-litigated.** (a) A second test carrying the `AC932` label lives in
  `tests/reconciliation-colour-palette-overlay.test.ts:497` and still proves the two
  claims that moved to AC-941/AC-944 — a mislabelled test, not a matrix defect.
  (b) AC-1146 and AC-1147 carry no `uat_coverage` field at all. Both are the uat
  level's to decide.

- **A same-shape hit exists in an adjacent capability.**
  `acceptance_criterion-ed355bc1` (under `story-3bf94bd4`, the REQ-132 image picker)
  still says "a site whose **asset directory** also holds a font and a stylesheet" —
  the identical REQ-142/143 adapter-phrasing shape as this cycle's finding 3, but
  outside this capability's four stories. Correctly left alone by attempt 5; its own
  ac-level check should pick it up.

- **`uat_coverage` is not this check's field and was not written.** For the record:
  CAP-89 `fail`, STORY-93 `stale`, STORY-102 `stale`, STORY-97 `pass`, STORY-92
  `pass`. The two `stale` values remain the expected consequence of attempt 4
  editing those bodies at 19:43Z.
