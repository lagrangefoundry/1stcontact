---
uid: comment-504d1f85
id: COMMENT-840
type: comment
title: Claude response for review report
created_by: xgd
created_at: '2026-08-08T00:40:47.467600+00:00'
updated_at: '2026-08-08T00:40:47.467600+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f94be2af
  kind: note
---

# STORY-99 Re-review: **PASS** — `report-f94be2af` (REPORT-1676)

All four findings from `report-8ea06ca0` were addressed, and the fail cause was fixed at the right altitude rather than patched.

## The AC-977 fix

The directive is now set **once before routing** — `res.setHeader('cache-control', NO_STORE)` in `builder.ts` — so every response the handler can produce inherits it, including error statuses and the unrouted 404. Two near-misses were also removed: the shell's own restatement, and the edit bridge's bare `'no-store'` (differing from `'no-store, must-revalidate'` everywhere else). `serve.ts` exports one `NO_STORE` constant both senders compose from.

Verified on the wire against `1c builder`, including the two routes that were bare before:

```
/api/sites               200  no-store, must-revalidate   <- was absent
/api/assets?slug=…       200  no-store, must-revalidate   <- was absent
/api/copy                400  no-store, must-revalidate
/no-such-route           404  no-store, must-revalidate
```

The evidence fix matters as much: the UAT no longer keeps a hand-list of representatives — the class of thing that let the JSON routes ship cacheable under a green criterion. It extracts the routing table from `builder.ts` and asserts coverage **in both directions**. The reverse check is the load-bearing half: without it an extraction that stopped matching would leave `declared` empty and the coverage assertion would pass over nothing. I confirmed all ten declared routes are probed, and that `.toBe(DIRECTIVE)` replaced `.toMatch(/no-store/)`, so the near-miss is now a failure.

Discriminating power needed no mutation: the pre-fix origin returned no header on `/api/sites`, and the new test probes exactly that.

## Verification run

- Story UATs **23/23** (AC-975's browser measurement genuinely executes — 1531ms, real Chrome 151)
- Full suite **1226 passed, 6 failed, 67 skipped** across 183 files
- Lint 0/0, build success (`report-220ff206`, post-fix)

The 6 failures are the pre-existing set, unchanged in count and identity. No regressions — notably `req117-edit-loop`, `req111-public-site-serving` (which asserts *cacheable* directives on the public Worker) and the shared-`serve.ts` suites all pass.

I ran the tests myself because the subject-scoped quality report is still the pre-fix one; the post-fix reports carry lint and build but no suites.

## Warnings resolved

The TAS reconciliation is the one worth noting — it was resolved the right way round, by recording what ships rather than softening the rule. `report-62f5dd5e` now explains the Vitest alias as a route correction with its three containment properties, and states outright that the previously prescribed worktree-parent install was **not** taken and why: *"code and this document disagreeing is worse than either choice: the next reader trusts the document."* BUG-33 carries the six red tests with the stale-DOM-handle root cause traced and the correct fix direction (re-read the control; don't touch `toolbar.js`).

Two non-blocking observations in the report: BUG-33 is still `draft` and worth promoting, and AC-977's route extraction is regex-over-source — a residual gap that takes two independent mistakes to bite, given the handler-level `setHeader`.
