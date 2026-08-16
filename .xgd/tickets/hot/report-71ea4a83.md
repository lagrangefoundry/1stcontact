---
uid: report-71ea4a83
id: REPORT-2079
type: report
title: 'UAT Coverage: Site Materials & Starting Point: Scaffold, Assets, Provenance
  & Palette'
created_by: xgd
created_at: '2026-08-16T06:16:03.895166+00:00'
updated_at: '2026-08-16T06:16:03.895166+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-b4ac88fc
  violations: 2
  warnings: 4
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Materials & Starting Point: Scaffold, Assets, Provenance & Palette

**Result**: FAIL
**AC verdicts**: 36 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 2 stale, 0 needs_review
**Capability verdict**: fail

Anchor report: report-7ef6a9ea. Previous attempts: 4.

**The failure is not a coverage gap.** Every one of the capability's 36 acceptance
criteria is active per cumulative intent and substantively evidenced — 36/36 pass,
no AC needs a UAT authored, edited or deprecated. The two violations are both
**story-body drift**: text in STORY-93's and STORY-102's Technical Context that a
later *reconciled* intent falsified. Under Step 2a that is a `stale` story verdict,
and under Step 3 any stale story makes the capability aggregate `fail`.

**Execution limitation — stated plainly.** The five suites carrying these UATs were
**not executed this run**. This session runs in don't-ask mode with no test runner on
the Bash allowlist: `npx vitest`, `xgd quality run`, `npm`, `pnpm` and `node <script>`
are all denied (each was attempted). No AC verdict below rests on a test *passing* —
each rests on reading the test body and judging whether it exercises real entry
points against real state in a way that could distinguish a correct implementation
from a wrong one. The last recorded execution of these suites (report-8cf89ae5,
2026-08-10) was 35/36 passing with 1 skipped (AC-871, browser-gated). See warning 4.

**No AC field was rewritten.** All 36 ACs already carried `uat_coverage: pass`, which
is the verdict this assessment independently reached; re-writing an identical value
would only churn ticket commits. The two story verdicts and the capability aggregate
*did* change and were written (STORY-93 `pass`→`stale`, STORY-102 `pass`→`stale`,
CAP-89 `pass`→`fail`).

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. Bundle members are
listed individually: the stories carry the bundle UID as `intent_uid` but align to
specific members. Every status below was re-read from the ticket store this run.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-102 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | merged `f9a415a8` 2026-08-06 | `1c new` seeds a complete valid L1 document — ladder, background, flowed root, one placeholder run; renders and shoots unedited; `1c repro` overwrites wholesale; no flag, no mode detection → STORY-93 | YES |
| REQ-101 (BUNDLE-11, `bundle-ee56a66e`) | free_and_reconciled | merged `f9a415a8` 2026-08-06 | `fonts/registry.yaml` provenance index; three-state `redistribute_in_product`; `distribution` marker on site config; `1c fonts check` with four violation kinds + on-disk scan; actions warn, redistribution blocks; broken record is a hard error → STORY-92 | YES |
| REQ-114 (BUNDLE-14, `bundle-0385746c`) | free_and_reconciled | merged `cd8f98c8` 2026-08-06 | Palette colour model (model half → STORY-80, other capability); census; retrofit with byte-identical conversion; §4 **retired the theme colour group outright** → STORY-97, and `updated_by` on STORY-93 | YES (and retires) |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | merged `b2b9208c` 2026-08-07 | `listSiteAssets` — union of declared registry + `draft/assets/`, merged by handle, `onDisk`/`registered` provenance, one handle vocabulary, derived `kind`, reachable from CLI and `/api/assets` → STORY-102 | YES |
| REQ-128 (`request-de67e1a1`) | free_and_reconciled | 2026-08-08 | Background-image picker over the *same* listing; explicitly reuses it, adds no source | YES (no delta here) |
| REQ-132 (`request-5946d045`) | free_and_reconciled | merged `6cb3942f` 2026-08-12 | Image picker becomes a thumbnail grid with file-name labels, **implemented locally** in `apps/control-app/src/builder/image-picker.js` because the upstream enum control has no seam | YES (and retires) |
| REQ-137 (`request-d2980a95`, `bundle-d9226698`) | bundled | 2026-08-12 | Deletes palette entry `steps` for a continuous `shade`; supersedes REQ-114's byte-identity with a bounded ≤8/255 guarantee | imminent — **re-verified NOT landed** on this branch |
| REQ-133 / REQ-140 | ready_to_reconcile | 2026-08-12 / 2026-08-15 | Palette popup; page-editor colour from the palette | imminent (editor capability — no UAT here) |
| REQ-134 (`request-ba3e3fba`) | abandoned | 2026-08-12 | Image generation component | NO |

