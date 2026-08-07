---
uid: report-aa73bcbf
id: REPORT-1602
type: report
title: 'Capability-Intent Alignment: site-materials-and-start-point (level=ac)'
created_by: xgd
created_at: '2026-08-07T18:25:06.451598+00:00'
updated_at: '2026-08-07T18:25:06.451598+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: site-materials-and-start-point
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Attempt 2 (previous_attempt_count = 1). The attempt-1 validation
(report-f5bac919) carried exactly one violation — AC-873's title still asserting
the retired theme colour-token group — and the fix pass (report-575629c5)
claimed three repairs. All three were re-verified independently against the live
tickets this run, not taken on report. A full fresh AC-level pass over all 35
active ACs found no further drift.

CAP-89 (capability-b4ac88fc) holds four stories, all `story_kind: feature` and
all `completed`, so all four are in AC-level scope; none is refactor /
reconciliation / test_infrastructure / composition.

| Story | Kind | ACs | Intent |
|---|---|---|---|
| STORY-93 (story-86c7c21b) — a created site is a page that already renders | feature | 8 (AC-869…AC-876) | BUNDLE-11 / REQ-102; `updated_by` BUNDLE-14 / REQ-114 |
| STORY-92 (story-8685be2d) — font provenance + licence gate | feature | 12 (AC-857…AC-868) | BUNDLE-11 / REQ-101 |
| STORY-97 (story-5e7eb0c5) — colour census + palette retrofit | feature | 9 (AC-939…AC-947) | BUNDLE-14 / REQ-114 |
| STORY-102 (story-c46abfa6) — the site asset store | feature | 6 (AC-1018…AC-1023) | REQ-118 (request-66e4c630) |

## Verification of the attempt-1 repairs

Re-read from the live ticket store this run:

| Element | Expected after fix | Observed | Verdict |
|---|---|---|---|
| AC-873 (acceptance_criterion-56334082) title | "A newly created site states its document background and placeholder colour as hex literals in its own layout document, and declares no palette" | exactly that | repaired |
| STORY-93 `## Story` line | "in colours the page's own document declares" | exactly that | repaired |
| CAP-89 Scope § "The authoring start point" | "in colours the page's own document declares" | exactly that | repaired |

AC-873's body, Verification section and `fields` are unchanged and still state
the post-REQ-114 position; the fix did not "correct" the body toward the retired
title, as instructed. All 35 AC titles were re-swept for retired-mechanism
vocabulary (theme colour tokens, `theme.palette`, `--color-*`): no remaining
instance in this capability, in a title or a body. AC-870's body mentions the
theme palette only to record it as *retired*, cross-referencing AC-873 — correct
as written.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. All three are
`free_and_reconciled` with a `merged_at_commit`; none is abandoned, deprecated,
draft or merely imminent, so all count in full.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-118 (request-66e4c630) | free_and_reconciled | 2026-07-31 (merged b2b9208c) | §3 "One asset listing, three consumers": `listSiteAssets` as the **union** of `site.json.assets` (metadata, empty on every real site) and `draft/assets/` (bytes, no metadata); entry shape `{id, src, alt, kind, onDisk, registered}`; `src` always `/assets/<name>` — the capture fold's own vocabulary, no parallel one; `editAssetList` supersedes the registry-only listing in place; §4 `GET /api/assets?slug=` reachable without a modal. Known upstream limitation: no per-option label or thumbnail. | YES |
| REQ-101 (in BUNDLE-11, bundle-ee56a66e) | free_and_reconciled | 2026-08-05 (merged f9a415a8) | `fonts/registry.yaml` provenance index (family, foundry, source, downloaded, licence name/URL, three permission answers, actions, files); three-state `redistribute_in_product` with the unresolved state treated as no; `siteConfig.distribution: internal\|product` defaulting to internal; `1c fonts check` with four violation kinds; both site trees plus an on-disk scan minus derived/vendored trees; open actions warn-not-fail; missing or malformed registry a hard error. Acquisition verb deliberately not built. | YES |
| REQ-102 (in BUNDLE-11, bundle-ee56a66e) | free_and_reconciled | 2026-08-05 (merged f9a415a8) | `1c new` scaffolds a minimal valid L1 document by default — standard widths ladder, document background, a flowed centred root with one placeholder text leaf; renders and screenshots immediately; `1c repro` over a scaffolded slug identical to over a virgin slug; **no flag, no mode detection**. | YES |
| REQ-114 (in BUNDLE-14, bundle-0385746c) | free_and_reconciled | 2026-08-06 (merged cd8f98c8) | L1 palette colour model (literal base, palette overlay) plus retrofit of existing sites: exact alpha collapse first, then hue-family ramp grouping, unclustered keeps its own entry; pixel-identical conversion; repeatable colour census. §4 **retires the legacy palette completely** (`paletteTokensSchema`, the required `theme.palette` key, `paletteVars()`, `--color-*` emission) — colour token group only; typography/spacing/radius/shadow/container/breakpoints untouched. This is the intent that moved a fresh site's colour provenance off the theme onto the page's own layout document, and so re-touched STORY-93. | YES |

