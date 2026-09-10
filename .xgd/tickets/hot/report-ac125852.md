---
uid: report-ac125852
id: REPORT-3632
type: report
title: 'UAT Coverage: 1c Capture & Diff Fidelity'
created_by: xgd
created_at: '2026-09-10T01:57:37.703601+00:00'
updated_at: '2026-09-10T01:57:37.703601+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-aa030c83
  violations: 0
  warnings: 4
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Capture & Diff Fidelity

**Result**: PASS
**AC verdicts**: 80 pass, 0 fail, 1 deprecated, 0 needs_review (81 ACs across 7 stories)
**Story verdicts**: 7 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Scope: **7 stories, 81 ACs** — 67 `active`, 13 `pending`, 1 `deprecated`. Attempt 7.
Every AC verdict below was re-derived this pass: the AC↔test index was rebuilt from
scratch (`.xgd/tmp/acscan.py`, byte-mode walk of `tests/ packages/ tools/ apps/ src/`,
because `.xgd/uat_index.json` is **empty** here — 0 entries — and two files in this
repo carry NUL bytes and are invisible to a text-mode grep), and the node-side suite
was **executed**, not read: 22 files run, **123 tests pass, 0 genuine failures, 13
skipped, 5 EPERM errors** (all sandbox, itemised in warning 1).

Three ACs carried a stale `fail` from an earlier attempt (AC-815, AC-1612, AC-720) and
twenty carried no verdict at all (AC-1415…1417, STORY-124's ten, STORY-125's seven).
All twenty-three were assessed from the AC body and the test source this pass and are
now `pass`; the capability aggregate follows.

## Cumulative Intent Considered

