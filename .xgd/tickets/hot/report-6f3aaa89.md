---
uid: report-6f3aaa89
id: REPORT-11244
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T02:44:46.325924+00:00'
updated_at: '2026-11-08T02:44:46.325924+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-4164b433
  plan_item_index: '5'
---

Plan item 5 is done. STORY-171 now describes the Sign out control and sign-out flow as REQ-204's revision specifies them, and the code matches that revision. I checked `signOut` and `signOutDestination` in `apps/control-app/src/sign-in.ts`, `accessLogoutUrl` in `access.ts`, and `signOutControl` in `builder/business.js`. No runtime code was changed and no new story was created.

- **STORY-171:** set to `story_kind: upgrade`. The sign-out part of the description now covers:
  - the Sign out control, always shown in the Account dialog;
  - the redirect, chosen from the credential the request carries rather than from what admitted the caller;
  - the case where someone holds both a session of ours and an Access cookie;
  - `returnTo` being built only from the request's own origin;
  - the fallback when no team domain is configured;
  - `/api/businesses` no longer carrying a `session` field.
- **Two decisions recorded under Reconciliation Decisions,** where the intent says nothing:
  - **No sessions configured:** on a deployment that issues no sessions, an Access caller is still sent to the Access logout, and no clearing cookie is sent because there is no cookie of ours to clear. So the "clears our cookie" criteria apply only to deployments that issue sessions.
  - **Only POST signs out:** a GET to `/sign-out` is not handled as sign-out. It goes on to the normal gated routes, so a link or a prefetch cannot sign anyone out.
- **AC-2351:** reworded so the cookie is cleared for every caller, it still succeeds for someone not signed in, and the redirect goes to `/sign-in` only when the request carries no Access credential. My first try passed the title through `--fields`, which didn't rename the AC and probably left a stray `title` field on the ticket. I renamed it properly with `--title`. The stray field should be harmless.
- **AC-2365 (new):** the Account dialog always shows a Sign out form beside Close that posts to `/sign-out` and lets the browser follow the 303. The builder's path is the same as the Worker's, and `/api/businesses` has no `session` field.
- **AC-2366 (new):** a request carrying an Access credential gets a 303 to the team domain's Access logout, with `returnTo` set to this origin plus `/sign-in`. That still applies when the caller also holds a session of ours, and our session is ended and our cookie cleared on the same response. With no team domain configured it lands on `/sign-in`.

No AC was marked superseded. The earlier "control is only shown for our own sessions" behaviour was never formalized as an AC under this story, so there was nothing to retire.

```
Upgrade mutations applied for plan item 5 of 7

Target Stories: STORY-171
Primary Story UID: story-e0ca0a36
Stories Modified: 1
ACs Modified: 1
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-e0ca0a36"
  acceptance_criteria:
    modified: ["acceptance_criterion-d09c5960"]
    added: ["acceptance_criterion-b959e6d2", "acceptance_criterion-0238eb81"]
    removed: []

Progress: 5 of 7 plan items complete
```