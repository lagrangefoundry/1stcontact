---
uid: comment-cc515b66
id: COMMENT-787
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T18:50:50.138697+00:00'
updated_at: '2026-08-07T18:50:50.138697+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-40ee51cb
  kind: note
---

**Result: FAIL** — 1 violation, 0 warnings, 0 needs_review. Report: **REPORT-1607** (`report-40ee51cb`).

## What I found

**CAP-88 holds zero stories.** Its only story, STORY-102, was reassigned to CAP-89 during this run's consolidation — commit `4d47c96f2` at 08:26:44, seven seconds after CAP-89 was created in `ec6256a06`. CAP-88 is still `status: active` with **no `merged_into`**: an active capability asserting a scope it carries no story, AC or UAT for, while CAP-89's `### The site asset store` section restates that scope point for point and evidences it.

So the intent is not missing from the matrix — REQ-118 (`free_and_reconciled`, merged `b2b9208c`) is fully expressed under CAP-89/STORY-102, which REPORT-1599 already validated as PASS. The drift is that the consolidation moved the stories but never retired the emptied capabilities.

**The repair is retirement, not a new story.** I flagged this prominently in the report, because a naive read of a coverage violation would have an editor author an asset-store story under CAP-88 — recreating exactly the duplication the consolidation removed. The correct edit is the shape this project already used for CAP-64/65/66/67/68/69/72/73: `merged_into: capability-b4ac88fc` + `status: deprecated`. The category vocabulary in this check has no `capability-deprecate` shape, so I tagged it `story-body-edit` and spelled out the real action.

## Two things worth your attention

**This is one defect five times over.** CAP-81, CAP-80, CAP-83 and CAP-84 are in the identical state (per REPORT-1574's clusters 1–5). Repairing CAP-88 alone means the same finding resurfaces four more times, one capability per run. Two of them carry an extra loss a bare deprecation would make permanent: CAP-83 holds a CAP-70 boundary statement CAP-89 doesn't carry, and CAP-84 is still cited as a live owner in STORY-99 and STORY-101's prose. CAP-88 itself is clean on that count — CAP-89 preserves its substance.

**The canonical ticket index is stale, and it shaped this run's scope.** Filtering on either capability returns STORY-102, contradicting the ticket's own field; I reproduced it with a control query (`capability-deadbeef` → nothing), so the filter isn't leaky — it's residue from the reassignment. That's why a capability with zero real stories got scheduled for story-level validation at all, and it means the overlap survey can manufacture phantom overlaps from its own inputs. I couldn't fix it: `xgd ticket rebuild-index` refuses to run from a branch worktree by design, and `--branch main` would mutate the canonical store from a regression worktree. **It needs a rebuild from `xgd-working`.** REPORT-1576 raised this too and it remains unfixed.

I stayed read-only — no tickets, tests or code modified — and verified every claim against `xgd ticket get --json` and git history rather than the `--filter` surface known to be stale.
