---
uid: report-143f685e
id: REPORT-5537
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T10:28:18.033982+00:00'
updated_at: '2026-09-29T10:28:18.033982+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/src/router.ts` — **UU**, code file under rule 2c (incoming authoritative, keep both sides where non-overlapping).

  One conflict hunk, at the tail of the `POST /api/ai/prompt` route. The two sides
  changed the same line for unrelated reasons:

  - **Ours** (`fix(chat): render a conversation from the junction, and let the drain
    outlive the client`): `streamTurn(host, sessionId, text, redactor(secretsOf(env)), ctx)`
    — adds the `ctx` argument — plus the whole `POST /api/ai/reattach` route (BUG-46),
    which does not exist on the incoming commit's base at all.
  - **Theirs** (`feat(material): a digest in the body, the full text in a comment`,
    REQ-173): `streamTurn(host, sessionId, text, scrub)` — substitutes the `scrub`
    the commit hoists to the top of `routeUncached` for the per-site
    `redactor(secretsOf(env))`, so that "every `error:` value out of this table is
    `scrub(...)`" (REQ-146 AC4) has a single subject.

  Both changes are real and disjoint, so neither side was taken wholesale. Kept
  HEAD's routes and applied the incoming commit's intent to both of them:

  - `streamTurn(host, sessionId, text, scrub, ctx)`
  - `streamTail(host, sessionId, cursor, scrub)` — the reattach route's call, which
    the incoming side never saw, updated to the same hoisted scrubber for consistency.

  Taking either side alone would have destroyed something: theirs-whole deletes the
  BUG-46 reattach route and the `ctx` argument; ours-whole leaves two inline
  `redactor(secretsOf(env))` calls the incoming commit exists to eliminate.

## Incoming changes preserved

`apps/control-app/src/router.ts` — verified every REQ-173 change from
`0504c1139fee525ef0e4c42919a918291f621788` is present in the resolved file:

- `sessionTextDescriber` import (line 26) and `type DescribeText` import (line 34)
- `RouterDeps.describeText` seam (line 279)
- `defaultTextDescriber()` (line 357) and `aiConfigured()` (line 377)
- `AI_STATUS_PATH` (line 382) and `NO_API_KEY_MESSAGE` (line 391) exports
- `text_comment` in `materialEnvelope` (line 456)
- hoisted `const scrub = redactor(secretsOf(env))` (line 573) — the subject of the conflict
- `describeText` wired into `ingestDeps` (line 706)
- `GET /api/status` route (lines 723–725)
- 503 refusals on the two ingestion routes (lines 893, 957)

`redactor`/`secretsOf` remain imported and used, at the hoisted declaration on line 573.
No hunks were dropped; the BUG-1301 precedence exception was not needed.

Typecheck: `npx tsc --noEmit` in `apps/control-app` passes clean.
