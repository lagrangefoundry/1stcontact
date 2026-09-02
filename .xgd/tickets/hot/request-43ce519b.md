---
uid: request-43ce519b
id: REQ-174
type: request
title: 'Rename the assistant role: caretaker -> consultant'
created_by: xgd
created_at: '2026-09-02T20:48:27.159106+00:00'
updated_at: '2026-09-02T20:48:27.159106+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6a65b0c6
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

## The stored-role compatibility question

`CARETAKER_ROLE` is persisted in session records (`role: "caretaker"` appears in
the `xgd-session` header of every archived chat). A rename must either migrate
those or accept the old value on read. Sessions already archived must keep
opening. Decide and record which; do not leave both paths live.

## Out of scope

Renaming `DOC-4 Webcaretaker` and `DOC-5 Gendev Website Caretaker Architecture`.
Those are historical architecture documents whose titles are part of the record.