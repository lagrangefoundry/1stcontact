---
uid: request-43ce519b
id: REQ-174
type: request
title: 'Rename the assistant role: caretaker -> consultant'
created_by: xgd
created_at: '2026-09-02T20:48:27.159106+00:00'
updated_at: '2026-09-02T22:59:57.250928+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6a65b0c6
  commits:
  - working_sha: ada55fd3364b15ea3a102ec38f40a405aa619cdf
    reconcile_sha: null
    main_sha: null
  version: 0.2.46
---

# Rename the assistant role: caretaker -> consultant

## Why

The role the client talks to is named `caretaker` throughout the code, the
system prompt, the role grant and the tests. The word is wrong for what the
role does and wrong for what we sell.

A caretaker maintains something that already exists and is not expected to
have a view. What this role actually does is take a client from nothing to a
live site, form judgements about their brand, argue for a layout, and say when
a request would make the site worse. [[DOC-33]] already calls that work *"The
Consultation Playbook"* and the sessions in it read as consultation, not
custody. The vocabulary should match the job.

This matters beyond taste. The role name is in the system prompt the model
reads about itself, and a model told it is a caretaker will behave more
passively than one told it is a consultant. The observed session behind
[[CHAT-35]] shows exactly that failure register: the assistant centred every
block of text on the page, and when challenged said *"I was building quickly
and didn't stop to think about it."* It also declined to raise the image-role
question with the client until asked. A consultant leads; a caretaker waits to
be told.

## What changes

Rename the role and every symbol, string and document that carries the old
word. There are ~122 occurrences outside the ticket store:

- `tools/generate/src/cli/ai/roles.ts` — `CARETAKER_SYSTEM`, `CARETAKER_PURPOSE`,
  `caretakerReminder`, `CARETAKER_ROLE = 'caretaker'`
- `tools/generate/src/cli/ai/instances.json` — the `caretaker` instance key
- `tools/generate/src/cli/ai/host.ts`, `host-core.ts`, `toolbox.ts`, `toolbox-core.ts`
- `apps/control-app/src/ai.ts`
- the UAT and reconciliation suites that name the role
- [[DOC-33]] (four occurrences in prose)

The prose the client-facing system prompt uses changes with it: *"You are the
caretaker of a website your user owns"* becomes the consultant framing. This is
not a mechanical find-and-replace on that sentence — the surrounding paragraph
describes a custodial posture and should be rewritten to describe an advisory
one, while keeping the existing constraint language about the closed vocabulary
intact.

Concretely, the rewritten preamble must tell the assistant to form a view and
state it, to say so when what the client has asked for would make the site
worse, and never to build past an open question and leave it unmade — the three
things the observed session did not do. The closed-vocabulary paragraph (no
HTML, CSS or JavaScript; a malformed change is refused whole) is unchanged, and
"user" becomes "client" throughout, because that is the relationship the word
consultant describes.

Two strings beyond the preamble carry the same register and change with it: the
per-turn reminder, and `CARETAKER_PURPOSE` — the sentence that primes knowledge
retrieval with what the role is for, which said the role "looks after" a
website. The role name is also the KEY of the grant in `instances.json`, so the
rename has to move that key or no session can construct a Toolbox at all.

The rename must leave nothing behind. A straggler in a comment, a test helper or
a JSON key is how a rename half-happens and then rots, so a guard scans the
working tree for the old word and allows it in exactly one file: the declaration
of the compatibility alias below. `kb/` and the inlined copy under `generated/`
are excluded — they are the system knowledge base, exported from the ticket
store and rebuilt by `1c kb build`, so DOC-33's rename reaches them on the next
KB build rather than in this commit.

## The stored-role compatibility question — decided: accept on read

`CARETAKER_ROLE` is persisted in session records (`role: "caretaker"` appears in
the `xgd-session` header of every archived chat, and in the `session_start`
record of a live junction). The session manager resolves a resumed session's
role by looking that stored name up in the role map it was constructed with, and
throws on a miss — so a rename alone would strand every conversation started
before it.

**Decision: accept the old value on read. There is no migration.** The old name
is registered as a second key onto the *same* role object, declared as
`LEGACY_ROLE_NAMES` in `roles.ts` beside the reasoning. Migrating instead would
mean rewriting an append-only record stream and the archives of every
deployment, including a store-backed one in production, to change a word; the
alias costs one entry, behaves identically for the file archive, the junction
and the store-backed archive, and needs nothing to be run anywhere.

Only one path is live. Nothing is ever *written* under a legacy name —
`createSession` records `CONSULTANT_ROLE` and `aiStatus` reports it alone — so
the alias is read-only and ages out with the sessions that need it.

## Out of scope

Renaming `DOC-4 Webcaretaker` and `DOC-5 Gendev Website Caretaker Architecture`.
Those are historical architecture documents whose titles are part of the record.

## Evidence

`tests/test_UAT_FC_REQ-174_consultant_role.test.ts`, against the real builder
origin with only the Anthropic client doubled:

1. the preamble the model actually receives names a consultant, never the old
   word, asks for judgement, for the "would make the site worse" pushback and
   for the open question to be settled — and still carries the closed-vocabulary
   constraint;
2. a new session is recorded in the archive header and reported by
   `api/ai/roles` under the new name alone;
3. the grant in `instances.json` and the corpus purpose are the consultant's,
   and the purpose no longer says the role "looks after" a site;
4. a session whose stored role name is aged back to the old value reopens with
   its turns intact and takes another turn that reaches the tools and changes
   the site — verified to fail when the alias is removed;
5. no file in the working tree carries the old word except the alias
   declaration.