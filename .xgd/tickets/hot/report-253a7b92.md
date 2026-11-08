---
uid: report-253a7b92
id: REPORT-11495
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T15:30:37.322789+00:00'
updated_at: '2026-11-08T15:30:37.322789+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0d00566a
  plan_item_index: '7'
---

I updated STORY-159 and added two new ACs to it for BUG-67 Defect B (what capture does when a host name doesn't resolve). Everything was checked against the operator's B1–B6 spec and acceptance criteria 1–7 in BUG-67, and against the code in `tools/generate/src/cli/capture/pipeline.ts:238-368`, `capture.ts:84-148` and `fidelity-core.ts:391-405`.

The code matches the intent on every point, so I found nothing to flag as a code issue.

**New ACs:**
- **AC-2465 (B1–B4):** a host that doesn't resolve is tried only once (`ERR_NAME_NOT_RESOLVED`, `ENOTFOUND`, `EAI_AGAIN` or `getaddrinfo`). Then exactly one alternate is tried, with `www.` added or removed and nothing else in the URL changed. There is no alternate for IP literals, `localhost` or other private names, or single-label hosts. The alternate must pass the egress rule before it is fetched. A timeout or reset is retried to the normal budget and never leads to an alternate.
- **AC-2466 (B5–B6):** when the alternate answers, it is used for the recorded URL and host, the bundle name, the URL `capture_site` returns, and the ladder, screenshot and hint passes. When no host form resolves, the error says "no such host", names each form tried, says the problem is the address rather than the site, and tells the caller to check the spelling or try another host form.

**STORY-159 body changes:**
- A new Description bullet covering this behaviour.
- The In-scope line now includes it.
- A Technical Context bullet noting that the shared pipeline means `1c capture` and re-extraction get the same behaviour.
- Five new Reconciliation Decisions, dated 2026-11-08, for points the intent doesn't cover:
  - `EAI_AGAIN` counts as a resolution failure.
  - The alternate gets the normal retry budget for timeouts and resets.
  - An alternate the egress rule refuses is dropped without being reported.
  - If the typed host doesn't resolve but the alternate fails some other way, the old generic error is kept.
  - Scheme, path and query are kept when the host is swapped.

One thing I left alone: the story's Out-of-scope line still says `1c capture` "keeps its existing network behaviour". That is no longer quite true for host resolution. I covered it in Technical Context rather than rewriting the line, because STORY-124/147 own that command.

Each `ticket create` printed a sandbox notice that it couldn't reach `github.com:22` (blocked by the sandbox). I didn't check whether that matters. The tickets were still created locally.

```
Upgrade mutations applied for plan item 7 of 8

Target Stories: STORY-159
Primary Story UID: story-31204812
Stories Modified: 1
ACs Modified: 0
ACs Added: 2
ACs Removed: 0

tickets_modified:
  stories:
    - "story-31204812"
  acceptance_criteria:
    modified: []
    added: ["acceptance_criterion-49223881", "acceptance_criterion-8c0a4f23"]
    removed: []

Progress: 7 of 8 plan items complete
```