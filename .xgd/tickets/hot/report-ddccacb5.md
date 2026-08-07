---
uid: report-ddccacb5
id: REPORT-1606
type: report
title: 'UAT Coverage: site-materials-and-start-point'
created_by: xgd
created_at: '2026-08-07T18:46:28.968802+00:00'
updated_at: '2026-08-07T18:46:28.968802+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-b4ac88fc
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: site-materials-and-start-point

**Result**: PASS
**AC verdicts**: 35 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 4 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-17a279f7. Scope `xgd/structural_validation/report-17a279f7/cap/capability-b4ac88fc/2/0`.
Every AC verdict is grounded in a read of the test body **and** an execution of
the suite (34 of 35 UATs run green here; the 35th is browser-gated and skipped —
see the warning below).

## Cumulative Intent Considered

Chronological ledger of the intents that created or touched this capability's
tree. All three are `free_and_reconciled` and merged to main.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-11 (bundle-ee56a66e) — BUG-27 + REQ-94/96/97/98/99/100/101/102/103/104/105/106/107 + BUG-28 | free_and_reconciled | 2026-08-05 → 2026-08-06 (`f9a415a8`) | **REQ-102** — `1c new` scaffolds no L1 document → created STORY-93. **REQ-101** — no licence provenance → font registry + `1c fonts check` → created STORY-92. REQ-107 put the envelope validator on every authored page, which the seeded document must clear. | YES |
| BUNDLE-14 (bundle-0385746c) — BUG-31 + REQ-114 + REQ-116 | free_and_reconciled | 2026-08-06 (`cd8f98c8`) | **REQ-114** — L1 palette colour model + retrofit existing sites → created STORY-97, and retired the theme's colour token group, which moved STORY-93/AC-873's colour provenance from the theme to the page's own layout document. | YES (one restatement, already absorbed) |
| REQ-118 (request-66e4c630) — image selection: click image segment → asset picker → structured src edit | free_and_reconciled | 2026-08-06 → 2026-08-07 (`b2b9208c`) | Created STORY-102 — the site asset store as a surface of its own (the listing the picker draws from; the picker itself is CAP-86's). | YES |

Checked for later intent that could retire any of the above: BUNDLE-13
(REQ-108/109/110/111/113 + BUG-30 — relocatable render output, R2 deploy,
public-site Worker) and BUNDLE-16 (REQ-117/115/44 — copy editing, builder shell,
tooling hygiene) are both reconciled but touch rendering, delivery and the
editing surface, not this capability's materials. BUNDLE-12 and BUNDLE-15 are
`abandoned` duplicates of BUNDLE-13/14 and do not count. **No AC or story body
in this capability describes a behavior any later intent retired**, and no AC is
unsupported by the ledger — so there are zero deprecations and zero
needs_review items.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-93 (story-86c7c21b) | REQ-102 (BUNDLE-11), REQ-114 (BUNDLE-14), REQ-107 | aligned | The one retirement in the ledger (REQ-114 deleting the theme colour palette) is already absorbed: the body restates the load-bearing property as "the page's own layout document", and AC-873 asserts the theme carries exactly the six non-colour groups. |
| STORY-97 (story-5e7eb0c5) | REQ-114 (BUNDLE-14) | aligned | Depends on STORY-80 (the palette *model*), correctly held out of scope. The body's two "intent/observation" notes (census counts drifted 17/15 → 18/16; two of four sites census at zero) are honest divergence records, not claims needing UATs. |
| STORY-92 (story-8685be2d) | REQ-101 (BUNDLE-11) | aligned | The body's four recorded divergences (no acquisition verb; invalid site definitions skipped by the reference join; two permissions recorded but not gated; the pass line under-describing the pass) are all explicitly marked as *not* asserted by any criterion — correctly, since three are absences and one is cosmetic. |
| STORY-102 (story-c46abfa6) | REQ-118 (request-66e4c630) | aligned | The third consumer (the editing surface's image chooser) is explicitly delegated to CAP-86; the obligation kept here — one listing, shared — is what AC-1023 proves. |

## AC-Level Findings

All 35 ACs are active, and each resolves to exactly one `test_UAT_AC<n>_*` UAT
that substantively exercises its behavior through a real entry point. Evidence
quality by story:

**STORY-92 — font provenance (AC-857 … AC-868), 12/12 pass.**
Every UAT builds a throwaway repo-shaped workspace on disk (record YAML + real
site trees) and drives `cmdFontsCheck`, the exported `validateFontRegistry` /
`validateSite`, the report renderer, or the shipped CLI through `run(['fonts',
'check'])` for the exit-status clauses. Nothing internal is mocked; the only
test double is a `console.log` spy used to capture the stream. AC-861 is the
strongest specimen — it holds the record entry and the served font constant and
varies only the two inputs across all four cells of the truth table, so a gate
that ignored either input would fail it. AC-867 runs the check against the real
`REPO_ROOT` and asserts all three scanned counts are non-zero, which is exactly
the "a pass cannot come from an empty scan" claim.

**STORY-93 — the authoring start point (AC-869 … AC-876), 8/8 pass.**
Each UAT runs `cmdNew` into a fresh temp workspace and reads the artifact back
**off disk** rather than recomputing it from the scaffold function, so a
scaffold that returned the right object but wrote the wrong file would fail.
AC-870 asserts the background colour in the rendered bytes equals the value read
back from the seeded document rather than a literal restated in the test — the
provenance clause, not just the paint. AC-872 asserts the ladder against
`RESPONSIVE_VIEWPORTS` (the capture ladder itself) *and* against the exported
`STARTER_WIDTHS`, so a restated-rather-than-derived ladder is caught. AC-875
reads the documented usage from the shipped `1c.mjs` launcher as a subprocess.
AC-876 asserts the *result* (byte-identical page documents over a seeded and a
virgin slug) rather than the emptying mechanism, as the criterion requires.

**STORY-97 — colour census & palette retrofit (AC-939 … AC-947), 9/9 pass.**
The stdout / stderr / exit-status ACs are driven through the shipped launcher as
a real subprocess; the palette-shape and pixel-identity ACs drive the command
handlers against isolated temp trees. AC-944 renders, retrofits, renders again
and compares byte-for-byte, *then* independently resolves every reference back
through `resolveL1Palette` and asserts deep equality with the pre-conversion
definition — two independent proofs of the same property. AC-945 hashes the
whole site tree before and after each of the three failure paths, so a partial
write is detectable. AC-941's file-list clause was repaired under fix attempt 1
(REPORT-1604, commit `d6729d0ed`) and now parses the written filenames back out
of stdout and cross-checks them against an independently computed set — it is no
longer self-fulfilling.

**STORY-102 — the site asset store (AC-1018 … AC-1023), 6/6 pass.**
Both entry points are real: the CLI through `run(argv)` (envelope + exit code
out) and the builder origin through `startBuilder` with a live `fetch` over HTTP,
so "one store, two ways in" is asserted about bytes on the wire, not a shared
import. AC-1023 additionally routes through the builder's own `fetchAssets`
client rather than hand-writing the URL twice. AC-1020's fixture declares the
same file both bare and qualified while it also sits on disk — four naming
sources, and the test asserts one entry, not two.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-871 | — (environment, no ticket edit) | `test_UAT_AC871_fresh_site_shoots_without_hand_editing` is substantive (real `cmdShot`, asserts the PNG signature on the emitted bytes) but is gated on `chromiumAvailable()` and **skipped in this environment**, so its evidence did not execute. Cause is a Playwright browser-version mismatch, not the test: `~/Library/Caches/ms-playwright` holds `chromium-1234` while the installed `playwright` expects `chromium_headless_shell-1228`. It also has **no entry at all in `.xgd/uat_index.json`**, so no run status has ever been recorded for it. | No ticket edit. AC-871's own Verification explicitly sanctions the gate ("Requires a headless browser; the check is gated on browser availability"), so the AC and the UAT are both correct as written. Resolve at the environment level (`npx playwright install chromium` in `tools/generate`) and re-run so the index records a status. |

**PASS**: zero violations, zero needs_review.

## Notes for the Editor

- **No action is required on any ticket in this capability.** All 35 ACs, all
  four story bodies and the capability body were judged against the intent
  ledger and against executed evidence; nothing is stale, deprecated or
  unsupported. The single finding is a warning about the *runner*, not about a
  ticket or a test.
- **The browser gate is a project-wide pattern, not a defect of this
  capability.** Twenty-plus test files under `tests/` use the same
  `it.runIf(browserOk)` construction (`req39-conformance`, `req82-l1-substrate`,
  `capture`, …). Fixing the Playwright browser install once un-skips all of
  them; treating AC-871 in isolation would be the wrong lever. Flagged here
  because a regression run in this environment reports coverage for AC-871 that
  never actually executed.
- **`.xgd/uat_index.json` is incomplete for skipped tests.** AC-871 exists as a
  UAT in the source tree but has no `acs` entry in the index, which means the
  index cannot be used alone to detect a missing test — it silently omits tests
  that have never reported. Worth knowing for any future check that reads the
  index without cross-checking the source tree; this assessment cross-checked by
  grepping `tests/` directly.
- **Evidence executed for this assessment**:
  `npx vitest run tests/reconciliation-scaffold-starter-l1.test.ts
  tests/reconciliation-site-asset-listing.test.ts
  tests/reconciliation-font-provenance.test.ts` → 25 passed, 1 skipped;
  `npx vitest run tests/reconciliation-colour-census-and-retrofit.test.ts` →
  9 passed. The colour suite seeds and removes `storage/sandbox/` slugs; the
  working tree was left clean.
