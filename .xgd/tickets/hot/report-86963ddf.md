---
uid: report-86963ddf
id: REPORT-1460
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-06T20:26:46.926816+00:00'
updated_at: '2026-08-06T20:26:46.926816+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-0385746c
  plan_item_index: '2'
---

Confirmed the duplicate listing is a branch-worktree index artifact, not duplicate tickets: every AC modified in this reconcile session (including item 1's four) lists twice under `children`, while `xgd ticket query` and the store both hold exactly one file per UID. No action needed.

**Verification of code alignment** (no runtime code touched):
- `apps/public-site/src/site-store.ts` — `SERVABLE_ROOT = 'sites'` is the only root; `manifestKey(slug)` and both prefix forms (`preview/<sha>/out`, `rev/NNNN/out`) are built from it. `resolve()` takes `slug/channel/ref` and never a root.
- `apps/public-site/src/routes.ts` + `index.ts` — `parseRoute` yields only `slug`/`ref`/`path`; nothing in the request path, query, headers or host reaches a root. So `/site/sandbox/<slug>/preview/<sha>/out/index.html` parses as slug `sandbox` and dies at the manifest lookup — the tree is unreachable by construction, matching BUG-31's stated resolution.
- `tests/bug31-sandbox-r2-namespace.test.ts:187` drives the real `fetch` over all four route forms.

The intent's declared boundary — sandbox is namespaced, not made servable, and exercising serving means a throwaway slug under `storage/sites/` — is now recorded as an explicit out-of-scope clause on the story rather than left implicit.

```
Upgrade mutations applied for plan item 2 of 6

Target Stories: story-d34eccd8
Primary Story UID: story-d34eccd8
Stories Modified: 1
ACs Modified: 1
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-d34eccd8"        # STORY-95, story_kind feature → upgrade
  acceptance_criteria:
    modified: ["acceptance_criterion-27815e0f"]   # AC-905 — two-gate servability
    added: ["acceptance_criterion-1fc3d687"]      # AC-927 — one store tree, never derived from a request
    removed: []

Progress: 2 of 6 plan items complete
```

Notes for the reviewer:
- **AC-905** was sharpened rather than replaced: the index remains the authority *within* the servable tree, but the tree is now stated as the prior gate, so a complete index in the wrong tree grants no reachability. Its verification section gained that case.
- **AC-927** is phrased as confinement of the addressable key space, not as rejection of bad input — deliberately, because the code achieves it by having one fixed value rather than by a check, and an AC written as "the sandbox root is rejected" would pass against a weaker implementation.
- Story Technical Context records why the criterion is "never derived from a request" and flags that the `SiteStore` seam (D1 phase, REQ-7) must restate the guarantee when the store implementation is replaced — that is the reason it is an AC and not a note.
- Out of scope for this call and left untouched: STORY-94 and its ACs (item 1, already applied), AC-902/903/904/906–914 on this story, and all runtime code.
