---
uid: comment-487e1c4b
id: COMMENT-2514
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T10:34:03.426283+00:00'
updated_at: '2026-09-10T10:34:03.426283+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-339c06fc
  kind: note
---

Attempt 4 complete. Report `report-339c06fc` (REPORT-3715) created.

## What I fixed — 5 mutations, all verified by running

**Finding 1 (AC-978)** — added the missing `/framework/` traversal group to the `trees` table, so the prefix the criterion names by name joins the shared `statuses` set. I also added a per-tree **liveness probe**: "no prefix lacks the confinement" is trivially true of a prefix that serves nothing, so without it the fix would have been self-defeating. All four trees now assert live-then-confined.

**Finding 6 (AC-1036, warning)** — dropped the three `etc/passwd` probes the criterion explicitly says are AC-978's, leaving the two in-channel probes it owns.

**Finding 4 (AC-1033)** — authored the missing two-workspace UAT. The AC's "same account identifier" premise is established from the shipped source (`TENANT_ID: 'local'`) rather than assumed, and both workspaces run the same slug so an account-keyed reuse collides. **Proven non-vacuous**: I temporarily replaced both reuse keys in `builder.ts` with an account-shaped constant and the test failed with exactly the AC's predicted message — the second workspace answered out of the first's reuse. Patch reverted; `git diff` on that file is empty.

**Finding 3 (AC-966)** — deleted the disk byte-comparison test the rewritten AC forbids and authored a correctly-aimed one in the mounted suite: a site seeded with a marker and **never rendered**, read through the address the pane is actually displaying, with the binding driven both ways. The stand-in detector matches the *rendered* placeholder rather than the raw slug (the raw slug also sits in every `<title>`, which broke my first attempt) and carries its own two-way non-vacuity check against untouched `alpha`.

Suites run: request-time-render 7/7, mounted 4/4, chrome 9/9, origin AC-978 ✓, plus the repo-wide naming guards 4/4. `WEBUI_INSTALLED` is true here, so the mounted half genuinely ran against real components.

## What I did not do, and why

**Findings 2 and 5 remain open.** Two reasons, both in the report: the validation report's own prescribed ordering puts them after the AC-966 repoint I did this call, and `unstable_dev` — the entry point both need — **times out in this sandbox**. I confirmed that's pre-existing by restoring the origin file to `HEAD` and re-running AC-964 alone; it times out identically on unmodified code. AC-964 and AC-965 were already failing here before I touched anything.

I did establish that the workerd pool *does* run here, and left a concrete design recommendation for AC-1401 next iteration: a shared declared route contract asserted by both doors, rather than `unstable_dev`, so the deployed leg actually runs instead of shipping as unrun assertions.

I did not write `uat_coverage` on any AC — that field belongs to check/fix_uat_coverage, and the validation report says explicitly nothing in this cycle should set it.
