---
uid: report-2be5131b
id: REPORT-5540
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T10:52:10.190957+00:00'
updated_at: '2026-09-29T10:52:10.190957+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — **UU**, config file (§2g, scalar conflict → incoming wins).
  Merge base `f205968b^` had `0.2.60`; HEAD (`1299856f8b`, *move the scope
  selector from a tab's toolbar to shell chrome*) had `0.2.61`; incoming
  `f205968b19` (*terms accepted before the builder loads*, REQ-169) carries
  `0.2.62`. Took `0.2.62` — the incoming value, which is also the monotonically
  higher one and unused anywhere reachable from HEAD. No other hunk in this file
  conflicted; `scripts`, `engines`, `packageManager` and `devDependencies` were
  identical on both sides.

The remaining five paths in the cherry-pick auto-merged with no conflict and
required no intervention:

- `apps/control-app/src/index.ts` — M
- `apps/control-app/src/terms.ts` — A
- `tests/support/local-d1.ts` — M
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` — M
- `tests/test_UAT_FC_REQ-169_terms.workers.test.ts` — A

No UAT test function was deleted on either side. No DU/UD/AA conflicts. No
spec-ticket conflicts. The BUG-1301 precedence exception was not invoked — no
incoming hunk was dropped.

## Incoming changes preserved

Verified by comparing the staged index against `CHERRY_PICK_HEAD`
(`f205968b1950b43a4c27d6e3728a333282801aa0`) for each of the six touched paths:

    git diff --cached --stat f205968b19 -- <the six paths>
    apps/control-app/src/index.ts | 8 +++++++-
    1 file changed, 7 insertions(+), 1 deletion(-)

- `package.json` — staged blob `dd084a3b13` is **byte-identical** to the incoming
  commit's blob. The `0.2.62` bump is present.
- `apps/control-app/src/terms.ts` — byte-identical to incoming (new file, whole
  terms interstitial + `guardTerms` + version/copy constants).
- `tests/support/local-d1.ts` — byte-identical to incoming (`seedIdentity` now
  seeds an ACCEPTED identity).
- `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` — byte-identical to
  incoming (the "reaches the builder" UAT accepts terms first).
- `tests/test_UAT_FC_REQ-169_terms.workers.test.ts` — byte-identical to incoming
  (new REQ-169 UAT suite).
- `apps/control-app/src/index.ts` — the only path differing from incoming, and
  the difference is **additive on the HEAD side**, not incoming loss. The staged
  version contains incoming's fourth check verbatim:

      5:  import { guardTerms } from './terms'
      209:        const terms = await guardTerms(request, env, admission)
      210:        if (terms) return terms

  sitting between `admit` and `resolveScope` exactly as REQ-169 specifies. The
  7-insertion delta versus incoming is HEAD's already-integrated REQ-179 change
  — `route(request, env, scope, { admission }, ctx)` and its explanatory comment
  — which incoming predates. Both sides' changes are present; nothing was
  discarded.

## Cherry-pick state

`CHERRY_PICK_HEAD` is intact at
`f205968b1950b43a4c27d6e3728a333282801aa0`. No `--continue`, `--skip`,
`--quit` or `--abort` was issued. `git status --porcelain` shows no
`UU`/`AA`/`DU`/`UD`/`AU`/`UA` lines — all six paths are staged as `M`/`A`.
The staged diff against HEAD is non-empty, so the finalize step has a real
commit to make.
