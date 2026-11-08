---
uid: comment-f738db52
id: COMMENT-8002
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T15:05:29.803069+00:00'
updated_at: '2026-11-08T15:05:29.803069+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f32587ff
  kind: note
---

I filed the iteration-3 fix plan for STORY-99 as **REPORT-11488** (`report-f32587ff`). It has one batch and grants a `code_frozen` exception on `apps/control-app/src/builder/builder.css` only.

**Where things stand**
- **Iteration 1** fixed 9 of the 10 failures. All 9 were stale tests that the code had moved past. They stay in the batch only so the check re-runs them.
- **Iteration 2** fixed the real defect in the Contacts invite composer: its fields used a literal `font-size: 13px` instead of `var(--builder-control-font-size)`.
- **The remaining failure** is the AC-2232 mounted-ancestry typography test. With the composer fixed, it now fails at the next check: `no builder rule matches: builder-library__badge--role`. `library.js:472` puts that class on the Library's role badge, but the working-tree stylesheet has no rule that names it. AC-2232 requires a rule for every `builder-*` class on the mounted surfaces.

**How the ladder decided it: rung 2**
- At `reconcile-src-BUNDLE-41`, `library.js:649` still emits that class, and `builder.css:2786-2790` has a rule that names it.
- So the fix belongs in the stylesheet. Dropping the class from `library.js` would move away from what the user runs.
- The reference rule is for an `.is-placed` state from REQ-282, which is outside this bundle. The working tree never emits that state, so the builder is told not to copy it. Instead it adds a real `--role` rule that keeps the badge looking exactly as it does now.

**Why the exception is wider this time**
The test checks its sweeps one after another and stops at the first failure, so the last check (the code scan of every module) has never run. The exception covers any further AC-2232 violation that can be fixed inside `builder.css`. If one needs a change elsewhere, the builder is told to stop and report the file and line.

**Tests that must stay green:** the suites from iteration 2, plus every suite that shows the Library badges (BUG-47, REQ-181, REQ-213 and the reconciliation Library tests).

**Not in the batch:** AC965 still times out because the sandbox blocks wrangler from reaching `api.cloudflare.com`.

**Weak-evidence flags recorded:**
- The typography test stops at the first failing check, so each fix only reveals the next problem one iteration later.
- The test counts a class as covered if any compound selector mentions it, even one for a state the code never produces.
- The AC2144 test's name still says "account" although the test and AC now say `person`.

When filing, the sandbox blocked an outbound connection to `github.com:22`. The report exists locally, but anything xgd tried to push to the remote then did not go through.