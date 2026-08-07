---
uid: report-f5bac919
id: REPORT-1600
type: report
title: 'Capability-Intent Alignment: site-materials-and-start-point (level=ac)'
created_by: xgd
created_at: '2026-08-07T18:15:28.316992+00:00'
updated_at: '2026-08-07T18:15:28.316992+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-b4ac88fc
  level: ac
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: site-materials-and-start-point
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

CAP-89 (capability-b4ac88fc) holds four `feature` stories, all `completed`, and
35 `active` acceptance criteria. Every story is feature/upgrade kind, so all four
are in scope for the AC-level checks.

| Story | Kind | ACs | Intent |
|---|---|---|---|
| STORY-93 (story-86c7c21b) — created site is a page that already renders | feature | 8 (AC-869…AC-876) | BUNDLE-11 / REQ-102; updated by BUNDLE-14 / REQ-114 |
| STORY-92 (story-8685be2d) — font provenance | feature | 12 (AC-857…AC-868) | BUNDLE-11 / REQ-101 |
| STORY-102 (story-c46abfa6) — site asset store | feature | 6 (AC-1018…AC-1023) | REQ-118 (request-66e4c630) |
| STORY-97 (story-5e7eb0c5) — colour census + palette retrofit | feature | 9 (AC-939…AC-947) | BUNDLE-14 / REQ-114 |

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. All are
`free_and_reconciled`; none is abandoned, deprecated or draft, so all count.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-118 (request-66e4c630) | free_and_reconciled | 2026-07-31 | Image selection T4. §3 "One asset listing, three consumers": `listSiteAssets` as the **union** of `site.json.assets` (metadata, empty on every real site) and `draft/assets/` (bytes, no metadata); entry shape `{id, src, alt, kind, onDisk, registered}`; `src` always `/assets/<name>`, the capture fold's own vocabulary; `editAssetList` supersedes the registry-only listing in place; §4 `GET /api/assets?slug=` reachable without a modal. Known upstream limitation: no per-option label/thumbnail. | YES |
| REQ-101 (in BUNDLE-11, bundle-ee56a66e) | free_and_reconciled | 2026-08-05 | `fonts/registry.yaml` provenance index (family, foundry, source, downloaded, licence name/URL, three permission answers, actions, files); three-state `redistribute_in_product` with `REVIEW_REQUIRED` treated as no; `siteConfig.distribution: internal\|product` defaulting to internal; `1c fonts check` with four violation kinds; both site trees + on-disk scan minus `dist/`/`node_modules/`; actions warn-not-fail; missing/malformed registry a hard error. Acquisition verb deliberately not built. | YES |
| REQ-102 (in BUNDLE-11, bundle-ee56a66e) | free_and_reconciled | 2026-08-05 | `1c new` scaffolds a minimal valid L1 document by default — standard `widths` ladder, `background`, `root` stack with `align: center` and one placeholder text leaf; renders and shots immediately; `1c repro` over a scaffolded slug identical to over a virgin slug; **no flag, no mode detection**. | YES |
| REQ-114 (in BUNDLE-14, bundle-0385746c) | free_and_reconciled | 2026-08-06 | L1 palette colour model (literal base, palette overlay) + retrofit of existing sites: alpha collapse first, then ramp grouping, unclustered keeps its own entry; pixel-identical conversion; repeatable colour-census command. §4 **retires the legacy palette completely** — `paletteTokensSchema`, the required `theme.palette` key, `paletteVars()`, `--color-*` emission — colour token group only; typography/spacing/radius/shadow/breakpoints untouched. This is the intent that moved a fresh site's colour provenance off the theme and onto the page's own layout document, and so re-touched STORY-93. | YES |

