---
uid: report-6dc8f70c
id: REPORT-11098
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-07T06:58:32.556455+00:00'
updated_at: '2026-11-07T06:58:32.556455+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7988e925
  plan_item_index: '3'
---

Upgrade mutations applied for plan item 3 of 7

Target Stories: story-d34eccd8
Primary Story UID: story-d34eccd8
Stories Modified: 1
ACs Modified: 2
ACs Added: 3
ACs Removed: 1

```
tickets_modified:
  stories:
    - "story-d34eccd8"
  acceptance_criteria:
    modified: ["acceptance_criterion-fd1af685", "acceptance_criterion-a136b7e4"]
    added: ["acceptance_criterion-ceaed855", "acceptance_criterion-e7bec195", "acceptance_criterion-ecdc5f9e"]
    removed: ["acceptance_criterion-08d88be5"]
```

Progress: 3 of 7 plan items complete

What changed (I read REQ-200 in BUNDLE-38 first, then checked it against `apps/public-site/src/index.ts`, `session.ts` and `routes.ts`):

- **STORY-95** (story-d34eccd8):
  - The story text now covers the apex front page.
  - Two new in-scope sections: one for session-aware serving, one for the private cache policy.
  - "Out of scope" no longer says the apex is held to a holding response. It now says authentication is out of scope beyond reading an existing session.
  - Technical Context records that the holding response is superseded and that one operator step remains (setting the apex key).
  - Reconciliation Decisions 5–7 cover behaviour the intent doesn't state: a page with the account chrome is private even when the visitor is signed out; a deployment with no cookie domain set reads no session at all; an expired session counts as signed out; and a header-only (`HEAD`) request for HTML reports the length that would actually be served.
- **AC-913 is marked superseded**, with `superseded_by_uid: bundle-7988e925`. REQ-200 explicitly replaces `APEX_BODY` with a published site, so this is a retraction rather than an ordinary removal. Its UAT stays in place as a historical record.
- **Three new ACs:**
  - **AC-2333:** the root and every path outside `/site/` serve the apex site; no apex configured, or not yet published, gives a not-found.
  - **AC-2334:** a page with the account chrome names the visitor's sign-in state. A missing, foreign-host, expired or unreadable cookie means signed out, and reading the session writes nothing.
  - **AC-2335:** those pages are served `private, no-store`, with `vary: cookie` and no etag, and never go into or come out of the shared cache. Pages without the chrome are unchanged.
- **AC-909 and AC-911 were edited even though the plan listed no modifications.** Left as they were, they would contradict the new behaviour:
  - AC-909 said every response is publicly cacheable.
  - AC-911 said every repeat request is answered from the cache.

  Both now exclude pages with the account chrome and requests that carry a session.

I found no point where the code contradicts the intent, so no code issues are flagged.

The sandbox blocked an outbound connection to `github.com:22` during the AC creates. All the ticket creates and updates succeeded locally, but any automatic push or sync of the tickets was blocked.