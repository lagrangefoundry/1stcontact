---
uid: report-26a1a39a
id: REPORT-12010
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-09T19:57:24.977116+00:00'
updated_at: '2026-11-09T19:57:24.977116+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0881342c
  plan_item_index: '6'
---

Upgrade mutations applied for plan item 6 of 6

Target Stories: story-f2e5032c
Primary Story UID: story-f2e5032c
Stories Modified: 1
ACs Modified: 3
ACs Added: 4
ACs Removed: 0

```
tickets_modified:
  stories:
    - "story-f2e5032c"
  acceptance_criteria:
    modified: ["acceptance_criterion-d3f5071d", "acceptance_criterion-746d2fa3", "acceptance_criterion-989dd7f7"]
    added: ["acceptance_criterion-0510d1dc", "acceptance_criterion-ec0b8434", "acceptance_criterion-742f0a22", "acceptance_criterion-a9118165"]
    removed: []
```

Progress: 6 of 6 plan items complete

**Changes:**
- **STORY-177:** `story_kind` is now `upgrade`. The body now covers the operator's preview use, plus the preview endpoint, tenant lookup, served-definition reads, the Access-based bypass and the edit-channel refusal.
- **AC-2504 (modified):** the tenant comes only from the URL: the site path on the published site, or in the preview the slug looked up through the store.
- **AC-2505 (modified):** values the business authored are read from whatever the submitter was served: the live revision on the published site, the draft in the preview. Provenance now includes the channel.
- **AC-2515 (modified):** the draft preview posts for real; the edit channel still can't post, and a POST to its lead path gets `404`.
- **AC-2560 (new):** a preview submission goes through the same handler as the published one and writes one lead contact in the slug's tenant. An unknown slug gets `404`.
- **AC-2561 (new):** a form that exists only on the draft is accepted, and its definition is read from the draft.
- **AC-2562 (new):** every lead records its channel, `draft` or `published`. The server sets it; a body field can't change it.
- **AC-2563 (new):** preview submissions skip Turnstile and the rate limiter. A public submission carrying `identified` in its body, query or headers is still challenged, and the body field is stored as an ordinary answer.

**How intent was settled:** at level 1. BUG-78's own body ("Decision on finding 1", 2026-09-11) agrees with the code throughout. One point: the plan says a preview lead records the channel as "preview". BUG-78 says the value is `draft`, and that every submission records a channel, including published ones. The ACs follow BUG-78.

**Recorded under Reconciliation Decisions:**
- **`404` refusals (my decision):** a lead POST to any preview channel other than `draft`, or for an unknown slug, gets `404`. BUG-78 only says the edit channel refuses, so I formalized what the code does.
- **Inaccurate comment, not a code issue:** the router's comment says a `published` POST "falls through to the redirect", but the code returns `404` first. Only the comment is wrong.

**Story points:** the `story_points` field is still 3. I wrote "3 (+2 for the BUG-78 preview upgrade)" in the body but didn't change the field.

**Not synced to GitHub:** each ticket write also tried to connect to github.com over SSH (port 22), and the sandbox refused it. The tickets are saved in the local store but haven't been synced to GitHub.