Cumulative picture at AC level: the capability should describe (a) a seeded,
literal-coloured, palette-free starting document on the capture ladder with no
mode selection and wholesale replacement on import; (b) a project-level font
provenance record plus a four-kind gate with a three-state redistribution
answer; (c) one union asset listing with provenance flags, one handle
vocabulary, a usage kind, reachable from CLI and origin; (d) a read-only colour
census plus a lossless-or-refuse palette retrofit with reproducible naming and
re-runnability.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-93 / AC-869 | REQ-102 | aligned — layout document present and whole definition validates unedited, incl. envelope checks |
| STORY-93 / AC-870 | REQ-102, REQ-114 | aligned — renders unedited; correctly records the theme colour palette as *retired* and defers provenance to AC-873 |
| STORY-93 / AC-871 | REQ-102 | aligned — screenshot works from the first command |
| STORY-93 / AC-872 | REQ-102 | aligned — scaffolded ladder derived from the capture ladder rather than restated |
| STORY-93 / AC-873 | REQ-102, REQ-114 | **drift: body was restated for REQ-114's palette retirement; the AC title was not** (finding 1) |
| STORY-93 / AC-874 | REQ-102 | aligned — flowed root, no per-width geometry track |
| STORY-93 / AC-875 | REQ-102 | aligned — one shape, slug-only invocation, no mode selection |
| STORY-93 / AC-876 | REQ-102 | aligned — pins the "one check before implementing" (overwrite, not merge) as a criterion |
| STORY-92 / AC-857 | REQ-101 | aligned — record contract incl. all three permission answers and the actions list |
| STORY-92 / AC-858 | REQ-101 | aligned — `unregistered-family` |
| STORY-92 / AC-859 | REQ-101 | aligned — `unregistered-file`, per-file accounting |
| STORY-92 / AC-860 | REQ-101 | aligned — `unprovenanced-file` incl. the `dist/`/vendored exclusion and the no-double-counting property |
| STORY-92 / AC-861 | REQ-101 | aligned — three-state gate; unresolved reported as unresolved, not as a plain refusal |
| STORY-92 / AC-862 | REQ-101 | aligned — distribution marker in the validated contract, absent means internal |
| STORY-92 / AC-863 | REQ-101 | aligned — actions warn and pass, with blast radius |
| STORY-92 / AC-864 | REQ-101 | aligned — record integrity a hard error, never a vacuous pass |
| STORY-92 / AC-865 | REQ-101 | aligned — both trees scanned, violations attributed to tree + site |
| STORY-92 / AC-866 | REQ-101 | aligned — follows from the story's "provenance is demanded of the file, not of the reference"; matches the intent's `asset_src_resolves_to_the_registry_file_key` |
| STORY-92 / AC-867 | REQ-101 | aligned — asserts scope counts non-zero (the gate), not the backfill's specific 23/10 figures the story excludes from capability surface |
| STORY-92 / AC-868 | REQ-101 | aligned — machine-readable form, success flag agrees with exit status |
| STORY-102 / AC-1018 | REQ-118 | aligned — undeclared on-disk file listed with `onDisk`/`registered` provenance |
| STORY-102 / AC-1019 | REQ-118 | aligned — declared asset merged into one entry per handle; declared-but-absent still listed |
| STORY-102 / AC-1020 | REQ-118 | aligned — `/assets/<name>` normalisation, no parallel vocabulary, deterministic handle order |
| STORY-102 / AC-1021 | REQ-118 | aligned — `kind` derived from the file; listing narrows nothing |
| STORY-102 / AC-1022 | REQ-118 | aligned — CLI answers without an editing gesture; empty is a success |
| STORY-102 / AC-1023 | REQ-118 | aligned — `/api/assets` same list, missing slug is a 400 caller fault |
| STORY-97 / AC-939 | REQ-114 | aligned — human census, read-only, zero-colour site is a valid census |
| STORY-97 / AC-940 | REQ-114 | aligned — single JSON document, numbers agree with the human form |
| STORY-97 / AC-941 | REQ-114 | aligned — palette written, literals rewritten, before/after counts and file list reported |
| STORY-97 / AC-942 | REQ-114 | aligned — REQ-114 AC5 (three `#2e86a3` variants → one entry plus the opacity axis) generalised to any alpha family |
| STORY-97 / AC-943 | REQ-114 | aligned — asserts the grouping *outcome*, correctly leaving the chroma-vs-saturation implementation choice out of the criterion |
| STORY-97 / AC-944 | REQ-114 | aligned — REQ-114 AC3 pixel-identity, stated as a property not a tolerance |
| STORY-97 / AC-945 | REQ-114 | aligned — lossless-or-nothing, no partial writes |
| STORY-97 / AC-946 | REQ-114 | aligned — descriptive derived names, `--names` promotion to role vocabulary |
| STORY-97 / AC-947 | REQ-114 | aligned — separate re-runnable pass; census of a retrofitted site measures resolved colours; correctly avoids asserting "every site carries a palette" (two of four are vacuous) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-873 (acceptance_criterion-56334082) | ac-edit | The AC **title** reads "A newly created site's document background and placeholder colour come from the site's own **theme tokens, not from literals** invented by the scaffold" — the exact inverse of its own body, which states "A newly created site states its starting colours as **hex literals in its own layout document**… It formerly came from the theme's closed colour palette, **which no longer exists**". REQ-114 (bundle-0385746c, free_and_reconciled, 2026-08-06) §4 deleted `paletteTokensSchema` and the required `theme.palette` key outright; STORY-93's Technical Context records this as a *restatement* of the criterion ("the single place a fresh site's colour is stated is the page's own layout document"), and sibling AC-870 already cross-references AC-873 as the authority for where colour comes from *now*. The body was updated for the retirement (updated_at 2026-08-06T22:01:31Z); the title was left on the pre-REQ-114 wording. A reader or test author taking the title at face value would look for theme colour tokens that no longer exist in the schema. | Retitle AC-873 to match its body and the story, e.g. "A newly created site states its document background and placeholder colour as hex literals in its own layout document, and declares no palette". Body needs no change; STORY-93's body needs no change. |
| 2 | info | exclusivity | AC-870 + AC-874 (STORY-93) | — | Both ACs assert the rendered root lays out flowed and centred. Not a duplicate criterion: AC-870's subject is *that a fresh site renders at all, with the slug painted on the seeded background*, AC-874's is *the absence of a per-width geometry track*. Two different load-bearing properties from the story body ("renders immediately" and "the root is flowed, not pinned") that happen to share one observation. No action. | none |
| 3 | info | consistency | AC-867 (STORY-92) | — | AC-867 binds a criterion to live repo state ("run against the project as it stands, the check passes and those counts are all non-zero"). STORY-92's Technical Context says the backfill figures "are repo state, not capability surface". No conflict: AC-867 asserts non-emptiness of the scan, not the 23-files/10-families figures, and the story's in-scope text explicitly wants a live gate "holding in both directions". Recorded so a future check does not re-litigate it. | none |
| 4 | info | coverage | AC-866 (STORY-92) | — | AC-866 (reference-form normalisation) is not named in STORY-92's in-scope list, but follows directly from the story's stated principle that the join is on the file rather than the reference, and matches REQ-101's `asset_src_resolves_to_the_registry_file_key`. Grounded, not orphaned. | none |

