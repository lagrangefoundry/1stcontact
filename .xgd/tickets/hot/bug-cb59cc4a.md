---
uid: bug-cb59cc4a
id: BUG-48
type: bug
title: A document in the corpus that is not in the index is a shipped lie
created_by: xgd
created_at: '2026-09-02T20:49:23.510284+00:00'
updated_at: '2026-09-03T00:39:44.258725+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
---

# A document in the corpus that is not in the index is a shipped lie

## Why

The consultant's field reference exists, is correct, and is unreachable.

`REF-l1.md` is 477 lines projected from the Zod schemas by `kb-projection.ts`.
It documents every field of every element kind with the schema's own prose:

```
- `gapPx` — number, at least 0
- `objectFit` — `cover` | `contain` | `fill` | `none` | `scale-down`
- `surfaceFill` — color. The painted fill behind the node's content.
- `backgroundImageUrl` — text. A background image (scheme-checked by the envelope...).
- `overlay` — overlay. A full-bleed translucent scrim painted over the background (hero overlay).
```

Every question the consultant guessed at across the whole of [[CHAT-35]] is
answered there. It reported to the operator that *"the knowledge base doesn't
have a detailed schema reference"*, and of the corpus it could search, that was
true.

## What is actually broken

`1c assets` inlines the system KB from two sources that can disagree, and does
not check that they agree. In `apps/control-app/src/generated/kb.js` today:

```
docs:            DOC-17, DOC-31, DOC-33, DOC-35, REF-behaviors, REF-l1, REF-surface, awareness
index manifest:  DOC-17, DOC-31, DOC-33, DOC-35
chunks manifest: DOC-17, DOC-31, DOC-33, DOC-35
```

Three projections and the awareness map ship as text and are in neither index.
Retrieval searches the index, so they cannot be returned. The consultant carried
them in its own bundle for the entire session and could not see them.

**This is not a broken pipeline.** `1c kb build` runs `writeProjections()` and
then indexes (`index.ts:793`), in that order, deliberately, with a comment
saying why. The REQ-165 suite passes 13/13 and asserts exactly this. The defect
is that the ordering is only enforced *inside* `kb build`, and nothing else has
to respect it:

- `1c kb export` calls `writeProjections()` and never indexes.
- `1c assets` reads `docs` as a **directory listing** and `index`/`chunks` as
  **build artefacts**, then inlines both.

So a document written after the last build appears in the corpus text
immediately and in the index never. That is how this checkout got here: the REF
files were written 2026-09-01 11:53 by an export, the last index build stamped
2026-09-01T00:57:52Z, and `1c assets` at 17:40 inlined the new docs beside the
old index. Rebuilding fixes today. Nothing stops it recurring tomorrow, and
nothing says it has happened.

## What this ticket does

**1. Fail the skew.** `1c assets` refuses to inline a bundle in which any
document in `docs` has no entry in the index and chunk manifests. Refuse, not
warn: the failure mode is an assistant that answers badly, which nobody
attributes to a stale index. The error names the missing documents and the
command that fixes them.

**2. Fix the instance.** Re-run the build so `REF-l1`, `REF-surface`,
`REF-behaviors` and `awareness` are indexed and chunked, and confirm the
consultant can retrieve `REF-l1` by search.

**3. Close the hole rather than only guarding it.** An export that writes
projections into a tree whose index it does not update is producing the skew (1)
now detects. Either `kb export` indexes what it writes, or it declines to write
documents it will not index, or the two verbs stop sharing one tree. Pick one
and record why in [[DOC-39]].

## Note on scope

The awareness map is missing from the manifests too, which means the system KB's
own "what exists" landing point was not searchable either. Whatever coverage
check lands must cover it, not just the `REF-` namespace.

## Related

- [[REQ-175]] — capability parity. This ticket is the discovery half; the two
  failures in [[CHAT-35]] were one of each, and either alone still produces an
  assistant that reports working features as missing.


