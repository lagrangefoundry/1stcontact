---
uid: report-43ec39d2
id: REPORT-3973
type: report
title: 'Fix implementation drift: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T10:27:19.906015+00:00'
updated_at: '2026-09-11T10:27:19.906015+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: fix_implementation_drift
  subject_uid: reconcile-BUNDLE-26
---

## Summary

The injected quality report (`report-0acd182f`) had **zero failing tests** —
`javascript-vitest` reported `passed=87, failed=0, failures=[]`. Every one of the
138 reported failures came from the `AC Coverage` pseudo-suite and was of
`kind=orphaned_ac`.

All 138 orphan ACs **were** in the run's `test_filter` and all 138 **do** have a
test file on disk. They were orphaned because **24 test files failed to collect**:
a fatal parse error in an implementation file meant vitest reported them as
neither passed nor failed, so their ACs read as "no passing test".

Root cause: commit `b47440dff2` (`fix_reconciliation_review`, `xgd-intent:
bundle-87be4669` — a prior step of *this* bundle) added a 17-line block to
`tools/generate/src/cli/ai/host-core.ts` re-declaring `REMINDER_PROVIDER`, which
was already declared 17 lines above:

    [PARSE_ERROR] Identifier `REMINDER_PROVIDER` has already been declared
      tools/generate/src/cli/ai/host-core.ts:267 / :284

A second, independent drift was uncovered behind it (details below).

**Outcome: 135 of the 138 orphan ACs now have a passing test.** The remaining 3 —
plus one failure the parse error had been masking — are all **case 2b** and are
not fixable at this layer.

## Failing UATs addressed

### Fixed (implementation edits)

- **135 ACs across 22 test files** — owning intents various; case 2a/2c.
  Unblocked by repairing the parse error in
  `tools/generate/src/cli/ai/host-core.ts`: removed the duplicate
  `const REMINDER_PROVIDER` and its two companions `SYSTEM_ENTRY` /
  `DOCS_PROVIDER`, which are referenced nowhere in the repository and whose
  values (`caretaker.system`, `caretaker.docs`) do not match the entry names the
  code actually uses (`caretaker`, `caretaker-landscape`, `caretaker-purpose`,
  `caretaker-mechanism`, `caretaker-reminder`). This is an exact revert of
  `b47440dff2`'s addition; the surviving declaration at :267 is the one used at
  :521 and :565.

- **AC-1651, AC-1652** (`tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts`)
  — case 2a. A second drift, revealed once the file could collect. The Worker's
  `knowledgePriming` still returned the **old snapshot shape**
  `(box) => Promise<{documents()}>`, while `HostDeps.priming` had been migrated to
  the **provider-pair shape** `{landscape, mechanism, register}`. So
  `deps.priming.landscape` was `undefined` and the role built an entry declaring
  neither `text` nor `provider`:

      _Priming entry "caretaker-landscape" declares neither;
       an entry must declare exactly one of 'text' or 'provider'._

  Upstream's `KnowledgeDocs` — the class the old shape depended on — no longer
  exists in `@lagrangefoundry/ai-knowledge`; `priming.js` exports
  `LANDSCAPE_PROVIDER` / `MECHANISM_PROVIDER` / `registerKmProviders` instead.
  The Node host (`tools/generate/src/cli/ai/host.ts` → `knowledgeDeps`) had
  already been migrated; the Worker had not. Files edited:

  - `apps/control-app/src/system-knowledge.ts` — `knowledgePriming` now returns
    the provider pair and registers their bodies via `registerKmProviders`,
    mirroring `knowledgeDeps`. Scoped with `kb: SYSTEM_KB` so the map axis matches
    the search axis `knowledgeSurfaceFor` already confines — which is AC-1652's
    "on both axes".
  - `apps/control-app/src/ai.ts` — dropped the now-vestigial `CARETAKER_PURPOSE`
    argument and import; `host-core.ts` owns that ordering now.
  - `tools/generate/src/cli/assets.ts` — added `LANDSCAPE_PROVIDER`,
    `MECHANISM_PROVIDER`, `registerKmProviders` to `AI_KNOWLEDGE_EXPORTS` so the
    generated `.d.ts` declares what the Worker imports. (The runtime shim is
    `export *`, so the values already resolved; only the type surface was short.)

### NOT fixed — case 2b (owning intent is EARLIER than the anchor)

All four belong to **`story-e674c60a` → intent `bundle-15c1f647`**.

- **AC-964** `test_UAT_AC964_the_admitted_split_holds_with_a_real_access_token`
  (`tests/reconciliation-builder-workspace-origin.test.ts`) — `expected 503 to be 200`.
