---
uid: request-8c474a78
id: REQ-182
type: request
title: 'Adopt DOC-22 session priming: consultant preamble, reminder and KM priming
  become configuration'
created_by: xgd
created_at: '2026-09-03T03:23:15.763170+00:00'
updated_at: '2026-09-08T01:50:22.417494+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a5972ecd
---

**Design ref:** lagrange-framework DOC-22 and the shipped implementation — `components/ai`
REQ-115 (Py, `3f1aa8d4c0`), REQ-116 (JS peer, `28367ac5aa`), REQ-123 (cache-boundary marker,
`4d3a68b45e`), REQ-126 (recycle retired + seed providers, `c62eeeb132` / `c4e7398a67`),
REQ-117 (knowledge) and REQ-118 (ai_knowledge).

**Not blocked.** All upstream requests are implemented (`ready_to_reconcile` / `free_coded`).
This is now a migration against shipped code, not a design dependency.

**The upstream change is breaking by design** — `Role.system`, `Role.source`, `Role.reminder`,
`ContextSource` and `StaticDocs` are deleted with no shims, so this host does not build against
the current `@lagrangefoundry/ai` until it adopts. One migration, not incremental.

## Summary
`tools/generate/src/cli/ai/roles.ts` already describes the upstream model in its header comment —
*"The priming a session gets has three layers… 1. this preamble… 2. the tool manual — PROJECTED…
3. the reminder — re-applied on every turn."* The three layers were arrived at independently and
are correct. What is missing is a framework that expresses them, so they are currently a
1,500-word TypeScript template literal, a hand-called reminder function, and a per-turn mutation
of the framework's role object.

## The shape being adopted

Two files. Each tier is an ordered list; each entry is a `name` plus **exactly one** of `text:`
or `provider:` (both or neither is a load-time `PrimingConfigError` naming the entry, as is an
unregistered provider name). Providers are `async (ctx) => string | null`; returning `null` drops
the entry **and** its separator.

A `priming:` list may carry **one** `{cache_boundary: true}` marker — a position, not an entry,
holding no text and rendering nothing. It is forbidden in `reminders:`, which are re-sent every
turn and have no prefix to cache.

## Scope

1. **`CONSULTANT_SYSTEM` → configuration** (`roles.ts:48`). The preamble becomes product-tier and
   role-tier `text:` entries. Product-tier is what is true regardless of role; "you are a design
   consultant and the site belongs to your client" is role-tier.

