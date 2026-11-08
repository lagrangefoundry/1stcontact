---
uid: acceptance_criterion-7284de3a
id: AC-2107
type: acceptance_criterion
title: The product tier is declared empty, and every piece of material lives in exactly
  one of role level or reminder
created_by: xgd
created_at: '2026-11-01T09:27:24.985509+00:00'
updated_at: '2026-11-08T05:10:19.780408+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

What a session is told by hand is organised by what changes it, and each piece of material lives in exactly one place:

- **No product tier.** The session's configuration declares an **empty product tier**. None of the framework's own shipped product entries is adopted: the session is never told that its turns are stored and addressable by id, because it is granted no operation that reads them.
- **Role level.** This is the role's ordered priming list. It opens with the **role text**: who this session is and how it speaks. Next comes the **product text**: how the site is changed (only through the tools, no HTML, CSS or JavaScript, a malformed change refused whole), how the site is built (a typed element tree plus vetted components, never named to the client), how to work (read before you write; ask for a tool's full entry when its one-line summary leaves you guessing), and that changes are private until the client publishes. The product text names **no role**, neither the current one nor any retired name, so it can move unchanged into a product tier when a second role arrives. With a knowledge base present, the role's **purpose** sits between the map and how to search. It names the subjects the method covers and both corpora searched (see the no-document-id criterion).
- **Reminder.** This is the per-turn text (see its own criterion).

No sentence of the product text is restated in the role text, the purpose or the reminder. The consultation method itself (the playbook's stages) appears in none of them: it lives in the corpus, and the texts point to it.

## Verification

Load the consultant's configuration. Its product tier has no entries, and no assembled priming contains the framework's transcript-pointer wording ("addressable", "turn id"). Assemble the priming the real host hands the model for a consultant session. It begins with the role text and contains the product text verbatim after it. The product text contains "only through your tools" and "refused whole", and matches neither "consultant" nor any legacy role name, case-insensitively. None of the product text, the role text, the purpose or a rendered reminder matches a playbook stage reference (`stage <n>`).
