---
uid: report-3e6c2e51
id: REPORT-11576
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T21:07:08.086138+00:00'
updated_at: '2026-11-08T21:07:08.086138+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-7ba3af93
  plan_item_index: '1'
---

Plan item 1 is done. STORY-138 now describes BUG-73's embedding-transport behaviour: AC-1664 is reworded and eight new ACs are linked under the story. I checked this by re-reading the story, which now lists all 20 children.

**Intent vs. code:** BUG-73's decided scope in the ticket body ("Scope (decided 2026-09-10): fixes 2 and 3, together", B1–B7 plus B1a and B6a) matches `apps/control-app/src/embedder.ts` and its four callers on every point. So the first step of the resolution ladder settled it, I didn't need the transcripts, and nothing needs flagging as a code issue.

**Two gaps where the intent says nothing, now written into the ACs** (recorded under `## Reconciliation Decisions` in the story):
- **Blank credentials:** an empty or whitespace-only credential counts as unset, because the code trims both values. This is in AC-2468.
- **Half a credential pair vs. the system knowledge base:** the system knowledge base normally answers null when nothing can embed. Half a credential pair still raises the named error there, because the rule that half a pair is an error wins over that quiet path. This is in AC-2470.

**Sandbox note:** every `xgd ticket` create/update printed a blocked outbound connection to `github.com:22`. The tickets were all written locally, but the ticket store's background push to GitHub didn't go through. Whatever syncs the store will need that access, or the changes will have to be pushed some other way.

```
Upgrade mutations applied for plan item 1 of 8

Target Stories: story-5281f009
Primary Story UID: story-5281f009
Stories Modified: 1
ACs Modified: 1
ACs Added: 8
ACs Removed: 0

tickets_modified:
  stories:
    - "story-5281f009"
  acceptance_criteria:
    modified: ["acceptance_criterion-020369c0"]
    added: ["acceptance_criterion-9463f606", "acceptance_criterion-6b0876eb", "acceptance_criterion-42bbadb3", "acceptance_criterion-51145d3b", "acceptance_criterion-afeccefe", "acceptance_criterion-cbf10c68", "acceptance_criterion-450b8441", "acceptance_criterion-64972132"]
    removed: []

Progress: 1 of 8 plan items complete
```

What changed, per ticket:
- **STORY-138 (`story-5281f009`):** `story_kind` changed from feature to upgrade. The description and scope now cover the transport chosen by the credential settings and the named embedding failures. Technical Context documents the resolver, the order in which the transports are tried, the failure wrapper, and the rule keeping credentials out of `wrangler.toml`.
- **AC-1664:** when no model is reachable, the refusal now names both fixes: declare `[ai]` and `[env.production.ai]`, or set both REST credentials.
- **New ACs:**
  - AC-2468: both credentials set means REST is used for every knowledge base and every gate, the binding is never called, and a blank value counts as unset.
  - AC-2469: neither credential set means the binding is used as before, so production is unchanged.
  - AC-2470: only one of the pair set raises a named error from every caller, with no fallback to the binding.
  - AC-2471: only one place decides how the deployment reaches the model.
  - AC-2472: an embedding failure carries the transport and the knowledge base, keeps the original message and cause, adds advice only on the binding transport, and is never wrapped twice.
  - AC-2473: the wrapper passes through the model's name and vector dimension and returns its vectors unchanged.
  - AC-2474: when nothing can embed, each consumer behaves as before (project KB refuses, system KB answers null, a session still opens).
  - AC-2475: neither credential variable appears in `wrangler.toml`.