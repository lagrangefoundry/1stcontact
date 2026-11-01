---
uid: report-906ffb7e
id: REPORT-7239
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T03:17:21.957339+00:00'
updated_at: '2026-11-01T03:17:21.957339+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-fd009b93
  plan_item_index: '7'
---

Plan item 7 (REQ-173) is applied: STORY-141 and STORY-140 now describe material bodies as digests, with each document's full text kept in a separate `material_text` comment. No runtime code or UATs were touched.

```
Upgrade mutations applied for plan item 7 of 7

Target Stories: STORY-141, STORY-140
Primary Story UID: story-4cabde9a
Stories Modified: 2
ACs Modified: 3
ACs Added: 4
ACs Removed: 1

tickets_modified:
  stories:
    - "story-4cabde9a"   # STORY-141
    - "story-6ccaedd5"   # STORY-140
  acceptance_criteria:
    modified: ["acceptance_criterion-0c82cacc", "acceptance_criterion-7f1a7eaa", "acceptance_criterion-09447c2d"]   # AC-1688, AC-1689, AC-1699
    added: ["acceptance_criterion-9046fb58", "acceptance_criterion-a75343f8", "acceptance_criterion-4b7c7e75", "acceptance_criterion-72894f27"]   # AC-2095, AC-2096, AC-2097, AC-2098
    removed: ["acceptance_criterion-be5f0e8c"]   # AC-1692 (superseded)

Progress: 7 of 7 plan items complete
```

**Stories**
- **STORY-141 (describing material):**
  - Every branch now yields a digest. Documents also return their full text, kept outside the body.
  - The digest is written by a lightweight AI-host session: no tools, no priming, no chat record, closed after each document.
  - The recorded describer is "`<model> (<extractor>)`".
  - A document whose digest can't be written keeps its derived title and its full text.
- **STORY-140 (ingestion):**
  - Ingestion now writes the `material_text` comment and returns its uid as `text_comment`.
  - Deep-text search hits point at the material itself, through a temporary reading view that should be deleted once the framework change lands.
  - With no model key, `/api/status` says so, the builder shows a banner and blocks input, and both ingestion routes refuse with 503.

**ACs**
- **Modified:**
  - AC-1688 (documents) and AC-1689 (text files): the body is a digest, the full text is returned separately, and the title is still derived from the document, never from the model.
  - AC-1699: the digest and the full text have separate ceilings, each stated in the text when it applies.
- **Added:**
  - AC-2095 (STORY-140): one `material_text` comment per document, named in the ingestion response.
  - AC-2096 (STORY-140): a search for words deep in a document returns the material's own uid, while its listing shows the digest.
  - AC-2097 (STORY-141): the tool-less, unprimed, unarchived describer session.
  - AC-2098 (STORY-140): the no-key gate.
- **Superseded:** AC-1692 is marked `superseded` by `bundle-fd009b93`. The intent says outright that a missing key now blocks the builder rather than storing undescribed material.

**Decisions made where the intent was silent** (recorded under Reconciliation Decisions):
- The full text has its own ceiling, stated when it applies.
- A scanned document makes no model call.
- The ingestion response names the text comment.
- The no-key banner stays selectable outside the blocked area, so its text can be copied into a support message.

**Not changed:**
- **AC-1697:** its six outcomes stay as they are, since "no describer" can still be reached as a fallback when a caller bypasses the gate.
- **AC-1678:** the plan didn't list it, though its verification still expects the body to contain text taken from the file. Now that the body is a digest, it may be worth a look.

While creating the tickets, the `xgd` CLI tried to reach `github.com:22`, and the sandbox blocked it. All four ACs were created in the local store; any sync that call was meant to do did not happen.
