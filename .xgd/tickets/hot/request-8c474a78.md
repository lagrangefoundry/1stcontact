---
uid: request-8c474a78
id: REQ-182
type: request
title: 'Adopt DOC-22 session priming: consultant preamble, reminder and KM priming
  become configuration'
created_by: xgd
created_at: '2026-09-03T03:23:15.763170+00:00'
updated_at: '2026-09-08T04:20:41.884877+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-a5972ecd
  commits:
  - working_sha: c6150d2ef27d6b4a39d562c1f043cffdb75bb3d0
    reconcile_sha: null
    main_sha: null
  - working_sha: b202d966956d114ef6abbb8c69298c3eba5985fc
    reconcile_sha: null
    main_sha: null
  version: 0.2.137
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


### E2 filed upstream — lagrange-framework BUG-45 (`bug-6bace52a`)

*Added 2026-09-07.* The cache-offset defect in E2 is now a framework bug:
**"Cache offsets index the full assembly but the backend is handed the stable priming —
breakpoints land mid-section once anything is volatile"** (priority high, severity high).
It carries the reproduction in both languages, the docstring contradiction that shows the
behaviour is unintended, the second symptom (`cacheBreakpoints` clamps `o <= length`, so a
large volatile section deletes the breakpoint rather than moving it), a proposed one-property
fix to `PrimingAssembly.offsets`, and a language-neutral UAT for the conformance corpus.

**Item 10 should not be scheduled until BUG-45 lands.** Nothing else in this ticket is
blocked by it — the role-tier marker (B) is independent and can go first.


### Sequencing against BUG-45 — narrower than E2 first stated

*Added 2026-09-07, correcting the line above.* "Item 10 should not be scheduled until
BUG-45 lands" is too broad. BUG-45 bites only where something is **volatile**, and the only
volatile entry in play is `session-summary`. Measured against
`components/ai/js/src/priming.js`, for four configurations of this host (probe asserts each
reported offset lands on a section edge of `stable`, the property BUG-45 breaks):

| Configuration | volatile | `stable === text` | offsets | Safe? |
|---|---|---|---|---|
| 1. Today — empty product tier, no role marker | — | yes | `[3]` of 161 | correct, but caches only `consultant-system` |
| 2. **B alone** — role marker at end of the role tier | — | yes | `[161]` of 161 | **yes** — whole priming cached |
| 3. Partial defaults (`transcript-pointer` + `tool-transcript-note`, no summary) + role marker | — | yes | `[190]` of 190 | **yes** |
| 4. Full shipped defaults (with `session-summary`) + role marker | `session-summary` | **no** | `[22, 232]` of 190 | **no — BUG-45** |

Row 4 is the sharper version of E2 than the one filed: the second offset (232) **exceeds**
`stable.length` (190), so `cacheBreakpoints`s `o <= length` clamp discards it outright. The
role tier declares a cached prefix over the whole priming and receives **no breakpoint at
all** — the vanishing-breakpoint symptom, reached by the actual target configuration rather
than a contrived one.

So the blocking relation is: **BUG-45 blocks the `session-summary` entry, and nothing else
in this ticket.** Rows 2 and 3 are unblocked and land the whole of the caching win.

One consequence of row 3 worth deciding deliberately, because it is finding A again in a
milder form: the product tier renders **before** the role tier, so adopting `transcript-pointer`
and `tool-transcript-note` puts framework prose ahead of "You are a design consultant". That is
the framework s own default ordering and it is probably fine — a pointer to the transcript is
not a claim about identity — but it is the same ordering constraint, and it should be a choice
rather than a side effect.

**Revised order of work:** (i) the role-tier marker + `maxPrimingChars` (items 3, 11) — the
measurable win, unblocked; (ii) prose to configuration (items 1, 2-static, 4, 6, 7, 9) per
A/D/F — unblocked; (iii) `transcript-pointer` / `tool-transcript-note` (part of item 10) —
unblocked, pending the ordering decision above; (iv) `session-summary` (rest of item 10) —
after BUG-45; (v) items 2-dynamic and 8 — blocked on C, `ctx.scope`, unrelated to BUG-45.


---

## Implementation scope — 2026-09-07

What is being built now, the decisions taken, and what is deliberately left out. Every
behaviour a UAT asserts is stated here.

### Configuration is JSON, imported as data, with prose authored as lines

