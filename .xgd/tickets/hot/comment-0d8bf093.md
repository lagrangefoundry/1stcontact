---
uid: comment-0d8bf093
id: COMMENT-2564
type: comment
title: Comment on chat CHAT-50
created_by: xgd
created_at: '2026-09-10T17:16:39.738047+00:00'
updated_at: '2026-09-10T17:22:31.227344+00:00'
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

<!-- xgd-chat-end -->