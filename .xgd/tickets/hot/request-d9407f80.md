---
uid: request-d9407f80
id: REQ-126
type: request
title: 'Build the L1 control surface API: declared schemas, error taxonomy, addressing
  contract, version'
created_by: xgd
created_at: '2026-08-08T21:14:42.246096+00:00'
updated_at: '2026-08-10T11:00:55.953217+00:00'
completed_at: '2026-08-10T11:00:55.953217+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 02a9af066a7485f7192ad38d28f48feb5a38c866
    reconcile_sha: null
    main_sha: null
  version: 0.1.30
  story_points: 8
  bundled_in: bundle-e59210c5
  chat_comment: comment-68897577
---

# Build the L1 control surface API

Bring the L1 control surface up to what **DOC-30** (`doc-aca10bce`) specifies. Scope comes from
that document's gap list and is not fully knowable until it is written — this request is
deliberately created ahead of its own scope so the work is not absorbed silently into the
tooling configuration request, where it would be invisible.

## Behaviour

The operations that change or describe a site become an API: stable names, declared input and
output schemas expressed as data, a published error taxonomy with caller-facing meanings,
declared read/write classification, a stated addressing contract, maintained per-operation
documentation, declared absences, and a version.

Consumers — the `1c` CLI, the click-to-edit modal, and the AI tool surface — continue to reach
the same single write path. This is a formalisation of `edit.ts`, not a second surface beside
it, and no consumer should gain a way to bypass validation, atomicity or re-render.

## Dependency note

Blocks the tooling configuration request, which projects its entire surface from this API.

---

## Scope, as settled from DOC-30

Since DOC-30 was written the upstream Toolbox has **shipped** (lagrange-framework DOC-20 /
REQ-74), and its JS peer is in the shared artifact store at `@lagrangefoundry/ai/core`. So this
is no longer "invent an API discipline"; it is **declare the L1 control surface as a Toolbox
surface**. Most of the machinery — schema validation, policy gating, group expansion, manual
projection, wire projection, provenance marking, audit — is upstream and is not written here.

The irreducibly local work:

1. **`ai/l1-surface.json`** — the declaration, as data on disk. Envelope (`surface: l1`,
   format `version`, `title`, `overview` carrying the worldview and the render-scoped
   addressing rule), 16 operations covering **everything `edit.ts` can do** (not only the
   AI-facing subset), parameter types (`l1_address`, `page_id`, `config_key`), return shapes,
   the six `ErrorCode`s with `ERROR_MEANINGS`' text promoted to the surface, effect-homogeneous
   capability groups, sequences, and absences.
2. **`ai/toolbox.ts`** — `L1Toolbox`, a thin class over `edit.ts`, constructed with slug +
   store context. One method per declared operation. No validation, no error rendering, no
   policy: all of that is the Toolbox's.
3. **`ai/instances.json`** — the instance configuration for the builder chat role. The grant
   narrows the surface: copy, pages, config and publish are granted; **asset add/remove is
   declared but not granted**, which is what lets it be documented and validated while staying
   out of the chat session.
4. **Provenance and audit** — every read declares `provenance: untrusted` (site copy is other
   people's prose re-entering the model's context, and `inproc` would default it *trusted*);
   an audit sink records every call against the site.
5. **CI** — the SDK-free standalone validator checks the declaration and the configuration at
   author time, in this repository.
6. **Deletions** — `ai/declare.ts` in full, `tools.ts`'s declaration bodies, the local manual
   renderer, and `guarded()`'s error rendering.

### Decisions taken

- **Site binding stays construction-time** (DOC-30's option 2). No `slug` parameter exists on
  any operation, so there is no bad value to refuse — strictly stronger than a scope predicate,
  and it is the guarantee REQ-122 already bought. Construction-scoped bindings are a finding to
  raise upstream, not a reason to weaken this.
- **The surface declares its own version** (`surface_version`) beside the format `version`.
  DOC-20's envelope has no field for it, so it is carried as data and read locally; raised
  upstream as R6.
- **Worked examples move into operation `description`.** DOC-20 has no `examples:` field, so
  their testability is lost — recorded as a residual, not worked around with a parallel format.

### What must not regress

`edit.ts` stays the single write path. A toolbox class is a caller like any other; the CLI, the
click-to-edit modal and the AI surface continue to reach the same functions, and nothing gains
a way past validation, atomicity or re-render.

## Test plan

`tests/test_UAT_FC_REQ-126_l1_surface.test.ts` — the declaration validates through the
framework's own validator; the whole surface is declared while the chat grant is narrower; a
read-only grant cannot reach a write and its manual never mentions one; parameters are
validated before any value reaches `edit.ts`; site content comes back provenance-marked; every
call is audited; the addressing contract is stated once; real edits land on the draft through
the Toolbox and a refusal leaves it byte-unchanged.

`tests/test_UAT_FC_REQ-122_tool_surface.test.ts` — rewritten onto the Toolbox (its `declare.ts`
unit assertions go with `declare.ts`; its behavioural workflows stay).