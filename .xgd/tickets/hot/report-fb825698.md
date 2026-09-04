---
uid: report-fb825698
id: REPORT-3395
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-03T23:13:01.177718+00:00'
updated_at: '2026-09-03T23:13:01.177718+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — **UU**, intent/bookkeeping ticket
  (rule **2e**). Resolved **per fact**; all three conflicting facts landed on the
  HEAD side. Applied as `git checkout --ours` because HEAD's blob is a strict
  superset of every fact the incoming commit authored (verified below), so no
  hand-merge could add anything.

Incoming commit `00a976b04e` (`content edit: add the blob store — separate
bucket, not a prefix in the publicly-bound sites bucket`, Aug 31 13:42:52 2026).
HEAD-side commit for this path `d86637121a` (Sep 1 18:34:36 2026). The
auto-enrichment reported intent unknown on one or both sides and directed the
timestamp rule; HEAD is the later side by ~29 hours, and its content is the
post-implementation refinement of the very edit being cherry-picked.

Per-fact resolution of the three conflict hunks:

1. **Frontmatter lifecycle** (`updated_at`/`completed_at`/`last_field_updated`/
   `status`). Same fields, different values. HEAD carries
   `status: free_and_reconciled` with `completed_at` set; incoming carries the
   older `draft`/`null` state. Later side wins → HEAD. Taking incoming here would
   have reverted an operator-only status to draft.

2. **Blob-store keying paragraph.** HEAD's version contains the incoming
   paragraph essentially verbatim (`t/<tenant>/blob/<sha256>` per DOC-38 §7.2,
   content-addressed, tenant-prefixed, declared in both wrangler blocks) and
   extends it with the concrete bucket name `1stcontact-material`, the
   `vitest.workers.config.mts` binding, the pre-deploy
   `wrangler r2 bucket create` note, and the wiring-layer enforcement discussion.
   Strict superset, later side → HEAD.

3. **Acceptance bullet on attachment ops.** Genuine same-fact difference, and
   HEAD *corrects* incoming: incoming asserted a store constructed without a
   `BlobStore` should fail at construction; HEAD records that the upstream
   component's call-time refusal is correct and unchanged, with enforcement moved
   to `ticketStoreFor(env)` throwing on a missing blob binding. That correction
   was reached after the work was implemented. Later side → HEAD.

## Incoming changes preserved

Confirmed. Nothing from the incoming commit was discarded.

The incoming diff has exactly three hunks, and every one is represented in the
resolved file:

- Hunk 1 (frontmatter) — superseded by HEAD's later lifecycle state, per fact 1
  above.
- Hunk 2 (the new `**3. The blob store, in its own bucket.**` section) — present
  verbatim in the resolved file: the REQ-104 `BlobStore` paragraph, the
  `**It must not share 1stcontact-sites.**` paragraph, and the BUG-31 /
  DOC-12 §7 disclosure-vs-overwrite paragraph, plus the `**4. The TypePack**`
  renumbering. Only the trailing keying paragraph differs, where HEAD is a
  superset.
- Hunk 3 (acceptance bullets) — the `A blob bucket distinct from
  1stcontact-sites` bullet is present verbatim; the attachment-ops bullet is
  present in HEAD's corrected form.

Mechanical verification: diffing the incoming blob (`00721ca18e`) against the
HEAD blob (`e909dcbb97`) yields incoming-only lines that fall solely into
(a) the superseded frontmatter, (b) the two facts HEAD refined above, and
(c) regions the incoming commit never touched and HEAD independently evolved
(the `**1. The schema.**` paragraph, the `A ticket created through the Worker is
readable back through it` bullet, and the `## Open questions` section — all
outside every hunk of `00a976b04e`, so no developer edit is involved).

No BUG-1301 precedence exception was needed; no test functions were involved.

## Net effect

The resolution stages to no diff vs HEAD. This is the redundant-commit case
(BUG-1109/BUG-1122), not a discard: STEP 3's discriminator resolves to
"present via a different route" — the incoming body edit had already reached
this branch through the merge-back that produced `d86637121a`, which then
refined it. Per STEP 4, staged and exiting `@done`; `--skip` was not called and
`CHERRY_PICK_HEAD` is left intact for `cherry_pick_finalize_resolution`.

## Flagged for post-merge review

Per the enrichment's resolution rule (intent unknown on one or both sides),
flagging `.xgd/tickets/hot/request-13a5e206.md` for post-merge review. The
substantive judgement is fact 3: the incoming ticket text states an acceptance
criterion that HEAD later revised on technical grounds. If the reviewer
disagrees with HEAD's account of where blob-store enforcement belongs
(wiring layer vs component), this is the line to revisit.
