---
uid: request-8c474a78
id: REQ-182
type: request
title: 'Adopt DOC-22 session priming: consultant preamble, reminder and KM priming
  become configuration'
created_by: xgd
created_at: '2026-09-03T03:23:15.763170+00:00'
updated_at: '2026-09-03T03:23:15.763170+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  auto_merge_back: true
  needs_review: false
---

**Design ref:** lagrange-framework DOC-22 (*Session Priming Configuration: three tiers, static
text and providers*), including Amendment §N–S. Blocked on lagrange-framework REQ-116
(`components/ai` JS) and REQ-118 (`components/ai_knowledge` JS).

**The upstream change is breaking by design** — `Role.system`, `Role.source`, `Role.reminder`
and the `ContextSource` seam are deleted with no shims. This host will not build against the new
`@lagrangefoundry/ai` until it adopts, so this lands as one migration rather than incrementally.

## Summary
`tools/generate/src/cli/ai/roles.ts` already describes DOC-22's model in its header comment —
*"The priming a session gets has three layers… 1. this preamble… 2. the tool manual — PROJECTED…
3. the reminder — re-applied on every turn."* The three layers were arrived at independently and
are correct; what is missing is a framework that expresses them, so they are currently a
1,500-word TypeScript template literal, a hand-called reminder function, and a per-turn mutation
of the framework's role object.

Adopt the upstream configuration so all three layers are declared rather than constructed.

## Scope

1. **`CONSULTANT_SYSTEM` → configuration** (`roles.ts:48`). The preamble becomes product-tier
   and role-tier `text:` entries in YAML. The split follows DOC-22 §2: anything true of the
   product regardless of role goes to the product file; "you are a design consultant and the
   site belongs to your client" is role-tier.

2. **`consultantReminder(slug, since, delta)` → reminder entries** (`roles.ts:~140`). Right
   shape, wrong wiring — it is already a callback over runtime state. It becomes:
   - two static `text:` entries (the no-framework-vocabulary and act-don't-narrate habits);
   - a provider for the site line, reading the slug from `ctx.scope`;
   - a provider for the REQ-131 change signal, returning `null` when no changes landed;
   - a provider for the REQ-160 corpus delta, returning `null` when nothing arrived.

   The existing `if (since.changes > 0)` and `if (delta)` guards **are** DOC-22 §4's
   `null`-drops-the-entry semantic; they stop being conditionals inside a joined string.
   Declaration order preserves the REQ-160 requirement that the delta rides last (the cached
   prefix argument in DOC-39 §6.4) — DOC-22 assembles in declaration order, so this is
   expressed by where the entry sits, not by string concatenation.

3. **Delete the per-turn role mutation** (`host-core.ts:827`). `role.reminder =
   consultantReminder(...)` currently reaches into the framework's role object and rewrites a
   field between turns, working only because `SessionManager` re-reads it. DOC-22 §S freezes
   `Role`, so this path is removed rather than discouraged. `baselines` stays — it still feeds
   the counter comparison; the `roles` Map's stated purpose (*"Held because the reminder is no
   longer a constant"*) evaporates.

4. **Delete the priming factory** (`host-core.ts:577`, `host.ts:158–175`). The duck-typed
   `{ documents: () => [box.manual()] }` literal, the `HostDeps.priming` field and the
   `KnowledgeDocs.open(...)` call all go. Replaced by product-tier `km.landscape` and
   `toolbox.manual` provider entries. **The ternary disappears**: a host with no KB is a
   product file without a landscape entry, not a runtime branch.

5. **`CONSULTANT_PURPOSE` → role-tier `text:`** (`host.ts:173`). It is currently passed to KM as
   `rolePurpose`; under DOC-22 §7 KM no longer accepts it and never sees the role.

6. **One `Role` for every site.** With the slug supplied by `ctx.scope` (item 2), the per-slug
   role instances keyed by `managerKey(slug, deps)` collapse to a single configured role.

7. **Delete `LEGACY_ROLE_NAMES`** (`roles.ts:193`) and its read path. DOC-22 §R rejects role
   aliases: there is no deployed installation with archived transcripts, so the alias guards
   against nothing. Delete the explanatory comment with it — it asserts that a rename would
   require rewriting *"the archives of every deployment, including a store-backed one in
   production"*, which is the premise being contradicted.

8. **Async providers simplify this host** (DOC-22 §N). `deps.priming` is already
   `(box) => Promise<...>`; with an async provider contract the `KnowledgeDocs.open()` /
   `documents()` split disappears and a recycled segment reads a fresh landscape instead of
   replaying one assembled at session start.

9. **`assets.ts:429`** lists `'KnowledgeDocs'` among shipped modules — update for its deletion.

## Acceptance criteria
- No priming or reminder prose exists as a TypeScript string constant; `CONSULTANT_SYSTEM` and
  the static half of `consultantReminder` are readable in YAML.
- No code assigns to any attribute of a `Role`.
- A turn with no site changes and no corpus delta emits neither entry — no empty clause, no
  placeholder residue.
- A turn with both emits both, with the corpus delta last.
- Switching a session between sites does not create a second `Role`.
- The assistant's manual still reflects only this session's actual grant (the projection
  property REQ-126 protects) — now via the `toolbox.manual` provider rather than a hand-passed
  `mechanism`.
- A document added to the client's KB mid-session appears in the landscape after a recycle.
- Existing UATs covering REQ-131 (change signal), REQ-160 (corpus delta) and REQ-174 (consultant
  register) pass against the configured form.