## A second defect, found while landing [[REQ-175]]

Everything above is about a document that is **complete and unreachable**. There
is a second one in the same file, and the fix above cannot detect it: `REF-l1` is
also **reachable and incomplete**. Index it perfectly and it still cannot answer
the question [[CHAT-35]] actually asked.

`projectL1Vocabulary` (`tools/generate/src/cli/kb-projection.ts:544`) renders
exactly three things:

```
elementKinds(named)   -> ## The kinds of element        (the l1NodeSchema union)
reachableShapes(...)  -> ## The shapes those fields take (whatever those reach)
envelopeSection()     -> ## The limits every page is held to (L1_ENVELOPE)
```

Those are the only three `##` headings in the 477 lines. **Nothing reads
`l1DocumentSchema`.** So the page document — `widths`, `background`, `textColor`,
`column`, `resources`, and the `font face` shape underneath it — appears nowhere
in the reference that calls itself "the vocabulary a page is written in".

That was survivable while the document was unwritable: a reference that omits
what nothing can set is merely incomplete. [[REQ-175]] made all five keys
writable through `get_page_style` / `set_page_style`, so it is now the exact
[[CHAT-35]] failure with the pieces rearranged — the capability is present, the
tool manual says the operation exists, and the field reference does not say what
may be written into it. An assistant that reads `REF-l1` to learn field names
learns that a page has no background.

### Also missing: the rules that are not numbers

`envelopeSection()` iterates `L1_ENVELOPE`, which holds numeric bounds only. Every
*structural* refusal is therefore absent from "The limits every page is held to",
though each one is a refusal a consultant will meet:

- a node `id` must be unique (`validate.ts` — duplicate ids break `#anchor` and
  the `for`↔`id` control contract);
- a palette reference must name a declared entry;
- a keyframe `at` must be one of the document's `widths`;
- `geometry.anchor` requires the document to declare a `column`;
- [[REQ-175]] — a painted `fontFamily` must resolve to a served face or name a
  generic, and a referenced asset must be one the site holds.

The section's own promise is "A page outside these is refused whole; nothing is
clamped silently." It currently keeps that promise for the numbers and breaks it
for everything else.

## What this adds to the ticket

**4. Project the document, not only the tree.** `projectL1Vocabulary` reads
`l1DocumentSchema` and renders its keys the way it renders an element's. The key
list is already derived — [[REQ-175]] added `L1_DOCUMENT_KEYS`, computed from
`Object.keys(l1DocumentSchema.shape)` — so project from that rather than writing
a heading per key, and the sixth document key documents itself the day it lands.

**5. Project the structural rules beside the numeric ones.** The refusals above
belong in "The limits every page is held to". They are prose, not bounds, so they
cannot come from `L1_ENVELOPE`; take them from the validator's own doc comments
the way `definitionOf` already lifts prose elsewhere in this file, so there is
still one source and no sentence is authored here.

**6. Guard completeness, not only presence.** (1) asserts every document in the
corpus is in the index. That is a necessary check and an insufficient one — this
defect passes it. What is missing is a check that a *projection covers its
declared source*: `REF-l1` says it is generated from "the L1 element schemas and
their validation envelope", and a schema the projection never reads makes that
line untrue. Assert coverage against the schema (every `L1_DOCUMENT_KEYS` entry
and every element kind appears in the projected body), derived rather than
listed — a hand-written expected list is the thing that goes stale silently, and
this ticket is about exactly that class of lie.

### Scope

This roughly doubles the ticket: (1)–(3) are one skew check plus a rebuild, while
(4)–(6) are a new projection section, a second prose source, and a coverage
assertion. Worth re-pointing before it is picked up. Splitting is reasonable —
(1)–(3) fix a shipped bundle and (4)–(6) fix a shipped document — but they should
not be separated by much, because either alone still leaves an assistant that
cannot find out how to paint a page.
