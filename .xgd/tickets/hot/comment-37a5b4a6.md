---
uid: comment-37a5b4a6
id: COMMENT-1544
type: comment
title: Comment on doc DOC-39
created_by: xgd
created_at: '2026-08-31T00:25:50.205105+00:00'
updated_at: '2026-08-31T01:13:30.280339+00:00'
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

<!-- xgd-turn id="f5b75a07-c59c-4e35-9a25-31d682f45e03-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T00:54:01.696906+00:00" -->
#### You
description is the right term can you update the document and the code on this please?

<!-- xgd-turn id="f5b75a07-c59c-4e35-9a25-31d682f45e03-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T01:13:27.930650+00:00" -->
#### Claude
Now the JS peer.

Now the Python peer.

Now the tests in both peers.

Component is clean. Running both test suites.

All remaining hits are the AI session `prompt()` method — unrelated. Running the full framework suites.

Framework done. Now the xgd side: its config, and the vendored copy.

Now re-vendor the framework copy into xgd.

Now 1stcontact: its KB config, test fixtures, and the DOC-39 body.

Scoped to exactly the one component I changed. Installing.

Done — the rename landed across all three repos, and DOC-39 now records why.

**DOC-39** — `§2`'s example is now `"description"`, with a fifth bullet naming it the prose twin of `corpus`, and a new **§2.1** recording that the old name was wrong: `prompt` reaches a model exactly once (build-time, as domain context in `describePrompt()`), is otherwise the awareness map's italic subtitle, and the docstring's *"injects `prompt` as the retrieval-time domain context"* was a false clause paired with a true one about `weight`, citing a spec (`DOC-7 §4.1`) that §11 already records as unreachable.

**The code**, three repos, three tickets:

| Repo | Ticket | Commit | Version |
|---|---|---|---|
| lagrange-framework | REQ-109 | `ecf0585a9af` | 0.0.170 |
| xgd | REQ-826 | `b8061aed6fc` | 0.15.413 |
| 1stcontact | DOC-39 | `020ec406100`, `d4eff1a9677` | 0.2.18 |

Framework covers both language peers, the `--prompt` → `--description` CLI flag, the shared conformance fixtures, `ai_knowledge`'s `kb_config_mapping` round-trip, the showcase, READMEs and tests — knowledge 45 JS / 203 py and ai_knowledge 32 JS / 36 py all green. xgd covers `kb_config.yaml`, `knowledge_bridge/build.py`, `bin/build_system_kb`, plus a re-vendor (6 UATs green). 1stcontact covers the KB declaration, `kb.ts` and four suites; `tsc` clean.

`describePrompt` / `describe_prompt` / `mechanicalDescribe(prompt)` are untouched — that one genuinely is a prompt.

**One step left, and it's yours to run.** The shared JS artifact store only refreshes on a deliberate install, so 1stcontact is currently red — `1c kb` fails with `unknown key(s) description (valid keys: prompt, …)`:

```
lagrange-framework/bin/install --lang js --component knowledge --no-deps
```

`--no-deps` matters: without it the install also re-packs `ticketing`, dragging in three unrelated commits (REQ-104 attachments/BlobStore, REQ-107 port scoping). The sandbox here denies writes to the store's parent directory, so I couldn't run it — I committed the 1stcontact half anyway rather than leave the rename half-applied, and the failure names its own fix.

Two things worth your judgment: **DOC-39 now carries code commits** in `fields.commits`, which is unusual for a doc ticket — I did it because the session is scoped to it and told me not to create 1stcontact tickets, but say the word and I'll move those two SHAs onto a REQ. And separately, **your xgd venv is damaged** — `site-packages/lagrangefoundry/` is full of `~`-prefixed orphans from a crashed pip install, the `xgd` console script is gone, and `lagrangefoundry.ticketing_refs` is missing. I worked around it with `PYTHONPATH` pointing at the vendored tree; a reinstall is on you.

<!-- xgd-chat-end -->