---
uid: report-7721af2b
id: REPORT-4896
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-24T00:13:40.898044+00:00'
updated_at: '2026-09-24T00:13:40.898044+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `apps/control-app/src/router.ts` — **UU on a code file** (rule 2c: incoming is
  authoritative, but non-overlapping changes on both sides are KEPT). The two
  sides overlapped on a single statement, the `/api/ai/prompt` return:
  - **HEAD** (`fix(chat): render a conversation from the junction, and let the
    drain outlive the client`): `streamTurn(host, sessionId, text,
    redactor(secretsOf(env)), ctx)` — a new trailing `ctx` argument, so the
    drain outlives the client (BUG-46) — plus an entire new
    `/api/ai/reattach` route immediately below it.
  - **INCOMING** (`feat(material): a digest in the body, the full text in a
    comment`, 0504c1139f): `streamTurn(host, sessionId, text, scrub)` — the
    same call rewritten to use the hoisted `const scrub` the commit introduced
    at the top of `routeUncached` ("ONE SCRUBBER FOR THE WHOLE TABLE", REQ-146
    AC4).

  These are not competing decisions — they change different arguments of the
  same call. Resolved by composing both: `streamTurn(host, sessionId, text,
  scrub, ctx)`. HEAD's `/api/ai/reattach` block was kept in full; the incoming
  side had no opinion on it because the route did not exist when that commit
  was written.

  Nothing was deleted from either side. The incoming deletion of the
  catch-block `const scrub = redactor(secretsOf(env))` and its hoist to line
  573 had already merged cleanly outside the conflict region and is intact.

## Incoming changes preserved

`apps/control-app/src/router.ts` — verified against
`git show 0504c1139f -- apps/control-app/src/router.ts`. Every hunk of the
incoming diff is present in the resolved file:

- `sessionTextDescriber` added to the `./ai` import; `DescribeText` added to
  the `./describe` import.
- `RouterDeps.describeText` seam.
- `defaultTextDescriber()`, `aiConfigured()`, `AI_STATUS_PATH`,
  `NO_API_KEY_MESSAGE`.
- `materialEnvelope`'s `text?: { uid: string } | null` parameter and the
  `text_comment` field it echoes.
- The hoisted `const scrub = redactor(secretsOf(env))` at the top of
  `routeUncached`, and the removal of both per-catch-block re-declarations.
- The `GET /api/status` route.
- `describeText` threaded through `ingestDeps()`.
- The two `aiConfigured` 503 gates on `/api/material` and
  `/api/material/fetch`.
- `scrub` substituted for `redactor(secretsOf(env))` at the ingest call site
  **and at the conflicted `/api/ai/prompt` call site** — the latter is the
  resolution above.

No hunk was dropped; the BUG-1301 precedence exception was not needed. One
note for post-merge review, not a discarded change: the HEAD-only
`/api/ai/reattach` route still builds its own `redactor(secretsOf(env))` for
`streamTail` rather than using the hoisted `scrub`. That line is outside the
conflict region and the incoming commit never saw it, so it was left
untouched; the two expressions are the same value, and folding it into `scrub`
is a cosmetic follow-up consistent with the incoming commit's stated intent.