Finding F ruled out YAML on the Worker path. The form adopted is the one this directory
already uses: a `.json` file imported directly by the module that needs it, exactly as
`toolbox-core.ts` imports `l1-surface.json` and `instances.json`, `ledger-core.ts` imports
`ledger-surface.json` and `fidelity-core.ts` imports `fidelity-surface.json`. Both
tsconfigs already set `resolveJsonModule`, both hosts already bundle this directory, and
`1c assets` is not involved — so a prose edit reaches the Worker the way a TypeScript edit
does, with no generated file to fall out of step.

**Prose is authored as an array of lines and joined with newlines at load.** JSON has no
block scalar, and 4,000 characters of preamble as one escaped line would satisfy the letter
of "no longer a TypeScript constant" while losing the whole point of it. So an entry's
`text:` may be a string or a list of lines; the list is joined with `"\n"` before the
mapping reaches the framework's loader. Nothing else about the format is this host's
invention — `name` / `text` / `provider` / `priming` / `reminders` / `cache_boundary` are
the framework's keys and are validated by the framework's own code.

**The mapping is loaded through `rolesFromMapping`, not by constructing `Entry` and `Role`
by hand.** That is what makes the both-or-neither check, the unregistered-provider
rejection, the cache-boundary marker parsing and the "no `args:` key" rejection this host's
behaviour rather than upstream trivia it happens not to use. A malformed configuration is a
`PrimingConfigError` naming the entry, raised when the host starts.

### Everything stays in the role tier; the product tier stays empty, deliberately

This settles item 10, and it settles it as "omit", for a reason stronger than the ordering
one in finding A.

`session.transcript_pointer` tells a session *"Everything said in this session is stored,
and addressable. Each exchange has a turn id; reading one by its id returns it in full."*
**This host grants no such operation.** The three surfaces it composes are
`l1-surface.json` (29 operations), `ledger-surface.json` (2) and `fidelity-surface.json`
(6), plus the knowledge surface; none of them reads the session's own transcript. Adopting
that entry would hand the consultant a hand-written claim about a tool it does not have —
the precise failure `roles.ts`'s header names, *"worse than no inventory because the model
believes it"*, and a direct breach of the layer-2 projection property REQ-126 protects.

`session.tool_transcript_note` needs a `hasToolTranscript` reader this host does not have;
registered without one it renders nothing, so adopting it would add a name and no text.

`session.summary` is the one this host actually wants, and it is blocked on
lagrange-framework BUG-45 (row 4 of the table above). It is not being adopted here.

So the product tier is left empty and the entry list stays single-tier, which is BUG-63's
decision re-affirmed rather than reversed, and finding A's ordering conflict never has to be
paid. When the ongoing tier's second role arrives (DOC-33 §10), that is the event that makes
a product tier worth having, and `PRODUCT_SYSTEM` is already a separate entry ready to move
into it.

### The cache boundary sits at the end of the list

One `{cache_boundary: true}`, last. Every entry is before it, so nothing is volatile,
assembly cadence is unchanged, and the whole assembled priming becomes one cached prefix
instead of the `consultant-system` entry alone. This is finding B; row 2 of the table above
is the measurement.

**A KM read happens once per session, not once per turn.** True today by accident (no
marker at all) and true after this change by declaration.

### The reminder becomes five entries, and the guards become null-drops

`consultantReminder`'s single space-joined string becomes five reminder entries:

- two static `text:` entries — no framework vocabulary, act rather than narrate;
- a static `text:` entry for the method pointer (DOC-33);
- a provider for the site line;
- a provider for the REQ-131 change signal, returning `null` when no changes landed;
- a provider for the REQ-160 corpus delta, returning `null` when nothing arrived, declared
  last.

The existing `if (since.changes > 0)` and `if (delta)` guards become the null-drops-the-
entry semantic. **The delivered text changes shape**: the framework joins reminder entries
with a blank line rather than the single space this host joined with, so the reminder
arrives as separated lines instead of one paragraph. That is a deliberate consequence, and
an improvement — the change signal and the corpus delta are the two things that must not be
skimmed, and they now sit on their own.

Host state changes with it: the module-level map holds **the signal** (`{slug, since,
delta}`) rather than a rendered string, because rendering is now the providers' job. The
site-line provider still reads the slug from that state rather than from `ctx.scope`, which
is finding C and is not fixed here.

### `maxPrimingChars` is declared

