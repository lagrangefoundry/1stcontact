---
uid: report-429d32cc
id: REPORT-4894
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-24T00:06:16.967307+00:00'
updated_at: '2026-09-24T00:06:16.967307+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `package.json` — **UU**, config file, version scalar (rule 2g / resync version-scalar rule).
  Sole conflicted hunk was the `version` field: HEAD `0.2.51` vs incoming `0.2.47`.
  Resolved to HEAD's `0.2.51`. The incoming side's change was a routine free-coded
  bookkeeping bump `0.2.46` → `0.2.47` (confirmed by `git show f1a2b40 -- package.json`),
  already superseded by main's advancement to `0.2.51`. Taking the incoming scalar would
  regress the version monotonically and risk colliding with an already-claimed version.
  `git diff HEAD f1a2b40 -- package.json` shows the version line is the **only** difference
  between the two sides, so no other incoming content was at stake in this file.

No other conflict classes were present: the remaining 17 files touched by the incoming
commit auto-merged cleanly (8 M, 3 A under `tests/`, plus the `tools/generate` and
`apps/control-app` changes).

## Incoming changes preserved

Of the 18 files touched by `f1a2b408609e7bcec469da28744859f61743a40f`, 16 match the
incoming content byte-for-byte in the staged index
(`git diff --cached --name-only f1a2b40 -- <incoming paths>` reports only two divergences).
Both divergences were inspected:

- `package.json` — diverges by design, per the resolution above. The dropped hunk is the
  version scalar only; it carries no code.
- `apps/control-app/src/material.ts` — all incoming hunks are present in the staged index,
  verified by symbol:
  - `readMaterial` return type widened to `MaterialRow & { body: string; members: string[] }` (line 847)
  - new `memberOf(attachment: Ticket)` helper (line 853)
  - new `membersOf(store, ticket)` helper (line 873)
  - `materialFile` gains the optional `member?: string` parameter (line 893)
  - member-by-name lookup `attachments.find((a) => memberOf(a) === member)` (line 904)
  - the new `That capture holds no member called '<member>'` rejection message (line 909)

  The residual delta against the incoming side in this file is a **main-side addition**,
  not a dropped incoming hunk: `materialTicket` now wraps `store.get({ uid })` in a
  try/catch that converts the store's `not_found` into `NotMaterialError` so an unknown
  uid returns 404 rather than 500. That code exists only on HEAD and is additive to the
  incoming REQ-166 work; the two changes touch different functions in the file.

No hunk was dropped under the BUG-1301 precedence exception. No test function present on
either side of this conflict was deleted — the three incoming UAT files
(`test_UAT_FC_REQ-166_capture_site_adopts.workers.test.ts`,
`test_UAT_FC_REQ-166_capture_to_ticket.workers.test.ts`,
`test_UAT_FC_REQ-166_library_shows_a_capture.test.ts`) merged cleanly and are staged as
additions with content identical to the incoming side.
