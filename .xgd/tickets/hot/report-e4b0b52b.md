---
uid: report-e4b0b52b
id: REPORT-4752
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T15:00:30.827947+00:00'
updated_at: '2026-09-21T15:00:30.827947+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` — **UU**, class 2e (intent/bookkeeping
  ticket under `.xgd/tickets/hot/request-*.md`; outside the sparse-checkout cone,
  so resolved via `git checkout --ours` + `git add --sparse` per DOC-986 §2/§4.1).

  Incoming commit `a61029bb` (2026-09-01 19:12:34Z, `last_field_updated: body`)
  is a purely **additive** body edit. HEAD (2026-09-19 15:15:30Z,
  `status: free_and_reconciled`, `completed_at: 2026-09-14`, `bundled_in:
  bundle-8e1807f6`) is a strictly later state of the same ticket that already
  contains every one of those additions, plus further refinement. Per 2e:
  each of the five conflicting hunks is a *per-fact* decision, and in every
  case HEAD is either a strict superset of incoming or the later-positioned
  intent on the same fact.

  Per-hunk:

  | Hunk | Fact | Resolution |
  |---|---|---|
  | frontmatter | `updated_at` / `status` / `completed_at` / `last_field_updated` | HEAD — later intent (09-19 `free_and_reconciled` vs 09-01 `draft`) |
  | `## Depends on` tail | status of the two REQ-112 dependencies | HEAD — same fact, later intent: incoming's *"Until they land, seeding and the delta channel are deliverable and search remains single-index"* is superseded by HEAD's *"The second is genuinely blocked and waits. The first is not, and is delivered here…"* (line 189), which records that the co-ranked fan-out has since been implemented |
  | `## Out of scope` → chat-summary bullet | scope of the AI-maintained summary | HEAD — strict superset: identical bullet plus the trailing *"[[REQ-171]] owns it, together with the session prompts and turn reminders…"* |
  | `## Acceptance` | acceptance criteria list | HEAD — strict superset: incoming's bullets all present, plus one more (*"A search reaching both knowledge bases returns one list ordered by the component's own scores…"*) |
  | `## Decided` | settled open questions | HEAD — strict superset: incoming's three `Decided` bullets all present, plus one more (*"A single oversized title is clipped, not dropped."*) |

  No BUG-1301 precedence exception was invoked; no test file touched; no
  content from either side was dropped except where the two sides state the
  **same fact** differently (the `## Depends on` tail), which 2e resolves to
  the later-positioned intent.

## Incoming changes preserved

Every block added by `a61029bb` is verified present in the resolved file:

| Incoming addition | Line in resolved file |
|---|---|
| *"Except that in the Worker it is not one yet…"* (`TicketSessionArchive` para) | 81 |
| *"The switch is a drop-in and not a port…"* | 90 |
| *"The cursor has a home with a lifetime that matches it."* | 97 |
| *"[[REQ-159]]'s `onTranscriptGrew` gets its caller."* | 102 |
| *"Tenancy stops being a convention."* | 104 |
| *"The costs are named rather than discovered…"* | 109 |
| `## Depends on` → *"And on the `knowledge` component, through lagrange-framework REQ-112…"* | 176 |
| *"Co-ranked search over independent per-KB indexes."* | 179 |
| *"The change-feed operation of piece 3"* | 186 |
| `## Out of scope` → *"The chat ticket's AI-maintained summary."* | 210 |
| `## Out of scope` → *"The audit trail."* | 218 |
| `## Out of scope` → *"Node's host."* | 221 |
| `## Acceptance` → chat-ticket / `session_id` bullet | 240–242 |
| `## Acceptance` → *"A resumed session's first turn reports what arrived while the client was away."* | 239 |
| `## Acceptance` → *"The session's cursor is a field on that ticket…"* | 243 |
| `## Decided` section heading | 247 |
| *"The cursor starts where the landscape's coverage ends"* | 251 |
| *"The cap is characters, ~400, and the count is always exact"* | 262 |
| *"Resumption needs no separate report."* | 267 |

Incoming's removal of the `## Open questions` section is also honoured — that
section is absent from the resolved file (both sides removed it).

The one incoming sentence not carried forward — *"Until they land, seeding and
the delta channel are deliverable and search remains single-index."* — is not a
dropped change: it is a **status assertion about the same fact** that HEAD
restates with later information (REQ-112's second dependency still blocked, the
first now delivered via the session's per-KB search fan-out). Keeping the 09-01
sentence alongside HEAD's 09-19 passage would leave the ticket self-contradictory.

## Staging state

`git status --porcelain` is empty: the conflict is resolved and staged, and the
staged tree is identical to HEAD (the incoming commit's content having already
landed in HEAD by a later path). `CHERRY_PICK_HEAD` (`a61029bb…`) is intact —
no `--continue`/`--skip`/`--quit`/`--abort` was run. The finalize step should
detect the clean staged diff and skip the commit.
