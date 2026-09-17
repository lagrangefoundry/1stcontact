---
uid: comment-d9b9fc8d
id: COMMENT-3029
type: comment
title: Comment on epic EPIC-16
created_by: xgd
created_at: '2026-09-17T03:34:34.354350+00:00'
updated_at: '2026-09-17T21:53:08.920813+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-96d8aca6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e1cc512e-d1e5-4d2c-b490-2e7757b65916",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cb28a7d9-40f7-4c4f-9bd6-3d5deca0b47e-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:34:28.479712+00:00" -->
#### You
This I think is probably getting a little too far over our skis for where we are right now, but I wanted to capture it while it was in my head because I can't see how we could manage without it in a real production environment. The idea here is that we would have a staging environment with some test sites set up with good rich test data and every deploy would go through the staging environment first and run our smoke tests and BFM tests and obviously any deployment migrations just like production. This ticket is to create that staging environment and an automated flow so that once the deployment is triggered it will go through automatically test and assuming all is good go straight to production. And then run another round of tests in production. The automation is critical here because there is literally one operator me. So everything has to run itself. I don't think I want to spend too much time on this epic right now. I think the requirements are relatively straightforward the tests are being handled by other epics so your job is really the deployment pipeline automation and the appropriate creation of test data. There are also some questions about whether we could keep such an environment from being public, and to an extent maybe whether we care? It is desirable that the automation run primarily in the cloud once it has been triggered. I don't want my laptop to be responsible for deployment

<!-- xgd-turn id="cb28a7d9-40f7-4c4f-9bd6-3d5deca0b47e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T03:41:09.033647+00:00" -->
#### Claude
EPIC-16 is written up. Title kept, status left at `draft`, no code touched.

**The one finding that changes the shape of the epic** — `.github/workflows/deploy.yml` is not the same deploy as `bin/deploy`. It runs `pnpm -r build` (which is `tsc --noEmit` in both apps, emitting nothing) then two bare `wrangler deploy --env production` calls. So the cloud path:

- never runs the `migrate` hook → **schema migrations are not applied**
- never runs the `secrets` hook → **no secret pushed, none capability-probed** ([[REQ-264]]'s report never happens)
- never runs `1c assets` → `dist-assets` is gitignored, so the control app's `[assets]` directory is absent on a fresh checkout
- never runs `bin/smoke`

Untouched since the scaffold commit `402ae93f1f`. The honest reading is that deploys have been coming off your laptop, which is exactly what you're asking to stop — so **fixing the workflow is child #1 and pays off with or without staging.**

What else the body settles:

- **One implementation, run twice.** `bin/deploy` already takes `--env`, already documents `--env staging`, already passes `DEPLOY_ENV` into hooks. The environment is a configuration exercise. One bug in the way: `bin/deploy.d/migrate/10-d1-site-store` hardcodes the database *name* `1stcontact` while honouring `--env`, so pointed at staging it would migrate production's D1.
- **The real constraint is migrations, not tests.** Code rolls back; D1 doesn't, and there's nobody awake to improvise. So the pipeline needs an expand/contract forward-only policy with a check, not a README paragraph. And without a promote step, the production test round is a postmortem rather than a gate — flagged as an open question since I haven't verified `wrangler versions` against the surface in use.
- **Private staging: yes, and not for embarrassment** — indexed duplicates of canary sites, weaker-by-design config facing the internet, and a real form anyone can fill in. Access on both staging hostnames with probes carrying a service token; [[BUG-59]]'s `SERVICE_TOKEN_IDENTITIES` already built the mechanism, and Access is an edge gate so the Worker path under test stays identical.
- **Test data: one site corpus, two destinations.** [[EPIC-15]] puts canaries in production deliberately; if staging fixtures are authored separately they drift and its open question 7 becomes two problems. Also: `bin/seed`'s safety guard is that `--remote` has to be typed — staging makes typing it a habit, so seeding must *refuse* the production database rather than warn.

I took [[EPIC-15]] §3 at its word and had this epic consume its probes rather than author any; that section was written addressed to this epic before it existed. The one thing I'd push back to it: staging probes need an auth seam to carry a service token, and that's cheaper to say now than after its probe interface settles.

<!-- xgd-turn id="9804a85f-55c1-46f7-8fd1-08db8b0d1fb3-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:53:08.709802+00:00" -->
#### You
Please check for security updates in your ticket

<!-- xgd-chat-end -->