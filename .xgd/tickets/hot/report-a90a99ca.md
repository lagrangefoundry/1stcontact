---
uid: report-a90a99ca
id: REPORT-4213
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T03:35:29.226095+00:00'
updated_at: '2026-09-14T03:35:29.226095+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — UU, intent/bookkeeping ticket (rule 2e).
  Resolved to OURS (`git checkout --ours` + `git add --sparse`; path is outside the
  sparse-checkout cone, DOC-986 §2/§4.1).

  Sides:
  - base `892df63` (pre-edit ticket)
  - ours (stage 2) `21a05a6` — `xgd(ticket): seed_local_overlay request request-51514090`
    (2026-09-11), identical to `HEAD:.xgd/tickets/hot/request-51514090.md`
  - theirs (stage 3) `6cdf2fb` — incoming `da7fe40` `xgd(ticket): update request
    request-51514090` (2026-09-01), a pure content edit

  Rule applied: **one side is a strict superset** (2e). The seed_local_overlay on HEAD
  already carries the incoming commit's entire body edit verbatim, plus strictly more.
  `git diff 6cdf2fb 21a05a6` shows only additions/advances on the ours side:
  - header scalars advanced by the later intent: `updated_at`
    2026-09-01T21:38:14Z → 2026-09-11T18:53:54Z, `last_field_updated` body → status,
    `status` draft → **bundled** (taking theirs here would regress the ticket out of
    the bundle it is currently being reconciled in);
  - fields added only on ours: `commits[]` (working_sha f580733/92e927e/d612c1a),
    `version: 0.2.39`, `bundled_in: bundle-8e1807f6`;
  - prose sections appended only on ours ("What the codec must do, precisely",
    "Sequencing, revisited: AC5 is not deliverable yet", "A finding AC4 turned up",
    "One honest caveat about 'the last native dependency'") — later working-timeline
    content already integrated into HEAD.

  There is no fact changed differently on the two sides other than the three header
  scalars above, and on those the ours side is the later-positioned intent
  (2026-09-11 bundling vs 2026-09-01 content edit), so the per-fact timeline rule and
  the superset rule agree. Nothing was invented; no field was edited beyond what one
  side's own operation already declared.

## Incoming changes preserved

Verified by diffing the incoming blob against the resolved blob
(`git diff 6cdf2fb 21a05a6`): **every** hunk of the incoming commit `da7fe40` is
present in the resolved file, byte-for-byte —

- "## The decision: hand-rolled, dependency-free" (DEFLATE via native
  `DecompressionStream`, rejection of `@jsquash/png` / `fast-png` et al., reversibility
  via AC6)
- "## Formats: PNG is the whole of this path, deliberately" (material.ts / describe.ts /
  content-type.ts non-decoding paths; JPEG IDCT non-bit-exactness; HEIC out of reach and
  out of scope)
- "### Consequence: non-PNG input is refused, not silently mishandled" (`1c crop --input`
  explicit format error)
- "## Shape: a pure core the Worker can import" (the pure-core split AC3 implies)
- AC2 rewritten to exact-equality on decoded pixels ("byte-identical", non-canonical
  DEFLATE caveat) and the matching "What must not move" paragraph
- AC4 narrowed to arithmetic cores with the [[REQ-155]] boundary
- "## Deferred: streaming row-lockstep decode"
- trailing-newline fix on the Origin line

No hunk of the incoming commit was dropped, so the BUG-1301 precedence exception was
not invoked and no @fail condition applies.

Net effect: the staged tree is byte-identical to HEAD for this path, i.e. the
cherry-picked commit is **redundant** — its intent is already in HEAD via the seeded
overlay, not discarded (STEP 3 distinction). Per STEP 4 this is staged and exited
@done as normal; `--skip` was not called and CHERRY_PICK_HEAD is intact for
cherry_pick_finalize_resolution.
