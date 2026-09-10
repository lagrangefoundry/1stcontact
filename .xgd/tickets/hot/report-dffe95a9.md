---
uid: report-dffe95a9
id: REPORT-3787
type: report
title: 'Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets,
  Provenance & Palette (level=ac)'
created_by: xgd
created_at: '2026-09-10T19:56:57.137233+00:00'
updated_at: '2026-09-10T19:56:57.137233+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: ac
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette
# Level: ac

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

> **Position in the cascade.** The story level passed 12 minutes before this run
> (`report-d9b5dd9e`, 2026-09-10T19:49Z, 0 violations) after attempt 4
> (`report-42796731`, 19:45Z) finally landed four real body/title writes. Per the
> level-priority rule the four story bodies are this check's working reference and
> were not re-litigated. Two of the three findings below are the **AC-level tail of
> that story-level repair**: attempt 4's same-shape sweep covered the four story
> titles and the capability body, but not the 38 ACs beneath them, and two of the
> phrases it removed upstairs are still sitting in the AC tree.
>
> The third finding is a **repeat**: `report-42025e18` (ac level, 2026-08-16T06:01Z,
> FAIL) raised it against AC-932 and it was never repaired. AC-932's body *was*
> edited later that day (22:25Z) — but for REQ-137's steps→shade change, not for
> the prescribed exclusivity narrowing.

## Cumulative Intent Considered

