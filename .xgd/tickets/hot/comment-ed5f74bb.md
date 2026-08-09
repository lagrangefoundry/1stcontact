---
uid: comment-ed5f74bb
id: COMMENT-530
type: comment
title: Comment on request REQ-101
created_by: xgd
created_at: '2026-07-27T20:27:05.335808+00:00'
updated_at: '2026-08-09T17:45:09.087053+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b63bbed5
  kind: chat_transcript
---

<!-- xgd-turn id="1b554fcb-5829-467f-93b1-f540c729f1e0-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T20:27:03.278439+00:00" -->
#### You
PLlease free code this ticket

<!-- xgd-turn id="77ea9efb-089c-416b-b55c-84500bf35a46-user" -->

<!-- xgd-chat role="user" ts="2026-07-29T00:24:24.864236+00:00" -->
#### You
PLease free code this ticket

<!-- xgd-turn id="77ea9efb-089c-416b-b55c-84500bf35a46-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-29T00:32:10.224713+00:00" -->
#### Claude
I'll start by reading the ticket and investigating the current state.

Interesting — `fonts/` and `cli/fonts.ts` already exist. Let me check whether prior work landed.

A prior session committed the work but never recorded it on the ticket. Let me verify state.

Work is committed but the ticket was never updated and there's no version bump in the commit. Let me verify tests pass and check the version bump requirement.

Tests pass. Let me verify the test naming convention, the registry backfill, and run the CLI end-to-end.

Now let me run the CLI end-to-end and the broader regression scope.

Implementation works. Now the regression scope — full test suite plus a clean build/typecheck.

All 900 tests pass. Now a typecheck — green vitest doesn't prove type-clean.

Typecheck clean. Let me review the schema additions before finalising.

Let me verify the backfill is genuinely complete against what's actually on disk.

Backfill is exactly complete (23 on disk, 23 registered, no drift). One gap: those `storage/references/**` capture fonts are registered but nothing *enforces* it — they aren't referenced by any site, so only a hardcoded 7-name list in the test holds them. Let me check the layout.

`storage/dist/` is derived and gitignored; the real trees are sites/, sandbox/, references/. Note `sandbox/joyfulculinary` has 7 fonts no site references — exactly the blind spot. Let me look at the helpers.

Now let me close the drift hole — enforce that every font file in the source trees is registered, not just the ones a site references.

Now the disk scan itself:

Now wire the scan into the check and the import list:

Now update the report header line so the disk scan is visible in output:

Now export the new symbols and fix the test's now-optional `usage` access:

Now the UAT for the new behaviour. Let me look at the workspace fixture helper first:

Now add the `writeFontFile` helper and the import:

11 pass, and the new UAT is a proper before/after discriminator. Now typecheck and the full suite.

All 902 pass, typecheck clean, CLI green. Now the version bump and commit.

