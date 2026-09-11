---
uid: report-b43eaea8
id: REPORT-3917
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-09-11T04:44:49.999591+00:00'
updated_at: '2026-09-11T04:44:49.999591+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-87be4669
  plan_item_index: '9'
---

Story and criteria are in place. Grounding notes on what I read:

- **Intent first**: REQ-163's body in the bundle (§ "Fetch is a plain `fetch`, with a guard this repo does not yet have" plus its acceptance list and the "Open questions" section) and the bundle's comments. The one comment touching this work is a prior-loop completion report about plan item 1, not a spec clarification.
- **Code**: `fetch-guard.ts`, `ingestFetch`/`classify` in `material.ts`, and the router's refusal mapping, read from `548c053deb` (the bundle's REQ-163 merge). None of it is on this branch yet — `git ls-tree HEAD` has no `material.ts`/`fetch-guard.ts` — so I read the commit blobs. I also diffed the guard against `xgd-working`: identical, so the bundle commit is ground truth here.

Four things worth flagging:

- **"Untrusted" has no flag in the code.** The intent asks to mark fetched material untrusted per DOC-10 §5.2; the implementation realises that as `origin: fetched` + `rights: third_party` + non-republishable, and says so explicitly. DOC-10 is not present in this worktree (only DOC-8, DOC-38, DOC-39 are), so I formalized the observable form and recorded the decision rather than asserting a prompt-level delimiter I cannot verify.
- **The name-resolution gap stays open, deliberately.** REQ-163 records it as an open question with a stated reason; AC-1701 asserts which address families are refused and does *not* claim completeness.
- **Three refusal shapes the intent never mentions** (error status, redirect with no destination, empty body) are formalized as AC-1707, since each is a real outcome of pointing at a real address.
- The upload-path rights AC on STORY-140 (AC-1683) already defers the inverted-bits case to this story by name, so AC-1706 picks up exactly that boundary without overlap.

```
Story #9 created for reconciliation bundle-87be4669

Story UID: story-77f8fc9e (STORY-142)
Title: Guarded Retrieval: Material Fetched On The Client's Behalf, And What It Is Recorded As
Type: feature
Capability: capability-20802191 (CAP-112 Material Ingestion — its "Guarded retrieval" concern)
Acceptance Criteria: 9 created (AC-1700 … AC-1708)

Progress: 9 of 17 plan items complete
```
