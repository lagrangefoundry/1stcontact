---
uid: comment-18e5a285
id: COMMENT-1434
type: comment
title: Comment on request REQ-153
created_by: xgd
created_at: '2026-08-22T21:55:56.842025+00:00'
updated_at: '2026-08-22T22:10:16.559909+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-94e93caa
  kind: chat_transcript
---

<!-- xgd-turn id="609c92bd-9b65-4d27-8831-5d65634511da-user" -->

<!-- xgd-chat role="user" ts="2026-08-22T21:55:47.773211+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="609c92bd-9b65-4d27-8831-5d65634511da-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-22T22:10:16.443313+00:00" -->
#### Claude
I'll start by reading the ticket to see what's being asked.

The ticket is well-specified and both existing sites are clean (`home`, `contact`, `whitepapers`). Three judgment calls I'll make rather than block on — I'll flag them at handoff:

- **Full ISO-639-1 set** (184 codes), not a curated subset — faithful to the ticket, and a miss is permanent while a false positive is a clear error message.
- **Case-insensitive** — `/DE` is the same ambiguity as `/de`.
- **Script and numeric-region subtags too** (`zh-Hans`, `es-419`), not just `xx-XX` — those are real locale path segments.

Starting the free-coding flow.

Now wire it into `pageSchema`:

Now the UAT file:

`de-luxe` matched as `de` + a 4-letter script subtag — a real false-positive class (`no-cost`, `it-team` too). Script-qualified prefixes aren't in the ticket and are far less likely than those slugs, so I'll drop that arm and keep exactly `xx` / `xx-XX` / `xx-999`, documenting the omission:

Adding an authoring-path UAT so the guard is proven at the entry point an author actually uses:

Now merge back and promote:

A concurrent session claimed 0.2.4 while I was working. Bumping to 0.2.5 on the branch, same remedy as REQ-151 used:

Now update the ticket body and promote to `free_coded`:

Done — REQ-153 is at `free_coded`, merged into `xgd-working`, branch cleaned up.

**What landed**

- `packages/site-schema/src/locale.ts` — `ISO_639_1_LANGUAGES` (the full registry as data), `isLocaleShapedSlug()`, `localeShapedSlugMessage()`.
- `packages/site-schema/src/schema.ts` — `pageSchema.slug` gains a `superRefine`. Sitting on the field means the path is `/pages/N/slug` automatically, and since every writer funnels through `validateSite`, the CLI, the AI toolbox's `add_page` and the store loader all inherit the guard unchanged.

**The three judgment calls, as flagged upfront**

1. **Full ISO 639-1 set** — the rule is about what a segment could mean later, not what we render today.
2. **Case-insensitive** — `/DE` collides exactly as `/de` does.
3. **Script subtag dropped.** I initially included `language[-script][-region]`, and the test caught the consequence: `de-luxe` was refused. A four-letter tail is ordinary English (`no-cost`, `it-team`), so reserving that arm to defend `/zh-Hans/…` costs real slugs for a negligible collision. The numeric region (`es-419`) stayed — three-digit tails are never words. This differs from your ticket text, which named `xx-XX`; the final rule is exactly that plus the numeric form.

**Evidence** — 30 UATs in `tests/test_UAT_FC_REQ-153_locale_slug_reservation.test.ts`. AC-1 also asserts at the real authoring entry point (`editPageAdd` rejects `path: 'de'` with `SCHEMA_INVALID` at `/pages/1/slug`, leaves no partial page, and succeeds at `de-services`) — that's what proves the guard is reachable, not just present. AC-3 enumerates `storage/sites/*` at runtime and validates each draft *and every published revision*, with a non-empty assertion so it can't pass vacuously.

Regression scope green (156 passed / 2 skipped). A full `vitest.node` sweep has 8 failing files in builder/webui/AI-host/deploy suites — I baselined those by stashing the change and re-running the same set: **identical** 4 files / 14 tests failing with and without it, so they're pre-existing worktree-environment artifacts, not this change.

**One thing worth knowing:** a concurrent session claimed version 0.2.4 mid-flight, so this needed a second commit bumping to 0.2.5 (same remedy REQ-151 used). Both SHAs are on the ticket.

<!-- xgd-chat-end -->