Cumulative picture at AC level — the capability should describe: (a) a seeded,
literal-coloured, palette-free starting document on the capture ladder, with no
mode selection and wholesale replacement on import; (b) a project-level font
provenance record plus a four-kind gate with a three-state redistribution
answer; (c) one union asset listing with per-source provenance flags, one handle
vocabulary, a usage kind, reachable from CLI and from the builder origin; (d) a
read-only colour census plus a lossless-or-refuse palette retrofit with
reproducible naming and re-runnability.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-93 / AC-869 | REQ-102 | aligned — layout document present, whole definition validates unedited including envelope checks and module-seam rules |
| STORY-93 / AC-870 | REQ-102, REQ-114 | aligned — renders unedited; records the theme colour palette as retired and defers colour provenance to AC-873 |
| STORY-93 / AC-871 | REQ-102 | aligned — screenshot works from the first command |
| STORY-93 / AC-872 | REQ-102 | aligned — scaffolded ladder derived from the capture ladder rather than restated |
| STORY-93 / AC-873 | REQ-102, REQ-114 | aligned (repaired this cycle) — title and body now both state hex literals in the page's own layout document, no palette |
| STORY-93 / AC-874 | REQ-102 | aligned — flowed centred root, no per-width geometry track |
| STORY-93 / AC-875 | REQ-102 | aligned — one shape, slug-only invocation, no mode selection |
| STORY-93 / AC-876 | REQ-102 | aligned — pins the overwrite-not-merge question the intent left open as a criterion |
| STORY-92 / AC-857 | REQ-101 | aligned — record contract, all three permission answers, actions list, entry+field-level rejection |
| STORY-92 / AC-858 | REQ-101 | aligned — unregistered-family |
| STORY-92 / AC-859 | REQ-101 | aligned — unregistered-file, per-file accounting |
| STORY-92 / AC-860 | REQ-101 | aligned — unprovenanced-file, derived/vendored exclusion, no doubled finding |
| STORY-92 / AC-861 | REQ-101 | aligned — three-state gate; unresolved reported as unresolved, not as a plain refusal |
| STORY-92 / AC-862 | REQ-101 | aligned — distribution marker in the validated contract, absent means internal |
| STORY-92 / AC-863 | REQ-101 | aligned — open actions warn and pass, with the referencing sites as blast radius |
| STORY-92 / AC-864 | REQ-101 | aligned — record integrity a hard error, never a vacuous pass |
| STORY-92 / AC-865 | REQ-101 | aligned — both trees scanned, each violation attributed to tree and site |
| STORY-92 / AC-866 | REQ-101 | aligned — follows the story's "provenance is demanded of the file, not of the reference" |
| STORY-92 / AC-867 | REQ-101 | aligned — asserts scan-scope non-emptiness, not the backfill's 23-files/10-families figures the story excludes from capability surface |
| STORY-92 / AC-868 | REQ-101 | aligned — machine-readable form, success flag agrees with exit status |
| STORY-97 / AC-939 | REQ-114 | aligned — human census, read-only, a zero-colour site is a valid census |
| STORY-97 / AC-940 | REQ-114 | aligned — single JSON document, numbers agree with the human form |
| STORY-97 / AC-941 | REQ-114 | aligned — palette written, every literal rewritten, before/after counts and written-file list |
| STORY-97 / AC-942 | REQ-114 | aligned — alpha collapse: one entry per RGB, opacity carried on each reference |
| STORY-97 / AC-943 | REQ-114 | aligned — asserts the grouping outcome, correctly leaving the chroma-vs-saturation implementation choice out of the criterion |
| STORY-97 / AC-944 | REQ-114 | aligned — pixel identity stated as a property, not a tolerance |
| STORY-97 / AC-945 | REQ-114 | aligned — lossless-or-nothing, no partial writes |
| STORY-97 / AC-946 | REQ-114 | aligned — descriptive derived names, `--names` promotion to role vocabulary, rename changes names only |
| STORY-97 / AC-947 | REQ-114 | aligned — separate re-runnable pass; a retrofitted site censuses as its resolved colours; correctly avoids asserting "every site carries a palette" |
| STORY-102 / AC-1018 | REQ-118 | aligned — undeclared on-disk file listed with on-disk/declared provenance |
| STORY-102 / AC-1019 | REQ-118 | aligned — one entry per handle; declared-but-absent still listed |
| STORY-102 / AC-1020 | REQ-118 | aligned — `/assets/<name>` normalisation, no parallel vocabulary (see info 2 on the ordering clause) |
| STORY-102 / AC-1021 | REQ-118 | aligned — kind derived from the file; the listing itself narrows nothing |
| STORY-102 / AC-1022 | REQ-118 | aligned — CLI answers with the site as its only input; empty is a success |
| STORY-102 / AC-1023 | REQ-118 | aligned — same list over the builder origin; missing slug is a 400 caller fault |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-873 (acceptance_criterion-56334082) | — | The attempt-1 violation is repaired and re-verified this run: title, body, parent STORY-93's `## Story` line and CAP-89's Scope § all now state the post-REQ-114 position (hex literals in the page's own layout document, no palette). No residue of the retired theme colour-token group survives anywhere in this capability's 35 ACs. | none |
| 2 | info | consistency | AC-1020 (acceptance_criterion-cd61874f) | — | AC-1020 asserts "entries are ordered by handle, so the same site yields the same order on every call", while STORY-102's out-of-scope list excludes "any presentation of the list — a friendly label, a thumbnail, an ordering for human eyes". Not a contradiction: the excluded thing is a *presentation* ordering; a deterministic handle order is a data-reproducibility property, and it is what the implementation does (`tools/generate/src/cli/edit.ts:771` sorts by `src`). Recorded so a future cycle does not re-litigate the apparent tension. | none |
| 3 | info | coverage | AC-941 (acceptance_criterion-48360aec) | — | AC-941's closing clause asserts the derived palette is obtainable as a machine-readable document. STORY-97's body names the `--json` form only under its Census bullet, not under Retrofit. Grounded rather than orphaned: both are forms of the one `1c colors <slug>` command, and AC-940 already carries the census half. Not a drift finding. | none |
| 4 | info | exclusivity | AC-870 + AC-874 (STORY-93); AC-942 + AC-944 (STORY-97); AC-857 + AC-864 (STORY-92) | — | Three near-pairs examined and cleared. AC-870/AC-874 share one observation (a flowed, centred root) but assert different properties — "a fresh site renders at all, with the slug painted on the seeded background" versus "no per-width geometry track exists". AC-942/AC-944 both touch round-tripping, but AC-942's subject is the alpha-collapse *structure* (one entry per RGB, no opacity on the entry) and AC-944's is render byte-identity across the whole conversion. AC-857/AC-864 are the schema validator's rejection versus the check command's refusal to produce a vacuous pass — two surfaces. None is a duplicate criterion. | none |

**Coverage**: no gaps. Every in-scope bullet of all four story bodies maps onto
at least one AC (mapping in the Alignment Ledger), and every AC maps back to
story-body text. Checked explicitly: STORY-92's "four ways a font can fail"
enumerate to exactly AC-858/859/860/861 with none missing and none invented;
STORY-97's two derivation passes are each pinned by outcome (AC-942, AC-943) and
their *ordering* is pinned implicitly, since collapse-last would split an alpha
family that AC-942 requires to be one entry; STORY-102's three named consumers
resolve to two ACs (AC-1022 CLI, AC-1023 origin) with the third — the editing
surface — explicitly out of scope per the story body and CAP-86's remit, so its
absence is correct rather than a gap. STORY-92's two acknowledged divergences
(invalid definitions skipped by the reference join; two permissions recorded but
not gated) are stated in the story body as deliberately *not* carrying criteria,
so they are not coverage gaps either.

**Exclusivity**: no two ACs within any story describe the same criterion. The
three nearest pairs are analysed in finding 4.

**Needs review**: none. The intent ledger speaks to every AC in the capability;
no criterion required a judgement the ledger left open.

## Notes for the Editor

- **Nothing to action.** All four findings are `info`. The capability passes at
  the AC level.
- **The attempt-1 repair pattern held.** REQ-114's palette retirement rippled
  into a story it did not own (STORY-93, via `fields.updated_by =
  bundle-0385746c`) and left a stale AC *title* behind after the body was
  updated. The fix pass swept the AC title plus the two containing surfaces the
  AC-level pass does not read (story `## Story` line, capability Scope §). This
  run re-checked all 35 titles and bodies for the same pattern and found no
  second instance.
- **Carried forward for the uat-level cycle**, unchanged from attempt 1 and
  still outside this level's remit: (i) AC-871's UAT
  (`test_UAT_AC871_fresh_site_shoots_without_hand_editing`) is *skipped* rather
  than passing while STORY-93 carries `uat_coverage: pass` — whether a
  browser-gated skip constitutes coverage is a UAT-level decision; (ii) AC-870's
  UAT is still named
  `test_UAT_AC870_fresh_site_renders_placeholder_centred_on_theme_background`,
  carrying the retired "theme" vocabulary in a *test name* that evidence sets
  reference, so the rename belongs to a UAT-level pass that can update those
  references together; (iii) STORY-92 and STORY-102 carry no `uat_coverage`
  field at all, while STORY-93 and STORY-97 carry `pass` — the absence should
  not be read as a pass.