`SessionManager` is constructed with an explicit cap rather than the framework's 200,000
default. The cap is chosen against the measured assembly and stated as arithmetic in the
code, with headroom for the one part that grows — the client's landscape. A configuration
that exceeds it fails loudly naming the entry, with no truncated priming produced.

### The REQ-160 comment is corrected

`roles.ts`'s *"Priming already carries a current landscape every turn"* is replaced. The
landscape is assembled once per session and re-delivered, and DOC-22's 2026-09-05 amendment
adds the second reason: in persistent invocation mode the system block is fixed at spawn, so
the reminder is the only channel that carries a within-session change on every backend. The
corpus delta is more necessary than the old comment argued, not less.

### Out of scope for this change, with reasons

- **Items 2-dynamic and 8** — one `Role` for every site, slug from `ctx.scope`. Blocked on
  finding C: neither manager populates `SessionContext.scope` or `.toolbox`. Per-site
  managers stay.
- **`session-summary`** — blocked on lagrange-framework BUG-45.
- **Item 9, `LEGACY_ROLE_NAMES`** — pending the operator's answer on whether any deployed
  environment holds archived `caretaker` sessions. Kept until then: deleting it wrongly
  makes those conversations unopenable, and keeping it wrongly costs one map entry.
- **Item 6's ternary** — `HostDeps.priming` survives. A host with no knowledge base has no
  landscape or mechanism provider registered, and naming an unregistered provider is a
  load-time error by design, so the branch is real rather than incidental. What it selects
  is now which named entries the configuration contributes, not whether a document gets
  assembled.

### Acceptance for this change

- No priming or reminder prose exists as a TypeScript string constant; the words are in
  `priming.json` and a prose edit needs no recompile of any `.ts` file.
- Prose authored as a list of lines reaches the model as the paragraphs it was written as.
- A configuration entry declaring both `text:` and `provider:`, or naming an unregistered
  provider, fails at host start with a `PrimingConfigError` naming the entry.
- The priming list declares exactly one `{cache_boundary: true}`, last, and the assembled
  cache offsets cover the whole priming.
- The landscape provider runs once for a session, not once per turn.
- A turn with no site changes and no corpus delta emits neither entry — no empty clause, no
  placeholder residue, no stray separator.
- A turn with both emits both, with the corpus delta last.
- The assembled priming sits under the declared cap with headroom; a configuration over the
  cap fails loudly naming the offending entry and produces no truncated priming.
- The session is told of no tool it was not granted: nothing in the priming claims the
  transcript is addressable.
- The existing REQ-131, REQ-160, REQ-174 and BUG-63 UATs pass against the configured form.


### As built — corrections and additions to the scope above

*2026-09-07.* Three things the scope stated loosely or not at all, stated now because
a UAT asserts each of them.

**The reminder is six entries, not five.** The site line, two habit entries
(no framework vocabulary, act rather than narrate), the method pointer, the change
signal and the corpus delta. The site line stays first because it is the framing the
rest hangs off, and the delta stays last.

**Two reminder entries interpolate runtime state, so their words are templates.** The
site line names the slug and the change signal names a count and a cursor, so neither
can be an entry's `text`. They are declared as `{placeholder}` templates in the same
file and filled by the provider that renders them — the shape the framework already
uses for its own defaults, where prose lives in a data file and is bound into the
provider. A placeholder with no value is left as written rather than blanked, so a
mistyped one appears in the prompt as itself instead of vanishing.

**Every provider name the configuration may use is bound in one place.** `roles.ts`
owns the file that names providers and the function that says what each name reaches
(`registerSiteProviders`, plus the corpus seam). A name can only be added to the
configuration by binding it here too, and a binding nobody names is visible as dead
weight. The corpus-free order is what makes this checkable: it names exactly one
provider, and that one must be registered on every session whether or not a knowledge
base exists.

**The tests read the configuration, not a copy of it.** `primingText(name)` returns a
declared entry's text, and the REQ-171 / REQ-174 / REQ-160 / BUG-63 assertions that
used to compare against `CONSULTANT_SYSTEM`, `PRODUCT_SYSTEM`, `CONSULTANT_ROLE_TEXT`
and `CONSULTANT_PURPOSE` now read through it. That is not a mechanical substitution:
a constant holding a copy of the words can agree with the test and disagree with the
session, which is the failure the whole change exists to remove.

**Additional acceptance:** a host with no knowledge base loads the second declared
order, and that order names only providers registered without a corpus.