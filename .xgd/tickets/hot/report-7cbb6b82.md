---
uid: report-7cbb6b82
id: REPORT-5757
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T17:19:57.398986+00:00'
updated_at: '2026-09-30T17:19:57.398986+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `package.json` — config file (2g scalar), single `version` hunk. Resolved to
  HEAD's `0.2.238`, dropping incoming's `0.2.237`. Reasoning below.

The other 8 files in the pick (`tests/support/xgd-ticket-get.ts`,
`tests/test_UAT_FC_BUG-104_round_provenance.test.ts`,
`tests/test_UAT_FC_REQ-256_ai_iteration.test.ts`,
`tests/test_UAT_FC_REQ-261_loop1_rounds.test.ts`,
`tools/repro-console/brief/DIAGNOSE-THE-GAP.md`,
`tools/repro-console/src/ai.ts`, `tools/repro-console/src/console.ts`,
`tools/repro-console/src/ticket.ts`) auto-merged with no conflict markers and
required no resolution.

## Incoming changes preserved

`git diff --cached HEAD --stat` is line-for-line identical to
`git show b96e9a8ece --stat` on every one of the 8 code/doc files:

    tests/support/xgd-ticket-get.ts                     42 +++
    tests/test_UAT_FC_BUG-104_round_provenance.test.ts 317 +++
    tests/test_UAT_FC_REQ-256_ai_iteration.test.ts      17 +-
    tests/test_UAT_FC_REQ-261_loop1_rounds.test.ts       5 +-
    tools/repro-console/brief/DIAGNOSE-THE-GAP.md       15 +-
    tools/repro-console/src/ai.ts                       11 +-
    tools/repro-console/src/console.ts                  74 ++-
    tools/repro-console/src/ticket.ts                   38 +++

The whole of BUG-104's substance — the `--created-by
'repro-console:<slug>#<iteration>'` worked example in the brief's §6/§5, the
`readTicket()` move from regex-over-human-rendering to `ticket get --json`, the
prefix check on the `repro-console` marker in `confirm()`, and the new
`tests/support/xgd-ticket-get.ts` read-back definition — is staged verbatim.
No UAT function on either side was deleted.

### The one dropped hunk: `package.json` `version`

Incoming's hunk is `0.2.236` → `0.2.237`. That is a monotone counter, and
HEAD has already passed through the incoming value:

- base (`b96e9a8ece^`)  → `0.2.236`
- incoming (`b96e9a8ece`) → `0.2.237`
- HEAD `6f9b671b4c` ("chore: bump version for BUG-103 [FREE-CODED]") → `0.2.237`
- HEAD `0db138a4d2` ("fix(capture): a text run's box is its line box …") → `0.2.238`

So the incoming bump is not a competing fact that HEAD overwrote — it is a
fact HEAD already carries. `6f9b671b4c` is itself a free-coded xgd-working
commit earlier in this same resync queue; it landed `0.2.237` on this branch,
and a later queue member moved the counter on to `0.2.238`.

Writing incoming's scalar would therefore *regress* the branch version from
`0.2.238` to `0.2.237`, reintroducing a value the branch already retired and
leaving the queue's remaining picks to conflict on the same line again. Taking
HEAD's `0.2.238` discards no developer intent: incoming's intent was "the
version advances past `0.2.236`", and `0.2.238` satisfies it strictly more
than `0.2.237` does.

This is not the "resolution that keeps only main's version" the hard rules
forbid — `0.2.238` did not come from main, it came from xgd-working commits
already integrated into this resync branch.
