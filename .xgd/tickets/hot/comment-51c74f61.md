---
uid: comment-51c74f61
id: COMMENT-2406
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T00:27:36.884229+00:00'
updated_at: '2026-09-10T00:27:36.884229+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-662e2788
  kind: note
---

Done. Final state confirmed: the 9-suite sweep ran after both mutation experiments were reverted, and `git status` shows only test and fixture files changed.

## What I did

Closed **2 of the 4 violations** and **3 of the warnings**, each with mutation proof.

**The cross-cutting batch (findings 1, 2, 5, 6)** — the report was right that these are one pattern: four ACs stating a property of a *command* but tested one seam below it. All four are now driven at the real boundary:

- **AC-657** — rewritten to spawn the real `1c` binary via `spawnSync` and parse its actual stdout bytes. The `--actual <manifest>` shape reaches both `--json` emit branches with no browser and no render, so it runs everywhere. Three legs now, including a guard that non-`--json` mode is *not* JSON.
- **AC-643 / AC-639** — new legs driving `cmdDiff` / `cmdValuesDiff` *without* an injected actual side, so the command renders and shoots for itself, asserting the driver was sized to the selected viewport.
- **AC-658** — stream split now asserted on the real command in both directions.

I verified these are load-bearing by breaking each production line the report named:

| Mutant | Result |
|---|---|
| `perceptual.ts` `viewport: opts.size` → `undefined` | 8 pre-existing tests stayed **green**; only the new AC-643 leg went red |
| `fidelity.ts` — drop the `viewport` argument | 8 pre-existing tests stayed **green**; only the new AC-639 leg went red |
| `index.ts` — a second `console.log` in the `--json` branch | old `withCleanStdout` tests stayed **green**; the new AC-657/658 legs went red |

That reproduces the report's central claim exactly. Both mutants were reverted; production code is untouched.

**Also**: folded AC-739's two Astro scans into its own test (finding 13), and switched AC-815's `itA` helper to `it.runIf(browserOk)` (finding 8).

## One thing you should know

**Chromium is not available in this sandbox**, so all browser-gated tests skip. That has a consequence worth flagging: AC-815's tests previously did a silent `return` on an absent browser and reported **PASS with zero assertions**. Now they report SKIPPED — which means this environment has apparently never had executing evidence for AC-815.

I extended the fixture with the overflow-clipped carousel and conventional band and wrote the two missing assertions (finding 4), but **I could not run them** and am not claiming they pass. I left `AC-815.uat_coverage` at `fail` rather than mark it green.

Finding 4 can't be closed by any iteration of this loop here — it needs a runner with Chromium. Same for finding 3 (AC-720), whose only unblocked path is the report's alternative (b): ac-editing the end-to-end clause out. Removing an assertion from an AC felt like your call, not mine, so I forwarded both rather than acting.

Verification: `Test Files 9 passed (9) | Tests 62 passed | 13 skipped (75)`. Report filed as `report-662e2788` with `needs_more_work: true`, `violations_remaining: 2`.
