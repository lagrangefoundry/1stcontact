---
uid: report-ea9fde0e
id: REPORT-7179
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T01:11:43.083973+00:00'
updated_at: '2026-11-01T01:11:43.083973+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-fd009b93
  plan_item_index: '1'
---

Upgrade mutations applied for plan item 1 of 7

Target Stories: STORY-106
Primary Story UID: story-189fc1ac
Stories Modified: 1
ACs Modified: 2
ACs Added: 7
ACs Removed: 0

```
tickets_modified:
  stories:
    - "story-189fc1ac"   # STORY-106, story_kind → upgrade
  acceptance_criteria:
    modified: ["acceptance_criterion-fbda4a6e", "acceptance_criterion-4bd36a69"]   # AC-1092, AC-1090
    added: ["acceptance_criterion-d52a5eea", "acceptance_criterion-2b403b0c", "acceptance_criterion-7c1282c7", "acceptance_criterion-2de08f72", "acceptance_criterion-d2671448", "acceptance_criterion-17853e8b", "acceptance_criterion-4a97e4d0"]   # AC-2068 … AC-2074
    removed: []
```

Progress: 1 of 7 plan items complete

**Changes:**
- **STORY-106:** The story now covers the whole page document, not just the element tree:
  - a read/write pair for the page's style, in the authoring grant beside the element write;
  - `describe_page` returns the page's document-level keys as a separate `style` member;
  - a write that introduces a broken font or asset reference is refused;
  - every reproduced page reads and writes back unchanged.

  The out-of-scope list now says the assistant can't add assets or fonts itself (it can't manage the site's assets, per REQ-175).
- **AC-1092:** There is exactly one way to change the element tree and one way to change the page style, both in the authoring group. A page-style write that names the element tree is refused and points the caller to the element write.
- **AC-1090:** The three-part refusal now also covers broken-reference refusals. Those name the bad value and list what the site does hold.
- **New ACs:**
  - AC-2068: reading the page style returns every document-level key exactly as stored.
  - AC-2069: setting the page style merges at the top level, replaces values whole, removes keys given as null, and validates the result.
  - AC-2070: `describe_page` carries the document-level keys.
  - AC-2071: a new font stack must name a served face or a generic fallback.
  - AC-2072: a new image or background-image reference must name an asset the site holds; query strings and fragments are ignored when matching.
  - AC-2073: a broken reference the stored page already carried doesn't block a write, even after it moves to another address.
  - AC-2074: every node and document-level key of every reproduced page round-trips through the surface.

**Reconciliation decisions (recorded in the story, 2026-10-31):**
- **Font rule:** the intent text (REQ-175 D5) puts the rule on the stack's *first* family. The code accepts a stack that names a generic family *anywhere*. I went with the code because the implementation chat on REQ-175 states this rule explicitly. It's also what keeps the reproduced sites' own `"Satoshi, …, sans-serif"` stacks valid, which D5 requires. I didn't flag it as a code bug.
- **Only new broken references are refused,** compared by value rather than position. This also comes from the implementation chat, which ranks above the code in the chain of authority.

**Notes:**
- AC-1084 (no styling in the page map) is unchanged. The new `style` member is separate from the per-element map entries, but a UAT that scans the whole serialised `describe_page` output for styling property names could now match it. Check this when UATs are mapped.
- Each ticket write also tried to reach `github.com:22`, and the sandbox blocked it. The local writes succeeded: all 7 new ACs show up as children of STORY-106 (19 ACs in total). Remote sync of these tickets hasn't happened.
