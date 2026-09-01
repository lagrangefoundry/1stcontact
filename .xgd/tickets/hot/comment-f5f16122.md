---
uid: comment-f5f16122
id: COMMENT-2021
type: comment
title: Comment on request REQ-160
created_by: xgd
created_at: '2026-09-01T18:30:41.623877+00:00'
updated_at: '2026-09-01T18:35:06.781807+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bbff35c7
  kind: chat_transcript
---

<!-- xgd-turn id="03d075c5-9f15-427a-91d2-11324833f734-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T18:30:17.129454+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="03d075c5-9f15-427a-91d2-11324833f734-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T18:35:06.453594+00:00" -->
#### Claude
I've read the ticket, DOC-39 §5–§6, and the code REQ-158/REQ-159 landed. Here's where things stand and what I need from you.

**What's already there:** `primeSession` already loops every visible KB into one `# What exists` section, so "both maps, one landscape" is a wiring job, not new assembly. `role.reminder` is re-read every turn (REQ-131's change signal), so the delta channel has its delivery mechanism. `resolveCorpus(store, kb, {since})` is literally the change feed. Good.

**What isn't:** `chatHost` opens `systemKnowledge(env)` only — the project KB is reached solely by the material-ingestion route, so nothing in a session sees it today. I'm assuming REQ-160 owns that wiring; the ticket's piece 1 is impossible otherwise.

Five questions, each with a recommendation. Say "go" and I'll proceed on all five as recommended.

**1. Co-ranked search across two indexes.** `search()` takes one `IndexSource`; the system index is bundle-resident, the project index is in R2. "Ranked together" needs them joined. I'd build a **composite `IndexSource`** in `apps/control-app` — concatenate embeddings and metadata, merge manifests, assert the two `model_info` agree — and hand it to a single `KnowledgeRuntime` holding both KBs and both stores via `sources`. Ranking, the `document` scope axis, and `get`'s store routing then all work unchanged and the co-ranking is genuine rather than two result lists stapled together. The alternative (fan out, merge, re-sort) re-implements ranking outside the component. **Composite?**

**2. Freshness, which the headline acceptance test depends on.** The chat host is built once per isolate; the project index changes mid-session on upload. If the composite is snapshotted at isolate start, "upload mid-session → next turn the AI can answer from it" fails. I'd memoise the decoded **system** half per isolate (immutable, expensive) and re-read the tenant's project half **per turn** (small). **Confirm — or accept next-isolate freshness, which fails the criterion that the ticket calls the one that matters.**

**3. Where the change-feed operation is declared.** `knowledge_surface.json` lives upstream in `@lagrangefoundry/ai-knowledge`; I can't land changes there from this session. `KnowledgeToolbox` accepts a `declarationOverride`, so I can extend the declaration in this repo and subclass — the operation still gets argument validation, the capability grant, untrusted marking, the audit trail and the projected manual, which is everything the ticket asks of it. **Local override now, or hold the operation for an upstream ticket and land REQ-160 without it?** I recommend the local override.

**4. Where the session cursor lives.** The ticket says "the session is a ticket, so it already has somewhere to keep one" — but in the Worker sessions are *not* tickets: `ai.ts` uses `R2TranscriptArchive` (`chat/<tenant>/<id>.md`), nothing constructs a `chat` ticket, and that's why REQ-159's `onTranscriptGrew` still has no caller. Options: **(a)** keep the cursor beside the index in R2, exactly as REQ-159 keeps `transcripts.json` — small, precedented, no new lifecycle; **(b)** switch the Worker to `TicketSessionArchive` so sessions become `chat` tickets, which also makes transcripts corpus members and gives `onTranscriptGrew` its caller. (b) is the DOC-10 §8 end state but drags in transcript migration and the chat-body-as-ledger question — materially more than 8 points. **I recommend (a) here and a separate ticket for (b)** — but that leaves the project corpus with no `chat` members, so tell me if you'd rather I file that follow-up ticket now.

**5. Scope confirmation.** I'm reading REQ-160 as also owning "wire `projectKnowledgeFor` into the chat host". Correct?

Two of your open questions I don't think need asking — DOC-39 already settles them, and I'll follow it unless you say otherwise: the cap is **characters (≤400) with the document count always exact** and titles truncated (§6.4), and the cursor initialises to **the awareness map's build timestamp**, not session start (§6.3), so resume needs no separate "while you were away" report — the delta covers the gap by construction, which is how your resumed-session acceptance criterion gets met.

<!-- xgd-chat-end -->