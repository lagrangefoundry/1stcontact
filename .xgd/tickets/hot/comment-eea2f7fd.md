---
uid: comment-eea2f7fd
id: COMMENT-759
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T16:08:16.386685+00:00'
updated_at: '2026-08-07T16:08:16.386685+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dfe14847
  kind: note
---

`cluster_id: "6"`, `report_kind: overlap_resolution`, and `subject_uid: report-17a279f7` are all set; the create call confirmed `Status: pass`.

## Cluster 6 resolved — both stories confirmed, no ticket changes

**Decision: C (Confirm) for both stories.** The overlap is acceptable — clean boundary, no duplicated behaviour.

| Story | Capability | Action |
|---|---|---|
| story-82eb6908 (STORY-76, gradients) | capability-aa030c83 (CAP-63, 1c Capture & Diff Fidelity) | confirm |
| story-c490f1cf (STORY-80, absolute values in L1) | capability-ae9d65d6 (CAP-70, Framework Substrate) | confirm |

**Why:**
- **Disjoint AC sets.** STORY-76's five ACs are about *gradients* — a composite directional multi-stop value: capture, comparison tolerances, and the resolver that authors it. STORY-80's six ACs are about *what form a single scalar may take* — hex literal vs. palette reference, dangling-reference validation, load-boundary resolution. No shared subject or verification.
- **The relation is consumption, not overlap.** AC-637 requires each gradient stop colour to resolve literal-or-role — STORY-76 *using* the value model STORY-80 owns. STORY-76's own Technical Context says exactly this.
- **Both capability bodies already agree.** CAP-63 explicitly claims gradients "captured … **authorable**, and diffed as a fidelity axis"; CAP-70 lists the `1c` capture/diff axes as out of scope. The authoring half is in CAP-63 deliberately, because the gradient value exists to close the loop the diff axis opened.
- **Rejected reassignment** (3 of 5 STORY-76 ACs are pure `values-diff` — moving the story would pull the capture spine out of the capture capability) and **rejected merge** (different behaviour, not duplicates).

**Verified:** every story belongs to exactly one capability, none skipped; no `capability_uid` changed and nothing archived, so all 11 AC relationships are preserved and no test needed renaming. All five STORY-76 ACs have live UAT coverage (`tests/reconcile-gradient-first-class.test.ts`, `tests/req62-gradient-panel.test.ts`).

**One thing I found but did not action** (recorded in the report): the survey's "L1 authorable value axis" phrasing points at a *supersession* question, not an overlap. The live L1 gradient axis (`l1GradientSchema`, panel fill, text-fill, REQ-103 radial) is in `packages/site-schema/src/l1/schema.ts` under CAP-70, while STORY-76's authoring ACs describe the module-era path (`resolveSurfaceGradient` in `packages/framework/src/modules/text-style.ts`) that CLAUDE.md flags as legacy being dismantled under REQ-96. Resolving that would mean splitting AC-637/638 into a different story — which this step's constraints forbid — so I flagged it for the next rebalance rather than acting on it.

Report: **REPORT-1580** (`report-dfe14847`).
