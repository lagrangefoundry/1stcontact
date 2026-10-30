---
uid: report-ba248bbb
id: REPORT-5787
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T11:25:49.481962+00:00'
updated_at: '2026-10-02T11:25:49.481962+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — pick `be385cd90f`

- **Pick**: `be385cd90f335147321557585d1142008508691c` — "feat(control-app): an operator console, and tenant cost as its first control [FREE-CODED]" (REQ-297, author 2026-09-22 11:30:10 -0700, 16 files, +2405/-15)
- **HEAD**: `2dbb13844e25d44ea8c668e02e21912cd591349b` (unmoved)
- **Apply target**: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- **Retry count**: 1, `prior_stage_failure` empty
- **Conflicted paths**: 2 `UU` code paths, one region each. The other 14 files applied cleanly.

## Outcome

Both paths resolved as **class 2c step 1 — non-overlapping, keep BOTH**. Every
incoming hunk is present; nothing of incoming's was dropped. No unmerged entries
remain, `CHERRY_PICK_HEAD` is intact, all 16 files are staged.

The enrichment's rule ("intent unknown → take the more recent commit by
timestamp") was not used on either path: neither conflict is a choice between
sides.

## `apps/control-app/src/builder/builder.css`

Both sides appended new rules after the same last rule of the file
(`.builder-people__more`), so git saw two different tails.

- Ours appended `.builder-dns-change__note`, `.builder-dns-change__note:empty`, `.builder-dns-card`.
- Theirs appended the whole operator-console and tenant-cost block (`.builder-console*`, `.builder-tenant-cost__*`, 158 lines).

Resolution: ours' three rules, then theirs' block, each closed with its own `}`.
Theirs' other hunk (adding `.builder-console` to the panel's `:has()` width
list) had auto-merged.

Verification: the sorted line multiset of the resolved file is **identical** to
that of incoming's blob `972ad967a1` (`diff` of the two sorted files is empty).
The resolved file is therefore incoming's content exactly, in ours' block order —
ours' delta from base is a 95/95 reordering of existing rules, all distinct
selectors.

## `apps/control-app/src/router.ts`

One region, the parameter list of `businessesPayload`:

- Theirs added a fourth parameter, `ownsPlatform: boolean = false`.
- Ours' entire delta from base in this file is naming the third parameter `accountName` where base and incoming both have `personName`.

Resolution: `accountName: string | null = null, ownsPlatform: boolean = false`.

Incoming made no change to the third parameter's name (base == incoming there),
so keeping HEAD's name discards nothing. The function body's use of the name had
already auto-merged to `accountName`, so taking `personName` in the signature
alone would not compile. The parameter is positional; the one call site
(`BUSINESSES_PATH` GET) and both existing test callers are unaffected.

Verification: `git diff <incoming blob 360a15d304> -- router.ts` is exactly two
lines, both the `personName`/`accountName` spelling (signature + body use).
Everything else in the file is byte-identical to incoming, including the new
`ownsPlatformBusiness` field, the call-site argument and the dev-open `false`.

**Flagged, not fixed**: `-S` search finds no non-merge commit on incoming that
introduces `personName` in this signature, so the `accountName` → `personName`
rename most likely lives in a merge commit on xgd-working, which resync never
picks. The branch will keep `accountName` until someone ports that rename; it is
a local identifier only, with no behavioural effect.

## Checks run

- `vitest run tests/test_UAT_FC_REQ-297_operator_console.test.ts` — **13 passed**.
- `tsc --noEmit` in `apps/control-app` — **3 errors, none from this pick**:
  `templateUid` does not exist in type `OutgoingMessage`, at `src/invites.ts:275`,
  `src/lead.ts:1136`, `src/sessions.ts:455`. The pick's staged diff contains
  neither `templateUid` nor `OutgoingMessage`, and none of those three files is
  in the pick. No errors in `router.ts`, `spend.ts` or any other file the pick
  touches. This is a pre-existing gap on the resync branch and needs its own look.
- `tests/test_UAT_FC_REQ-297_tenant_cost.workers.test.ts` and the two modified
  `.workers.test.ts` files were **not run** — workerd suites cannot bind a local
  port in this role.

## Also checked

- `package.json`: auto-merged to `0.2.318` (HEAD `.317`, incoming `.318`) — the pick's own +1 bump, no conflict.
- `ownsPlatformBusiness` is exported from `apps/control-app/src/identity.ts` on this branch, so the new call site resolves.
- No test function was deleted or weakened; the two new UAT files are staged as incoming wrote them.