The story-level check re-derived this ledger independently 12 minutes ago and I
have not duplicated that work wholesale; the rows that bear on an AC-level finding
were re-verified from the ticket store directly (statuses read out of
`.xgd/tickets/hot/`, not taken on the prior report's word).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-101 (`request-b63bbed5`, BUNDLE-11) | free_and_reconciled | 2026-07-26 | Font provenance index; three-state redistribution answer; `distribution` marker; four violation kinds + on-disk scan; actions warn, redistribution blocks | YES |
| REQ-102 (`request-56cb1897`, BUNDLE-11) | free_and_reconciled | 2026-07-26 | `1c new` seeds a complete L1 document; renders/shots unedited; `1c repro` overwrites wholesale; no flag, no mode selection | YES |
| REQ-114 (`request-3cd338cd`, BUNDLE-14) | **free_and_reconciled** (re-verified) | 2026-07-31 | Census command; retrofit of `storage/sites/*`; retired the theme colour token group. **AC3 guaranteed byte-identity** | YES (AC3 superseded) |
| REQ-118 (`request-66e4c630`) | **free_and_reconciled** (re-verified) | 2026-07-31 | `listSiteAssets` — union of registry + asset store merged by handle, `onDisk`/`registered` provenance, one handle vocabulary, derived `kind`, CLI + `/api/assets` | YES |
| REQ-132 (`request-5946d045`) | **free_and_reconciled** (re-verified) | 2026-08-12 | Image picker becomes a local thumbnail grid; adds no source to the listing | YES (no AC delta) |
| REQ-137 (`request-d2980a95`, BUNDLE-18) | **free_and_reconciled** (re-verified) | 2026-08-12 | Deletes entry `steps`, adds continuous `shade`. Body line 80–81: *"the retrofit … is no longer pixel-identical. REQ-114 AC3 guaranteed byte-identity; this supersedes that guarantee with a bounded, measured one: ≤8/255"* | YES — **drives finding 2** |
| REQ-142 (`request-0dd62a5d`) | **free_and_reconciled** (re-verified) | 2026-08-15 | Async `SiteStore` port, filesystem moved behind it | YES — **drives finding 3** |
| REQ-143 (`request-18a48d63`) | **free_and_reconciled** (re-verified) | 2026-08-15 | D1/R2 adapter for the same port; both adapters live | YES — **drives finding 3** |
| REQ-145 (`request-b474390f`) | free_and_reconciled | 2026-08-15 | control-app becomes the builder origin | YES (AC-1023 already generic) |
| REQ-128, REQ-133, REQ-140, REQ-149, REQ-151–153, REQ-162 | free_and_reconciled | 2026-08 → 09-02 | Downstream/adjacent; no AC delta inside this capability's four scope areas | YES (no delta) |
| REQ-154 (`request-b88b79fe`) | bundled | 2026-08-20 | Browser Rendering driver behind the existing seam | imminent — no AC delta |
| REQ-134 | abandoned | 2026-08-12 | Image generation component | NO |
| REQ-155–161, REQ-163–166 | draft | 2026-08-20 → 08-31 | Capture port, fidelity, KB, Library tab, ingestion, … | NO |

**Step 2.5 was checked and does not apply.** A grep across all 38 AC bodies in
this capability for `REQ-`/`BUG-`/`DOC-`/`STORY-`/`CAP-` returns nothing: no AC
names a ticket as its delivery vehicle, so the stale-citation false-positive case
cannot arise here and produces no `needs_review`.

## Alignment Ledger

### STORY-93 (`story-86c7c21b`) — the authoring start point — 8 ACs — **aligned**

Working reference: the story body as repaired at 19:43Z (page-declared literals).

| AC | Covers (story body clause) | Outcome |
|---|---|---|
| AC-869 (`acceptance_criterion-2b109b66`) | "a complete layout document"; envelope + behavior-module page rules | aligned |
| AC-870 (`acceptance_criterion-34b88d22`) | "renders … with no editing whatsoever" | aligned — its parenthetical already states the theme palette as *retired*, pointing at AC-873 |
| AC-871 (`acceptance_criterion-b17420aa`) | "screenshots" / render-and-look loop | aligned |
| AC-872 (`acceptance_criterion-b211815a`) | "The ladder is the capture ladder" | aligned — asserts derivation, not restatement |
| AC-873 (`acceptance_criterion-56334082`) | "Colour is stated in the page's own document, as literals"; "Creation declares no palette" | aligned — **this AC already carried the corrected provenance before the story body did**, which is why attempt 4's story-body repair needs no cascade here |
| AC-874 (`acceptance_criterion-e48441de`) | "The root is flowed, not pinned" | aligned |
| AC-875 (`acceptance_criterion-ba6fe401`) | "one shape and no opt-in" | aligned |
| AC-876 (`acceptance_criterion-d64f190a`) | "a reproduction import replaces the page document wholesale" | aligned — asserts the result, as the story's Technical Context directs |

Coverage complete: every in-scope clause of the story body maps to an AC, and the
two clauses the body explicitly assigns elsewhere (the behavior-module seam rule;
the layout language itself) correctly have none.

### STORY-92 (`story-8685be2d`) — font provenance & licence — 12 ACs — **aligned**

| AC | Covers | Outcome |
|---|---|---|
| AC-857 (`db2202bc`) | the record's contract + rejection naming entry and field | aligned |
| AC-858 (`bf0a6404`) | failure way 1 — unregistered family | aligned |
| AC-859 (`3cdc059e`) | failure way 2 — unregistered file | aligned |
| AC-860 (`4d12bd29`) | failure way 3 — on-disk bytes nothing records; derived/vendored trees excluded | aligned |
| AC-861 (`2b2e4518`) | failure way 4 — unresolved redistribution treated as *no* | aligned |
| AC-862 (`0e249010`) | the distribution marker in the validated contract; absent ⇒ internal | aligned |
| AC-863 (`3d85c7cc`) | the advisory channel: outstanding work warns and passes | aligned |
| AC-864 (`875c0a08`) | record integrity as a hard error, never a vacuous pass | aligned |
| AC-865 (`11047c96`) | project-wide scan incl. the scratch tree; per-tree attribution | aligned |
| AC-866 (`15da3b28`) | reference-form normalisation | aligned |
| AC-867 (`d5fe6862`) | the report states its own scope | aligned — asserts a *property* (counts non-zero), not frozen numbers, exactly as the story's Technical Context requires |
| AC-868 (`fee5470e`) | machine-readable form, success flag agrees with exit status | aligned |

Coverage complete, and the two divergences the story body records as deliberately
un-criterion'd (invalid site definitions skipped by the reference join; two of the
three permissions recorded but not gated) correctly have no AC asserting them.

### STORY-102 (`story-c46abfa6`) — the site asset store — 6 ACs — **1 warning**

