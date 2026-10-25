---
uid: comment-9bd9002b
id: COMMENT-3006
type: comment
title: Comment on bug BUG-96
created_by: xgd
created_at: '2026-09-15T23:21:17.013073+00:00'
updated_at: '2026-09-15T23:27:25.155534+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-400041c0
  kind: chat_transcript
---

<!-- xgd-turn id="2e623845-a8f5-41f5-8d43-f14e14161319-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T23:21:00.962252+00:00" -->
#### You
I tried to "send" myself the whitepapers email from the form but I was show:

"This site cannot take messages at the moment."

And this appeared in the logs: 

✘ [ERROR] {"event":"lead_capture_failed","site":"site_bca807fc7cdd0bf418b15e255f8c45c6","error":"D1_ERROR: table asset_grants has no column named form_handle: SQLITE_ERROR"}

<!-- xgd-turn id="2e623845-a8f5-41f5-8d43-f14e14161319-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T23:27:24.987187+00:00" -->
#### Claude
Found it — this isn't a code bug. Diagnosis:

**The `ALTER TABLE` landed on disk; the running dev server never saw it.**

| fact | timestamp (UTC) |
|---|---|
| control-app `wrangler dev` session started (`.wrangler/tmp/dev-*`) | 2026-09-15 **18:37** |
| `0009_asset_grant_form_handle.sql` applied to local D1 | 2026-09-15 **22:36:32** |
| your form submission failed | 2026-09-15 **23:21** |

The local D1 file on disk is correct right now:

```
CREATE TABLE asset_grants (
  id, contact_id, business_id, site_id, form_handle, created_at, revoked_at )
```

…but the workerd process that executed the INSERT has held that SQLite file open since 18:37 — four hours before the rename — and is still serving the pre-rename schema from its cache. `bin/deploy.d/migrate/README.md`'s sibling note already warns about exactly this: restart `wrangler dev` after applying a migration.

**Fix: restart the dev servers.** `public-site` (8787) is already down; `control-app` (8788) is the one still running stale. Restart both and the submission will go through — nothing to change in the code.

Two things I ruled out along the way:

- **It wasn't remote/production.** Production D1 *is* still at `0001` (eight migrations pending, so its `asset_grants` genuinely has `instance_id`) — but it holds **zero sites**, and `captureLead` starts with `businessOfSite()`, so a remote hit would have logged `lead_not_captured / unknown_site` rather than throwing. Your error is a thrown D1 exception, which only the local path produces.
- **It wasn't `public-site`'s own D1.** That store (`apps/public-site/.wrangler/state/…`) is empty and stale since Sep 10 — the write happens in `control-app` via the `LEAD_INTAKE` service binding, against control-app's store.

Two adjacent things worth deciding, neither of which I've touched:

1. **Nothing applies local migrations when dev starts.** `pnpm dev` runs `wrangler dev` directly; the local D1 is only ever migrated by someone remembering to run `wrangler d1 migrations apply 1stcontact --local` by hand. This class of failure will recur, and it fails as a 503 with a cryptic log line rather than at startup.
2. **Production D1 is eight migrations behind**, which (per the earlier investigation) implies `bin/deploy` has never completed successfully against production.

Want me to scope either of those onto this ticket, or leave BUG-96 as the record of the restart diagnosis? I've not written anything to the ticket yet — tell me which shape you want and I'll fill it in.

<!-- xgd-chat-end -->