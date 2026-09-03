---
uid: comment-2a38a753
id: COMMENT-2181
type: comment
title: Comment on bug BUG-48
created_by: xgd
created_at: '2026-09-03T02:32:44.146363+00:00'
updated_at: '2026-09-03T02:36:30.240049+00:00'
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

<!-- xgd-chat-end -->