| AC | Covers | Outcome |
|---|---|---|
| AC-1018 (`4cd04340`) | "an undeclared file is visible as an undeclared file" | **warning — finding 3**: still names the filesystem adapter ("draft asset area", "asset directory") |
| AC-1019 (`c15ea16c`) | "a declared asset with no file is visible as a missing one"; one entry per handle | aligned |
| AC-1020 (`cd61874f`) | "One handle vocabulary"; deterministic handle order | aligned (verification carries the same adapter phrasing — see finding 3) |
| AC-1021 (`feaa4db0`) | "A usage kind"; the listing itself narrows nothing | aligned (same, verification only) |
| AC-1022 (`bc7cc7f1`) | "Reachable without an editing gesture" — CLI; empty is an answer | aligned |
| AC-1023 (`07e381ca`) | builder origin returns the same list; missing site is a caller fault | aligned |

Coverage complete. The story body's deliberate no-AC decision on labels and
thumbnails ("The listing carries no label and no thumbnail, by boundary", rewritten
at 19:43Z) is honoured — no AC asserts either.

### STORY-97 (`story-5e7eb0c5`) — colour census & palette retrofit — 12 ACs — **2 violations**

| AC | Covers | Outcome |
|---|---|---|
| AC-939 (`681fa4dd`) | census, human-readable; zero-colour census is valid | aligned |
| AC-940 (`63d8463e`) | `--json` census | aligned |
| AC-941 (`48360aec`) | the retrofit write + before/after counts + files written | aligned (and is the rightful owner of the "materially smaller" claim — see finding 1) |
| AC-942 (`62c0b208`) | exact alpha collapse | aligned |
| AC-943 (`3f7e1894`) | hue-family grouping, most-reaching base, rounds, family-change refusal | aligned |
| AC-944 (`3127e56f`) | the 8/255 bound + reported drift | aligned — states the supersession in its own body, correctly |
| AC-945 (`66e919f9`) | bounded-or-nothing abort | **violation — finding 2**: body is correct, **title** still promises "proved lossless" |
| AC-946 (`c9cc59fc`) | derived naming + `--names` role vocabulary | aligned |
| AC-947 (`e7d18852`) | separate re-runnable pass; second run a byte-identical fixpoint | aligned — its "byte-identical" is second-run idempotence, which REQ-137 does not touch |
| AC-932 (`9f1e7baf`) | (claims palette size + colour-losslessness + zero-colour no-op) | **violation — finding 1**: two of three claims duplicate AC-941 and AC-944 |
| AC-1146 (`3dc77086`) | unreachable colour becomes its own exact entry | aligned |
| AC-1147 (`b80e8a70`) | fit searched over the definition's own shade function | aligned |

**Consistency**: 36 of 38 ACs accurately follow their story body. Two do not
(findings 1–2 concern AC-945's title and AC-932's scope; finding 3 is AC-1018).

**Coverage**: no `ac-add`. All four stories are `feature`/`upgrade` (STORY-97 is
`upgrade`, the other three `feature`), so all four are in scope for the ACs check,
and each story's behavioural surface is fully mapped above. Every reconciled
intent's asked behaviour lands on a named AC.