Now update the ticket body (preserving the operator's content) and move to `free_coded`.

Done — REQ-101 is at `free_coded` with both commits recorded.

## What I found

A prior session had already implemented and committed the bulk of this (`a2b2f7a2d`), but never completed the free-coding lifecycle: no version bump, `fields.commits` empty, status still `draft`. That commit was one sync away from being reverted.

## What was already there (verified, not assumed)

- `fonts/registry.yaml` — 10 families, 23 files, with `licence.redistribute_in_product` as a three-state value (`true` / `false` / `REVIEW_REQUIRED`), every gate treating the unresolved state as *no*.
- `siteConfig.distribution: 'internal' | 'product'` as the marker that switches on the strict gate.
- `1c fonts check` joining sites against the registry.
- Backfill complete — I checked disk against registry programmatically: 23 files, 23 registered, zero drift in either direction.

## The gap I closed

The check joined only what a page *referenced*. That left the class this ticket cares most about invisible: a capture bundle mirrors third-party fonts into `storage/references/`, and those bytes are in the repo whether or not anything points at them — with exactly the redistribution status least likely to be clear. `sandbox/joyfulculinary` has 7 such files today that no site references. Their registration was held only by a hardcoded 7-filename list in a test.

That is the documentation-drift failure mode the registry exists to prevent. Added a source-tree scan and a fourth violation kind, `unprovenanced-file`: every font file under `storage/` (minus derived `dist/` and vendored `node_modules/`) must be accounted for. Acceptance criterion 4 went from a state someone asserted once to a live gate holding in both directions.

## Verification

- Full suite: **902 passing / 128 files** (up from 900 — 2 new UATs).
- `tsc --noEmit` clean for `tools/generate` and `packages/site-schema`. Green vitest doesn't prove type-clean here, so I checked separately.
- `1c fonts check` on the real repo: exit 0, 10 families, 13 references across 3 sites, 23 files on disk, 7 families with advisory open actions.
- The new UAT is a proper before/after discriminator — asserts `pass: true`, drops an unregistered file, asserts `pass: false`.

## One thing I deliberately did not build

No acquisition verb (`1c fonts add <url>`). The gap statement mentions one, but the operator direction and all four acceptance criteria are about *tracking*, not automation — and a download command is only useful once the font menu it draws from exists. Flagged in the ticket body under "Not done (deliberate)" so it's a visible decision rather than a silent omission. Say the word if you want it.

Ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is your call.

<!-- xgd-turn id="1b554fcb-5829-467f-93b1-f540c729f1e0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T20:41:15.759531+00:00" -->
#### Claude
I'll start by reading the ticket and surveying the current state.

Ticket read. Now let me survey the CLI structure and font landscape.

Now let me look at the site config schema to find where a product-distribution marker belongs.

Now I have the full picture. Let me write the registry schema in `site-schema` (where zod lives).

Now wire it into the schema exports and add the site distribution marker.

Now the check command itself.

Now wire the command into the CLI dispatcher.

Now wire the command in: import, export, USAGE, and dispatch case.

Now let me gather accurate provenance data for the backfill from the capture bundles.

Now the backfilled registry.

Let me verify the check runs against the real trees before writing the UATs.

Now the UATs — driving the real `1c` CLI entry point against a real on-disk site tree.

Perfect — a canonical starter exists. Let me use it instead of a hand-rolled theme.

All 9 pass. Let me clean up the unused import and simplify the awkward registry helper.

Now let me verify the CLI end-to-end and run the full regression scope.

Typechecks clean. Now the full regression scope.

Clean rebuild green. Now version bump and commit.

Now let me update the ticket, preserving the operator's existing body.

Now let me append the implementation record to the ticket body, preserving the operator's existing content.

The append took `-` literally. Let me check the correct flag and repair.

Done. REQ-101 is free-coded and committed.

## What landed

**`fonts/registry.yaml`** — the project-level provenance index. Per family: foundry, source URL, download date, licence name/URL, `commercial_use` / `self_host` / `redistribute_in_product`, outstanding actions, and the file list. Backfilled complete: **10 families, 23 files** across `sites/`, `sandbox/` and `references/`.

The registry separates two provenance classes honestly:
- **Authored** — Satoshi (ITF FFL, `REVIEW_REQUIRED` — non-transferrable and terminable), JetBrains Mono (OFL, `true`).
- **Capture-derived** — Cinzel, Oswald, Lato, Raleway, Karla, Font Awesome, eicons. Mirrors of someone else's CDN delivery; families mostly OFL but subsetting provenance unverified, so each carries `REVIEW_REQUIRED` plus a re-obtain-upstream action. `eicons` is `false` outright.

**`1c fonts check`** — joins every site's `l1.resources.fonts` against the registry. Fails on `unregistered-family`, `unregistered-file` (a hand-added weight escaping the record), and `redistribution-not-permitted`. Scans both `sites/` and `sandbox/` in one pass, no flags — a licence attaches to the font, not the site. A missing registry is a hard error, never a vacuous pass.

**`config.distribution: 'internal' | 'product'`** on `siteConfigSchema` — the marker that arms the product gate, part of the validated site contract.

## One judgment call worth flagging

The ticket's prose said fail on "a family that is unregistered **or carries an unmet action**", which contradicts its own acceptance criteria. I implemented the acceptance criteria: **actions warn, they don't fail.** Satoshi legitimately has an open legal-review action while xgd.dev is not product-distributed — failing on that makes the registry unusable on day one. Registration is provenance, not approval; `redistribute_in_product` is the gate, and `REVIEW_REQUIRED` is treated as "no" everywhere so an unanswered licence can't leak into product by default.

## Verification

9 UATs in `tests/req101-font-registry.test.ts`, driving the real `run(['fonts','check'])` entry point against real on-disk trees in temp workspaces. One asserts the *shipped* registry accounts for the files actually on disk; another asserts the check holds green over the real repo. Full suite **121 files / 854 tests passing**; clean-from-scratch `site-schema` rebuild plus `--noEmit` typechecks of `tools/generate`, `control-app`, `public-site` all clean.

Ticket at `free_coded`, commit `8c6053f26`, version `0.0.213`, story_points 3. Original body preserved with the implementation record appended.

## Needs your call

`tools/generate/src/cli/fonts.ts` imports `yaml`, which is a workspace-**root** devDependency not declared in `tools/generate/package.json`. It resolves fine today (node walk-up; CI installs root devDeps) and matches existing repo practice — `jsdom` is used the same way. Declaring it properly needs a lockfile update, which I didn't run:

```
pnpm add yaml --filter @1stcontact/generate
```

Also left untouched: the pre-existing `CLAUDE.md` modification and untracked `storage/sites/xgd/import/` — neither is mine.

<!-- xgd-chat-end -->