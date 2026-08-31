---
uid: comment-37a5b4a6
id: COMMENT-1544
type: comment
title: Comment on doc DOC-39
created_by: xgd
created_at: '2026-08-31T00:25:50.205105+00:00'
updated_at: '2026-08-31T00:27:55.437395+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: doc-d88e2e1c
  kind: chat_transcript
---

<!-- xgd-turn id="cab2f31f-7da4-41f6-be16-2de810e6dff4-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T00:25:19.747268+00:00" -->
#### You
> **Document** · DOC-39 — The Knowledge Management System

> **Selected text** "system": { "prompt"

Why call this a prompt - that doesn't make sense (check the chat session Site Data Model for context)

<!-- xgd-turn id="cab2f31f-7da4-41f6-be16-2de810e6dff4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T00:27:54.886080+00:00" -->
#### Claude
You're right, and the code is worse than the doc.

## What the field actually does

Three references to `.prompt` in the entire knowledge component's `src/`, and two of them are consumers — both in `landscape.js`, both **build-time**:

- `describePrompt()` (`landscape.js:127`) — prepends `"Domain context for this knowledge base:\n…"` to the territory-describe prompt. So it's *context supplied to* a prompt, not a prompt.
- `assembleLandscape()` (`landscape.js:449`) — renders it as the italic subtitle under `# Awareness map: <name>`. Pure prose caption.

`search.js` and `ranking.js` never touch it.

## The docstring makes a claim the code doesn't support

`config.js:100` and the `@property`:

> *"ranked search multiplies its score by `weight` and **injects `prompt` as the retrieval-time domain context**"* … *"Domain-context system prompt injected at retrieval time."*

It is never injected at retrieval time, and it is never a system prompt. It reaches a model exactly once — inside the awareness build — and otherwise only reaches a human reading the map. `weight` in that same sentence *is* read at retrieval; `prompt` is not, so the sentence pairs a true claim with a false one and reads as verified.

Note that `config.js` cites DOC-7 §4.1 as the authority for this — the specification DOC-39 §11 records as resolving in no reachable store. The false claim can't be checked against its stated source.

## Why CHAT-30 is the right context

Decision 4: **a KB is a view, not a folder**. A view's declaration carries a *scope statement*, and this field is the prose twin of `corpus` — `corpus` says which rows machine-readably (`type=doc AND fields.system_kb=true`), this says what they are in English. Same fact, two levels of formality, neither an instruction.

Every real value confirms it. All three configs are noun phrases:

```
1stcontact: "1stcontact system knowledge: how the product is designed and why — …"
xgd:        "xgd system knowledge: how the tool thinks and is used — the CLI and MCP surface, …"
xgd:        "This project's capability matrix: what capabilities exist, …"
```

Not one addresses a model or is imperative. Nobody has ever written a prompt in this field, because it isn't one.

## Recommendation

Rename to **`description`**. `scope` also works; `prompt` is the only one that imports a runtime-instruction connotation the field has never had.

Scope is cross-repo and belongs in `lagrange-framework`, not here: `components/knowledge/js/src/config.js` (`KB_KEYS`, `KnowledgeBase`, both `landscape.js` sites), the Python peer at `components/knowledge/py/src/lagrangefoundry/knowledge/config.py`, `conformance/fixtures.json`, plus the two live configs (`xgd/.../kb_config.yaml`, `1stcontact/kb/knowledge_bases.json`). `KB_KEYS` rejects unknown keys rather than ignoring them, so it's a breaking config change unless both names are accepted for a transition — which is cheap and probably worth it given the configs live in different repos.

Want me to note this in DOC-39 §2 (the field is a description; the docstring's retrieval-time claim is false) and file the rename against `lagrange-framework`?

<!-- xgd-chat-end -->