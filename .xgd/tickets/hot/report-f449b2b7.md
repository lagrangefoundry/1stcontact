---
uid: report-f449b2b7
id: REPORT-4235
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-14T05:24:24.901498+00:00'
updated_at: '2026-09-14T05:24:24.901498+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-8e1807f6
  plan_item_index: '3'
---

All mutations applied and verified. No runtime code was touched (`git status` shows only xgd's own change log).

**Scope**
- In scope for change: `story-e15a19ef` (STORY-79), `AC-1013`, `AC-1017`, plus one new AC on that same story.
- Explicitly out of scope and unchanged: STORY-79's other thirteen ACs (AC-656/657/658/659/720/738/739/1014/1015/1016/1415/1416/1417), and every other story. No new story ticket was created.

**What the code actually does** (`tools/generate/src/cli/preflight.ts:69-77`): `COMMAND_DEPS` is seven verbs — `capture`, `shot`, `values-diff`, `adopt-gaps`, `diff`, `gate`, `aligned-crops` — every one naming `playwright` alone. `crop` carries no entry. `sharp` is absent from `tools/generate/package.json` and from every source file under `tools/generate/src`. `1c preflight`'s declared list is derived from that same map (`index.ts:542`), so it no longer names an imaging package. Both re-pinned suites assert the seven-verb set as a whole and that `crop` is refused on no tree.

**One code-issue flagged, not encoded as an AC.** The CLI's own `USAGE` text (`tools/generate/src/cli/index.ts:475-483`) still lists `crop` among the commands that check the installed tree. REQ-156 says plainly that "`crop` leaves the preflight map … the entry goes rather than emptying," and the shipped map agrees — so the help text contradicts both intent and behaviour, telling an operator a verb is gated when it is not. Nothing pins that string today. Per the chain of authority the criteria record the intent; this is recorded in Technical Context for `fix_uat_coverage`.

```
Upgrade mutations applied for plan item 3 of 10

Target Stories: story-e15a19ef
Primary Story UID: story-e15a19ef
Stories Modified: 1
ACs Modified: 2
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-e15a19ef"
  acceptance_criteria:
    modified: ["acceptance_criterion-0b79f27e", "acceptance_criterion-a465080d"]
    added: ["acceptance_criterion-2cadf6cf"]
    removed: []

Progress: 3 of 10 plan items complete
```