Story→intent bindings read directly this run: STORY-93 `bundle-ee56a66e` (updated_by
`bundle-0385746c`), STORY-92 `bundle-ee56a66e`, STORY-97 `bundle-0385746c`, STORY-102
`request-66e4c630`. BUNDLE-11 and BUNDLE-14 both resolve `free_and_reconciled` with
merge commits recorded.

**Verified in the tree rather than inferred** (each finding below rests on one of
these, not on reading the intent ticket's prose):

| Claim | Where checked | Current tree |
|---|---|---|
| A scaffold cannot source colour from the theme | `tools/generate/src/cli/scaffold.ts:45-46,60-61,80` | `STARTER_BACKGROUND = '#ffffff'` / `STARTER_TEXT = '#111827'` are literals written onto the L1 document |
| The image picker is a locally-wrapped thumbnail grid with file-name labels | `apps/control-app/src/builder/image-picker.js:6,20,102-143` | present; draws `<img>` tiles with the handle's file name as the label, and its header states the upstream `<select>` "is not reachable through its seams" |
| REQ-137 has not landed | `packages/site-schema/src/l1/palette.ts:63-72` | `steps` still declared, no `shade` — so STORY-97 and AC-943/944 still describe the live system |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-92 (`story-8685be2d`) | REQ-101 | **aligned / pass** | Every behaviour the body claims — the record contract, the four violation kinds, warn-vs-block, the distribution marker, the hard error, the deliberate absence of an acquisition verb — is asserted by AC-857…AC-868's tests. No later intent touches the registry. |
| STORY-97 (`story-5e7eb0c5`) | REQ-114 | **aligned / pass** | Aligned to the system as it stands. REQ-137 is imminent, not reconciled, and its code is verified absent from this branch, so nothing in the body is retired *yet*. See warning 3. |
| STORY-93 (`story-86c7c21b`) | REQ-102 (origin), REQ-114 (`updated_by`) | **stale** | Coverage is complete (AC-869…AC-876 all pass); the body's final Technical Context bullet still calls the scaffold's colours "theme-sourced", which REQ-114 retired. Violation 1. |
| STORY-102 (`story-c46abfa6`) | REQ-118 (origin); REQ-128, REQ-132 downstream | **stale** | Coverage is complete (AC-1018…AC-1023 all pass); the "Known upstream limitation" paragraph asserts a picker behaviour and a project rule that REQ-132 both falsified. Violation 2. |

Exclusivity holds: no AC number appears under two stories, and exactly one test
claims each AC. STORY-92 and STORY-102 both enumerate font files but answer
different questions (project-level licence obligation vs site-level reference
listing), and STORY-102 states that boundary explicitly.

## AC-Level Coverage — how each verdict was reached

All 36 ACs are `status: active`, `kind: behavior`, and none is retired by any
reconciled intent. Every test drives production entry points against real on-disk
trees in throwaway workspaces. **No test in this capability mocks the thing it is
testing**; the only test doubles anywhere are `console.log`/`console.error` spies
used to capture a CLI's own output stream, which is the observation, not the
subject. No test is structural (none reads source text to assert a name appears).

| ACs | Test file | Why the coverage is substantive |
|---|---|---|
| AC-869…AC-876 | `tests/reconciliation-scaffold-starter-l1.test.ts:110-365` | Calls `cmdNew`/`cmdRender`/`cmdShot`/`cmdRepro` and reads the artifact **back off disk** rather than recomputing it from the scaffold function. AC-869 validates the assembled definition through `validateSite` (envelope, node cap, ids), not just the document. AC-870 asserts the run paints inside `<body>` — explicitly guarding against the slug matching only in `<title>`. AC-872 compares element-wise against `RESPONSIVE_VIEWPORTS` and asserts `STARTER_WIDTHS` is derived, not restated. AC-873 asserts every seeded colour is one the document itself declares. AC-874 asserts `geometry` undefined on every node **and** no `position: absolute` in the emitted CSS. AC-875 reads `1c help` from the shipped launcher as a subprocess. AC-876 byte-compares a repro over a seeded slug against a repro over a virgin slug. |
| AC-857…AC-868 | `tests/reconciliation-font-provenance.test.ts:205-712` | Validates the **shipped** `fonts/registry.yaml` entry-by-entry plus four damaged candidates with expected error paths (857); each violation kind provoked by a purpose-built workspace and asserted on kind, message, remediation and CLI exit (858-861); the redistribution gate driven as a 2×2 matrix with everything but the two inputs held constant (861); the marker asserted through `validateSite` including rejection of `oem` (862); advisory warnings with blast radius and their absence (863); all four record-integrity failures, each also run through the real CLI asserting non-zero exit and no `PASS` on stdout (864); both site trees with per-tree attribution (865); six reference forms plus a query-bearing end-to-end pass (866); `cmdFontsCheck(REPO_ROOT)` against the real project with non-zero scan counts, so a pass cannot come from an empty scan (867); `--json` on a passing and a failing project with flag/exit agreement and nothing else on the stream (868). |
| AC-939…AC-947 | `tests/reconciliation-colour-census-and-retrofit.test.ts:200-751` | The stdout/exit-status ACs drive the **shipped `1c` launcher as a subprocess**; the derivation ACs drive the same handlers against isolated temp trees. AC-939 parses the header, checks per-literal ordering and α annotation, and proves read-only by a before/after sha256 tree hash. AC-941 measures the literal count **by census** rather than baking it in, and compares the reported file list against an actual changed-file diff. AC-944 renders every page before and after, compares bytes file-for-file, **and** independently resolves the converted definition back to the pre-conversion object. AC-945 exercises all three refusal causes with a tree hash proving nothing was written. AC-946 proves a rename changes names only, by comparing resolved colours. AC-947 proves idempotence across a second retrofit. |
| AC-932 | `tests/reconciliation-colour-palette-overlay.test.ts:467-519` | Runs the real `cmdColors`/`cmdColorsAssign` over copies of the two real stored sites and compares the **multiset of painted colours** from the load boundary both times, so a reference resolving differently would show. Guards the comparison against being vacuously true. Also covers the zero-colour no-op. Two warnings attach (2 and 3) but neither undermines the evidence. |
| AC-1018…AC-1023 | `tests/reconciliation-site-asset-listing.test.ts:218-411` | Drives `run(argv)` — argv in, `{ok,data}` envelope and exit code out — and, for AC-1023, a real HTTP `GET` against a started builder, compared **entry-for-entry against the CLI's own answer** rather than against a constant alone, plus the builder's own `fetchAssets` client. AC-1020 compares the listed handle against what a real page node actually holds, and pins the off-site-URL boundary. AC-1022 asserts the full entry shape and that an empty store is a success, not a failure. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | story | STORY-93 (`story-86c7c21b`) | story-body-edit | Technical Context → final bullet ("Intent/implementation agreement") still reads "The derived-rather-than-restated ladder and **the theme-sourced colours** are implementation decisions … documented here as behaviour". REQ-114 (free_and_reconciled, merged `cd8f98c8`, §4) retired the theme colour group, so a scaffold cannot source colour from the theme. Verified in the tree: `tools/generate/src/cli/scaffold.ts:45-46` seeds `'#ffffff'` / `'#111827'` as literals on the L1 document. The story's own *first* Technical Context bullet already states the corrected provenance, so the body contradicts itself. AC-873 and its test assert the corrected behaviour, so this is body text only — no AC or UAT is wrong. | In the final bullet, replace "the theme-sourced colours" with "the page-declared literal colours", or delete the clause. Leave the Description and the first bullet alone; both are correct. |
| 2 | violation | story | STORY-102 (`story-c46abfa6`) | story-body-edit | Technical Context → "Known upstream limitation, deliberately not worked around" asserts (a) "a chooser drawn from this listing shows the handle rather than a friendly name or a thumbnail" and (b) "the project's rule that a component gap is closed upstream and never wrapped locally". REQ-132 (free_and_reconciled, merged `6cb3942f`, 2026-08-12) falsified both: the picker is now a thumbnail grid with file-name labels, implemented **locally** in `apps/control-app/src/builder/image-picker.js` (verified present; its own header records that the upstream `<select>` has no seam for a grid). The listing's surface is unchanged by REQ-128 and REQ-132, so no AC or UAT is affected. | Rewrite the paragraph. Keep what remains true — the **listing itself** carries no label or thumbnail (`SiteAsset` is `{id, src, alt, kind, onDisk, registered}`; REQ-132's label is the handle's basename derived client-side). Drop the claim about what the chooser shows and drop the "closed upstream, never wrapped locally" rationale, replacing it with the REQ-132 boundary: presentation of the choices belongs to the editing capability, this capability supplies the data. |
| 3 | warning | ac | AC-871 (`acceptance_criterion-b17420aa`) | — | The UAT is registered with `it.runIf(await chromiumAvailable())` (`tests/reconciliation-scaffold-starter-l1.test.ts:47-48,177`), so on a host with no headless browser the screenshot criterion is evidenced by nothing while the suite still reports green — which is exactly what happened on the last recorded execution (report-8cf89ae5: 1 skipped). Held at warning because AC-871's own Verification clause sanctions the gate ("Requires a headless browser; the check is gated on browser availability") — criterion and test agree. | Nothing at the UAT level. Unconditional evidence would require editing AC-871's body to drop the gating clause **and** guaranteeing a browser in the regression environment — an `ac`-level decision. |
| 4 | warning | uat | AC-932 (`test_UAT_AC932_…`, `tests/reconciliation-colour-palette-overlay.test.ts:471-486`) | uat-edit | The test hard-codes today's repository contents — `['xgd', {distinctRgb: 16, entries: 6}], ['gigabytealchemy', {distinctRgb: 30, entries: 8}]` — and asserts them with `toBe`. Adding one page to either stored site fails a test whose criterion has not changed. It is not a *coverage* defect: the relative assertions (`entries < census.distinctRgb / 2`, `assigned.before > entries`) and the painted-colour multiset comparison carry the criterion on their own. It mirrors AC-932's own body, which also freezes the counts — so the repair is owned by the `ac` level (report-42025e18 finding 2) and this test should be edited *after* it, not before. | After AC-932's body is narrowed, drop the two `toBe(expected.…)` equalities and keep the relative assertions and the multiset comparison. |
| 5 | warning | story | STORY-97 (`story-5e7eb0c5`) | — | REQ-137 (`bundled` → imminent) will supersede two things this story and AC-943/AC-944 assert: entry `steps` (replaced by a continuous `shade`) and byte-identity (replaced by a bounded ≤8/255 guarantee). Not a violation today — verified `packages/site-schema/src/l1/palette.ts:63-72` still declares `steps` with no `shade`, so the story and both tests describe the live system. | No edit now. Flagged so the reconcile of `bundle-d9226698` rewrites STORY-97's title, its ramp-grouping text, AC-943, AC-944 and their two tests in one pass. |
| 6 | warning | — | this report | — | The five suites could not be executed: every runner is denied by this session's Bash allowlist (`npx`, `npm`, `pnpm`, `node <script>`, `xgd quality run` — each attempted). Verdicts here are reading-based, which is the correct basis for *coverage* (does the test exercise the behaviour) but cannot detect a *runtime* regression in the production code these tests drive. | Add `Bash(npx vitest*)` or an equivalent runner to the allowlist if this check is expected to execute its evidence. |

## Notes for the Editor

- **Two edits close both violations, and they are the same two edits the `story`
  level already reported.** report-375af0aa (level=story, FAIL, this run) raised
  findings 1 and 2 against the identical clauses. This report reaches them
  independently — the Step 2a story judgment cannot skip a stale body just because
  another level owns it — but the editor should repair each clause **once**, not
  twice. After those two clauses are fixed, both stories flip to `pass` and the
  capability aggregate flips to `pass` with no other work.

- **Nothing here asks for a UAT to be written, edited or deleted.** Coverage of this
  capability is genuinely complete: 36 active ACs, 36 tests, one test per AC, all
  driving real entry points. If a fix workflow reads this report looking for
  `uat-add` or `uat-edit` work, the only such item is warning 4 — and it is
  explicitly sequenced *after* an `ac`-level repair, so it should not be picked up
  first.

- **Shared root cause worth one sweep.** Violation 1 exists because REQ-114's update
  to STORY-93 rewrote the Description and prepended a new Technical Context bullet
  but did not sweep the rest of the section for the superseded wording. Any other
  story carrying `updated_by: bundle-0385746c` is worth grepping for residual
  "theme palette" / "theme-sourced colour" phrasing.

- **AC-932's test lives in another story's file.** It sits in
  `reconciliation-colour-palette-overlay.test.ts` beside AC-930 and AC-931, which
  belong to STORY-80 in the framework-substrate capability — residue of AC-932
  having been authored under STORY-80 and later moved to STORY-97. Not a finding
  (file placement is not a matrix property, and the test does drive STORY-97's
  `cmdColors`/`cmdColorsAssign`), but an editor touching that file should know it is
  shared with another capability's evidence.

- **Tooling observation, not a capability finding.** `.xgd/uat_index.json` on this
  branch contains `"acs": {}` — zero entries — so the AC→test lookup this prompt
  prescribes returns nothing for every AC in the capability. The mapping was
  recovered instead by grepping `test_UAT_AC<n>_` across `tests/`, which found
  exactly 36 tests, one per AC, with no AC number appearing twice. Worth knowing
  before another assessor reads an empty index as "no tests exist".