**Exclusivity**: one genuine duplication (finding 1). Everything else that reads
adjacent was checked and distinguished — AC-869/870/871 are three different exit
points (validates / renders / screenshots) of one scaffold, not one criterion three
times; AC-943 and AC-1146 are the reachable and unreachable halves of grouping;
AC-944 and AC-1147 are the bound itself versus the fit sharing the model's own
shade function; AC-940 (census document) and AC-941's closing clause (palette
document) emit different documents.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | exclusivity | AC-932 (`acceptance_criterion-9f1e7baf`) under STORY-97 | ac-edit | **Repeat of `report-42025e18` finding 1, still unrepaired.** Both of AC-932's substantive claims are already criteria elsewhere in the same story. (a) "the number of entries is materially smaller than the number of distinct colours the site used … a palette rather than a colour list" is AC-941 (`48360aec`) bullet 1 verbatim in substance, parenthetical included: "whose entry count is materially smaller than the site's distinct colour literal count (a palette, not a colour list)". (b) "every colour the site painted before the conversion is still painted after it — within the bound — and no new colour appears" is a strictly weaker AC-944 (`3127e56f`), whose Verification carries the *same sentence*: "Compare the painted colours before and after in document order and assert the number of slots is unchanged". AC-932's body was edited 2026-08-16T22:25:28Z, but for REQ-137's steps→shade update (6/8 entries → 7/15), not for the prescribed narrowing | Narrow AC-932 to its **one** non-duplicated criterion — "Sites with no L1 colour axes carry no palette at all and remain valid" — and retitle to that zero-colour no-op. Drop claim (a) (owned by AC-941) and claim (b) (owned by AC-944). Re-verified this run that the zero-colour retrofit is uncovered elsewhere: AC-939 covers the zero-colour *census*, AC-945 enumerates only three refusal causes (no stored draft, out-of-bound fit, invalid result), and AC-941 asserts a palette *is* written. **Do not deprecate AC-932 outright** or that case is lost |
| 2 | violation | consistency | AC-945 (`acceptance_criterion-66e919f9`) under STORY-97 | ac-edit | The title reads "A retrofit that cannot be proved **lossless** writes nothing". REQ-137 (`request-d2980a95`, free_and_reconciled, 2026-08-12) body lines 80–81 retire exactly that promise: *"the retrofit … is no longer pixel-identical. REQ-114 AC3 guaranteed byte-identity; this supersedes that guarantee with a bounded, measured one: ≤8/255."* The retrofit now *accepts and reports* up to 8/255 per-channel drift, so a gate described as "proved lossless" is false. The AC's own **body is already correct** ("within the stated bound (byte-exactly, where the reference carries no shade …)"), as is STORY-97's "**Bounded, reported, or nothing**" bullet — the title is the sole orphan. This is the identical shape attempt 4 repaired one level up 12 minutes ago: STORY-97's title ("without moving a pixel" → "within a proven per-channel bound") and CAP-89's body ("lossless-or-refuse write" → "bounded-reported-or-nothing write"). The sweep stopped at story titles | Retitle to the bounded gate, e.g. "A retrofit that cannot be proved within the bound writes nothing: the command fails with a diagnostic and every file is left untouched". **Body needs no edit** — verified clause by clause against STORY-97's bullet. Do not touch AC-932's "colour-lossless in the sense that matters for the palette's shape … within the bound the conversion is gated on" (explicitly qualified, correct) or AC-947's "byte-identical" (second-run fixpoint, untouched by REQ-137) |
| 3 | warning | consistency | AC-1018 (`acceptance_criterion-4cd04340`) under STORY-102 | ac-edit | AC-1018 says the listing returns "every file present in the site's **draft asset area**", and glosses the situation as "a full **asset directory** beside an empty declared registry". REQ-142 (`request-0dd62a5d`) put asset listing behind the async `SiteStore` port and REQ-143 (`request-18a48d63`) added a second live adapter — both free_and_reconciled, re-verified this run. Confirmed on this branch: `listAssets` is a port method (`tools/generate/src/store/site-store.ts:178`) with three adapters — `fs-store.ts:113`, `d1r2-store.ts:599`, `memory-store.ts:160` — and `listSiteAssets` reads `opts.store.listAssets(slug)` (`tools/generate/src/cli/edit.ts:1887`), never a directory. Under the D1/R2 adapter there is no directory at all, so the AC names one of three adapters as if it were the contract. This is the same phrasing attempt 4 removed from STORY-102's body at 19:43Z ("draft asset directory" → "asset store"), which is why it is a warning rather than a violation — the story-level check scored the identical shape as its one warning | Replace "the site's draft asset area" with "the site's asset store", and "a full asset directory beside an empty declared registry" with "a full store beside an empty declared registry". Sweep the same phrase out of two Verification sections in the same pass: AC-1020 (`cd61874f`) "a site whose **asset directory** holds the same file" and AC-1021 (`feaa4db0`) "a site whose **directory** holds pictures". Leave AC-1019's "on disk" alone — that is the entry flag's own name (`present-on-disk` / `onDisk`), not adapter phrasing |
| 4 | info | consistency | AC-932 (`acceptance_criterion-9f1e7baf`) | — | `report-42025e18` finding 2 (warning) — AC-932 baking frozen repo counts into a criterion — is **now closed**. The 22:25Z edit reframed them as observation ("**As built**, the two stored sites … land at 7 entries and 15 entries") and the Verification asserts only the *relation* ("compare the declared palette size against the count of distinct colours … confirm it is materially smaller"), never the numbers. This matches the framing STORY-97's own Technical Context uses for the same figures. Do not re-open it | none |
| 5 | info | coverage | all 38 ACs | — | Step 2.5 checked and not triggered: no AC in this capability names a ticket as a delivery vehicle (grep for `REQ-`/`BUG-`/`DOC-`/`STORY-`/`CAP-` across all 38 AC bodies returns nothing), so no stale-citation case exists and nothing escalates to `needs_review` | none |
| 6 | info | consistency | STORY-93, STORY-92 AC trees | — | Both trees are clean and needed no cascade from attempt 4. AC-873 in particular already stated the corrected page-declared colour provenance *before* STORY-93's body did — it was the AC tree that was ahead of the story, not behind it | none |

