---
uid: comment-cc47f70c
id: COMMENT-2276
type: comment
title: Comment on bug BUG-51
created_by: xgd
created_at: '2026-09-05T18:26:52.726905+00:00'
updated_at: '2026-09-05T18:57:29.926858+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-61165116
  kind: chat_transcript
---

<!-- xgd-turn id="8f1e3876-91f7-4d61-b156-af50f2a10b1f-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T18:26:37.236732+00:00" -->
#### You
I'm not sure if this is expected behavior or not: I was working earlier - just playing with the system and I had the AI create a demo website.

I just fired up the server again - our chat transcript is intact, but the site we were working on is gone?

<!-- xgd-turn id="8f1e3876-91f7-4d61-b156-af50f2a10b1f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T18:34:03.694604+00:00" -->
#### Claude
Not expected. Your site wasn't deleted — its content was **overwritten with a blank starter scaffold**, which is why everything *around* it survived.

**What's still in the local store** (`tenant=1stcontact`, `slug=alpha` — the "Gigabyte Alchemy" site):

- chat transcript — intact (38,896 bytes)
- the 16-record change journal — intact
- your uploaded `AlchemistLabWithTech.png` — intact in R2
- the 65-record AI audit trail — intact

**What's gone:** `site_json` and `home.json`, both replaced by the `1c new` scaffold — one centred placeholder reading `alpha`, no palette.

Two things prove overwrite rather than delete-and-recreate: `version` is still 26 and `counter` still 16 (a recreate starts both at 0), and `updated_at` is `2026-09-03T03:12:17Z` — ~7h40m after your last AI edit, with no audit record at that moment, so it didn't come through the AI surface.

**Mechanism.** `SiteStore.write()` (`tools/generate/src/store/d1r2-store.ts:461`) replaces `site_json` outright and upserts pages by name, with no guard on existing content. `createDraft()` is `INSERT OR IGNORE` and looks protective, but every "create a starter site" path is `createDraft` *then* `write(starter)` — so on an existing slug the first call does nothing and the second wipes the page. Both call sites do this: `identity.ts:597` (provisioning) and `router.ts:884` (`POST /api/import`, i.e. `bin/publish`).

Which path fired is inferred, but the evidence is narrow: the scaffold on disk has its heading set to the slug (`"alpha"`), whereas provisioning always passes `STARTER_HEADING = 'Your 1stcontact site'`. Heading-defaults-to-slug is `1c new`'s shape, and that reaches D1 only via `/api/import`. `bin/publish` defaults to `http://localhost:8788` — your running dev server — so a `1c new alpha` + `bin/publish` in *any* checkout, including a free-coding worktree, lands on top of whatever you have at that slug. The same thing produced a second scaffolded `alpha` under `acct_uatwestheadme` on Sep 3.

**Recoverable.** The audit records carry full `set_l1` node payloads — `audit/1stcontact/site-alpha/1788374147.604-0015.json` (5,970 bytes) holds the whole hero/about/pillars document with the background image, overlay and palette hexes. Replaying the write-effect records in key order reconstructs the page; last mutating op was a `write_image` at `1788376498.045`.

I've written all of this up on BUG-51 (severity high) with two defects called out: (1) a scaffold write can destroy authored content, and (2) there is no undo — the journal stores labels, not documents, and `alpha` was never published so there's no revision snapshot either.

No code written yet — the fix scope needs your call. Options I listed on the ticket: guard the starter write against a slug that already holds content; make `/api/import` require an explicit force; or snapshot before any destructive write. Want me to restore the site from the audit trail first, and/or pick a fix direction?

<!-- xgd-turn id="ee0891b5-15a0-42f5-b9d9-caa82e1c5a33-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T18:39:42.647591+00:00" -->
#### You
So we are still very much in test mode. It would be nice to get the site back but if not its not a huge deal.

What I do need tho is control - the default should be that the site, transcript history is preserved between server restarts. But I also need a "reset" command so that I can start a test from a completely fresh, known state.

<!-- xgd-turn id="ee0891b5-15a0-42f5-b9d9-caa82e1c5a33-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T18:57:29.502174+00:00" -->
#### Claude
Design settled. Let me record the behaviour spec on the ticket before cutting a branch.

Now B2 — `createDraft` reporting creation, and provisioning honouring it.

Now the UATs.

Now the reset UAT (node project).

Done and merged back. BUG-51 is `free_coded` at version 0.2.74 (commits `a6f66c3`, `cfe4cce`).

**⚠️ Before you run `1c reset`:** the Gigabyte Alchemy site is still recoverable from the R2 audit trail — and that trail lives in `.wrangler/state`, which is exactly what reset deletes. Say the word and I'll reconstruct the site first.

## Restart was never the problem

`1c builder` runs `wrangler dev`, which already persists D1 and R2 to `apps/control-app/.wrangler/state` and neither seeds nor clears it. Your site didn't die on restart — it died to an unguarded overwrite. So "preserved by default" is delivered by closing those, not by changing startup.

**Imports no longer replace builder work.** `POST /api/import` reads the site's change counter first. Zero (fresh site, or one only ever published from `storage/sites/`) → lands as before. Non-zero → 409, nothing written, naming the slug and how many changes it protected. `1c push --force` / `bin/publish --force` overrides.

The counter, not the version, is deliberate: `write` bumps `version` on its own call, so a version guard would refuse the second `bin/publish` of a site nobody had touched. `counter` moves only through `appendChange` — a builder edit, an AI turn, a structured-edit command.

*One consequence to expect:* `1stcontact/xgd` has counter 1, so re-publishing it now needs `--force`. That's the intended reading — that edit would otherwise be discarded.

**`createDraft` now reports whether it created the row.** `INSERT OR IGNORE` always knew; the port threw it away, which is why every caller followed it with an unconditional `write` and the "or ignore" protected nothing. `createStarterSite` scaffolds only on creation. This one is a structural guard, not a live fix — the starter slug is 16 random bytes, so provisioning can't currently collide. It becomes reachable the moment REQ-183 seeds the portal site, whose slug is fixed.

## `1c reset`

```
1c reset                          # preview: what it would remove, deletes nothing, exits 0
1c reset --yes                    # do it
1c reset --yes --include-public   # plus apps/public-site/.wrangler/state
1c reset --yes --port 9000        # if your builder isn't on 8788
```

It empties `apps/control-app/.wrangler/state` — every site, page, journal, asset, revision, transcript, ticket, tenant and audit record; equivalent to a fresh clone. It never touches `storage/`, since `storage/sites/` is the tracked source a re-seed comes from. It refuses while something is listening on the dev port, because a live miniflare holds those SQLite files open and deleting underneath it corrupts the store rather than emptying it.

That refusal is not theoretical — it fired for real during testing against your running server on 8788, and deleted nothing.

## Tests

17 new UATs across two files, all passing, plus the store/import/identity/invite suites (127 tests) green after the merge.

The full suite has 30 failures in 11 files — all KB and webui-scope suites. I baselined the same files on untouched `xgd-working` before my change: 31 failures in 12 files. Pre-existing, not mine. There's also one pre-existing typecheck error (`SHIPPED_SOURCE` in `session-knowledge.ts`) that fails identically on the base branch.

**Your running dev server is on the old code** — restart it to pick up the import guard.

<!-- xgd-chat-end -->