All eight bundles in this capability's tree were re-read live this pass and every one
carries `free_and_reconciled`, so every intent below counts. **No intent in this tree
carries `abandoned`, `deprecated` or `wont_fix`** — nothing in the ledger retires a
behaviour that an AC still claims. The two supersessions that did occur are internal
to counted intents and are already reflected in the matrix (AC-637 deprecated; REQ-89's
conditional form replaced by REQ-150's unconditional one).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 `bundle-ab9e0cb6` (REQ-58/59/61/62) | free_and_reconciled | 2026-07-17 | `intent_uid` of STORY-75…79; `--size`, the persisted ladder, `--multi-viewport`, `responsive-diff`, gradient stops + panel gradient | YES |
| BUNDLE-7 `bundle-31e474b9` (REQ-63, 79, 82/83/84 +2) | free_and_reconciled | 2026-07-22 | Typography/effect axes (AC-711…714); aligned-crops sandbox routing (AC-720); REQ-84 deleted the modules hosting the gradient content field | YES |
| BUNDLE-8 `bundle-cceaba25` (BUG-7, REQ-89/90/91/92 +5) | free_and_reconciled | 2026-07-29 | Quiet bootstrap (AC-738/739); painted-marker precondition | YES (REQ-89's conditional form superseded by REQ-150) |
| BUNDLE-10 `bundle-4ff83a8b` (BUG-12…BUG-16 +11) | free_and_reconciled | 2026-07-29 | Offline re-extract against the bundle's mirrored faces (AC-1607) | YES |
| BUNDLE-11 `bundle-ee56a66e` (BUG-27, REQ-94/96/97/98 +10) | free_and_reconciled | 2026-08-05 | Backdrop / collapsed-subtree capture (AC-815/816/817); REQ-96 retired the gradient **resolver** leg | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-44, 115, 117) | free_and_reconciled | 2026-08-07 | Per-command dependency preflight (AC-1013…1017) | YES |
| BUNDLE-20 `bundle-b3b7c399` (REQ-143…148, REQ-150 +5) | free_and_reconciled | 2026-08-24 | Plain Vite SSR launcher; Astro out of the repo (AC-1415…1417, AC-739) | YES (supersedes REQ-89) |
| BUNDLE-22 `bundle-8eef3846` (REQ-154 + BUG-39) | free_and_reconciled | 2026-08-31 | Cloud Browser Rendering driver behind the existing seam; self-origin fulfilment (STORY-124/125) | YES |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| **STORY-75** `story-d5de22a5` — 20 ACs | BUNDLE-6, 7, 8, 10, 11 | **aligned, covered** | All twelve Description items map onto ACs (extent→629/630/1605, composite fill→631, border→632/713, pairing→633 + attribution→1606, treatments→711, effects→712/714, re-extract→1607 + FOUT→715, band extent→815, backdrops→816/817 + overlay→1608, module-invariant→818, row gap→1609 + padding supersession→1610). Ran its ten node files here: **41 pass, 8 skipped (browser-gated), 3 EPERM** |
| **STORY-76** `story-82eb6908` — 7 ACs | BUNDLE-6 (REQ-59/62), REQ-72; retired legs REQ-84/96 | **aligned — the `stale` verdict this story carried is discharged** | The body already records the resolver supersession in the same terms as the capability's Scope bullet 2, distinguishes the still-live **validator** leg (AC-638), and AC-637 is already `status: deprecated`. Nothing in the body claims a behaviour a counted intent retired, so `stale` no longer describes it. AC-1612 now carries `tests/reconciliation-gradient-modern-colour-stops.test.ts` with both fixtures on disk |
| **STORY-77** `story-16f2793c` — 13 ACs | BUNDLE-6 (REQ-58/61), REQ-64, REQ-76 | **aligned, covered** | Items 1–8 all map (size→639/643, fail-loud→641/642/644, ladder+screenshots→647, multi-viewport→1613, collapse→1614, clusters→1615/1616, deterministic cell→1617, default path→640, vocabulary→645). 25 of 27 tests pass here; the two failures are the AC-639/AC-643 live-render legs timing out on `listen(2)` EPERM, and each of those two ACs has a second, passing leg |
| **STORY-78** `story-2c7069fe` — 9 ACs | BUNDLE-6 (REQ-61) | **aligned, covered** | All nine drive `run(argv)` at the true CLI boundary; file runs green here |
| **STORY-79** `story-e15a19ef` — 15 ACs | BUNDLE-6, 7, 8, 16, 20 | **aligned, covered** | All six guarantees map (boolean flag→656, hygiene/quiet→657/658/659/738, sandbox routing→720, launcher+Astro removal→1415/1416/1417, no build transform→739, preflight→1013…1017). Ran all five files: **20 pass, 1 skipped** (AC-720 Part B, browser-gated). Its two `## Reconciliation Decisions` entries cover the two intent-silent points (empty-stderr sharpening; manifest-scan scope) |
| **STORY-124** `story-080c6036` — 10 ACs | BUNDLE-22 | **aligned, covered** | Every In-scope bullet maps (presets→1459/1460, absent binding→1461, lease+contexts→1462, release on every exit→1463, one navigation→1464, honest limits→1465, shared preconditions→1466/1467, no local stack→1468). Its four intent-silent points are recorded under `## Reconciliation Decisions` — treated as decided, not re-opened |
| **STORY-125** `story-7fa314f5` — 7 ACs | BUNDLE-22 | **aligned, covered** | Seven bullets, seven ACs, one-to-one (1469…1475). Four intent-silent points recorded under `## Reconciliation Decisions`; the intent's AC4 (a DOC-13 prose obligation) is deliberately not an AC, with the record reproduced in Technical Context — a decision, not a gap |

## How each previously-unverdicted or `fail` AC was judged

**AC-815 (was `fail`) → pass.** `tests/bug27-nested-backdrop-capture.test.ts` carries
four AC-named tests that drive the real `cmdCapturePage` in real headless Chromium
against a committed fixture and assert all four Verification clauses — collapsed-header
subtree present in the manifest (`:137-148`), the carousel band clamped and stated
against the unclamped 3000px value so it cannot pass vacuously (`:150-170`), a
conventional band unchanged (`:172-184`), the off-canvas block excluded (`:186-196`).
Not missing, not trivial, not mocked, not structural. The tests **skip** here because
`chromiumAvailable()` is false in this sandbox — an execution escalation (warning 1),
not a coverage defect, and `it.runIf` reports SKIPPED rather than green-over-zero.

**AC-1612 (was `fail`) → pass.** `tests/reconciliation-gradient-modern-colour-stops.test.ts`
(211 lines) plus both fixtures on disk. Three legs map one-to-one onto the three
Verification clauses; assertions are non-vacuous in the direction of the defect
(`stops.length === 2` against the pre-fix empty list; painted order by channel
dominance; the hex twin independently pinned so the modern/legacy pair cannot agree by
both being empty; a real capture→diff pass with a no-false-delta control). Verified
skipping-not-failing by running the file (`1 file skipped, 3 tests skipped`).

**AC-720 (was `fail`) → pass.** Both legs present. Part A drives the real
`subRenderOptions` seam across three invocation shapes; Part B
(`:205-243`) drives the real `cmdRepro --sandbox` → real `cmdAlignedCrops --sandbox`
chain against a locally built reference bundle and asserts the AC's own closing
observable (`areas.length > 0`, both `-ref.png` and `-ours.png` on disk, repro under
`storage/sandbox/` with `storage/sites/tastingmenu` absent). The docstring concession
earlier reports quoted ("the end-to-end check is manual") is gone.

**AC-1415/1416/1417 → pass.** Read in full. These are the one class where source-level
evidence is the *correct* evidence rather than a shortcut: the criteria are about how
the launcher is configured and what has left the repository, and a successful boot
cannot establish either (a plugin that finds nothing to transform boots exactly like no
plugin). The tests are not "a name appears in a file": AC-1416 enumerates workspace
members from `pnpm-workspace.yaml`, parses every manifest and the lockfile's importers,
checks both Vitest configs and every tsconfig, asserts the two must-survive
declarations, and confirms `astro/container` does not resolve **off disk**; AC-1415
adds a real `node 1c.mjs list` exiting 0; AC-1417 adds a real `1c assets` and
`1c assets --json` subprocess run against a mirrored root with the emitted report's
contents asserted. Each would fail under a wrong implementation. All executed green
here (AC-1417's run leg was **not** skipped — webui is installed in this worktree).

**STORY-124's ten and STORY-125's seven → pass.** Read in full. Both `.workers.` files
run against real D1 and real R2 inside workerd, and the single fake is the browser
**at the boundary** — it drives the driver (emits the navigation through the driver's
own interception handler and re-issues parsed subresources against the page's real
`baseURI`) rather than stubbing an answer, so everything between the seam and us is
production code (`shotPreview`, `shotUrl`, `withBrowserSession`, `screenshotUrl`,
`previewRenderer`, the Worker's own `fetch`). STORY-125's oracle is the `/preview/*`
route fetched over HTTP rather than the renderer that answered, which is what makes
AC-1469/1474 claims rather than tautologies. AC-1461 drives import → palette write →
read-back → preview → publish through the Worker's entry point before asserting the
named `BrowserNotConfiguredError`. AC-1465/1466/1467/1468 are node-side and were
**executed here: 4 passed**. The `.workers.` files cannot run in this sandbox at all
(miniflare cannot bind a socket) — warning 1.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | capability | AC-815, AC-720, AC-1612, AC-1607, AC-639, AC-643 + all of STORY-124/125 | — (escalate: runner, not editable) | **The standing execution escalation, re-measured this pass.** Three sandbox denials, none a matrix or test defect: (a) `chromiumAvailable()` is false, so **13 browser-gated legs skip** (AC-815×4, AC-816×4, AC-1612×3, AC-720 Part B, +1 gradient leg); (b) `listen(2)` is EPERM, so **5 node legs error** — AC-1607×3 in `reconciliation-offline-reextract-mirror.test.ts`, and the AC-639/AC-643 live-render legs in `reconciliation-size-aware-diff.test.ts` (120s timeouts); (c) miniflare cannot bind, so the **three `.workers.` files die before any test runs**, leaving all 17 STORY-124/125 ACs authored-but-unobserved here. Every one of these tests is correctly authored and skips or errors honestly rather than passing over zero assertions | None for the editor. **Run this capability's suite once on a host with Chromium and socket-binding permission** and correct whatever those legs report. No test or matrix edit can discharge it |
| 2 | warning | ac | AC-1610 `acceptance_criterion-4a491cfa` (STORY-75) | ac-edit | AC body re-read live: the **Verification** closes "assert **exactly one delta** is reported, on the `gap` axis", which is not satisfiable as written — shifting a row so the measured gap differs also moves the element absolutely and fires an independent `position` delta. The **Criterion** (band padding is not compared; the gap axis supersedes it) is fully satisfiable and is what `test_UAT_AC1610_identical_band_padding_with_a_shifted_row_reports_the_gap_axis` asserts, documenting the divergence inline. This is an AC-body defect, not a coverage gap — coverage stands | Reword the Verification's last sentence to "assert the vertical-spacing signal reported is the `gap` axis, and that no band-padding delta is emitted on any section". **Do not edit the test to chase the overreaching wording** |
| 3 | warning | ac | AC-1605 `acceptance_criterion-e7641019` (STORY-75) | ac-edit | The **Verification** asks that each run of a multi-run element carry an extent "matching that run's own **text-node** rect — narrower than the shared element box". True for the `<br>`-broken paragraph; false for "a heading with a nested span", where outer heading and inner span each own exactly one run and so, by the Criterion's own first sentence, each is measured off its **own element box** — there is no shared box to be narrower than. `test_UAT_AC1605_a_nested_span_gives_each_owner_its_own_extent` asserts the Criterion and flags the disagreement in its header. Coverage stands | Qualify the nested-span clause — e.g. "…and for the nested-span shape assert each owner carries its own distinct extent" — so it stops asking for a text-node rect where the Criterion assigns an element box |
| 4 | warning | capability | capability body, "Overlap cluster 2" recorded-defect note | capability-body-edit | That note says STORY-124's Technical Context "says 'Filed under CAP-102 (1c Capture & Diff Fidelity)' … and will keep surfacing until a step permitted to edit story content corrects it to CAP-63". Read live this pass, `story-080c6036` now reads **"Filed under CAP-63 (1c Capture & Diff Fidelity)"** — the story defect is repaired and the capability body's note about it is now itself the stale artifact, and will keep drawing a reader's eye to a defect that no longer exists | Replace the "Recorded defect, not repaired here" paragraph with one line noting the numeral was corrected to CAP-63, or drop it |

No violations. No `needs_review`, and therefore no impact screen was required: every AC
in this capability is supported either by a counted intent or by an explicit
`## Reconciliation Decisions` entry on its story (STORY-79 ×2, STORY-124 ×4,
STORY-125 ×4) — decisions already made by an authorised stage, treated as grounded.

## Notes for the Editor

**There is nothing for a `fix_uat_coverage` step to author.** All 81 ACs carry at least
one AC-named test, and every one of those tests was judged substantive against the AC's
own Verification this pass — none is missing, trivial, over-mocked or name-matching.
The three ACs that had been sitting at `fail` were fixed by earlier attempts and the
fixes verified here against the working tree and a real test run; the twenty that had
no verdict simply had never been reached by an earlier attempt (this capability's
assessment has been re-entered seven times, and STORY-124/125 — added on 2026-08-31 —
were the tail that kept being cut off).

Two things are worth carrying forward rather than re-discovering:

- **`.xgd/uat_index.json` is empty (0 entries) in this worktree**, so the index-driven
  lookup the prompt suggests silently returns "no tests" for every AC. Any assessor
  reading it at face value will manufacture 81 coverage gaps. Rebuild the index from
  the tree instead, in **byte mode** — two files in this repo carry NUL bytes and are
  invisible to a text-mode read.
- **Findings 2 and 3 are for an `ac`-level pass, not this one.** Both are AC-body
  wording defects whose tests correctly assert the Criterion and document the
  divergence inline. Rewriting either test to satisfy the overreaching Verification
  text would weaken real evidence to match prose.