2. **`consultantReminder(slug, since, delta)` → reminder entries** (`roles.ts:~140`). Already a
   callback over runtime state; wrongly wired. It becomes:
   - two static `text:` entries (no-framework-vocabulary, act-don't-narrate);
   - a provider for the site line, reading the slug from `ctx.scope`;
   - a provider for the REQ-131 change signal, returning `null` when no changes landed;
   - a provider for the REQ-160 corpus delta, returning `null` when nothing arrived.

   The existing `if (since.changes > 0)` and `if (delta)` guards **are** the `null`-drops-the-entry
   semantic. Declaration order keeps the delta last; no cache marker is involved, because
   reminders carry none.

3. **Place the cache boundary in the product tier — the load-bearing decision.** The marker sets
   **assembly cadence, not only wire caching**: entries before it are assembled once and
   re-delivered, entries at or past it are re-assembled every turn. DOC-22 Amendment V forbids
   putting a KM or ticket read on the latency path of every turn, so:
   - `km.landscape` and `toolbox.manual` sit **before** the marker;
   - anything that moves within a session sits after it.

   This replaces `DOC-39 §6.4`'s ordering convention with a declared position.

4. **Correct the premise in `roles.ts`'s REQ-160 comment.** It currently reads *"Priming already
   carries a current landscape every turn."* With the landscape before the marker that is no
   longer true — it is assembled once per session and re-delivered. The corpus-delta channel is
   therefore **more** necessary than the comment argues, not less; update the reasoning so it
   does not rest on a property the host no longer has.

5. **Delete the per-turn role mutation** (`host-core.ts:827`). `role.reminder = consultantReminder(...)`
   reaches into the framework's role object between turns and works only because the manager
   re-reads the field. `Role` is now frozen, so the path is removed. `baselines` stays (it feeds
   the counter comparison); the `roles` Map's stated purpose — *"Held because the reminder is no
   longer a constant"* — evaporates.

6. **Delete the priming factory** (`host-core.ts:577`, `host.ts:158–175`). The duck-typed
   `{ documents: () => [box.manual()] }` literal, `HostDeps.priming` and the
   `KnowledgeDocs.open(...)` call all go, replaced by product-tier `km.landscape` and
   `toolbox.manual` entries. **The ternary disappears**: a host with no KB is a product file
   without a landscape entry, not a runtime branch.

7. **`CONSULTANT_PURPOSE` → role-tier `text:`** (`host.ts:173`). KM no longer accepts
   `rolePurpose` and never sees the role.

8. **One `Role` for every site.** With the slug read from `ctx.scope`, the per-slug instances
   keyed by `managerKey(slug, deps)` collapse to a single configured role.

9. **Delete `LEGACY_ROLE_NAMES`** (`roles.ts:193`) and its read path (`host-core.ts:664`, the
   `for (const legacy of LEGACY_ROLE_NAMES) named[legacy] = role` loop). Role aliases are
   rejected upstream: nothing is deployed with archived transcripts, so the alias guards against
   nothing. Delete the explanatory comment with it — it asserts a rename would require rewriting
   *"the archives of every deployment, including a store-backed one in production"*, which is the
   premise being contradicted.

10. **Decide on the shipped product defaults.** The framework now ships `defaults/product.yaml`
    and `defaults/prose.yaml`, registering `session.transcript_pointer`,
    `session.tool_transcript_note`, `session.summary` and `session.summary_trigger`. Either adopt
    them (the session gains a summary and a transcript pointer it does not have today) or supply
    a product file that omits them — deliberately, not by accident.

11. **Set `maxPrimingChars`.** `host-core.ts:666` constructs `SessionManager` without one, so it
    takes the framework default. Overflow is now a **loud failure naming the entry** with no
    truncation path, and this host's landscape grows with the client's KB — pick a cap
    deliberately.

12. **Async providers simplify this host.** `deps.priming` is already `(box) => Promise<...>`;
    the `KnowledgeDocs.open()` / `documents()` split that existed only to bridge a synchronous
    `ContextSource` disappears.

13. **`assets.ts:429`** — `AI_KNOWLEDGE_EXPORTS` lists `'KnowledgeDocs'` among the four names the
    Worker reaches for, with a comment calling it *"the map that tells a cold session the corpus
    is there at all."* The list becomes three; update the comment, which no longer describes how
    the map arrives.

## Out of scope
**Nothing from the document tier.** It is *not* a fourth priming tier — it is the middle rung of
KM's navigation hierarchy (knowledge base / **document** / chunk), amending DOC-22 §7 rather than
§2, and it **is implemented**: `outline(uid)` (`ai_knowledge/toolbox.py:381`), `chunk_search(doc=)`,
ranged `get(uid, start, end)` (`:412`), and a whole-document cap that refuses rather than truncates.

This host inherits it with no configuration change: `knowledgeInstanceConfig([SYSTEM_KB])` resolves
to `{"groups": [READ_GROUP]}`, so the new operations arrive with the group already granted, and
`toolbox.manual` projects them into the priming automatically. Nothing to do here beyond
confirming the manual reflects them after adoption.

## Acceptance criteria
- No priming or reminder prose exists as a TypeScript string constant; `CONSULTANT_SYSTEM` and
  the static half of `consultantReminder` are readable in YAML.
- No code assigns to any attribute of a `Role`; attempting it raises.
- A turn with no site changes and no corpus delta emits neither reminder entry — no empty clause,
  no placeholder residue, and no stray separator.
- A turn with both emits both, with the corpus delta last.
- Switching a session between sites does not create a second `Role`.
- The product tier declares exactly one `{cache_boundary: true}`, with `km.landscape` and
  `toolbox.manual` before it.
- A KM read happens once per assembly, not once per turn — verifiable by counting store reads
  across a multi-turn session.
- The assistant's manual still reflects only this session's actual grant (the projection property
  REQ-126 protects), now via `toolbox.manual`.
- A priming configuration exceeding the configured cap fails loudly naming the offending entry;
  no truncated priming is produced.
- No module resolves `KnowledgeDocs`.
- Existing UATs for REQ-131 (change signal), REQ-160 (corpus delta) and REQ-174 (consultant
  register) pass against the configured form.


---

## Review — 2026-09-07: what BUG-63 already landed, and what is left

This ticket was written on 2026-09-03 as *the* adoption of DOC-22. On 2026-09-07
BUG-63 (`53ede2641f`, `3c7cb93c17`) landed a **forced** migration: `bin/install
--component all` pulled four days of unpinned framework movement, `KnowledgeDocs`
was gone and `Role` had frozen over a fixed key set, so the control app stopped
building. That migration was scoped to "make the host build and prime correctly",
not to this ticket's scope. The two overlap, and this section separates them.

**Verified against**: `components/ai/js/src/{roles,priming,manager,defaults}.js`,
`defaults/{product,prose}.json`, DOC-22 including the CHAT-25/CHAT-26 amendments
(N–W and the 2026-09-05 invocation-mode qualification), and this host's
`roles.ts` / `host-core.ts` / `host.ts` / `assets.ts` /
`apps/control-app/src/{ai,session-knowledge,system-knowledge}.ts` at
`7c74b26cc8`. `tests/test_UAT_FC_BUG-63_priming_configuration.test.ts` passes
(6/6).

### Scope items, item by item

| # | Item | State |
|---|---|---|
| 1 | `CONSULTANT_SYSTEM` → configuration | **Not done**, and as written it conflicts with REQ-171 — see A below |
| 2 | `consultantReminder` → reminder entries | **Half.** It is a registered provider (`site.reminder`), not a role mutation; it is still *one* entry returning a joined string, not the four/five entries this ticket specifies. The split is blocked by C below |
| 3 | Cache boundary | **Not done.** No marker anywhere in this host. Real consequences — see B |
| 4 | Correct the REQ-160 comment premise | **Not done.** `roles.ts` still reads *"Priming already carries a current landscape every turn."* It is now false in the opposite direction to the one this ticket assumed — see D |
| 5 | Delete the per-turn role mutation | **Done** (BUG-63). Covered by `test_UAT_FC_BUG-63_the_host_mutates_no_role` |
| 6 | Delete the priming factory | **Half.** `KnowledgeDocs.open` and the duck-typed `{documents: …}` literal are gone. `HostDeps.priming` and both ternaries survive (`host-core.ts:698`, `apps/control-app/src/ai.ts:319`) |
| 7 | `CONSULTANT_PURPOSE` → role-tier text | **Done in substance** — it is an `Entry({text})` and KM no longer takes a `rolePurpose`. Still a TypeScript constant |
| 8 | One `Role` for every site | **Not done, and blocked upstream** — see C |
| 9 | Delete `LEGACY_ROLE_NAMES` | **Not done.** Still live at `roles.ts:240` / `host-core.ts:754` |
| 10 | Decide on the shipped product defaults | **Still open, and explicitly deferred by BUG-63.** Two hard preconditions discovered — see B and E |
| 11 | Set `maxPrimingChars` | **Not done.** `SessionManager` is constructed with `{junctions|logDir, providers}` alone, so the 200,000-char framework default applies |
| 12 | Async providers simplify the host | **Done** |
| 13 | `assets.ts` `AI_KNOWLEDGE_EXPORTS` | **Done** (BUG-63) — three names, comment rewritten |

### A. Item 1 as written contradicts REQ-171's ordering decision

Tiers concatenate **product then role** (`priming.js`: `sections = [...productTier.sections,
...roleTier.sections]`). REQ-171 split the preamble into `PRODUCT_SYSTEM` and
`CONSULTANT_ROLE_TEXT` and composed them **role-first**, deliberately: *"the first thing
a model reads about itself sets the register for everything after it."* Putting
`PRODUCT_SYSTEM` in the product tier inverts that.

BUG-63 hit the same wall from the other side and chose one tier — *"the order this host
needs interleaves them — landscape, PURPOSE, mechanism — so they go in one list, the
role's."* That is the correct reading of DOC-22 §2 (tiers vary by **variation scope**,
never by topic) as long as this host has one role.

