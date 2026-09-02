---
uid: bug-cb59cc4a
id: BUG-48
type: bug
title: A document in the corpus that is not in the index is a shipped lie
created_by: xgd
created_at: '2026-09-02T20:49:23.510284+00:00'
updated_at: '2026-09-02T20:49:23.510284+00:00'
completed_at: null
last_field_updated: created_at
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
