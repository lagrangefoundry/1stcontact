---
uid: report-1bc4b808
id: REPORT-3722
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (story) — attempt
  8'
created_by: xgd
created_at: '2026-09-10T11:26:39.249188+00:00'
updated_at: '2026-09-10T11:26:39.249188+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: story
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (story)

**Attempt**: 8
**Fixes applied this call**: 1
**Violations remaining**: 0
**Needs more work**: false

REPORT-b9edb947 carried exactly one violation (finding 1) plus four `info` rows
requiring no action. The report was explicit that the repair is a one-row move and
that the rest of STORY-85's new section had been verified line by line against
`schema.ts:568-635` and `conformance/harness.ts:92-145`. I made that one edit and
did not rewrite the section.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-85 (`story-179b8c06`) | Removed the **orphan seam** row from the "Binding is validated, never best-effort" rejection table in *Where a behaviour sits on a page*, and recorded the same state as legal in the sentence that already lists legal states. |

### The edit, verbatim

Removed from the rejection table:

```
| **orphan seam** — a `slot` in the tree no module binds | the seam stays the inert placeholder (legal, but the mount is absent) |
```

The sentence following the table changed from:

```
Both empty is legal — that is the empty starter page.
```

to:

```
Both empty is legal — that is the empty starter page. So is an **orphan seam**: a
`slot` in the tree that no module binds is *not* rejected. It stays the inert
labelled placeholder — the mount is simply absent — and STORY-83 owns what it
emits in that state. The rule is one-directional: every module must name a live,
unique seam; a seam need not attract a module.
```

The five surviving rows, the "each of these is an error with a machine-readable
path" framing, the STORY-83 cross-reference and the entire `mountInL1` paragraph
are untouched.

## Verification

**Code re-checked before editing**, rather than taken from the report. Read
`packages/site-schema/src/schema.ts:560-640`. `pageSchema.superRefine` raises
issues for exactly the conditions the surviving table rows name:

| condition | site |
|---|---|
| `slot` with no `l1` | `schema.ts:566-576` |
| duplicate slot names in one document | `schema.ts:579-586` |
| unbound module (no `slot`) | `schema.ts:590-599` |
| dangling slot name | `schema.ts:601-610` |
| double-bound seam | `schema.ts:612-618` |

After the module loop it falls through — nothing iterates `available` minus
`bound`, so an unbound seam produces no issue. (There is also a duplicate
module-id check at `schema.ts:625-635`, which is not a slot-binding rejection and
the table correctly omits it.) The schema's own doc comment at `schema.ts:540-544`
enumerates four rejections and does not mention orphan. `grep -rn "orphan"` over
`packages/site-schema/src` and `packages/framework/src` returns no hit.

Per the report's "Notes for the Editor", I did **not** consult REQ-93's
"Implementation (delivered)" narrative — that appended line is the origin of the
error, and REQ-93's planning half plus the code agree against it.

**Cross-story consistency confirmed.** STORY-83's *What a `slot` emits* section
states the same legality positively ("With no mount supplied it is the inert
labelled placeholder … which is what this story owns and what the round-trip gate
sees", `story-d0a8cfad` body). The two stories now agree with each other and with
the emitter. Swept the other five stories in this capability (`story-46e3b3c7`,
`story-c490f1cf`, `story-2e4e2c45`, `story-d2b5cb1c`, `story-3569e1a4`) for the
same claim — no occurrence of "orphan" in any body, so no parallel edit was needed.

## Code Edits (if any)

None this call.

## Field mutations

None. `uat_coverage` on STORY-85 was left at its prior value (`fail`) — it is owned
by the UAT-coverage prompts, not by this one.

## needs_review Items Forwarded

None. The report recorded that nothing needed escalation, and the one violation was
resolvable from the code plus REQ-93's planning half without the operator.

## Forwarded to the AC-level cycle (unchanged, not a violation here)

- REPORT-3720's `ac-add`: "the page-level binding rejections and `mountInL1` have no
  acceptance criterion." That list is now correct at five rejections — an AC
  authored from STORY-85's table as it currently stands will no longer demand an
  orphan-seam rejection, which was the cascade this fix was meant to stop.
- Finding 5 (`info`, exclusivity): STORY-82 remains provenance rather than
  capability surface; duplication would bite at its ACs. Still deferred to the AC
  cycle.
