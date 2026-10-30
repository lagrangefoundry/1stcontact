---
uid: report-7d42b8b6
id: REPORT-5613
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T21:21:49.712302+00:00'
updated_at: '2026-09-29T21:21:49.712302+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/src/knowledge.ts` — class **UU**, code file, rule **2c**
  (integrate both; non-overlapping changes keep BOTH sides).
  Cherry-pick `c5710f503a` ("[FREE-CODED] BUG-73: one embedder resolver, a REST
  transport, and a legible failure"), retry count 1, apply target
  `9ac98712a708888db67f8aff21f22b16bd98094e`.

  Three of incoming's four hunks auto-merged. The only conflicted region was the
  named-import list at the top of the file — six lines, two *deletions* of
  different symbols from adjacent positions:

  - theirs removed `WorkersAiEmbedder` (BUG-73 replaces the direct constructor
    call with `embedderFor(env, PROJECT_KB)` from the new `./embedder`);
  - ours removed `DEFAULT_SOURCE` (HEAD's index seam keys by
    `this.kb.source ?? PROJECT_KB` rather than by the bare `DEFAULT_SOURCE`).

  The two deletions are disjoint in effect, so both were honoured: the merged
  import list drops both names. Neither identifier has any remaining reference in
  the file (`grep`: `WorkersAiEmbedder` had only the import line; `DEFAULT_SOURCE`
  survives only in three prose comments at `:36`, `:94`, `:352`). Nothing was
  tie-broken and nothing was authored.

## Incoming changes preserved

Verified from the INDEX (`git show :apps/control-app/src/knowledge.ts`), not the
worktree. Every hunk of incoming's base→theirs diff is present:

- `import { embedderFor, type EmbedderEnv } from './embedder'` — present (`:19`).
- `WorkersAiEmbedder` import removed — present.
- `AiNotConfiguredError` message rewritten to the REST-or-binding wording
  (`CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`, `[[BUG-73]]`) — present.
- `ProjectKnowledgeEnv extends TicketStoreEnv, EmbedderEnv` (the `AI?: {...}`
  member dropped) — present.
- `projectKnowledgeFor`: `embedder = embedderFor(env, PROJECT_KB)` +
  `if (embedder === null) throw new AiNotConfiguredError()`, with the B1/B2/B7
  comment — present (`:686`–`:689`).

No hunk was dropped, so the BUG-1301 precedence exception was not invoked and no
`@fail` condition applies. Ours' only contribution to the conflicted region —
the `DEFAULT_SOURCE` deletion — is a deletion, not incoming code, and it does not
touch anything BUG-73 adds.

### Why dropping `DEFAULT_SOURCE` does not discard the BUG-55 decision

`c5710f503a` does not add `DEFAULT_SOURCE`; it inherits it from the base blob
`76d864f534`, which is xgd-working's own BUG-55 commit `798310c363`. That BUG-55
decision is already integrated into HEAD, in a more general form: main had
independently keyed the seam as `indexes: { [this.kb.source ?? PROJECT_KB]: ... }`
(HEAD-side blob `00829dbae3`), and this branch's earlier replay of BUG-55
(`4faae1aec3`) added only BUG-55's explanatory comment on top of it.

The two forms are behaviourally identical for this KB: `PROJECT_KB` is `'project'`
(`knowledge.ts:94`) and the comment there records that the component's
`DEFAULT_SOURCE` "is also `'project'`". `kb/knowledge_bases.json` gives the project
KB no `source` of its own — the premise BUG-55's own commit message states — so
`this.kb.source ?? PROJECT_KB` resolves to exactly the string `DEFAULT_SOURCE`
names, and additionally honours a declared `source` if one is ever added. So the
import is genuinely unused after the merge, and removing it preserves BUG-55's
intent rather than reversing it.

## Staging

`git status --porcelain` shows no conflict class lines. Staged set is exactly the
picked commit's own diff, no more:

```
A  apps/control-app/src/embedder.ts
M  apps/control-app/src/knowledge.ts
M  apps/control-app/src/router.ts
M  apps/control-app/src/session-knowledge.ts
M  apps/control-app/src/system-knowledge.ts
A  tests/test_UAT_FC_BUG-73_embedder_transport.test.ts
```

Unlike this branch's ticket-file picks, this leaves a REAL net change from HEAD —
finalize will commit it, so "zero net change" is not the success signal here.
`CHERRY_PICK_HEAD` left intact; no `--continue`/`--skip`/`--abort` issued.

## Verification limits

Verification stopped at read level, as the caretaker rule requires: `test_fix` is
forbidden in this role, and the workerd/wrangler suites this commit touches
(including its own `tests/test_UAT_FC_BUG-73_embedder_transport.test.ts`) are not
runnable in a headless session — they fail at `listen EPERM`. No test was run and
none is claimed to pass.

## Forecast for remaining picks on this file

None. `c5710f503a` is the TIP of `xgd-working` for
`apps/control-app/src/knowledge.ts` (`git log xgd-working -- <path>`: 7 commits,
this one newest). The next pick touching this file, if any, will be a fresh
xgd-working commit rather than a continuation of a known queue.
