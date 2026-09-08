---
uid: bug-99e6d76b
id: BUG-65
type: bug
title: Priming hardwires system-KB document ids; corpus membership must come from
  the build
created_by: CHAT-44
created_at: '2026-09-08T22:01:47.769621+00:00'
updated_at: '2026-09-08T22:01:47.769621+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

# Priming hardwires three system-KB document ids; one of them is no longer in the corpus

## Symptom

`tools/generate/src/cli/ai/priming.json`, entry `purpose`, tells every builder
session:

> You advise a client on their website and build it with them. Your method is
> written down and you are expected to read it before you start: **the
> consultation playbook (DOC-33)** for how a consultation runs, **personas, modes
> and registers (DOC-35)** for who you are talking to and how to pitch it, and
> **the differentiation audit (DOC-31)** for what separates work worth paying for
> from a template. …

As of [[CHAT-44]], `DOC-31` carries `doc_kind: architecture` and is therefore no
longer exported into the shipped corpus. **The priming now instructs every
session to read a document it cannot open.** There is no error and no warning:
the search returns nothing and the session proceeds without the material it was
told was mandatory.

## Root cause

The entry enumerates corpus members by id, in hand-authored prose, in a file
nobody touches when membership changes. Membership is decided at build time by
`doc_kind: system_kb` ([[DOC-39]] §3.3); this list is a second, unsynchronised
answer to the same question.

`kb.ts` already rejects exactly this shape for membership itself, for exactly
this reason:

> The kind lives on the TICKET rather than in a list in the KB declaration
> because it is a fact about the document and has to move with it — **an id list
> drifts silently when a document is renamed or retired.**

The enumeration also creates a two-tier corpus. Three documents are named in
priming; every other member — including all six authored in [[CHAT-44]] — is
discoverable only through the awareness map. Nothing about those three makes
them structurally more important, and a member added tomorrow is invisible to
this entry forever.

**This is not a stuffing bug.** No document body reaches the session: the
`km.landscape` and `km.mechanism` providers carry the map and the search
instructions, and the shared component's contract is explicit that neither
carries a document body. The defect is the hand-maintained id list sitting
between them.

### Why it looked necessary

`kb/system/awareness.md` is stale — dated 2026-08-31, describing four documents
in two territories, with no mention of the `REF-l1`, `REF-surface` or
`REF-behaviors` projections although all seven are in the index manifest. The
map the enumeration compensates for has not been rebuilt since the corpus
changed. **Rebuilding the map removes the reason the hardcoding appeared to
earn its place.**

## Required behaviour

**The `purpose` entry must name no document, of any kind, by id or by title.**

What it must keep saying is the *obligation*, which the map genuinely cannot
carry: that the assistant's method is written down, that it is expected to read
it before starting rather than improvise, and that the client's own corpus is the
other half of what it searches. That is a behavioural instruction, not a
discovery mechanism, and it belongs in authored priming.

What tells a session *which* documents exist is the awareness map, rendered by
the `km.landscape` provider and rebuilt by `1c kb build`. **Corpus membership
must reach the session only through the build.**

Consequences that follow, and each must hold:

- Adding a system-KB document makes it discoverable with no edit to
  `priming.json`.
- Demoting one removes it from the session's view with no edit to
  `priming.json`.
- Renaming or retitling one breaks nothing.
- No file outside the build enumerates corpus members.

## Scope

- `tools/generate/src/cli/ai/priming.json` — rewrite the `purpose` entry's text.
  Prose in a data file; per that file's own header, changing what the assistant
  is told needs no change to any `.ts`.
- Rebuild the awareness map and the shipped index (`1c kb build`), then
  `1c assets`, so the map the provider reads describes the current eight
  authored documents plus three projections rather than the four it describes
  today.

## Verification

- Grep `priming.json` for `DOC-` and for the words "playbook", "personas",
  "differentiation audit": no matches.
- A session's assembled priming names no document id.
- `kb/system/awareness.md` describes the current corpus, including the `REF-*`
  projections.
- Assembled priming stays under `MAX_PRIMING_CHARS` (60,000). It is about 16,000
  today; the landscape is the part that grows, and the corpus roughly triples.

## Related

[[DOC-39]] §3.3, §4, §5 · [[CHAT-44]] (the corpus this surfaced from) ·
[[DOC-46]]–[[DOC-51]] (the six documents the current entry cannot see)
