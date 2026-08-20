---
uid: comment-45a520f3
id: COMMENT-1286
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-08-20T10:29:05.170165+00:00'
updated_at: '2026-08-20T10:29:05.170165+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4da13b28
  kind: note
---

Both violations closed. REPORT-2416 (`report-4da13b28`) filed.

**Finding 2 — AC-1343** (`tests/req93-l1-slot-mounted-behaviors.test.ts:220`): added `test_UAT_AC1343_deliberately_legal_compositions_are_not_rejected`, driving the real `validateSite` over the three compositions that must be accepted — an unbound seam, one-bound/one-unbound siblings (which makes the rule per-seam, not per-page), and the empty starter with `modules`/`l1` both genuinely absent. **Verified passing.**

**Finding 1 — AC-1344**: four arms now actually call `assertModuleConforms` with `mountInL1`.

- `..._conformance_discriminates_in_both_shipping_shapes` — the load-bearing one. Uses the render-level `isolation` dimension and a core that throws during SSR, so it fails inside `renderSite` *before* `startServe` and needs neither browser nor socket. Asserts standalone reports exactly `['isolation.render-throws']` and mounted reports the **same AC set**. **Verified passing** — the undriven capability is now driven and proven to discriminate.
- `..._mounted_host_seam_spans_the_viewport_at_every_probed_width` — closes the clause that was true by construction and asserted nowhere: a keyframe at every ladder width, and every emitted seam `width` is the viewport identity, checked structurally rather than by sampling. **Verified passing.**
- `..._a_defect_visible_only_when_mounted_is_reported_as_failing` and `..._browser_dimensions_run_over_the_same_ac_set_in_both_shapes` — authored, but **skipped/EPERM here**, see below.

One code edit: exported `conformanceL1HostDocument()` from `conformance/harness.ts` (13 lines, no behaviour change — `oneModulePage` now calls it so host-under-test and host-that-ships can't drift). Without it the seam-geometry claim was only observable through `serveOneModulePage`, which cannot run here.

**What I could not execute.** This worktree permits no socket binding at all — I probed it: `listen` returns `EPERM` for `0.0.0.0`, `127.0.0.1` and `::1` alike, so every path through `serveOneModulePage` dies in `cli/serve.ts:54`. I am not claiming the three remaining arms green by execution: two report `skipped` (no Chromium, via `it.runIf` — not the `if (!HAVE_CHROMIUM) return` anti-pattern), and one reaches the same EPERM as the pre-existing sibling, i.e. it fails at the socket rather than at an assertion. They need a runner with network permission and a provisioned engine.

File went 10 passed → **13 passed, 2 skipped, 2 EPERM**; `typecheck` and `lint` both clean. AC-1343, AC-1344 and STORY-85 set to `uat_coverage=pass`. Neither AC body was edited down to fit the tests.

Forwarded, not actioned: `.xgd/uat_index.json` has been empty for three cycles running — a tooling defect that wants its own ticket, outside the editor brief.
