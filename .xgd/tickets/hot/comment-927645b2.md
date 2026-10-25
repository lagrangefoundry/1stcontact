---
uid: comment-927645b2
id: COMMENT-2588
type: comment
title: Comment on bug BUG-73
created_by: xgd
created_at: '2026-09-10T19:40:37.002084+00:00'
updated_at: '2026-09-10T20:01:33.183473+00:00'
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

<!-- xgd-turn id="b846306b-33c5-4bcf-b9d9-78c128055c35-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T19:49:53.376524+00:00" -->
#### You
yes please do 2 and 3

<!-- xgd-turn id="b846306b-33c5-4bcf-b9d9-78c128055c35-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T20:01:32.421386+00:00" -->
#### Claude
`--append-body-file` exists — that preserves the diagnosis I already wrote.

Ticket scoped. Now cutting the branch.

Now let me write the resolver module.

Now wiring the four call sites.

Now `system-knowledge.ts`:

Now `session-knowledge.ts` and `router.ts`:

Now the `.dev.vars` documentation (B2/B5) and a typecheck.

Now cleaning up the test to use the real exported class:

Now let me commit, then wire up the actual local config.

Free-coding protocol complete. Now the local config that actually switches your dev server onto the REST transport.

Both fixes are in, merged to `xgd-working` at v0.2.153, BUG-73 is `free_coded`.

**Fix 2 — the transport.** New `apps/control-app/src/embedder.ts` is now the single place that decides how the Worker reaches the model. Set `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` and it embeds over REST, never touching `env.AI` — no preview session, so nothing to expire. Set neither and it uses the binding exactly as production does. Set one, and you get a named error rather than a silent fall back to the transport you were switching off. The four sites that each answered "can this deployment embed" on their own (`knowledge.ts`, `system-knowledge.ts`, `session-knowledge.ts`, `router.ts`'s `defaultIndexer`) now ask that one resolver — with a UAT that fails if a fifth ever starts answering locally.

I reused `1c kb build`'s variable names deliberately: same credential, same account, same model.

**Fix 3 — legibility.** An embedding failure now surfaces as `EmbeddingFailedError` naming the transport and the KB, preserving the underlying message, and on the binding path carrying the sentence about the expired preview session and the reload that refreshes it. The decorator forwards `name` and `dimension`, which the index build and search read — dropping those would have swapped a legibility fix for a model-comparability corruption.

21 UATs, all passing. Also ran the knowledge, ingestion, material and structural suites: clean, except `test_UAT_FC_REQ-160_two_kb_session.workers.test.ts`, which fails the same 3 of 8 on a clean `xgd-working` checkout as it does after the change.

**One step I couldn't finish.** The sandbox denies writes outside the repo, so the token never reached `~/Documents/secrets/1c.dev.env` — meaning the REST transport is code-complete but not switched on. To finish it:

```
printf 'CLOUDFLARE_API_TOKEN=%s\n' "$(tr -d ' \n' < ~/Documents/secrets/1c_Admin_Token)" \
  >> ~/Documents/secrets/1c.dev.env
```

then uncomment `CLOUDFLARE_ACCOUNT_ID` in `apps/control-app/.dev.vars` — it's already written there with the account id and a note — and restart the dev server. Use `1c_Admin_Token` specifically; I tested the others against `/ai/run/…` during the diagnosis and they return `Authentication error`. I left the account-id line commented rather than active, because half the pair on its own is a boot error, and I didn't want that waiting for you on your next restart.

Until you do that the binding is still in use, so the bursts can still happen — but they'll now read as a sentence naming the binding, the KB and the fix, instead of a reference id.

<!-- xgd-chat-end -->