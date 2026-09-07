---
uid: comment-ef5524d0
id: COMMENT-2307
type: comment
title: Comment on bug BUG-63
created_by: xgd
created_at: '2026-09-07T20:20:47.537352+00:00'
updated_at: '2026-09-07T20:27:36.030483+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d672f592
  kind: chat_transcript
---

<!-- xgd-turn id="1504ce6c-5fba-4bb2-94f2-589b4120e91a-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T20:18:57.328269+00:00" -->
#### You
```
((.venv-working) ) martin@nyx control-app % cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app
npx wrangler dev --port 8788 \
  --env-file .dev.vars \
  --env-file ../../.dev.vars.local \
  --env-file "$HOME/Documents/secrets/1c.dev.env"

 ⛅️ wrangler 4.106.0
────────────────────
Using secrets defined in .dev.vars
Using secrets defined in ../../.dev.vars.local
Using secrets defined in ../../../../Documents/secrets/1c.dev.env
Your Worker has access to the following bindings:
Binding                                                                 Resource                  Mode
env.DB (1stcontact)                                                     D1 Database               local
env.SITES (1stcontact-sites)                                            R2 Bucket                 local
env.BLOBS (1stcontact-material)                                         R2 Bucket                 local
env.BROWSER                                                             Browser Run               local
env.AI                                                                  AI                        remote
env.ASSETS                                                              Assets                    local
env.TENANT_ID ("biz_51a6746495c8057e886ff98d4208e6b9")                  Environment Variable      local
env.PLATFORM_ADMINS ("(hidden)")                                        Environment Variable      local
env.ACCESS_DEV_OPEN ("1")                                               Environment Variable      local
env.ACCESS_TEAM_DOMAIN ("(hidden)")                                     Environment Variable      local
env.ACCESS_AUD ("(hidden)")                                             Environment Variable      local
env.MAIL_FROM ("no-reply@1stcontact.io")                                Environment Variable      local
env.SESSION_COOKIE_NAME ("session")                                     Environment Variable      local
env.SESSION_COOKIE_DOMAIN ("")                                          Environment Variable      local
env.ANTHROPIC_API_KEY ("(hidden)")                                      Environment Variable      local
env.RESEND_API_KEY ("(hidden)")                                         Environment Variable      local

╭───────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│  [b] open a browser [d] open devtools [e] open local explorer [t] start tunnel [c] clear console [x] to exit  │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
✘ [ERROR] Build failed with 2 errors:

  ✘ [ERROR] No matching export in
  "src/generated/ai-knowledge.js" for import "KnowledgeDocs"
  
      src/session-knowledge.ts:2:2:
        2 │   KnowledgeDocs,
          ╵   ~~~~~~~~~~~~~
  
  
  ✘ [ERROR] No matching export in
  "src/generated/ai-knowledge.js" for import "KnowledgeDocs"
  
      src/system-knowledge.ts:3:2:
        3 │   KnowledgeDocs,
          ╵   ~~~~~~~~~~~~~

```

I see two errors on server start

<!-- xgd-turn id="1504ce6c-5fba-4bb2-94f2-589b4120e91a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T20:25:47.857260+00:00" -->
#### Claude
Diagnosed. This is bigger than the two import errors suggest — let me lay it out.

Ticket BUG-63 written up. The short version:

**The two errors are the small half of the problem.**

`bin/install --component all` (store mtime today 11:20) pulled the framework's head. Nothing in this repo pins a framework version — every `@lagrangefoundry/*` package reports `"version": "0.0.0"` and no manifest records the commit. Meanwhile the framework landed its **DOC-22 three-tier priming architecture** between 09-03 and 09-06, and our AI host was last touched 09-02.

`KnowledgeDocs` was deliberately deleted (framework `c77717d61f`, "KM priming providers replace KnowledgeDocs"). That's the visible break.

**The invisible break is worse.** `Role`'s constructor in the installed `@lagrangefoundry/ai` is now:

```js
constructor({ name, priming = [], reminders = [], tools, permissions,
              sandbox, cacheBoundary } = {}) { …; Object.freeze(this) }
```

`system`, `source` and `reminder` are gone. Both our `Role` constructions still pass them — `host-core.ts:591` and `ai.ts:161` — and because the object is frozen over a fixed key set, they're silently dropped. So the obvious two-line fix (delete the `KnowledgeDocs` import) gives you a Worker that **builds, boots, and serves an assistant with no system prompt, no role purpose, no KM landscape and no reminder.** Strictly worse than the current failure, which at least stops.

We've migrated none of it — zero hits for `PrimingProviders`, `productFromMapping`, `registerDefaults`, `registerKmProviders`, `cacheBoundary` outside `node_modules`. Nine files touch the retired API (listed in the ticket), including three test files.

**Two routes, and I'd like your call before coding:**

- **A — migrate.** Adopt DOC-22 here: a `PrimingProviders` registry per host, `CONSULTANT_SYSTEM` / reminder / KM landscape expressed as product- and role-tier priming entries, `registerKmProviders` where `KnowledgeDocs.open` was, plus `assets.ts`'s export allow-list and the tests. Correct, and the only route that leaves the assistant actually primed. Non-trivial — it touches both the Node CLI host and the Worker.
- **B — pin and defer.** Reinstall the store from the last framework commit before `28367ac5aa` to unblock you now, and record the pin. Migrate on your own schedule.

The pin is worth doing either way: an unpinned out-of-band store is exactly what let a framework release break this repo with no diff in it.

One thing I'd add to whichever route you pick — the regression that matters isn't "the Worker builds", it's that a constructed session's assembled priming actually *contains* the system prompt and the landscape. Nothing asserts that today, which is why the `Role` key drop would have shipped silently.

<!-- xgd-turn id="155651b0-cd97-41b6-8016-5794319ab673-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T20:27:35.649694+00:00" -->
#### You
ok lets me clear - we are in dev mode, there is no production data. 

If we have broken data in there - lets clear it out.

There is only one thing I care about - the draft xgd site. Everything else is toast

<!-- xgd-chat-end -->