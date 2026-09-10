---
uid: comment-927645b2
id: COMMENT-2588
type: comment
title: Comment on bug BUG-73
created_by: xgd
created_at: '2026-09-10T19:40:37.002084+00:00'
updated_at: '2026-09-10T19:46:10.813117+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-317820d4
  kind: chat_transcript
---

<!-- xgd-turn id="f6f708bc-7806-4a6b-8b8e-fb522404f8f3-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T19:40:12.897213+00:00" -->
#### You
```
[wrangler:info] GET /b/biz_51a6746495c8057e886ff98d4208e6b9/preview/1stcontact/draft/assets/wordmark-option-a.svg 200 OK (9ms)
[wrangler:info] GET /favicon.ico 404 Not Found (4ms)
✘ [ERROR] Error: internal error; reference = 6knvuijid52gaa1eks2l9jl5

✘ [ERROR] Error: internal error; reference = nv7j5pdduce0ia1i6i2qjcvv

✘ [ERROR] Error: internal error; reference = vb94n4imn2m198b2met7qso9

✘ [ERROR] Error: internal error; reference = u16cn1n86sel1dt5pdr5nagv

✘ [ERROR] Error: internal error; reference = ivr1cb0e8bq0lukd2iqifbo8

✘ [ERROR] Error: internal error; reference = j4qo36sdrhq48ooe943uk43r

✘ [ERROR] Error: internal error; reference = aen4mbqhsvp4kgj3vndc9h5k

✘ [ERROR] Error: internal error; reference = pk66teg52h7obe6jium6fv1h

✘ [ERROR] Error: internal error; reference = m8lv628eucek45ebu13c9q1m

✘ [ERROR] Error: internal error; reference = 4compo0tnd1o6bpq3gr6a1m1

✘ [ERROR] Error: internal error; reference = k3tua09c9gfdcrgu1gbhlmdb

✘ [ERROR] Error: internal error; reference = dcsgdh64j0h964g0v0qp5plt

```

Seeing this in the dev-server console

<!-- xgd-turn id="f6f708bc-7806-4a6b-8b8e-fb522404f8f3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T19:46:09.541188+00:00" -->
#### Claude
Diagnosed from the wrangler debug log (`~/Library/Preferences/.wrangler/logs/wrangler-2026-09-10_19-01-21_076.log`) — the console only shows the sanitised half of these.

**What they are:** `internal error; reference = <id>` is workerd's redacted internal-error form. `env.AI` is the **only remote binding** in `apps/control-app/wrangler.toml` (DB, SITES, BLOBS, BROWSER, ASSETS are all local), so anything failing through a remote proxy is Workers AI.

**The timing is the giveaway:**

| | |
|---|---|
| last remote-preview session established | 19:23:21 |
| first burst | 19:31:39 (+8m18s) |
| further bursts | 19:32:47, 19:38:41, 19:38:58 — all still failing |

No further `edge-preview` POST appears in the log. Wrangler has no refresh timer for the preview token; its only expiry handling (`handlePreviewSessionUploadError`, CF code 10049 → *"Preview token expired, fetching a new one"*) fires on **re-upload**, i.e. on a worker reload. So once the dev server idles past the token's lifetime, every `env.AI` call fails until something triggers a reload.

Workers AI itself is fine — a direct REST call to `@cf/baai/bge-small-en-v1.5` on the account returns vectors right now.

**What it costs you in practice:** every knowledge-base search in the chat panel fails after a few idle minutes, and the only signal is that opaque reference id.

Two things I have *not* established, and won't claim: I didn't reproduce it, and the "exactly three errors per burst" is unexplained — `CoRankedKnowledge.search` fans out over 2 KBs under `Promise.all`, so the third call is unaccounted for.

**Options** (BUG-73 now records all of this):

1. **Workaround** — touch a file to force a reload; the token refreshes on re-upload.
2. **Real fix** — stop using the remote binding locally. `WorkersAiEmbedder` already takes `{accountId, apiToken}` over REST, which is the path `1c kb build` uses. Select that in local dev and `env.AI` isn't needed at all: no preview session, no expiry, no per-call charges, and the standing "AI bindings always access remote resources" warning disappears.
3. **Legibility** — whatever the cause, a failed embed should name the binding and the KB rather than surfacing a bare workerd reference.

Production is unaffected either way — a deployed Worker reaches Workers AI in-datacentre with no preview session involved.

Want me to take (2), and is it worth folding (3) in at the same time? I haven't cut a branch or written code yet.

<!-- xgd-chat-end -->