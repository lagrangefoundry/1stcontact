---
uid: bug-cb59cc4a
id: BUG-48
type: bug
title: A document in the corpus that is not in the index is a shipped lie
created_by: xgd
created_at: '2026-09-02T20:49:23.510284+00:00'
updated_at: '2026-09-03T03:18:42.878331+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2a38a753
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


## Scoped behaviour (agreed with the operator before coding)

Six behaviours land. Each numbered item above becomes one of them.

### S1 — `1c assets` refuses a bundle whose corpus and index disagree

Before `1c assets` inlines the system KB into `apps/control-app/src/generated/kb.js`
it compares the bundle's three parts. Every document in `docs` must have an entry
in BOTH the document index manifest and the chunk index manifest, and that entry's
stamp must not be older than the document's own `updated_at`. A bundle failing
either test is refused, not warned about: nothing is written, `1c assets` exits
non-zero, and the error names every offending document, says for each whether it is
MISSING from the manifests or STALE in them, and names `1c kb build` as the fix.

**Staleness is a failure, not only absence.** A document present in the manifest
under an older stamp ships new text against old vectors — retrieval finds it and
ranks it on content it no longer has. That is the same lie as an unindexed document
in weaker form, and the manifest already keys on exactly the stamp that detects it.
This checkout is in that state today: `DOC-17` and `DOC-33` carry file stamps newer
than the `2026-09-01T00:57:52Z` the manifests claim for them.

**The awareness map is exempt, and the exemption is recorded rather than assumed.**
`awareness.md` cannot be in the manifests and must not be: `buildKb` writes it AFTER
both index passes, and it carries `type: system` where the corpus store is bound
`{ type: 'doc' }` — it is held out of the corpus it describes, deliberately, so the
map does not map itself. It is reachable by a different route entirely: DOC-39 §6
injects it at priming, into every session, every turn. A document in every prompt is
not unreachable for being unsearchable. The check therefore skips the awareness map
BY THE PROPERTY THAT EXEMPTS IT — a corpus document the corpus predicate excludes —
and not by filename, so a second such document is exempt for the same stated reason
rather than by a second special case.

### S2 — the instance is fixed by rebuilding

`REF-l1`, `REF-surface`, `REF-behaviors` are indexed and chunked, and `REF-l1` is
retrievable by search. This needs Workers AI credentials and is run by the operator
against a key; S1 is what makes its absence impossible to ship past unnoticed.

### S3 — one ordered command runs the release, and the shipping step is where skew is refused

The hole is that the ordering `kb build` enforces internally binds nothing else:
`kb export` writes documents into a tree whose index it does not update, and
`1c assets` reads the corpus as a directory listing and the manifests as build
artefacts. Rather than change what either verb may do — which trades one
useful property (`kb export` needs no credentials) for another — the ordering
becomes a thing an operator can run rather than a thing they must remember:
`bin/kb-release` runs export, projections, both indexes, the map and `1c assets`
in that order and stops at the first failure. The skew is refused at the point it
would be SHIPPED (S1) rather than at the point it is produced, because producing a
stale tree is legitimate — `kb export` on a machine with no credentials is a real
thing to want — and shipping one never is. DOC-39 records this and why the other
three options were declined.

### S4 — `REF-l1` projects the page document, not only its element tree

`projectL1Vocabulary` renders a section for the L1 DOCUMENT — `widths`,
`background`, `textColor`, `column`, `resources` — the way it renders an element
kind: one field line per key, the type words from the schema and the prose from
the schema's own doc comment. The key list comes from `L1_DOCUMENT_KEYS`, which
is computed from `Object.keys(l1DocumentSchema.shape)`, so a sixth document key
documents itself the day it is declared. The shapes those keys reach — the font
face among them — are seeded into the same reachability walk that already
collects the element fields' shapes, so they are described once, in the section
that already exists for that purpose, rather than duplicated.

### S5 — the structural refusals are projected beside the numeric bounds