## Notes for the Editor

- **All three actionable findings are one-element text edits.** No `ac-add`, no
  `ac-deprecate`, no `uat-add`, no `code-issue`. Nothing in the capability's four
  scope areas is uncovered.

- **Two of the three are the AC-level tail of a story-level repair that stopped at
  story titles.** `report-e5fd0e6a` asked whoever fixed finding 3 to sweep for the
  same shape; attempt 4 swept the four story titles and the capability body and
  reported them clean, which they now are — but the sweep never descended into the
  38 ACs. Findings 2 and 3 are what it would have found there. When repairing,
  sweep the AC tree, not just the two named ACs; I have already done that sweep and
  the extra hits are itemised inside findings 2 and 3 (AC-1020 and AC-1021
  Verification sections; and the *non*-hits AC-932/AC-947, which must be left
  alone).

- **Finding 1 is on its fifth check.** AC-932 has now been flagged by the ac-level
  check on 2026-08-10 (`report-34f54ad3`), 2026-08-16 (`report-42025e18`) and again
  here. The element is not inert — it was edited at 22:25Z on 08-16 — so the
  failure mode is not a lost write; it is that the edit that landed was the REQ-137
  content update while the prescribed exclusivity narrowing was never applied.
  Re-read the body after updating and confirm the two duplicated claims are gone,
  not merely reworded.

- **One thing to settle while narrowing AC-932, flagged rather than raised as a
  finding.** Once AC-932 is reduced to the zero-colour clause, that clause becomes
  the only criterion asserting it, so its wording has to be exact. AC-932 currently
  says such a site carries "**no palette at all**"; `cmdAssign` spreads the derived
  palette onto the base unconditionally (`tools/generate/src/cli/colors.ts:687`,
  `const nextBase = { ...base, palette }`), so a zero-colour retrofit looks like it
  would write `"palette": {}` rather than omit the key. I did **not** run the
  command to settle which it is, so this is not a `code-issue` finding — but the
  narrowed AC should say whichever the code actually does ("no palette entries" vs
  "no palette key"), and STORY-97's Technical Context ("`1stcontact` and
  `harbor-cafe` census at zero colour literals, so there is nothing to convert and
  no palette is written") should be read alongside it.

- **`uat_coverage` consequence of finding 1, unchanged from the last ac check.**
  AC-932 carries `uat_coverage: pass`. Narrowing it as suggested moves its current
  evidence onto claims that now live in AC-941 and AC-944, so its UAT must be
  re-pointed at the zero-colour no-op or the uat level will pass on evidence for a
  criterion AC-932 no longer makes. AC-1146 and AC-1147 carry no `uat_coverage`
  field at all — a uat-level question, not this check's, and not touched here.

- **`uat_coverage` is not this check's field and was not written.** For the record:
  CAP-89 `fail`, STORY-93 `stale`, STORY-102 `stale`, STORY-97 `pass`, STORY-92
  `pass`. The two `stale` values remain the expected consequence of attempt 4
  editing those bodies.
