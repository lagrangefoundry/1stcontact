---
uid: comment-2a38a753
id: COMMENT-2181
type: comment
title: Comment on bug BUG-48
created_by: xgd
created_at: '2026-09-03T02:32:44.146363+00:00'
updated_at: '2026-09-03T03:12:40.358969+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-cb59cc4a
  kind: chat_transcript
---

<!-- xgd-turn id="5b3f18ee-b325-48ee-9b28-6cce558ae49c-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T02:32:14.352485+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="5b3f18ee-b325-48ee-9b28-6cce558ae49c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T02:36:29.935145+00:00" -->
#### Claude
I've read the ticket and traced all six work items through the code. Five questions before I start — each changes what gets built.

**1. The awareness map (the "Note on scope").** It structurally cannot be in the manifests today, and not by accident. `buildKb` writes `awareness.md` *after* both index passes (`kb.ts:944`), and the map's frontmatter is `type: system` while the corpus store is `DocDirStore(reader, { type: 'doc' })` (`kb.ts:674`) — so it is excluded from the corpus it describes, with a comment saying that's the point. DOC-39 §6.2 also has the map injected at priming every turn rather than retrieved.

So either:
- **(a)** the check exempts the map, with the reason recorded — unsearchable ≠ unreachable here, it's in every prompt already; or
- **(b)** we genuinely index it — a third pass after the map build, dropping the recursion guard and paying an embedding round to make searchable a document that is already inlined into every session.

I recommend (a). Confirm?

**2. Absence only, or staleness too?** Item (1) as written catches "no manifest entry". There's a second state in this same checkout: `DOC-17.md` (Sep 2 15:54) and `DOC-33.md` (Sep 2 15:58) are *present* in the manifests but stamped `2026-09-01T00:57:52Z` — the bundle would ship new text against old vectors. The manifest keys on exactly that stamp, so catching it is free. It's the same lie in weaker form. Include it? Note the consequence: `1c assets` then fails on this checkout until a rebuild — which is question 3.

**3. I can't do item (2).** `1c kb build` needs `CLOUDFLARE_API_TOKEN` and reaches Workers AI over REST; this session has no network. I can build and test the guard, but "re-run the build, confirm the consultant retrieves `REF-l1` by search" has to be you. Is that acceptable — I land (1) and (3)–(6), you run `1c kb build && bin/build`?

**4. Item (3) — which closure?** The three offered are each costly: (a) export indexes → kills its documented "no credentials needed"; (b) export declines to write → the verb becomes a no-op; (c) split the trees → export loses the thing it's for. My pick is a narrower (c): **`writeProjections()` stops being called by `kb export` and is called only by `kb build`** — the two producers already own separate namespaces and separate sweeps, so this costs nothing and removes the producer that wrote three of today's four missing documents. That does *not* fully close it (an export can still rewrite a changed `DOC-N`), so DOC-39 records the honest position: the verbs share a tree, the tree is allowed to go stale, and **the shipping step is where staleness is refused**. Take that, or one of (a)/(b)?

**5. Item (5) — where the structural prose comes from.** To lift it without authoring a sentence in the projection, I'd add an exported `L1_STRUCTURAL_RULES` table to `validate.ts` whose **values are the message fragments the validator already emits** (so the table is load-bearing for enforcement, not decoration) and whose per-key doc comments are what `definitionOf(declarations, 'L1_STRUCTURAL_RULES', key)` lifts — exactly the `L1_ENVELOPE` mechanism. That means touching the validator's error strings. The alternative is a table only the projection reads, which is one source for the prose but unenforced and free to drift from the checks it claims to describe. I recommend the first. Object?

Assuming no instruction otherwise, I'll keep all of (1) and (3)–(6) on BUG-48 — one branch, several commits — rather than splitting, since the ticket notes they shouldn't be separated by much.

<!-- xgd-turn id="4ac4b985-0130-4e01-b894-af78a309cd5e-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T02:42:38.352983+00:00" -->
#### You
1 (a) please - the map is a discovery chart of everything else but it cannot map itself either 

2 yes staleness

1. I can give you a key to test it when you complete the coding
   4. I don't understand the consequences if this is about the boundary of which commands do what, I don't care I'm going to have you create a script that runs them all in order
   5. what is the structural prose?

<!-- xgd-turn id="4ac4b985-0130-4e01-b894-af78a309cd5e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T03:12:40.159744+00:00" -->
#### Claude
Answering **5**, then I'll scope and start.

**The structural prose** is the sentence each refusal already carries in `validate.ts`, lifted the same way `definitionOf` lifts a schema field's doc comment. Eight refusals are enforced there and absent from "The limits every page is held to" — these are the actual source sentences, not ones I'd write:

| rule | prose already in `validate.ts` |
|---|---|
| unique node `id` | "ids became real DOM ids when links landed, so they must be unique. A duplicate breaks `#anchor` navigation and the `for`↔`id` association the `control` contract relies on" |
| palette reference resolves | "every palette reference must name an entry the palette actually declares… the only thing standing between a dangling reference and a crashed render is this check" |
| keyframe `at` is a declared width | `keyframe width N is not one of the document widths [...]` |
| keyframes ascending | `keyframes must be sorted strictly ascending by 'at'` |
| `widths` strictly ascending | "the ladder is an ordered set" |
| `geometry.anchor` needs a `column` | "a column anchor is meaningless without the column it refers to, and silently falling back to the keyframes would hide the dangling reference behind geometry that merely looks plausible" |
| a painted `fontFamily` resolves | "a stack that names a generic has a declared fallback… a font family with no face paints the browser default" (REQ-175) |
| a referenced asset is one the site holds | "an image handle with no bytes paints a broken image or nothing at all — accepted, and the author learns what they wrote by looking at the render" (REQ-175) |

Each becomes one bullet beside the numeric bounds. The table in `validate.ts` carries the message fragment the validator emits, so it stays enforced rather than decorative, and the projection reads only the doc comment above it.

On **4**: taking your answer as "the boundary isn't the deliverable, the ordered script is." So I'll leave `kb export` / `kb build` as they are, add `bin/kb-release` running export → projections → index → chunks → map → assets in order, and record in DOC-39 that the shipping step is where skew is refused rather than the producing step. Scoping now.

Ticket scoped, status `free_coding`. Cutting the branch.

Now the implementation. Starting with the skew check in `kb.ts`.

Now the stamp normalisation and the skew check itself.

Now wiring it into `1c assets`:

Now wiring each rule into the message the validator actually emits.

Now the projection: the page-document section and the structural half of the limits section.

Now `documentSection`, placed beside `elementKinds`:

Now the structural half of the envelope section:

Now the UAT tests. First let me verify the projection actually renders through a test harness.

Good — I have what I need. Adding the seam to the coverage check, then writing the UATs.

Now the UAT suites.

Now the wider regression — suites that touch validator messages, plus a typecheck.

Now a broad run to catch anything else, plus the typecheck.

<!-- xgd-chat-end -->