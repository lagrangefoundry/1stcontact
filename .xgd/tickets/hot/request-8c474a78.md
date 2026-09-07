---
uid: request-8c474a78
id: REQ-182
type: request
title: 'Adopt DOC-22 session priming: consultant preamble, reminder and KM priming
  become configuration'
created_by: xgd
created_at: '2026-09-03T03:23:15.763170+00:00'
updated_at: '2026-09-07T00:01:52.168239+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
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
**The document tier.** DOC-22's 2026-09-03 amendment designs a fourth tier, on the argument that
whole-document `get` calls relocate context pressure into turns two-through-five rather than
removing it. It is **not implemented** upstream (no `documents` tier exists in `roles.py`). Adopt
the three shipped tiers; the fourth is a later migration.

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
