---
uid: comment-c967cea0
id: COMMENT-1256
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T04:31:09.861715+00:00'
updated_at: '2026-08-20T04:31:09.861715+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6d2d7d31
  kind: note
---

Report created: **REPORT-2364** (`report-6d2d7d31`) — **FAIL**, 10 violations / 2 warnings / 0 needs_review.

## What this cycle found

This was the first `ac`-level check since attempts 7–10 rewrote the story bodies, and that's the whole story. The story-level sweep sucked BUNDLE-10 (BUG-15/16/22/24/25), REQ-73 and REQ-72 into STORY-75 and STORY-76 and now passes — but **no AC followed**. STORY-75 went from 11 to 15 Description items with its AC count frozen at 14; STORY-76 gained item 3 with its count frozen at 5.

**Six coverage violations on STORY-75**, each verified live at HEAD rather than inherited:

| Body item | Evidence it ships | AC |
|---|---|---|
| Per-text-node run geometry (BUG-25) | `extract.ts:666,1101` | none |
| Surface-bearing box (BUG-22) | `extract.ts:23-29,852-863,1179` | none |
| Capture-time font settling (BUG-16) | `extract.ts:369,389-395,1152` | none |
| All-collapse band fallback (BUG-15) | `extract.ts:469,1391` | none |
| Modern-syntax scrim probe (BUG-24) | `extract.ts:265,1055` | unpinned by AC-816 |
| Adjacent-gap axis + padding retirement (REQ-73) | `fidelity.ts:301,386,417,459` | none |

**Four on STORY-76**, two of them now unrepaired for a **fifth consecutive cycle**: the surface-gradient capture-selection rule (`extract.ts:840`), and AC-638 still advertising a palette-role alias as *accepted* when REQ-114 retired it and `validateGradient` → `validateColor` is hex-only (`validate.ts:130-134`, `:101-107`).

I re-derived the AC-638 code claim independently rather than trusting the prior report — worth doing, because `validate.ts:131` and `:167` still carry "hex/role" prose comments that contradict the code they annotate. That's likely why the AC has survived five cycles. Those comments are production code, not matrix elements, so I flagged them in the notes rather than as findings.

Two things I'd flag for you specifically:

- **Finding 9 will regenerate** unless the STORY-76 body is edited in the same pass as AC-638 — the stale alias clause lives in both, and four prior cycles edited neither.
- **Finding 10 has a legitimate fork.** `resolveSurfaceGradient` is live exported code with *zero* production callers. I classified it `ac-add` because both the story's In-scope line and the capability body deliberately retain it — but retiring it via `story-body-edit` is equally defensible. That's a scope call above this level, so I surfaced it rather than deciding it.

STORY-77, STORY-78 and STORY-116 are clean; I re-derived each from its body rather than carrying forward the prior verdict. STORY-116 is the instructive counter-example — the one story from the 2026-08-19 sweep where ACs were authored alongside the body, and the one with no gap.

One operational note: the ticket store's `git push` failed (`Broken pipe` to the remote). The report committed locally and is readable, but it hasn't reached the remote.
