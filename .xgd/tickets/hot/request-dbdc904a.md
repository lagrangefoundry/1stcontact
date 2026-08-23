---
uid: request-dbdc904a
id: REQ-125
type: request
title: Complete DOC-30 — the L1 control surface API design and its gap list
created_by: xgd
created_at: '2026-08-08T21:14:37.419676+00:00'
updated_at: '2026-08-09T18:46:18.534613+00:00'
completed_at: null
last_field_updated: status
status: legacy_done
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-ab46f06f
---

# Complete DOC-30 — the L1 control surface API, and the gap list

Take **DOC-30** (`doc-aca10bce`) from draft to a design record that specifies the surface and states exactly how far today's code is from it.

## Done when

Requirements R1–R7 are each specified concretely — operation naming, declared input/output schemas as data, error taxonomy with caller-facing meanings, read/write classification, addressing contract, documented semantics, versioning, declared absences.

And the document ends with the **itemised gap list**: per requirement, what `edit.ts` already satisfies and what is missing. That list is the deliverable that scopes the build request, and it cannot be written in advance — the gap may be modest, since the single write path already exists and `CommandError` already carries code, path and hint; or substantial, once declared schemas, output contracts and a version are added.

## The acceptance bar for the declaration format

A usable tool manual must generate from the API declaration **with no prose written in the tooling configuration**. If the manual needs hand-written explanation to be usable, the declaration is underspecified and config will drift toward carrying the difference.

## Preserve

`edit.ts` as the **single write path**. The `1c` CLI, the click-to-edit modal and the AI tool surface all dispatch to the same functions, so validation, atomicity and re-render happen once and cannot be bypassed by adding a caller. This document formalises that surface; it must not fork it.

The addressing correspondence — `formatL1Path` stamps `data-l1-path`, `resolveL1Node` consumes it — becomes a stated contract rather than an implementation coincidence, including the render-scoped lifetime of an address.

---

## Progress — DOC-30 rewritten against DOC-20 / REQ-74 (2026-08-08)

The premise of this ticket changed underneath it. When it was written, the generic tooling object was _being designed_ in lagrange-framework. It is now **specified (DOC-20, **`doc-5de13501`**) and built (REQ-74, **`request-22e5b9f3`**)** — declaration ingest, config validation, group expansion, wire-spec and manual projection, schema validation, policy gating, provenance, audit, and a standalone author-time validator, in Python and JS with a conformance corpus.

So DOC-30 is no longer "design an API discipline for the L1 control surface". It is **"declare the L1 control surface as a Toolbox surface, and state how far **`edit.ts`** is from that"**. The document has been rewritten on that basis, and now carries:

- R1–R7 mapped onto the Toolbox declaration fields, with the two that are **not** discharged by the format called out rather than glossed (R4 addressing; R6 a surface's own version);

- what the L1 declaration must contain, concretely — envelope, the full operation list (the surface declares everything `edit.ts` does; the _grant_ narrows it, which removes the old "AI-facing subset only" complaint), parameter types, shapes, errors, capability groups, sequences, absences;

- the inherited security obligations, with **provenance (S5)** and **audit (S6)** identified as genuinely new and, in this product's case, load-bearing — every read on this surface returns third-party prose, and `inproc` would default it _trusted_;

- REQ-74's two extra rules (the quantifier rule; array base for optional selectors under an `allow_set`) and where they bite here;

- what `declare.ts` is replaced by, field for field;

- the **itemised gap list** this ticket asks for, per requirement and per security obligation.

### Two findings to raise upstream

1. **Site binding.** DOC-20 lists our "closed-over site slug and unenforced `writes` flag" together. The `writes` half is correct — declared, enforced by nothing. The slug half is not: no tool declares a `slug` parameter at all, which is _stronger_ than a scope predicate (S2's own reasoning one level up — an absent parameter has no bad value to refuse). DOC-20's `scope_axes` (`applies_to: {param: …}`) cannot express a constraint over a construction-time binding. Recommendation: keep the binding, and propose construction-scoped declaration upstream, rather than adding a `slug` parameter purely to fit the current field set.

2. **A surface's own version.** DOC-20's `version:` is the declaration _format_ version. R6 asked for a surface version and the envelope has no field for one. Partly absorbed (configuration is a projection; startup validation catches drift), not fully.

Also open: DOC-20 has no `examples:` field, while `declare.ts`'s structured examples are test-executable and demonstrably useful for a model's first call.

### Status

Document-only change; no code touched, so no free-coding ceremony applies. The build request is now scopeable from DOC-30's gap list — the local work is the declaration as data, an `L1Toolbox` class over `edit.ts`, eight declared return shapes, the builder-chat instance configuration, the author-time validator in CI, and deletion of `declare.ts` plus the local manual renderer.

## DOC-20 amended (2026-08-08)

Three edits to lagrange-framework **DOC-20** (`doc-5de13501`), made from this ticket's analysis. No code changed in either repo.

1. **S4 gains the two rules REQ-74 forced** and its own body said were "worth folding back into DOC-20" — the **quantifier rule** (a projection yields alternative denotations of one value, so _any_ admitted denotation admits it; a list parameter yields distinct selections, so _every_ one must be admitted) and **narrowing needs somewhere to put the values** (an optional parameter read by an `allow_set` axis must declare base `array`). Plus the note that `when_unset` needs no matcher of its own.

2. **The 1stcontact refactor-target bullet is corrected.** It filed our closed-over slug alongside the unenforced `writes` flag. The `writes` half stands; the slug half did not — no tool declares a `slug` parameter, which is stronger than a scope predicate, and the bullet as written instructed a refactor that trades a real safety property for a declarative one.

3. **Three items added to Deferred**, attributed to this surface: scope over a construction-time binding (**blocks our refactor either way**), a surface's own version, and worked examples.

### No REQ-74 delta

Verified in the shipped code rather than taken from REQ-74's body. Both rules are implemented in both languages: the quantifier split at `components/ai/py/.../toolbox/policy.py:170-187` and `components/ai/js/src/toolbox/policy.js:150-167`, the array-base startup failure at `declaration.py:644-653` and `declaration.js:528-537`, each carrying the reasoning in a comment. DOC-20 was behind its implementation, not ahead of it, so edit 1 is the document catching up and needs no code. Edit 2 is prose about a refactor not yet started.

The three Deferred items would each need code if adopted, but none is decided; the construction-scoped binding is the one that must be resolved before the L1 refactor starts.