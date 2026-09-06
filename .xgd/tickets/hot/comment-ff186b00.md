---
uid: comment-ff186b00
id: COMMENT-2300
type: comment
title: Comment on chat CHAT-41
created_by: xgd
created_at: '2026-09-06T20:22:08.894114+00:00'
updated_at: '2026-09-06T20:30:34.606045+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-6655ab09
  kind: chat_transcript
---

<!-- xgd-turn id="c822d1c7-7977-4f18-a4d9-ca48dfa49c94-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:21:56.074612+00:00" -->
#### You
I have created a resend account and set up 1stcontact.io per the TODO-5 instructions

I have an API key - what do I do with it?

<!-- xgd-turn id="c822d1c7-7977-4f18-a4d9-ca48dfa49c94-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:23:35.322592+00:00" -->
#### Claude
Short answer: **you never put it in a file — you export it and run `bin/deploy`.** REQ-196 already landed the hook that does the rest.

## The API key

```bash
export RESEND_API_KEY='re_...'
bin/deploy --dry-run control-app      # should print "would push RESEND_API_KEY to ..."
bin/deploy control-app
```

`bin/deploy.d/secrets/20-resend-api-key` pipes it into `wrangler secret put`, where it's write-only — the dashboard shows the name, never the value. After that you never export it again: a later deploy reads the name back off the Worker and leaves it alone. Re-exporting a value is how you express a **rotation**.

Three things to be deliberate about:

- **Store it in your password manager now.** Resend shows a key once.
- **Do NOT add it to `.dev.vars`.** The credential *is* the adapter switch (`apps/control-app/MAIL.md`) — no key means `wrangler dev` uses the local adapter that logs and delivers nothing. Putting it in `.dev.vars` means a test fixture on your laptop can mail a real person.
- **Sending-scope only**, not full account access, if you haven't already.

## Two corrections to TODO-5's "done when"

**"both production and preview"** — there is no preview environment. `apps/control-app/wrangler.toml` declares only `[env.production]`, and `bin/deploy` defaults to `--env production`. That criterion is unsatisfiable as written; drop it or create the env deliberately.

**The webhook signing secret has no deploy hook.** `apps/control-app/src/email-webhook.ts` landed with REQ-198 and reads `EMAIL_WEBHOOK_SECRET` (Svix scheme, `whsec_…`), refusing everything when it's unset. But `bin/deploy.d/secrets/` contains only `10-anthropic-api-key` and `20-resend-api-key` — so this one is manual:

```bash
cd apps/control-app
printf '%s' 'whsec_...' | npx wrangler secret put EMAIL_WEBHOOK_SECRET --env production
```

The endpoint to register in Resend is `https://app.1stcontact.io/api/email/webhook`, subscribed to delivered / bounced / complained. It's mounted ahead of the Access gate deliberately — the signature is the only thing protecting it, so the secret must be in place *before* you register the endpoint, not after.

## Remaining blockers before that "done when" closes

The DNS half is what still has waiting in it: confirm exactly one `v=spf1` TXT record on the zone, DKIM published, DMARC at `p=none` with a `rua=`. Then send to a Gmail *and* an Outlook address and read the raw headers for `spf=pass dkim=pass dmarc=pass` on both.

Want me to write a `30-email-webhook-secret` hook so that secret follows the same path as the other two rather than staying a manual step? That's a code change and would need a ticket.

<!-- xgd-turn id="73144f8f-102a-47bd-b71e-a0296ac040df-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:30:34.356971+00:00" -->
#### You
```
((.venv-working) ) martin@nyx 1stcontact % bin/deploy --dry-run control-app
DRY RUN — hooks are told not to change anything, and nothing is uploaded.

==> control-app → 1stcontact-control-app (--env production)
  hook migrate/10-d1-site-store
    would apply D1 migrations to '1stcontact' (--env production --remote)

 ⛅️ wrangler 4.106.0
────────────────────
Resource location: remote 

▲ [WARNING] Processing wrangler.toml configuration:

  
    - "env.production" environment configuration
      - The following vars exist at the top level, but not on "env.production.vars".
        This is probably not what you want, since "vars" configuration is not inherited by
  environments.
        Please add these vars to "env.production.vars":
        - ACCESS_DEV_OPEN

✅ No migrations to apply!
  hook secrets/10-anthropic-api-key
    would push ANTHROPIC_API_KEY to 1stcontact-control-app
  hook secrets/20-resend-api-key
bin/deploy: RESEND_API_KEY is not set in your environment, the Worker has no RESEND_API_KEY either.
  1stcontact-control-app will run the LOCAL mail adapter, which records messages
  and delivers none of them — nothing this deployment sends will arrive. That is
  survivable today because nothing sends yet; it will not be once a route does.

  To fix it, add the domain in Resend, publish the SPF/DKIM/DMARC records it
  gives you (apps/control-app/MAIL.md), then:

    export RESEND_API_KEY='...'   # from your password manager

  Nothing needs to be exported once the secret is in place — a later deploy
  reads the name back off 1stcontact-control-app and leaves the value alone.

 ⛅️ wrangler 4.106.0 (update available 4.129.0)
───────────────────────────────────────────────
▲ [WARNING] Processing wrangler.toml configuration:

  
    - "env.production" environment configuration
      - The following vars exist at the top level, but not on "env.production.vars".
        This is probably not what you want, since "vars" configuration is not inherited by
  environments.
        Please add these vars to "env.production.vars":
        - ACCESS_DEV_OPEN

✨ Read 111 files from the assets directory /Users/martin/lagrangefoundry/1stcontact/apps/control-app/dist-assets
Total Upload: 6233.15 KiB / gzip: 1723.06 KiB
Your Worker has access to the following bindings:
Binding                                                                  Resource                  
env.DB (1stcontact)                                                      D1 Database               
env.SITES (1stcontact-sites)                                             R2 Bucket                 
env.BLOBS (1stcontact-material)                                          R2 Bucket                 
env.BROWSER                                                              Browser Run               
env.AI                                                                   AI                        
env.ASSETS                                                               Assets                    
env.TENANT_ID ("biz_51a6746495c8057e886ff98d4208e6b9")                   Environment Variable      
env.PLATFORM_ADMINS ("")                                                 Environment Variable      
env.ACCESS_TEAM_DOMAIN ("lagrangefoundry.cloudflareaccess.com")          Environment Variable      
env.ACCESS_AUD ("c802fa9c4efc483e13f1c27d2d9a9ca3ff933...")              Environment Variable      
env.MAIL_FROM ("no-reply@1stcontact.io")                                 Environment Variable      

--dry-run: exiting now.

==> Deployed
  1stcontact-control-app           (rehearsed, not uploaded)
((.venv-working) ) martin@nyx 1stcontact %

```

The 

RESEND_API_KEY is set in the environment

<!-- xgd-chat-end -->