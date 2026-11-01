---
uid: acceptance_criterion-7284de3a
id: AC-2107
type: acceptance_criterion
title: The session's texts are product level, role level and reminder, each piece
  of material in exactly one; the product level names no role
created_by: xgd
created_at: '2026-11-01T09:27:24.985509+00:00'
updated_at: '2026-11-01T09:27:24.985509+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

What a session is told by hand is organised as three texts, split by what changes them:

- **product level** — how the site is changed (only through the tools, no HTML, CSS or JavaScript, a malformed change refused whole), how the site is built (a typed element tree plus vetted components, never named to the client), how to work (read before you write; ask for a tool's full entry when its one-line summary leaves you guessing), and that changes are private until the client publishes. It names **no role** — neither the current one nor any retired name — so standing up a second role requires restating none of it;
- **role level** — who this session is and how it speaks, carried in the system prompt **before** the product text, so the system prompt the model receives opens with the role and contains the product text verbatim after it; and the role's purpose in the priming, naming the documents the role must read;
- **reminder** — the per-turn text (see its own criterion).

No sentence of the product text is restated in the role text or the reminder, and the consultation method itself (the playbook's stages) appears in none of the three: it lives in the corpus and is referenced.

## Verification

Read the system prompt the real host hands the model for a consultant session. It begins with the role text and contains the product text after it. The product text contains "only through your tools" and "refused whole" and matches neither "consultant" nor any legacy role name, case-insensitively. Neither the product text, the role text nor a rendered reminder matches a playbook stage reference (`stage <n>`).
