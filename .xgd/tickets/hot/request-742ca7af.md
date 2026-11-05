---
uid: request-742ca7af
id: REQ-472
type: request
title: 'Site consultant: motion reference packaged from the DOC-72 survey'
created_by: EPIC-19
created_at: '2026-10-26T23:42:39.695598+00:00'
updated_at: '2026-10-27T16:46:54.152476+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1c88cf43
  commits:
  - working_sha: 2955d8d87f288de43cf12e38b104e6067d706852
    reconcile_sha: null
    main_sha: null
  - working_sha: 1d00375b822537dfe24cdf63ae1d72549c47c0f3
    reconcile_sha: null
    main_sha: null
  version: 0.2.675
  story_points: 2
---

## What

Package [[DOC-72]] (the motion survey and taste guide, EPIC-26) as knowledge the **Site
consultant** can use while it talks a client through a signature effect and finishing touches
([[DOC-71]] §12.9).

## Why

DOC-72 is the earned opinion the Site consultant needs: what tasteful motion looks like for a small
business, which patterns fit which business, and what to avoid. As a 17K survey with a site register
and citations, it's the wrong shape for a consultant reference. The consultant needs the parts it
acts on, in its own vocabulary, at the moment it's offering motion.

## The package

A compact consultant reference (in the knowledge base the Site consultant already searches,
`kb/system/`, alongside DOC-33/35 and the REF docs). It contains only:
1. **The pattern catalogue** (DOC-72 §2): pattern, what it is, when to offer it, what to watch for.
   Examples are named by what they show, not by URL.
2. **The four taste tests** (§3):
   - the motion carries the story or the brand;
   - clearly real or clearly art; real must look chosen; photoreal AI only of the client's own
     subject;
   - one motion language, with one signature effect plus reveals as the baseline;
   - it still works when the motion never plays.
3. **The don'ts** (§4), one line each.
4. **How to offer it** (DOC-71 §12.9): the signature effect goes in the first draft, discussed with
   the client first and ideally made from their own photos. Cohort zero gets a suggestion and the
   consultant goes ahead unless they object; client-driven gets options with a recommendation.
5. **Clip-making rules:**
   - a reveal that ends on the original photo, then quieter ongoing motion;
   - a clean last frame;
   - account for the end state (the extra-pepper lesson);
   - room in the frame for the moving element;
   - strong motion plays once.

Left out: the site register, the measurement method, the citations, and §6's product implications
(those are the renderer's and the processing step's job, not things for the consultant to say).

**Size:** small. The priming budget is near its cap (BUG-129), so this is a searchable KB doc the
consultant reads when it reaches finishing touches, not always-on priming. When the DOC-71 rewrite
lands, it becomes the finishing-touches stage guide (§9.2) without rewording.

## Naming

Where it's ambiguous, assistants are named by their tab: **Site consultant**, **Settings
assistant**, and so on (DOC-71 §12.10).

## Test plan

UATs named `test_UAT_FC_REQ-472_*`:
- the Site consultant's knowledge base contains the motion reference, and a search for "living
  photo", "hero video" or "finishing touches" returns it;
- the reference contains the pattern catalogue, the four taste tests, the don'ts and the clip rules,
  and doesn't contain DOC-72's site register or citations;
- it isn't in the always-on priming (the BUG-129 budget is unchanged).

Related: [[DOC-72]], [[DOC-71]], [[EPIC-26]], [[EPIC-19]].


## What landed

- **[[DOC-74]]** — *Motion and finishing touches: the Site consultant's reference* (`doc_kind:
  system_kb`, ~7K). `1c kb export` writes it into `kb/system/`; the next `bin/build` (`1c kb ensure`)
  or `bin/kb-release` indexes it. It's addressed to the Site consultant in its own words, in five
  parts: how to offer it (by cohort), the pattern catalogue (11 patterns), the four taste tests, the
  don'ts (one line each) and the clip-making rules. Examples are named by what they show (e.g. "a loch
  that barely moves under a hotel") and carry no domain names, file sizes or measurements.
- Not named in priming: the consultant finds it by searching, and the generated KB map describes it.
  The BUG-129 budget is untouched (`priming.json` isn't changed).
- **Test:** `tests/test_UAT_FC_REQ-472_motion_reference.test.ts` exports the *real* system corpus into a
  scratch root, indexes it with the stub embedder, and runs `KnowledgeSearch` through the toolbox.
  DOC-74 must be the **top** hit for each of the three queries.