- **AC-1400** `test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate`
  (`tests/reconciliation-workspace-build-artifacts.test.ts`) — `expected 503 to be 200`.

  Both construct the Worker env with `DB`/`SITES` as Proxies that **throw when
  touched**, asserting that static routes (`/`, `/builder/main.js`) are answerable
  without opening a store. That premise no longer holds: `apps/control-app/src/index.ts:123`
  now calls `admit(env, gate.email)` for **every** configured request before
  routing, and `admit` reads D1 unconditionally (`identity.ts:293` → `findUser`).
  The Proxy throws, `index.ts`'s catch-all turns it into 503.

  This is a deliberate design change of the newer intent, stated in the code
  itself ([[DOC-40]] §3, `access.ts:340`): *"passing Access WAS admission. It is
  not any more."* Making static routes bypass `admit()` would relax the
  identity-admission boundary the newer intent established — a security decision
  above this layer, and one that risks the 21 identity ACs in
  `reconciliation-identity-invite-and-admission.workers.test.ts` that now pass.

- **AC-965** `test_UAT_AC965_a_worker_that_cannot_serve_names_the_missing_configuration`
  (same file) — `Test timed out in 180000ms`. Spawns a `wrangler dev` child via
  `unstable_dev`, which this sandbox cannot start (`wrangler` already fails with
  `EPERM` writing its own log). Case 2b by ownership regardless.

- **AC-960** `test_UAT_AC960_component_scope_is_written_in_exactly_one_place`
  (`tests/bug32-webui-scope-rebrand.test.ts`) — **newly visible, not newly broken.**
  This file was one of the 24 that could not collect, so the failure was masked;
  repairing the parse error revealed it. The repo-wide scan requires the literal
  `@lagrangefoundry` to appear only in `tools/generate/src/cli/webui.ts`. Two
  tracked files restate it in prose:

  - `apps/control-app/src/knowledge.ts:218` (an error-message string)
  - `tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts:42`
    (a doc comment)

  Both are present at `HEAD` and neither was edited by this session (`git status`
  lists only the four files above). The second was introduced by
  `243731d7dc` — `xgd-kind: reconcile, xgd-intent: bundle-87be4669,
  xgd-story: story-a58a0974` — i.e. **the merging intent's own generated UAT
  violates the earlier intent's AC**, which is exactly the 2b shape.

  It is also unfixable here on authority grounds independent of the timeline: the
  test would only pass if *both* hits were reworded, and one of them lives in a
  UAT file, which this prompt prohibits editing.

## Timeline comparisons

    xgd working-timeline bundle-87be4669 bundle-15c1f647

| intent | role | timestamp | iso | n_commits | anchor_sha |
|---|---|---|---|---|---|
| `bundle-87be4669` | anchor (merging branch) | 1788287737 | 2026-09-01T18:35:37+00:00 | 12 | `c2f6c582ad88…` |
| `bundle-15c1f647` | owner of story-e674c60a | 1786076192 | 2026-08-07T04:16:32+00:00 | 1 | `1741ee5d1d20…` |

`owning_ts (1786076192) < anchor_ts (1788287737)` → **case 2b** for AC-960,
AC-964, AC-965 and AC-1400. The merging intent supersedes the owning intent for
this surface, but no BUG-246-style invalidation was declared during
reconciliation. Per the fix_implementation_drift contract this cannot be repaired
at the implementation layer: it needs a corrective intent that explicitly
invalidates (or restates) the superseded ACs.

## Local verification

Run in the worktree with `npm test -- <files>`.

- **The 24 test files that own the 138 orphan ACs**: `Test Files 2 failed | 22 passed (24)`,
  `Tests 3 failed | 145 passed (148)`. The only failures are AC-964, AC-965 and
  AC-1400, all case 2b above.
- **Regression check — the 15 files whose 82 ACs were already passing**:
  `Test Files 1 failed | 14 passed (15)`, `Tests 1 failed | 88 passed (89)`. The
  single failure is AC-960, analysed above: pre-existing content, previously
  masked by the collection failure, not caused by these edits.
- `tests/reconciliation-projected-reference.test.ts` — 13/13 (was 0, parse error).
- `tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts`
  — 3/3 (was 1 passed / 2 failed).

Net: **135 of 138 orphan ACs resolved**; 3 remain orphaned and 1 previously
masked failure is now visible, all four attributable to the same superseded
story.

## Files edited

    apps/control-app/src/ai.ts
    apps/control-app/src/system-knowledge.ts
    tools/generate/src/cli/ai/host-core.ts
    tools/generate/src/cli/assets.ts

No test file, UAT, AC/story/capability ticket or linkage field was modified.
