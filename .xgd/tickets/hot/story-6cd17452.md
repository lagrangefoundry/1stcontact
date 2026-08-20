---
uid: story-6cd17452
id: STORY-115
type: story
title: 'Draft change journal: know what changed since you last looked, without re-reading
  the site'
created_by: xgd
created_at: '2026-08-20T02:25:25.761224+00:00'
updated_at: '2026-08-20T02:46:12.200469+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-77b28def
  capability_uid: capability-702b7c02
  story_kind: feature
  story_points: 3
---

## Story

**As a** site owner who edits my own draft directly on the page — including between two turns of the assistant's conversation — **I want** the assistant to be told that the site moved under it and to be able to read exactly what moved, cheaply, **so that** it never silently reverts an edit I just made, and I never have to stop using the editor to protect my own work.

The same question is asked by the operator from the command line, of one implementation.

## Description

The draft is a shared mutable working copy with three writers — the client's page editor, the assistant, and the operator's own tooling — and until now the assistant's picture of a page was **stale by default** with no cheap way to find out. The only correct move was to re-read the whole page before acting; on a real page that is 73 segments, and doing it defensively on every turn of a multi-hour session is not affordable. So in practice it would not be done, and the assistant would "improve" a section the client had just reworded and silently revert them — a failure a client does not report as a bug, they simply stop touching the editor, and the cheapest channel in the product goes dark.

This story provides the mechanism that closes that hole, at three costs:

| Question | What it costs | How it is answered |
|---|---|---|
| Has anything changed since I last looked? | nothing, no call at all | pushed into the assistant's per-turn reminder |
| What changed? | proportional to *the change* | one read of the change log |
| What is the page now? | proportional to *the page* | the existing full reads — fallback only |

**In scope**

- A **monotone per-site change count**. Every mutating operation on the single write path — whichever caller drives it — returns the count it produced. A caller that holds the count from its last write therefore has a baseline that advances as it writes, so any gap between that baseline and the current count is *by construction* somebody else's work. No actor filtering is needed anywhere; the arithmetic does it.
- **Self-describing records**, because addresses are not durable. An address into a page is render-scoped: valid only for the render that minted it, and worthless once structure has moved. So every record carries a human-readable label for the thing that changed and, where the change was textual, the text before and after — bounded, so one enormous paste cannot make the log expensive to read. It also carries the count it produced, when it happened, who did it (assistant, client, or the operator's own tools), the operation, and the page it happened on.
- **A bounded window** that degrades gracefully. A baseline older than the retained window is answered with whatever remains plus a truncation flag, and the caller falls back to a full read. There is no correctness cliff.
- **A read for both callers.** The assistant reads it as a declared read operation in the group it is already granted, marked as third-party content. The operator reads the same log from the command line, in human and machine-readable form. One implementation, so the two cannot come to disagree.
- **The push signal.** The host compares the count across turn boundaries and, when it moved, says so in the per-turn reminder — which is re-applied every turn and never enters the transcript. In the common case (nothing changed) the whole mechanism costs nothing.

**Out of scope**

- **Undo.** The log makes it thinkable; that is not a reason to build it here. What a thing said before is on record, so the assistant no longer has to narrate old values into the conversation to keep them recoverable — but there is no undo operation.
- **Any change to the revisions model.** This is explicitly *not* a revision: no revision id, no publish-history entry, no participation in publish or checkout.
- **Surfacing the log to the client** in the builder UI. A revision-diff display mode is its own piece of work.
- **Divergence detection against the ledger.** This makes it cheap; it does not implement it.
- **`status`**, which answers a different question — the draft against the last *published* revision, file-level, with no ordering, no actor and no before/after.

## Technical Context

- **Instrumenting one chokepoint.** The single validated, atomic write path (CAP-86) is the one place all three writers pass through, and it already carries a structured, validated change vocabulary — so this persists something that already flows through it rather than inventing a representation. The count is part of that write surface's contract: **every** write hands it back, including the two whose answers are shaped as an asset rather than as a change. Omitting it there would have been defensible on shape grounds and wrong on behaviour grounds — a session whose last write was an upload would hold a baseline that never advanced and would be told next turn that its own upload was somebody else's work, which is exactly the false alarm the count exists to make impossible.
- **Records are written at the *return* of a mutating command, never before the write.** That is what makes "a refused write appends nothing" true without a transaction: every write on this surface validates the whole resulting definition and throws on refusal, so reaching the record means the bytes have already landed.
- **Divergence from the intent, recorded not absorbed.** The intent says a record is appended *"transactionally with the write it describes"*. As built there is no transaction: recording happens after the write, and a store that cannot take the record leaves the count where it was rather than failing the edit. The failure mode is therefore a *stale* count, not a lost edit — and a stale count over-reports (the caller is later told about its own write) rather than under-reporting, which is the safe direction. Recorded here so regression can see it; a journal is not worth losing an operator's work over, which is the reason it was built this way.
- **Degradation, never failure.** An unreadable or malformed record store reads as empty. A corrupt log must degrade to "I cannot tell you what changed" and never to "your edit failed". Correctness never depends on the log existing — the fallback is the same full re-read an over-old baseline already takes.
- **Where it is kept is deliberately outside the draft** and is not version-controlled: a record of every copy edit would churn the tracked tree on every keystroke-settle, and it must never be captured by a publish snapshot or perturb the draft's byte-identity. Losing it costs a re-read and nothing else.
- **The label comes from the same derived segment model the editor uses for its outlines**, rather than a second derivation that could disagree with it. The record's one-line summary is the command's own human line, so a change reads the same way to the person who made it and to whoever finds it later.
- **A count is a value the host may legitimately hold across turns**, unlike an address. The difference is that staleness here is *detectable* — a baseline that has fallen behind produces a signal, which is the correct outcome — whereas a stale address produces a write landing somewhere nobody chose.
- **The baseline is recorded after the turn, not before it**, so the assistant's own writes are absorbed rather than reported back to it, and an abandoned turn leaves no stale baseline behind.
- **Pinned decisions** the intent left open: the count is **per-site** (matches "has anything changed"); the window is **500 records** with **300 characters** per text value, sized so a whole consultation session never truncates in practice; actor attribution ships, defaulting to the operator's own tools for an unattributed caller — nothing about *detecting* a change depends on it, so a caller that forgets it produces a less informative record and never a wrong answer.
- Related: CAP-86 (the write path this instruments), CAP-90 / CAP-92 (the assistant's session and its declared, granted, audited control surface), CAP-87 (the client-side gesture whose edits are the thing being detected).

## Dependencies

None.

## Story Points

3