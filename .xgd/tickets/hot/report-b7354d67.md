---
uid: report-b7354d67
id: REPORT-2300
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (story) — attempt 7'
created_by: xgd
created_at: '2026-08-20T01:34:46.595385+00:00'
updated_at: '2026-08-20T01:34:46.595385+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: story
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (story)

**Attempt**: 7
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

All three violations and both warnings from report-b2da2ab0 are addressed. They
were one pattern, as the assessor's notes said: STORY-99's body was exhaustive
about what the workspace *shows* and thin about what its origin *answers*. Every
repair lifts wording the capability body (CAP-85) already declares, so no new
intent was invented.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit (finding 1) | STORY-99 (`story-e674c60a`) | Added in-scope bullet **"The origin carries the write path's operations, and adds no semantics to them"** — read/apply reachable over this origin, handed to the same operations the command line dispatches to, answer returned unchanged; a refused edit arrives as the write path's own refusal carrying its reason, path and hint rather than a server failure; the gesture's client bytes are served from here, produced from the same source the renderer is built from so page code and markup cannot drift. Mirrors CAP-85's "thin transport that adds no semantics of its own" |
| 2 | story-body-edit (finding 1) | STORY-99 out-of-scope | Narrowed "Editing of any kind" → **"Edit semantics and the editing gesture"**: what the write path validates/writes/refuses (and what a refusal carries) stays out; this story owns only that those operations are reachable over the origin as a transport that changes none of it, and that the gesture's bytes are served from here. Previously the bullet excluded the transport instead of carving it in |
| 3 | story-body-edit (finding 2) | STORY-99, "One tab, filling the window" | Extended with the tab-declaration pass-through REQ-117 fixed: a tab is declared once and whole, every declared option reaches the chrome intact (filling the window being one of them), a mounting step that rebuilds a tab from only the properties it knows discards the rest without a word, and adding an option requires no change to the mounting step — a silently narrowed tab declaration is the failure this prevents. Gives AC-976 its supporting sentence |
| 4 | story-body-edit (finding 3) | STORY-99, origin bullets | Added in-scope bullet **"The two ways the origin can fail to answer are told apart"** — unconfigured names the command that starts the origin, unreachable names the address tried, neither a blank page nor a success. Written about *the origin's failure to answer*, per the assessor's ordering note, not about a proxy, so REQ-145's reconcile need not unpick it. Gives AC-965 its supporting sentence |
| 5 | story-body-edit (finding 5) | STORY-99, "Confinement" | Extended: a request naming something the origin does not serve at all — a channel that is not one of the site's, a page or site the store does not hold, a component the workspace does not consume — is answered as not found, never from a neighbour and never as a success carrying unrelated content. Covers AC-979 and AC-1036, which the escaping-only wording left unsupported |
| 6 | story-body-edit (metadata, finding 4) | STORY-99 `fields.updated_by` | Now `["bug-ede1fb8c", "bug-5cabb340", "bundle-e59210c5"]` — records BUG-32 (scope rename) and BUNDLE-17 (REQ-119 + REQ-122). Written as a **list**, matching `ticket_types.yaml` (`updated_by: type: list`); an interim comma-string value was corrected in the same call |

Supporting Technical Context paragraph added beside the existing Node-origin
paragraph: the edit seam calls the same two functions the command line's copy
commands dispatch to (one implementation of what an edit means), a refusal is
returned as a request-level refusal carrying the reason object those functions
produce, and the client bridge is derived from the renderer's source rather than
kept as a parallel hand-written file. It is explicitly flagged as mechanism that
moves with the origin into the edge runtime, so finding 7's REQ-145 note holds:
the criteria are about what the origin answers, not how.

## Code Edits (if any)

None this call. All mutations are ticket-body / ticket-field edits via
`xgd ticket update`; no production or test code touched, and no AC status
changed (findings 3 and 5 needed story-body support only — AC-965 and AC-979
already exist and pass).

## Verification

- Body re-read from the ticket store after write (24,431 chars, up from 20,603);
  the five new passages are present exactly once each.
- `fields.updated_by` re-read as a three-element list.
- No test run was warranted: no AC was added, deprecated or re-worded, and no
  UAT's subject changed.

## Carried Forward (not this level)

- **finding 1 → `ac-add` at level=ac** (the assessor's own downstream note): no AC
  asserts the transport's defining properties — that it adds no semantics, that a
  refusal carries the write path's own `code`/`path`/`hint` rather than a generic
  failure, and that the served bridge is derived from the renderer's source. Today
  those routes appear in the AC tree only inside AC-977's cache-header sweep. The
  story body now states all three, so the ac-level cycle has the text to write
  against.
- **finding 7 (info)**: REQ-145 retires the Node origin, the verbatim front and
  the type-stripped `/framework` route. Not landed on this branch
  (`apps/control-app/src/index.ts:31-52` still holds the proxy;
  `tools/generate/src/cli/builder.ts` still serves `/api/copy` and the
  type-stripped bridge), so no repair is due — and the new paragraphs are worded
  so REQ-145's reconcile moves mechanism, not criteria.

## needs_review Items Forwarded

None. No finding in report-b2da2ab0 was categorized `needs_review`.
