---
uid: comment-5a835774
id: COMMENT-1272
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-20T07:33:16.003988+00:00'
updated_at: '2026-08-20T07:33:16.003988+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d63b40df
  kind: note
---

## UAT Coverage Assessment — CAP-63 (1c Capture & Diff Fidelity): **PASS**

**REPORT-2399** (`report-d63b40df`) — 0 violations, 4 warnings, 0 needs_review. Capability `uat_coverage` flipped `fail` → `pass`.

**Verdicts:** 63 ACs pass, 1 deprecated (AC-637, correctly). All 6 stories pass. Every AC and story already carried the value I independently arrived at, so the capability aggregate was the only field that needed writing.

### What I actually checked

I re-derived everything rather than adopting attempt 7's conclusions:

- **AC→test index rebuilt from bytes** across 352 files (this repo has files with NUL bytes that plain grep skips). All 63 active ACs carry ≥1 AC-linked test; the deprecated one carries none.
- **Gating re-derived per AC** — every active AC has at least one *ungated* test, so none is entirely skipped headless.
- **Executed all 22 test files: 173 passed, 24 skipped, 0 failures.** Every skip is an honest `it.runIf` on a real environment probe.
- **Anti-pattern sweep** — no `.skip`/`.todo`/`.only`, no `vi.mock`, no source-text stand-ins.
- **Attempt 7's fixes verified at source.** The AC-657 rewrite is genuine: it drives the real `run(argv)` dispatcher over on-disk bundles, parses the whole stdout stream as one document, and deep-equals it against the `--out` report the same run wrote. The AC-1310/AC-720 body edits and the STORY-79 trim all landed.

### The four warnings (none blocking)

1. **AC-818** — two of four Verification clauses untested. The capture-side skip is proven well, but no test runs `diffManifests` over an invariant-bearing form to prove the pairing claim, and the fixture omits the widget mount the Criterion names.
2. **AC-1314** — the bounded-wait clause ("a face that 404s cannot hang the capture") has *no* test, gated or ungated. The `.invalid` host in that file is used in the positive direction only, and the AC's own evidence-gating paragraph doesn't acknowledge this clause as gated.
3. **AC-739** — worth your attention. REQ-148 §5 *explicitly* names AC-739 as superseded, and `ready_to_reconcile` sits in the prompt's "imminent = counts" bucket, which read strictly would mean deprecating it now. I didn't, and I grounded that on the code rather than the ticket: `render.ts:264` still carries the `needsAstro` branch, its test passes, and REQ-148's commits have null reconcile/main SHAs. Deprecating would strip evidence from shipping code. Six prior cycles carried this as a silent info note; I've promoted it to a visible warning with the deferred action spelled out.
4. **AC-1307** — carry-forward, fifth cycle: the `oklch()`/`color-mix()` case is browser-gated and skips here. Honest gating, headless siblings exist, no action.

Warnings 1 and 2 are the same shape — an AC whose Criterion enumerates several cases where the evidence covers the load-bearing ones and drops one. That's also what attempt 7's AC-1311 finding was, so it's the pattern worth watching in this capability.
