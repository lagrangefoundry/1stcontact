---
uid: comment-cb7fa49c
id: COMMENT-1910
type: comment
title: Comment on request REQ-165
created_by: xgd
created_at: '2026-08-31T21:51:22.915848+00:00'
updated_at: '2026-09-01T18:36:21.204336+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-26dafd83
  kind: chat_transcript
---

<!-- xgd-turn id="939a085a-a870-4282-8ec6-07b188d98ecb-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T21:50:49.056544+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="939a085a-a870-4282-8ec6-07b188d98ecb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T22:22:01.563558+00:00" -->
#### Claude
Now let me write the projector.

Good — cwd is the worktree. Now the L1 vocabulary projection.

Now the control-surface projection and the assembly.

Now let me run the export and inspect what it actually produces.

Now update the call sites to use the scoped lookup.

Now wire the CLI to run the projection step.

Now update my UATs to the new shape.

<!-- xgd-turn id="668ea4bd-14c0-4887-ad02-de6e3870c3bb-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T22:57:29.081369+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-turn id="668ea4bd-14c0-4887-ad02-de6e3870c3bb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T23:03:38.390464+00:00" -->
#### Claude
Now the index.ts conflicts:

Now the two test-file conflicts:

<!-- xgd-turn id="b732eeae-bcfd-4148-8c88-ddb4dac07b04-user" -->

<!-- xgd-chat role="user" ts="2026-09-01T18:14:44.241039+00:00" -->
#### You
please complete the free-coding of this ticket

<!-- xgd-turn id="b732eeae-bcfd-4148-8c88-ddb4dac07b04-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-01T18:36:20.463000+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check current state.

Now let me run the relevant tests.

Typecheck clean. Now re-run the tests on the branch.

Now the version bump and ticket body update.

Now update the ticket body with what actually landed, then merge back.

Now the merge back to xgd-working.

Free-coding of REQ-165 is complete.

## What landed

A projector (`tools/generate/src/cli/kb-projection.ts`, 865 lines) plus a second corpus producer (`writeProjections` in `tools/generate/src/cli/kb.ts`), wired into `1c kb export` and the assets build ahead of `1c kb build`.

Three projections, one source each, verified end-to-end by running the real export:

```
corpus: 4 document(s) -> kb/system
projected: REF-behaviors, REF-l1, REF-surface
```

- `REF-behaviors` ← the framework behavior catalogue (`CATALOG`)
- `REF-l1` ← the L1 schemas + envelope
- `REF-surface` ← the declared control surface (`ai/l1-surface.json`)

Each reads exactly one source and reads no document — every sentence is either rendered from the source's shape or lifted verbatim from prose the source carries. Deliberately not `renderManual`: a manual is projected *through a grant* (one role's operations, second person); a reference describes the whole declared surface.

**Design decisions recorded in the ticket body** (all UAT-backed): two producers with two namespaces and one sweep each so neither can delete the other's output; unchanged projections not rewritten so the incremental index doesn't re-embed; membership read from the KB declaration rather than hardcoded (the predicate already changed once, at REQ-164); provenance stated in the body as well as frontmatter because retrieval returns passages; no `[[DOC-N]]` cross-references, since sending a client-facing assistant to an internal ticket is a dead end.

## Verification

- `tsc --noEmit` clean on the merged working tree.
- 56 tests pass across the four KB suites (14 new `test_UAT_FC_REQ-165_*`).
- Full suite post-merge: 9 failing files, all present in the pre-merge xgd-working baseline. Four of them (`bug32-webui-scope-rebrand`, `reconciliation-assistant-conversation`, `reconciliation-copy-edit-parameter-sheet`, `test_UAT_FC_REQ-127_session_binding`) I confirmed fail identically on unmerged xgd-working; the rest are the known `dist-assets`-wiped-mid-run ordering artifact and pass once assets are rebuilt. No new failure.

## Ticket

`REQ-165` → `free_coded`, `story_points: 8`, `version: 0.2.31`, commits `52fd6302cc`, `9ae7338430`, `c2f6c582ad`. Branch merged and cleaned; lock released.

One wrinkle worth flagging: the first `move-to-free-coded` was rejected because the 0.2.30 bump reached xgd-working *through the merge commit*, which the gate cannot attribute to a claimed SHA. I bumped again directly on xgd-working (`c2f6c582ad`) as the error instructs. That leaves a redundant bump commit in history — harmless, but it means the branch-per-ticket flow needs the version bump landed after the merge-back, not before.

<!-- xgd-chat-end -->