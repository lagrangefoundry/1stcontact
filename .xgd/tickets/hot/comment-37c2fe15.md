---
uid: comment-37c2fe15
id: COMMENT-2804
type: comment
title: Comment on request REQ-228
created_by: xgd
created_at: '2026-09-11T22:31:26.099704+00:00'
updated_at: '2026-09-11T23:47:50.048507+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-77e4e59c
  kind: chat_transcript
---

<!-- xgd-turn id="947a883b-c0f9-4fc0-985d-3f3556d5cd7d-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T22:31:03.501536+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="947a883b-c0f9-4fc0-985d-3f3556d5cd7d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T22:35:00.516427+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Let me explore the relevant code before asking questions.

I've read the ticket and traced the code — `host-core.ts`'s `extraSurfaces` composition, `ledger-core.ts`/`image-core.ts` as the surface precedent, `material.ts`'s `MaterialRow`/`listMaterial`/`promoteToSiteAsset`, `image-library.ts`'s `resolveStoredImage`, and the `ai-ticketing` package in the shared store (it does export `TicketToolbox`/`instanceConfig`/`ticketToolbox` as the ticket says).

**One question I do need answered before I build.**

**Half A — do you actually want `ReadTickets` granted, or should I build B+C only?**

The ticket proposes it, but there's a direct tension with a principle already written into this codebase. `ledger-core.ts`'s header argues:

> WHY A PURPOSE-BUILT SURFACE AND NOT THE TICKETING ONE. `@lagrangefoundry/ai-ticketing` already declares `TicketAppendBody` and `TicketUpdate`, and granting them would be the shorter path. It would also hand a client-facing assistant the ability to write *any* ticket in the project, to be clawed back by a scope predicate that has to stay correct forever.