"The limits every page is held to" promises "A page outside these is refused whole;
nothing is clamped silently" and currently keeps that promise only for the numbers
in `L1_ENVELOPE`. The refusals that are prose rather than bounds are projected
beside them: a unique node `id`, a palette reference that names a declared entry,
a keyframe `at` that is one of the document's `widths`, keyframes ascending,
`widths` strictly ascending, `geometry.anchor` requiring a declared `column`, a
painted `fontFamily` that resolves to a served face or names a generic, and an
asset reference the site holds.

No sentence is authored in the projection. `validate.ts` gains an exported
`L1_STRUCTURAL_RULES` table whose VALUES ARE THE MESSAGE FRAGMENTS THE VALIDATOR
EMITS — so the table is load-bearing for enforcement and cannot rot into
decoration — and whose per-key doc comments are the prose, lifted by the same
`definitionOf` machinery that already lifts `L1_ENVELOPE`'s. One source per fact,
and the fact's source is the code that enforces it.

### S6 — a projection is asserted to cover its declared source

S1 asserts every document in the corpus is in the index, which this second defect
passes. What is missing is that a projection COVERS WHAT IT SAYS IT IS GENERATED
FROM. `REF-l1` declares its source as "the L1 element schemas and their validation
envelope", so its body must mention every element kind in `l1NodeSchema`, every
`L1_DOCUMENT_KEYS` entry, every `L1_ENVELOPE` key and every `L1_STRUCTURAL_RULES`
key. The expectation is DERIVED FROM THOSE DECLARATIONS at assertion time, never
listed: a hand-written expected list is the exact thing that goes stale silently,
which is the class of lie this whole ticket is about.


## Behaviour added as a consequence, recorded before it was written

Four things the six behaviours above require and do not say. Each is here because
it is a real change to what the product does, not an implementation detail, and a
UAT covers it.

### C1 — the bundle stamps a document the way the index does

S1 compares a document's version against the manifest entry the index wrote for
it, and that comparison is only meaningful if the two are the same string. They
were not. `nodeDocReader` — the reader the index is built through — stamps to
SECOND precision (`…T00:57:52Z`), and `kbBundle` stamped the same file with its
milliseconds. So the bundle and the index already disagreed about the version of
every document whose mtime is not on a whole second, silently, before anything
compared them.

The bundle therefore stamps as the corpus itself spells it. Without this the
skew check would report every document as stale on a perfectly current build —
it would cry wolf once and be turned off — and the property [[REQ-158]] says the
stamps exist for, that the corpus and the index do not disagree about how recent
a document is, was not actually being kept.

### C2 — the asset report names what shipped unsearchable

The exemption in S1 is a claim, and a claim nobody can see is indistinguishable
from the bug it resembles. `1c assets` therefore names the exempt documents on
its own report line rather than counting them: a count is a number the operator
cannot check, while the names let them see that the map is the only thing
shipping unsearchable. An ordinary build says nothing extra, so the clause keeps
meaning something when it appears.

### C3 — the coverage check is scoped to the section that renders each thing

S6 asks whether the projection covers its declared source. Asked as "does this
string appear anywhere in the body" the question answers yes for a document that
is missing the section entirely — `fontSizePx` is named by a text axis whatever
the limits section says, and every document key is a word that occurs somewhere
in five hundred lines. So each part of the source is held against the heading
that is supposed to render it: document keys against the page section, element
kinds against the kinds section, bounds and structural rules against the limits
section. Asking the narrower question is asking the one that was actually wrong.

The check also takes the body as a parameter, so it can be shown to fail. A
coverage assertion nobody has watched fail is indistinguishable from one that
passes vacuously, and a vacuous check is how `REF-l1` reached the state this
ticket describes.

### C4 — a reworded refusal keeps the words its callers already read

S5 routes nine validator messages through `L1_STRUCTURAL_RULES`. Those messages
are a contract: [[DOC-8]] §6 makes them what an AI author self-corrects from, and
several suites read them. Each rewritten message therefore still carries the
phrase its existing readers match on — `duplicate node id '<id>'`, `not an
allowed URL`, `not one of the document widths` — with the rule's own statement in
front of it. The rule gains a single source; nothing downstream loses a sentence
it was relying on.
