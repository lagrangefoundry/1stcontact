---
uid: comment-5a048898
id: COMMENT-839
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-08T00:32:49.005766+00:00'
updated_at: '2026-08-08T00:32:49.005766+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-177a9552
  kind: note
---

**REPORT-1674 (`report-177a9552`) — FAIL: 2 violations, 7 warnings, 0 needs_review.**

## Scope and evidence

The capability grew from 24 ACs (last cycle) to **96** across 7 stories. All 96 have a matching `test_UAT_AC<n>_*`; 335 UAT names repo-wide, all unique. I ran all 97 AC-linked UATs across 18 files: **96 passed, 2 skipped**, 18/18 files green.

## Violations

**1. AC-685 ¶1 over-claims the emitter's Layer-2 guarantee — confirmed by execution.** Raised by REPORT-1316 two cycles ago as an inspection finding and never repaired. Closed-enum axes are still interpolated raw (`render.ts:406, 226, 523, 575, 1876, 1891–1905, 1988`; no `cssEnum` guard exists). I rendered an unvalidated document with `border.style = 'solid; } body { display: none } .pwn {'` and the emitter produced:

```
.l1-0 { border: 2px solid; } body { display: none } .pwn { #ff0000; position: relative }
```

Live CSS, braces still balanced. **Not a live vulnerability** — `validateL1` rejects that document and Layer 1 is in the production path. It's a documentation defect: DOC-2 §2 lists the Layer-2 guarantees as text/colour/font-family/length/image-src, so policy and code agree and the AC is the outlier. `ac-edit` recommended over hardening ten sinks.

**2. AC-1012's evidence is thinner than its green result suggests.** Its Verification is entirely browser-based; the measurement arm sits behind `if (!HAVE_CHROMIUM) return` and did not run — yet the test reports *pass*, not skip. Separately, the "round-trip fidelity unchanged" clause is exercised by no arm at all, and can't be: the fixture is synthetic, with no original capture to compare against.

## Warnings (7)

Three are unrepaired carry-overs (AC-702's internal mock, AC-716/AC-686 duplicate rejection cases, retired "capability"/"dial" vocabulary in test prose — now third cycle, and one instance prints in the runner's own output). Two more (`if (!HAVE_CHROMIUM) return` at two further sites; AC-930/AC-932 duplicating STORY-97's retrofit tests) plus AC-686 ¶2 / AC-687 ¶2 clauses proven by AC-849's test rather than their own.

**Findings 5–8 are blocked on `ac-edit`s REPORT-1670 already specified** — doing them as test edits now would be wasted work.

## Worth your attention beyond the findings

Engine gating is now on its **sixth cycle**, and I verified the cause directly rather than inheriting it: the playwright cache holds `chromium_headless_shell-1234` / `webkit-2336` / `firefox-1538` while the installed 1.61.1 demands `-1228` / `-2311` / `-1532`. The consequence is that the capability's own headline gate — `capture(render(L1)) ≈ L1` — and the three-engine equivalence contributed **zero executed evidence**. This run proves the validator and emitter thoroughly and the browser-observable behaviour hardly at all. `npx playwright install` in this worktree fixes it.

The other 72 first-time-assessed ACs hold up well: real `validateSite` + `cmdRender` on-disk, the real motion driver under a modelled IntersectionObserver, real JSDOM navigation/focus drives, the real Astro SSR container, the real conformance harness with a throwing core. Internal mocking appears exactly once in 97 UATs. AC-685 ¶2 — last cycle's other violation — is now properly closed.
