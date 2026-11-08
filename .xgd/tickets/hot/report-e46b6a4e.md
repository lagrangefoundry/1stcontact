---
uid: report-e46b6a4e
id: REPORT-11609
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T23:04:13.220633+00:00'
updated_at: '2026-11-08T23:04:13.220633+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7ba3af93
  plan_item_index: '4'
---

Plan item 4 of 8 (REQ-218, stored image as a sixth picture kind) is applied: I updated both target stories, edited three acceptance criteria and added eight. I created no new stories, retired no criteria, and changed no runtime code.

**Two points of intent that need a decision**
1. **The CLI host doesn't say it has no Library (code issue).** REQ-218 says the local `1c` host "answers for the site's own assets and says it holds no Library", and EPIC-1 accepted that shape. In the code, a Library name asked on the CLI gets the general "not found" refusal, which tells the model to name the picture "by the name it appears under in the Library". That host has no Library. AC-2487 states what the intent says, so its UAT should fail until `fix_uat_coverage` changes the wording. The issue is recorded in STORY-157's Technical Context.
2. **Drawings are still photographed outside the site's page (open follow-up).** In its 2026-09-11 review, EPIC-1 said photographing a drawing inside the site's draft preview "is wanted", so the fonts the drawing names are the fonts it gets. The code renders it in a bare document and adds a caption saying the text is in the browser's default font. That review was an epic answer, not something the operator said on REQ-218, and it calls the bare-document path the interim state. So I formalized the current caption as the criterion and recorded moving to the draft preview as a follow-up under Reconciliation Decisions.

**What the matrix now records**
- **The intent behind the kind:** the operator asked for "both namespaces – the AI should have access to all the images in the store, however they are referenced". The ticket's later sections, which EPIC-1 reviewed and accepted, settle the rest:
  - there is no `list_images` operation;
  - photos and other non-PNG pictures are converted to PNG now, rather than waiting for REQ-219;
  - the CLI keeps the kind for the site's own assets.
- **Behaviour the code settles where intent says nothing:**
  - an exact spelling of a name wins before a case-insensitive match;
  - a Library item also answers to its upload filename;
  - a stored PNG is returned without opening a browser;
  - an empty store gets a "none held yet" refusal;
  - `viewport` is accepted and ignored on an `image`;
  - a picture the browser can't decode is refused, naming the picture and its stored type.

The CLI printed a `github.com:22` sandbox denial after each create. Every ticket was still created locally; the denial appears to be only an attempted sync.

```
Upgrade mutations applied for plan item 4 of 8

Target Stories: story-58b2cec4, story-47fb84e6
Primary Story UID: story-58b2cec4
Stories Modified: 2
ACs Modified: 3
ACs Added: 8
ACs Removed: 0

tickets_modified:
  stories:
    - "story-58b2cec4"
    - "story-47fb84e6"
  acceptance_criteria:
    modified: ["acceptance_criterion-19a996bc", "acceptance_criterion-934e8fdc", "acceptance_criterion-d1e65a2f"]
    added: ["acceptance_criterion-d9ab036e", "acceptance_criterion-cef80dd2", "acceptance_criterion-b6e7c9b7", "acceptance_criterion-ef95eeef", "acceptance_criterion-4b0b6386", "acceptance_criterion-56773d31", "acceptance_criterion-23963e43", "acceptance_criterion-7a28bf30"]
    removed: []

Progress: 4 of 8 plan items complete
```