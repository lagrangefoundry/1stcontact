---
uid: comment-e9fb910e
id: COMMENT-1268
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T06:42:15.196092+00:00'
updated_at: '2026-08-20T06:42:15.196092+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-02e413b2
  kind: note
---

Attempt 9 complete. **21 mutations, 0 violations remaining, `needs_more_work: false`.** Report: `report-02e413b2` (REPORT-2393).

## What the violation actually was

AC-815's only two tests were built with a wrapper whose body was `if (!capture) return`. An `it()` that returns early **reports PASS** — so on every runner without Chromium, AC-815 read fully covered and green while asserting nothing. And the file it lived in could never run: its `beforeAll` bound a socket before probing the browser, so it hard-failed with `listen EPERM` and timed out at 180s. A name-index sweep sees identifiers and green; both checks returned clean for nine attempts.

## Fixes

**V1 + W1** (same file, same root cause, one edit): guard hoisted above `serveDir`, vacuous wrapper replaced with `it.runIf(browserOk)`. `bug27` now runs in **1.6s** instead of timing out — 12 passed, 6 honestly skipped.

**AC-815 headless coverage**: 5 new UATs driving the real `EXTRACT_SCRIPT` over jsdom with layout stubbed per class (the `req72:56-67` harness). AC-815 is a geometry computation over element rects, so its whole surface is provable without a paint.

I red-checked both halves rather than just observing green — reverting `paintedExtent` to the element's own box fails the two subtree tests; dropping the canvas clamp fails the two extent tests. `extract.ts` restored after each; **no production code changed.**

## One correction to the report

Its V1 states `bug27` was "the sole survivor" of the vacuous-wrapper anti-pattern. That's wrong — two more files carried it with the `// Chromium unavailable — skip silently` comment verbatim: `req36-capture-settle.test.ts:78` (2 vacuous tests) and `req47-fidelity-structural.test.ts:320` (3). Both fixed.

Neither carries an `AC<N>`-linked test — they're `test_UAT_FC_REQ-*` — which is why the AC-name-index sweep never reached them. That's the same blind spot in a different coordinate, and the report's own closing advice (reconcile files-executed against files-carrying-ACs) wouldn't have caught them either, since they carry no ACs. A gating-shape grep does, and it now returns nothing. I also closed the latent hook hazard across the remaining 10 files.

**Verification**: 13 touched files — 85 passed, 41 skipped, 0 failures, 2.67s. `tsc --noEmit` clean.

Two caveats worth flagging. I did not run the full `tests/` suite — it exceeded 600s and I stopped it; since no production code changed, the regression surface is confined to the 13 test files I ran green. And this call *increased* the count of never-executed tests from 6 to 11 — that's a reporting correction, not a regression: those 5 tests never asserted anything here, they just used to lie about it. W2 (AC-1307) remains no-action per the assessor; it needs a Chromium-provisioned runner, as does the rest of the browser-gated tier.