The read case is weaker but the same shape. The tenant store holds every `chat` ticket (each carrying another session's full transcript as a `chat_transcript` comment), every engagement ledger, every material body, and the awareness map. `ReadTickets` gives `get`/`query`/`comments`/`backlinks`/`history` over all of it, gated by a predicate DSL the model would also have to learn.

And the acceptance test you wrote — the `chat-d73a11e1` session reading its own catalogue, looking at three generated illustrations, and placing the one it chose — is satisfied entirely by Halves B and C. Half A adds nothing to it.

**My recommendation: build B and C now, hold A.** If you want A, I'd rather it be its own decision with its own scope argument than ride along here.

---

**Two decisions I'm making unless you say otherwise** (flagging so a veto is cheap):

1. **A fifth surface, `library`**, following the `image`/`ledger` pattern exactly — `library-surface.json` + `library-core.ts`, grant travels with the surface (not `instances.json`, for the validator reason `image-core.ts` states), composed via a new `HostDeps.library` factory, assembled in `router.ts`, absent on the `1c` CLI which has no ticket store. Three operations: `list_library` and `get_library_item` in a `ReadLibrary` group, `place_on_site` in its own `PlaceOnSite` group — both granted, since the gate that matters (`promoteToSiteAsset`'s `republishable` refusal) is already load-bearing and a captured third-party image mechanically cannot be placed.

2. **The catalogue lists all material kinds, not just images** — documents and fonts too, with `kind` as a filter. "The complete account of the client's material" is Half D's own phrasing, and a client's uploaded font is exactly something that should reach the site. Naming stays one rule: I'll reuse `resolveStoredImage` as the matcher and feed it a `StoredImage[]` built over the whole catalogue by the *same* projection `materialImageLibrary` uses — extracted into one function so the two cannot drift, which is the failure `image-library.ts` was written to prevent.

Listing is bounded (default limit + `total`/`more`), as the ticket requires.

Tell me on Half A and I'll cut the branch and build.

<!-- xgd-turn id="3ae48ac4-59db-4a4c-9419-31abb8a3bda5-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T22:37:03.031206+00:00" -->
#### You
I have no idea what 1 or 2 mean

<!-- xgd-turn id="3ae48ac4-59db-4a4c-9419-31abb8a3bda5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T22:37:28.668754+00:00" -->
#### Claude
Sorry — that was written in the repo's vocabulary rather than in plain terms. Let me restate all three in terms of what actually changes for the person using this.

**Background in one line:** the assistant has tools it can call. Today it has no tool that reaches the Library — the place a client's uploaded logo, brand PDF or a generated illustration lives. That's the bug.

---

**Decision 1 — three new tools, and the "put it on the site" one is kept separate.**

I'd give the assistant three new tools:

- *see what's in the Library* — the same list a person sees on the Library tab
- *read one item's details* — its description, what it's for, whether it's already on the site
- *put one on the site* — copies it into the site's images so a page can use it

The first two only look. The third one **copies a file out of the client's private storage into the site**, which is a meaningfully bigger deal — so I'd keep it in a separate bucket from the other two. Practically that means: if you ever want an assistant that can browse the client's files but not publish any of them, that's a config change, not a rewrite. In this deployment I'd switch all three on.

The safety gate for the third one already exists and already works: material we fetched from someone else's website is marked not-republishable, and the existing code refuses to place it. The assistant can't get around that.

**Decision 2 — the Library holds pictures, documents and fonts. Should the assistant's new list show all three, or only pictures?**

The ticket is titled "one picture catalogue", so pictures are clearly in. My call is to show all three, with a way to ask for just one kind — because a client who uploads their brand font uploaded it so it can go on the site, and a list that silently omits it is the same class of bug we're fixing. Nothing is forced on the assistant; it just isn't hidden from it.

---

**And the question I still need you to answer.**

Separately from those two, the ticket proposes also giving the assistant a general "read any ticket in this client's project" ability.

The thing to know is what else lives in that same store: **every other conversation this client has had with the assistant is in there, in full**, along with the engagement notes from each. So that grant isn't "read the picture catalogue" — it's "read everything, including past conversations."

Your own codebase already argues against the equivalent for writing, in `ledger-core.ts`: granting the generic ticket tools "would also hand a client-facing assistant the ability to write *any* ticket in the project, to be clawed back by a scope predicate that has to stay correct forever." Reading is a smaller version of the same thing.

And the acceptance test you wrote into the ticket — the assistant looks at the three illustrations it generated, forms a view, places the one it picked — is fully satisfied by the three tools above. The general ticket access adds nothing to it.

**So: yes or no on the general "read any ticket" grant?** My recommendation is no, not in this ticket. Say "skip it" and I'll cut the branch and build the three tools.

<!-- xgd-turn id="c16da8b8-b818-4905-805d-b8e79ae95fd6-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T22:47:40.078866+00:00" -->
#### You
The thing to know is what else lives in that same store: **every other conversation this client has had with the assistant is in there, in full**, along with the engagement notes from each. So that grant isn't "read the picture catalogue" — it's "read everything, including past conversations." <-- this is EXACTLY THE INTENTION how can the assistant be helpful without context

**So: yes or no on the general "read any ticket" grant? YES YES PLEASE YES critical part of the product intent**

<!-- xgd-turn id="c16da8b8-b818-4905-805d-b8e79ae95fd6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T23:17:42.122534+00:00" -->
#### Claude
Understood — and that reframes it: the cross-session reach is the product intent, not a hazard to be narrowed. I'll build all three halves. Let me check the one wiring question that decision opens before I cut the branch.

Confirmed the wiring works: upstream's policy treats an unset `when_unset: deny` axis as an empty allow set, and a local uid projects to nothing — so `ReadTickets` with no project scope reads **every ticket in this tenant's store** and refuses only cross-project references. That's exactly the reach you want.

Let me scope the ticket first, per protocol.

Ticket scoped. Now the branch.

Now let me build. Starting with the shared naming projection in `material.ts`.

Now the shared projection — one function both the image library and the catalogue name items through.

Now the surface declaration — every word the model reads lives here, none in the code.

Now the surface core — the port, the operations, and the one naming rule reused.

Now the host side — the port implemented over the ticket store and the site store.

Now wiring the surface into the host.

Now Half A — the ticketing bridge. First the build shim, so the Worker can resolve the package.

Now the ticket surface composition in `ai.ts`, and the two new params on `workerHost`.

Now the `workerHost` signature — the library factory and the ticket surface composition.

Now the router assembles it.

Now generate the shim and typecheck.

Now the UATs. Let me check how existing suites exercise a Toolbox grant.

Now writing the first UAT — the surface's own behaviour.

Two real findings from the framework's validator. Let me see all four failures.

All four are fixture/declaration bugs, not surface bugs. Fixing the sequence first — the validator requires steps to name the surface's own operations.

Declaration is clean now. The remaining two are my fixture's — it hand-built aliases instead of using the real projection. Let me fix that properly.

24 passing. Now the workers suite — the real stores, and Half A's ticket grant.

Now the workers suite — real stores, and the ticket grant.

Good — real domain findings. `role: 'reference'` implies `republishable: false` by design, and the route only promotes when the form carries a slug. My fixtures picked the wrong lever.

Now fix the four cases that used `role` as the placement lever.

Both suites green. Now Half A's own UAT — the ticket grant and its reach.

Two findings — the declaration's `tool` names differ from the `op` names, and `run` renders refusals as text rather than throwing.

Now update the call sites to use tool names and the text-refusal contract.

All three suites pass. Now the full regression run.

The two lists are nearly disjoint, which points to load-dependent flakiness plus real regressions mixed together. Let me isolate the ones that plausibly touch my change.

All seven share one symptom: the per-turn reminder isn't reaching the model. Let me check whether that reproduces on main.

Real regression — main passes 50/50. Let me find it.

Not a regression — running `1c assets` in the worktree regenerated `kb.js` as `null`, since the worktree has no built KB. Restoring the artefact:

Let me determine decisively whether my changes cause it, by reverting the tracked files temporarily.

Confirmed — these reproduce with my code fully reverted. A worktree-environment artifact, not a regression. Restoring my changes:

Let me check the remaining worktree-only failures against the same control.

Every one fails with my code reverted. Now the same set with my changes restored:

Identical: 13 failed / 92 passed with and without my change. Now confirming my own suites and the AI-surface neighbours all pass.

<!-- xgd-turn id="fd3603c8-aa10-4e8a-a664-f7e0a44c529e-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T23:47:48.954220+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->