So item 1 is really two questions, and only the first is settled:
- *Should the prose be data rather than a TypeScript constant?* Yes — it is the point of
  the ticket.
- *Should it be split across tiers?* **No, not while there is one role.** Revise item 1 to
  "the preamble becomes two role-tier `text:` entries, `product-system` after
  `consultant-role`", and note that standing up DOC-33 §10's second role is the event
  that makes a product tier worth having — at which point the ordering conflict has to be
  paid for, not before.

### B. The cache boundary is worth more than this ticket claims, for a different reason

With no marker declared, the framework's **computed** rule applies: the cached prefix ends
at the first `provider:` entry. This host's role tier is `consultant-system` (text),
`km-landscape` (provider), `purpose` (text), `km-mechanism` (provider) — so the cached
prefix is `consultant-system` **alone**: ~4,200 characters of an assembled priming of
roughly 16–20k (`CONSULTANT_ROLE_TEXT` 1,907 + `PRODUCT_SYSTEM` 2,276 + `CONSULTANT_PURPOSE`
~760 + the landscape + the ~10,830-character manual summary). The remaining ~12–16k is
outside every cache breakpoint and is charged at full input price on every turn of a
four-hour consultation. `ClaudeAPIBackend` declares `promptCache: true` and
`anthropicSystem` does place the breakpoints, so this is live, not hypothetical.

