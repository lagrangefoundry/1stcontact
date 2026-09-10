---
uid: comment-cbc306f3
id: COMMENT-2566
type: comment
title: Comment on bug BUG-69
created_by: xgd
created_at: '2026-09-10T17:21:28.655054+00:00'
updated_at: '2026-09-10T17:30:28.990236+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-cbccc6ad
  kind: chat_transcript
---

<!-- xgd-turn id="d288f428-c952-4e8d-a68a-8b4f82323ad3-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:21:14.772680+00:00" -->
#### You
As I move between Businesses (with the business/site selector) in 1c the site pane updates correctly, but the chat window does not always do so - right now I just switched from Lagrange Foundry to XGD. I see the XGD site on the left but the Lagrange Foundry chat on the right

<!-- xgd-turn id="d288f428-c952-4e8d-a68a-8b4f82323ad3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T17:30:28.601739+00:00" -->
#### Claude
Found it — and the data confirms it. Let me write the scope ticket.

Now the fix in `chat.js`:

Now `app.js`:

Now the UAT:

Now I'll write the UAT file.

Now merge back into `xgd-working`:

Now rebuild the builder assets in the main checkout so the running app picks this up:

Fixed and landed on `xgd-working`. **BUG-69** is at `free_coded`, commit `9898bc8`.

**What was wrong.** The origin derives a chat session id from the slug alone — `site-<slug>`. That's unique where the origin resolves it, because every request carries `/b/<businessId>` and the host reads the id against that business's own store. It is *not* unique in the browser: slugs are per-business by design. Your two businesses both have a site slugged `unnamed`:

```
biz_5b10…  Lagrange Foundry   unnamed
biz_96fc…  XGD                unnamed, xgd
```

The chat pane deduped on the id (`if (next === sessionId) return`), so the switch asked the origin under the new scope, got XGD's transcript back — and threw it away, because `site-unnamed` was already what it was showing. That's why it only happens sometimes: only when the two sites share a slug.

**The fix.** The pane is now told which conversation it's showing, as a `key` beside the session. `app.js` scopes the session id by the selected business exactly the way `api.js` scopes a URL (`biz_xgd/site-unnamed`, bare when there's no business). The wire `sessionId` is untouched — it's still what turns are addressed to. The mount key follows too, so a half-typed message stays with the business it was typed under instead of surfacing under another business's same-named site.

**Tests.** `tests/test_UAT_FC_BUG-69_chat_follows_the_business.test.ts` — three cases, all three verified failing before the fix and passing after. The existing REQ-179 shared-slug case missed this because its fixture returned an empty transcript and only asserted the transport had been *asked*. Regression scope: 25 builder suites, 181 passing. Two pre-existing failures in `reconciliation-copy-edit-form-presentation.test.ts` (modal width CSS, and a font assertion that only fails in a worktree) — both unrelated and present on a clean `xgd-working`.

**One thing you need to know:** `./bin/1c assets` refuses to run right now, so the builder JS your dev server serves is still the old bundle. It's blocked on something unrelated to this fix — the system KB corpus and index disagree (`DOC-47`, `DOC-48`, `REF-l1`, `REF-surface` stale in the index). Run `1c kb build` (or `bin/kb-release`) and then `./bin/1c assets` to see the fix in the app. I didn't do that myself since it needs the admin token and rewrites the KB bundle.

<!-- xgd-chat-end -->