---
uid: report-2424f95f
id: REPORT-5810
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T16:31:51.015102+00:00'
updated_at: '2026-10-02T16:31:51.015102+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/ACCESS.md` — code-tree documentation, class 2c (`UU`, one
  region, the `wrangler dev` bullet under "What Access does *not* change").
  Rule applied: overlapping and truly incompatible ⇒ **incoming wins** in the
  conflicted region; ours' non-overlapping hunks elsewhere in the file are kept.

Picked commit: `b12355bbcb` "dev up serves the snapshot; delete every server
reading src/ [FREE-CODED]" (BUG-150, author 2026-09-26 13:35:15 -0700, 25 files).
HEAD `2c56e17d33`. The other 24 paths applied cleanly and were already staged.

The two sides rewrite the same sentence from base (`1c builder` as the Node
origin on 8790) in opposite directions:

- **Ours** (REQ-145): `1c builder` *is* this Worker under `wrangler dev` on
  `localhost:8788`, reached via `ACCESS_DEV_OPEN` with empty top-level
  identifiers.
- **Theirs** (BUG-150): the local dev environment is `1c dev serve` on 8789,
  reached through the simulator on 8799.

These cannot be integrated: the picked commit's own message lists `1c builder`
(and `wranglerDevArgs`, `pnpm dev:control`) as deleted, and says 8788 keeps only
a `1c ps` row "naming itself retired". Ours' sentence documents the server this
commit removes. The same commit's sibling paths (`tools/generate/src/cli/index.ts`,
`dev.ts`, `ps.ts`, `bin/dev`, `package.json`) are staged with that deletion, and
its other two hunks in this same file (the bash recipe at ~L163 and the cookie
host line) auto-merged to the 8789/8799 wording — keeping ours here would leave
the file contradicting itself and the code. `xgd-working:apps/control-app/ACCESS.md`
carries theirs' text for this region verbatim.

The enrichment rule ("intent unknown, take the more recent commit by timestamp")
was not used; it is not a basis for dropping incoming content on a code path.

## Incoming changes preserved

- `apps/control-app/ACCESS.md`: all three incoming hunks are present. Diffing
  the resolved file against the incoming blob `a38a8ac550` leaves exactly two
  hunks (`@@ -25,8` and `@@ -41,9`, 15 changed lines), both in the
  "Configuration" section and both ours' REQ-145 edits that incoming never
  touched — kept under the non-overlapping rule. No conflict markers remain.
- No hunk was dropped under the BUG-1301 precedence exception.
- No test file was conflicted; no test was edited or removed by the resolver.

## Flag for post-merge review

Ours' retained Configuration callout (line 48) still says "Fill them in at the
top level and `1c builder` comes up and answers `401`". `1c builder` no longer
exists after this pick. It sits outside the conflict and incoming never saw that
paragraph, so it was left as-is rather than hand-rewritten; it wants a one-line
follow-up naming `1c dev serve`. Note also that `xgd-working`'s tip does not
carry ours' Configuration rewrite at all (it still has base's "Both vars ship
empty" wording), so that section is main-only content.

## Notes

- The session prompt arrived without its mission body; arguments were recovered
  from `session-r36f21cf3.jsonl` seq 59635 (`anchor_uid` `report-377b581e`,
  `apply_target` `ec118d67626fd31cfce67ca88dc9908ecdde70ed`,
  `prior_stage_failure` empty, retry count 1).
- Not run: no tests executed (documentation-only resolution).