Declaring `{cache_boundary: true}` at the **end** of the role list fixes it: `tierBoundary`
becomes 4, the whole priming is one cached prefix, and `volatileNamesOf` still returns
`[]` — nothing becomes volatile, so assembly cadence is unchanged.

Note this is the opposite of the ticket's stated rationale. Item 3 argues the marker is
needed to keep KM off the per-turn path. **It is already off it**: `volatileEntries()`
returns empty for a configuration with no declared marker, so `_seedForTurn` short-circuits
and providers run once per session. The marker is needed for wire caching, and it becomes
*mandatory* the moment anything volatile is adopted — E.

### C. Items 2 and 8 are blocked on an upstream gap: `ctx.scope` is never populated

Both rest on *"the slug read from `ctx.scope`"*. `SessionContext` declares `scope` and
`toolbox` in both languages, and **neither manager ever fills them** —
`manager.js:269` and `manager.py:313` construct `SessionContext` from
`{sessionId, role, backend, chatTicketUid, turnIndex}` only, and nothing subclasses
`_context`.

That is why BUG-63 keyed a module-level `reminders` map by `managerKey(slug, deps)` and
kept one `SessionManager` per site: with no scope on the context, per-site binding has to
come from the closure. Item 8's collapse to a single `Role` additionally needs
`ctx.toolbox`, because `MANUAL_PROVIDER` closes over a per-slug `box`.

**Recommendation:** move items 2 and 8 out of this ticket and raise a
lagrange-framework request to populate `SessionContext.scope` / `.toolbox`, or accept
per-site managers as the design and delete item 8. Splitting the reminder into entries is
achievable without it (the site line can stay a registry-keyed provider), but the *reason*
given for the split — reading the slug from the context — is not.

### D. Item 4's correction needs re-writing, not just applying

The comment in `roles.ts` says *"Priming already carries a current landscape every turn"*
to argue the corpus delta is still necessary. This ticket says the landscape is assembled
once and re-delivered, so the argument is even stronger. That is right, but the mechanism
is not the one this ticket names: it is not the cache boundary that makes the landscape
session-fixed, it is the **absence** of one (B). And DOC-22's 2026-09-05 amendment adds a
second reason the delta channel is load-bearing — in persistent invocation mode the system
block is fixed at spawn, so *nothing* that varies within a session is deliverable through
priming at all. The delta rides the reminder, which is re-assembled per turn on every
backend, and is therefore the only channel that works in both modes.

