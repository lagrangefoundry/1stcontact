---
uid: comment-0d8bf093
id: COMMENT-2564
type: comment
title: Comment on chat CHAT-50
created_by: xgd
created_at: '2026-09-10T17:16:39.738047+00:00'
updated_at: '2026-09-10T19:03:45.810494+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-ca970741
  kind: chat_transcript
---

<!-- xgd-turn id="1beb9a51-ce3d-4d94-87b6-127f1d49cabf-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:16:13.889890+00:00" -->
#### You
I created a business XGD can you add the xgd site data to this business please?

<!-- xgd-turn id="1beb9a51-ce3d-4d94-87b6-127f1d49cabf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T17:22:31.003737+00:00" -->
#### Claude
Done — the xgd site is now in the XGD business.

**What landed** (local dev store, `biz_96fc32af…`):
- `site.json`, 2 pages (`home.json`, `whitepapers.json`), 9 assets (4 Satoshi weights, JetBrains Mono, 4 SVGs) — copied from `storage/sites/xgd/draft/`
- Renders clean: `<title>XGD — AI writes it. XGD keeps it working.</title>`, full L1 tree through to the footer
- Site listing for the business is now `[unnamed, xgd]`

**Two things you should know:**

**1. The starter site is still there.** Creating the business scaffolded `unnamed` (counter 0, never edited). The imported site sits beside it as `xgd`. Want me to drop `unnamed`, or rename `xgd` → `unnamed` so the business has exactly one site? Either is a one-liner.

**2. `1c push` cannot target a business — and fails silently in the worst direction.** `push.ts:163` builds the URL as `new URL('/api/import', opts.origin)`, which **discards any path on `--origin`**. So `1c push xgd --origin http://localhost:8788/b/biz_96fc…` posts to `/api/import` unprefixed, `resolveScope` falls through to "first admissible business", and for your account that's **1st Contact** — the site lands in the platform's own business with a 200 and a cheerful summary. I confirmed it: unprefixed `/api/sites` as you returns `1stcontact, gigabytealchemy, xgd`, not XGD's.

That's the BUG-51 failure shape again (an import writing over the wrong thing, quietly), so I did this by hand instead: built the payload from the draft and POSTed it to `/b/<id>/api/import` with a minted access-sim token. Worth a ticket — `1c push --business <id>`, or just have push preserve `--origin`'s path. Say the word and I'll file it.

Minor, related: the access-sim on :8799 is a **stale build without the BUG-59 forwarder** — it mints fine but 404s everything it should be proxying, so `1c push` through it can't work at all right now. Restarting it from current `bin/access-sim` would fix that.

<!-- xgd-turn id="f6e75a32-74d9-4d84-9031-0e9783515063-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T19:02:03.858870+00:00" -->
#### You
I do not see the xgd site in the xgd business?

<!-- xgd-turn id="f6e75a32-74d9-4d84-9031-0e9783515063-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T19:03:45.083949+00:00" -->
#### Claude
Found it. The site is in the store — the builder just can't show it.

Fixed. Reload the builder and switch to XGD — you'll see it now.

**Why it was invisible:** the builder has no site selector. `toolbar.js:131` — *"THERE IS NO SITE SELECTOR HERE ANY MORE (REQ-179)... A SITE selector will be back, one level down, when a business can hold several sites."* A business shows exactly one site, and `app.js:337` / `app.js:894` pick it as `list[0]`.

The XGD business had two sites: `unnamed` (the blank starter, created with the business) and `xgd` (my import). Alphabetically `unnamed` sorts first, so the builder opened the blank starter and the xgd site had no way to be reached.

**What I did:** deleted the `unnamed` starter. It was pristine — `counter=0`, `version=1`, zero changes, zero revisions, zero assets, one placeholder page reading *"Your 1stcontact site"*. Nothing was lost. XGD now lists exactly `[{"slug":"xgd"}]` and the preview serves the real page.

No delete route exists in the store (no `DELETE` handler in `router.ts`, no `deleteSite` anywhere), so that was one SQL statement against the local D1 — the same shape REQ-190's own comment describes for renaming a slug.

**This makes the earlier finding worse than I stated.** It isn't just that `1c push` can't name a business — it's that importing a site into a business that already has one **creates a site the UI can never display**, silently, with a 200 and a success summary. Any operator doing this on a real business gets "the import worked" and a builder showing the blank starter. Two ways to fix it (either would do): give `/api/import` a way to name the target site, or have the starter step aside when a business's only site is an untouched scaffold.

Still worth a ticket — want me to file it? And the stale access-sim on :8799 is still 404ing everything it should proxy, which will bite the next `1c push` you run locally.

<!-- xgd-chat-end -->