---
uid: report-6fbba9c2
id: REPORT-3014
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-31T17:34:10.239938+00:00'
updated_at: '2026-08-31T17:34:10.239938+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-78f4e2fe
  plan_item_index: '5'
---

Working tree clean — no runtime code touched. All three mutations landed and verified by reading them back.

```
Upgrade mutations applied for plan item 5 of 5

Target Stories: story-a58a0974
Primary Story UID: story-a58a0974
Stories Modified: 1
ACs Modified: 1
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-a58a0974"        # STORY-103
  acceptance_criteria:
    modified: ["acceptance_criterion-7b488315"]   # AC-1055
    added:    ["acceptance_criterion-29569117"]   # AC-1456
    removed:  []

Progress: 5 of 5 plan items complete
```

**What changed**

- **STORY-103** — "Where the conversation runs" now states that the contract does not know *which instance* of a host is answering: an identifier resolves against durable, account-scoped storage, so a turn runs on a process that never opened the session. "Honest failure" restates the identifier refusal as *names no site this account holds* (was: *the host never issued*). Technical Context gains a note that the per-isolate host cache is a cache of hosts, not of conversations. A dated `## Reconciliation Decisions` entry (2026-08-31, BUNDLE-21/BUG-38) records the supersession, why the new criterion is separate from AC-1055, and the per-origin refusal shape.
- **AC-1055** — authority test moves from "this process issued it" to "it names a site this account holds". An identifier of the derived form for a site the account holds now *resolves*; fabricated, non-existent, foreign-account, no-derivable-site and path-traversal identifiers are refused, with no conversation, no transcript storage and no site write. Refusal shape is stated per origin (plain not-found where turns answer with a status code; the origin's own message ahead of the completion where turns always stream) — sharpened because the code has always differed and the prior text described only the first.
- **AC-1456** (new) — a turn runs on a host process that never opened the session, from the identifier alone and without re-opening; turns across processes read back as one conversation in order.

**Verification I did**: read `host-core.ts` (`slugForSession` / `sessionIdFor` / `openSession` / `streamPrompt`), both refusal transports (`builder.ts:268` → 404 JSON; `router.ts:669` → text frame + `done`), `d1r2-store.ts:439` `hasDraft` (`WHERE tenant_id = ? AND slug = ?` — confirms account scoping), and the BUG-38 FC test's three UATs.

**Flagged for downstream, not fixed here**: `tests/test_UAT_FC_REQ-127_session_binding.test.ts:192` (`..._an_unissued_session_id_is_refused_rather_than_opened`) still asserts 404 for `site-${SLUG}` where that site exists — the exact case the restated AC-1055 now says must resolve. The BUG-38 commit did not touch that file. This is `fix_uat_coverage`'s to reconcile. I could not execute it to confirm: the sandbox denies `listen`, and the suite binds a port (`EPERM: listen 0.0.0.0`), so this is reasoned from the source, not from a run.
