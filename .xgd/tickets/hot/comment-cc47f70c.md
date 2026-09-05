---
uid: comment-cc47f70c
id: COMMENT-2276
type: comment
title: Comment on bug BUG-51
created_by: xgd
created_at: '2026-09-05T18:26:52.726905+00:00'
updated_at: '2026-09-05T18:39:43.050580+00:00'
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

<!-- xgd-chat-end -->