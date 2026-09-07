---
uid: comment-ef5524d0
id: COMMENT-2307
type: comment
title: Comment on bug BUG-63
created_by: xgd
created_at: '2026-09-07T20:20:47.537352+00:00'
updated_at: '2026-09-07T20:20:47.537352+00:00'
completed_at: null
last_field_updated: created_at
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

<!-- xgd-chat-end -->