### E. Adopting the shipped product defaults (item 10) has two preconditions

Both were measured against the framework source, not inferred.

**E1 — it puts the KM read back on the per-turn path unless the role tier also declares a
marker.** `renderTier` only re-uses cached sections `if (cached !== null && boundary !== null
&& index < boundary)`. A tier with **no declared marker re-renders every entry** on the
per-turn pass. The shipped product tier declares one (for `session-summary`), which makes
`volatileEntries()` non-empty, which makes `_seedForTurn` assemble on every turn — and our
undeclared role tier then re-runs `km.landscape` and `toolbox.manual` each time. Measured
over one cold start plus three turns:

```
role marker absent:  landscape reads=4  manual reads=4
role marker at end:  landscape reads=1  manual reads=1
```

So this ticket's AC *"a KM read happens once per assembly, not once per turn"* is satisfied
today and is broken **by** adopting the defaults, unless B lands with it. They are one
change, not two.

**E2 — an upstream defect makes the cache offsets wrong whenever a volatile section
precedes a later tier's boundary.** `manager.js:530` hands the backend
`priming = assembly.stable` (volatile sections removed) together with
`cacheOffsets = assembly.offsets`, but `PrimingAssembly.offsets` is computed by slicing
`this.sections`, which **includes** the volatile ones. Reproduced against
`components/ai/js/src/priming.js` with a product tier of
`[transcript-pointer, {cache_boundary}, session-summary]` and our role tier:

```
boundaries [2, 4]  offsets [11, 71]  stable.length 131
cut@71 => "LLLLLLLLLLLLLLLLLLLLLLLLLLLLLL"   # lands inside km-landscape
```

The intended cut was the end of `consultant-system`; the actual cut is off by exactly the
summary's length plus one separator. It does not bite this host today, because nothing is
volatile and `stable === text`. It bites the day we adopt the defaults. Anthropic accepts
an arbitrary text-block split so nothing errors — the breakpoint is simply in the wrong
place, silently, which is the failure mode DOC-22 §8 says a boundary must not have.

**Recommendation:** raise this as a lagrange-framework bug before item 10 is scheduled.
(Not filed from this session — say the word and I will.)

### F. "Readable in YAML" is not achievable on the Worker path

The first acceptance criterion asks for the prose to be readable in YAML. `roles_file.js`
is Node-only, and the framework ships its own defaults as `defaults/product.json` /
`defaults/prose.json` for exactly this reason — `productFromMapping` /
`rolesFromMapping` take an already-parsed mapping so a Worker can configure from a value.

So the AC should read "readable in configuration **data**, not in a TypeScript template
literal", with JSON on the Worker path (or YAML authored and inlined at build, the way
`1c assets` already inlines the knowledge base into `src/generated/kb.js`). The property
being bought — one author, one file, no recompile to change a word — survives either way.

### G. Item 9 rests on a premise this ticket should confirm, not assume

The ticket says the `caretaker` alias *"guards against nothing"* because nothing is
deployed with archived transcripts. `roles.ts:222` asserts the opposite — *"the archives of
every deployment, including a store-backed one in production"*. One of the two is wrong and
the difference is a question about the deployed store, not about the code. Confirm before
deleting: the failure mode is a pre-rename session that refuses to reopen, which is
unrecoverable for that conversation.

### Recommendation on this ticket's shape

What is left is three separable things with different value and different blockers:

1. **The boundary and the defaults** (items 3, 10, 11) — the only part with measurable
   behaviour attached, and internally coupled: the marker, the product-tier decision and
   the cap are one change. Blocked on E2 upstream if the defaults are adopted; the marker
   alone is unblocked and worth landing on its own.
2. **Prose to configuration** (items 1, 2-static, 4, 6, 7, 9) — now cosmetic rather than
   structural, since BUG-63 already made the assembly an ordered list of named entries.
   Real value is single-authorship of the words and no recompile to change them. Needs A
   and F applied first.
3. **The context-driven collapse** (items 2-dynamic, 8) — blocked upstream on C. Move out
   or drop.

Proposed: keep this ticket for (1) and (2), re-scoped per A/B/D/F, and take (3) out.
