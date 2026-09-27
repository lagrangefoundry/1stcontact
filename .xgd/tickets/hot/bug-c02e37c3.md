---
uid: bug-c02e37c3
id: BUG-156
type: bug
title: A stale projection is invisible to the KB build that generates it
created_by: EPIC-16
created_at: '2026-09-27T00:13:07.945050+00:00'
updated_at: '2026-09-27T00:40:53.500740+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-35d04e57
---

`1c kb ensure` cannot detect a stale projection, so `bin/build` will never rebuild
one — and the projections are the corpus documents most likely to be wrong,
because they are the only ones derived from code that changes daily.

## What happens

`REF-l1`, `REF-behaviors` and `REF-surface` are not written documents. They are
rendered by `writeProjections` from the live declarations at build time —
`REF-l1` from `l1NodeSchema` and `l1DocumentSchema`, and [[BUG-48]]'s second half
was exactly this document being reachable and incomplete against the schemas it
claims to describe.

[[REQ-322]]'s build stage decides whether to rebuild by calling `requireCoherentKb`,
whose test is `kbSkew`: for each `kb/system/*.md`, the file's **mtime** against the
version recorded in the document and chunk manifests (`kb.ts:1106` stamps the bundle
with `statSync(...).mtimeMs`). `exportCorpus` and `writeProjections` both run only
inside `buildKb`. So a projection whose SOURCE has moved is a file that has not
moved: same mtime, same manifest entry, no skew, no rebuild — and the stage prints
*"the index covers all 12 corpus document(s) — nothing to build"*, which is true and
useless.

Observed 2026-09-26: `kb/system/REF-l1.md` last projected 2026-09-24 00:19;
[[REQ-329]], [[REQ-330]] and [[REQ-331]] changed `packages/site-schema/src/l1/schema.ts`
between 12:50 and 13:03 on 2026-09-26. The projection is two days behind the schema
it renders, the index is perfectly coherent with it, and every `bin/build` since has
correctly reported nothing to do.

## Why this is BUG-48's lesson and not a new one

BUG-48 is "presence is not coverage", and its fix was a check that refuses a bundle
whose index does not cover its corpus. This is the same sentence one level further
out: **coverage is not currency.** The index covers `REF-l1` completely; `REF-l1`
does not cover the schema. A stale projection is worse than an unindexed one,
because it is retrievable, confident and wrong — the assistant answers questions
about the L1 vocabulary from a document that describes a vocabulary the code no
longer has.

It is also the failure mode `l1VocabularyGaps` was written against, escaping through
a door that function does not watch. That check derives its expectation from the
same four declarations the projection renders from, *at the moment it is checked* —
deliberately, because "a hand-written list of what the document ought to contain is
precisely the artefact that goes stale without saying so". It answers "is the
projection complete?" and is never asked "is the projection the CURRENT one?".

## What it should do

`1c kb ensure` should treat a projection whose rendered output differs from the file
on disk as skew, in the same way and in the same place as a missing or stale index
entry — one call, no second opinion, because a stage with its own idea of staleness
is free to disagree with the check that gates the inline.

The comparison is available without a credential and without a request: the
projections are pure functions of declarations already in the tree, so rendering
them and comparing is local work of the same order as the two manifests `ensure`
already reads. A build that touched no declaration must still cost nothing new —
that property is [[REQ-322]]'s and must survive.

Rewriting a projection makes its file newer than the manifest, which is already
`kbSkew`'s trigger, so the existing rebuild path handles the rest without a second
mechanism.

## Boundary

Hand-written `system_kb` documents are out of scope. Those live in tickets and their
staleness is an editorial question with no derivable answer; the projections are
mechanical and theirs is a diff. Detecting one is not evidence the other is possible.