**Coverage**: no gaps found. Every in-scope bullet of all four story bodies maps
onto at least one AC (mapping in the Alignment Ledger above). Every AC maps back
to story-body text.

**Exclusivity**: no two ACs within a story describe the same criterion. The
nearest pair (AC-857 record-validator rejection vs AC-864 check-refuses-to-run)
have different subjects — the schema validator versus the check's own refusal to
produce a vacuous pass — and are correctly separate.

**Needs review**: none. The intent ledger speaks to every AC in the capability.

## Notes for the Editor

- **The single finding is a title-only repair.** AC-873's body, its Verification
  section, sibling AC-870's cross-reference, and STORY-93's Technical Context are
  all already correct and mutually consistent on the post-REQ-114 position. Only
  the AC title carries the retired claim. Do not "fix" the body toward the title.
- **Pattern to watch**: REQ-114's palette retirement rippled into a story it did
  not own (STORY-93, via `fields.updated_by = bundle-0385746c`). The body edits
  landed; the title did not. When an intent retires a mechanism, titles of ACs in
  *other* stories are the surface most likely to be missed — AC-873 is the only
  instance found here, but the same sweep is worth running after any future
  cross-capability retirement.
- **Not a finding, recorded for context**: STORY-92 and STORY-102 carry no
  `uat_coverage` field, while STORY-93 and STORY-97 carry `uat_coverage: pass`.
  That is a UAT-level concern and outside this level's remit; flagged only so the
  uat-level cycle does not read the absence as a pass.
