---
uid: acceptance_criterion-d795f91c
id: AC-2227
type: acceptance_criterion
title: An import into a site with builder-recorded changes is refused 409 naming the
  slug and change count, and the stored site is byte-identical afterwards; the same
  import with force lands
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:29:46.501303+00:00'
updated_at: '2026-11-01T20:47:56.354973+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

An import (`POST /api/import`, reached by `1c push` and `bin/publish`) reads the
target site's **builder-recorded change count** before it writes anything.

- **Zero changes** — a site that does not exist, or one that has only ever been
  filled by imports — the import proceeds exactly as before. The write version an
  earlier import raised is not the test, so the ordinary publish loop is never
  refused.
- **One or more changes** — someone has edited this site in the builder, by hand,
  by the assistant or by a structured-edit command — the import is **refused with
  409 and nothing is written**: no definition, no page, no asset, and no empty
  site row left behind. The response names the slug and the number of recorded
  changes at risk in its message, carries both as fields (`slug`, `changes`), and
  carries a separate `force` field telling a program how to mean it.
- **An explicit `force: true` in the payload overrides the refusal** and the
  import lands. Any other value of `force`, or its absence, does not.
- **`1c push --force` sends `force: true`; an ordinary `1c push` omits `force`
  from the payload entirely** rather than sending `false`, so the wire shows what
  was meant.
- **`bin/publish --force` applies to every slug in the run.** It answers a
  question about the invocation; the refusal names the site it protected, so a
  narrower rerun is one command away.

## Verification

Import a site, record one builder change against it, then import a different
payload without force: assert 409, assert the body names the slug and a change
count of 1, and assert the stored definition and every stored page are
byte-identical to what they were before the attempt. Repeat with `force: true`
and assert it lands and the stored page now matches the payload.

Import into a fresh slug, and import again into a slug that has only ever been
imported to: assert both land.

Assert the payload an ordinary `1c push` sends has no `force` key, and that
`1c push --force` sends `force: true`.