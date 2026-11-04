---
uid: report-4e7a9260
id: REPORT-10851
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-04T16:03:04.562323+00:00'
updated_at: '2026-11-04T16:03:04.562323+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-5052a63c
  plan_item_index: '2'
---

Plan item 2 is applied: all three target stories are updated, nine ACs added, two existing ACs corrected, and AC-1422 superseded. No runtime code, UATs or story tickets were created or changed.

**Departures from the plan:**
- **Starter-site wording.** The plan's draft criterion said a new account's starter site is "named home". REQ-190's own notes reject `home` explicitly, and choose slug `unnamed` with display name `Unnamed`. The code (`apps/control-app/src/identity.ts:776`, `:785`) matches REQ-190. Since the intent outranks the plan, AC-2246 says `unnamed`, and the reason is recorded under Reconciliation Decisions in STORY-94.
- **Two extra AC edits.** The plan listed no AC modifications, but checking the sibling ACs turned up two that still described the old behaviour:
  - AC-903 still said a site name resolves through "the claim recorded when the site was first published", which REQ-190 deletes. It now says the address segment is the site key, and its check uses two businesses sharing a slug.
  - AC-905 said the untrusted value reaching a storage key is the "site name"; it now says "site key".
- **AC-1422 is `superseded`, not deprecated.** REQ-190 explicitly deletes the claim table, `SlugClaimedError` and the 409 ("deleted, not relaxed"), so I set `superseded_by_uid: bundle-5052a63c` rather than treating it as an ordinary removal.

**No code contradicts the intent.** The code matches REQ-190 on every point I checked: the single baseline whose platform-business id matches both blocks in `wrangler.toml`, the one minter in `ids.ts`, site-only child rows and storage prefixes, per-business slug uniqueness, `siteKey`/`siteKeys`/`forget`, the `/site/<siteId>/` resolver, and the builder redirect that returns 404 for a slug the business doesn't hold.

```
Upgrade mutations applied for plan item 2 of 8

Target Stories: story-fde7370b, story-d34eccd8, story-5349d01f
Primary Story UID: story-fde7370b
Stories Modified: 3
ACs Modified: 2
ACs Added: 9
ACs Removed: 1

tickets_modified:
  stories:
    - "story-fde7370b"
    - "story-d34eccd8"
    - "story-5349d01f"
  acceptance_criteria:
    modified: ["acceptance_criterion-5312d7ac", "acceptance_criterion-27815e0f"]
    added: ["acceptance_criterion-bae5941a", "acceptance_criterion-0035140e", "acceptance_criterion-4646a3bd", "acceptance_criterion-477aba6b", "acceptance_criterion-7967e301", "acceptance_criterion-25cd8321", "acceptance_criterion-ee0efea1", "acceptance_criterion-21f724fc", "acceptance_criterion-ceb41845"]
    removed: ["acceptance_criterion-51835b53"]

Progress: 2 of 8 plan items complete
```