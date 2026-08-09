---
uid: comment-0891bc1f
id: COMMENT-885
type: comment
title: Comment on request REQ-127
created_by: xgd
created_at: '2026-08-09T19:38:24.459438+00:00'
updated_at: '2026-08-09T20:07:13.833741+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-22a6521a
  kind: chat_transcript
---

<!-- xgd-turn id="c1a4f8a8-3f92-4d9d-9e79-cb41d3dea99f-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T19:38:19.952441+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="c1a4f8a8-3f92-4d9d-9e79-cb41d3dea99f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T19:41:10.121531+00:00" -->
#### Claude
I'll start by reading the ticket.

Let me investigate the current state.

Let me verify the delivered state is green before reporting.

I did the legwork before touching anything. Here's what I found.

## REQ-127's scope has already landed — under REQ-126

Commit `02a9af066` ("declare the L1 control surface as a Toolbox surface", owned by REQ-126, status `free_coded`) delivered essentially all of REQ-127's body:

| REQ-127 requirement | State |
|---|---|
| AI reaches the site through operations selected from the declared L1 API | ✅ `ai/l1-surface.json` — 16 ops, param types, 10 return shapes, 6 error codes, groups, sequences, absences |
| …under a declared policy | ✅ `ai/instances.json` — `caretaker` granted `ReadSite`, `WriteCopy`, `ManagePages`, `WriteConfig` |
| …bound to an in-process call type | ✅ `call_type: inproc`, `L1Toolbox` over `edit.ts` in-process |
| Config carries selection/policy/binding only, no prose | ✅ `instances.json` is 5 lines; every sentence projects from the declaration |
| `declare.ts` deleted | ✅ deleted — and so was `tools.ts` entirely |
| `tools.ts` reduced to declaration + config | ✅ superseded: `host.ts` builds tools from `box.schemas()`, no hand-written `Tool` bodies, no local manual renderer |
| Read/write split becomes **enforced** classification | ✅ `effect: read\|write` per op, gated by the Toolbox at projection and dispatch |
| **Site binding becomes a declared scope predicate** | ❌ **not done — deliberately** |

Nothing references `declare.ts`, `ERROR_MEANINGS`, `toolSpecs`, `renderManual`, `ToolDeclaration` or `builderTools` anywhere in the tree. Both AI suites are green (19 tests).

## The one open item is a decision, not a gap

REQ-126 kept the construction-time slug binding on purpose, and DOC-30 argues that's the *stronger* posture: no operation declares a `slug` parameter at all, so the model cannot address another site because there is no hole to fill. A scope predicate refuses a bad value; an absent parameter has no bad value to refuse. DOC-30's recommendation is **option 3** — extend the upstream Toolbox vocabulary with construction-scoped bindings so the existing guarantee becomes *declarable* — with option 2 (what shipped) as the interim, and it explicitly warns that option 1 "trades a real safety property for a declarative one and should not be adopted just to fit the current field set."

REQ-126's commit message records this was raised upstream.

## What I'd recommend

**Close REQ-127 as delivered by REQ-126**, and let the residual live upstream as the lagrange-framework finding it already is. Free-coding the scope predicate locally would mean adding a `slug` parameter the model must get right on every call — re-opening an error class REQ-122 removed for free, and contradicting our own design record.

I haven't changed the ticket or any code. Tell me which you want:

1. **Close it** — I'll update REQ-127's body to record that REQ-126 absorbed it, cite the commit, and note the scope-axis residual with its upstream pointer. No code, no commit.
2. **Build the scope axis anyway** — I'll do it, but I want the explicit call given the above.
3. **Something else you had in mind for this ticket** that isn't in the body yet — the body reads as pre-REQ-126 planning, so it's plausible your intent has moved on.

<!-- xgd-turn id="279b2250-2790-49ce-ba53-4bed8255ec03-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T20:06:51.946413+00:00" -->
#### You
There's something I don't understand here. It feels to me like the slug should be completely outside of the scope of what's going on here. Each site gets a chat window with its own session. The session is initialized to recognize that it is attached to that site. The chat window does not need to know anything about the sites. It's given a session and it's first contact job to trigger that session creation appropriately. No?

<!-- xgd-turn id="279b2250-2790-49ce-ba53-4bed8255ec03-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T20:07:13.703226+00:00" -->
#### Claude
Let me look at the actual wiring between the panel and the host before I answer.

<!-- xgd-chat-end -->