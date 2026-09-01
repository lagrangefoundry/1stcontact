---
uid: report-99aeb97d
id: REPORT-3267
type: report
title: 'Reconcile resolve conflicts: reconcile-REQ-162'
created_by: xgd
created_at: '2026-09-01T23:33:47.238588+00:00'
updated_at: '2026-09-01T23:33:47.238588+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-REQ-162
---

## Files resolved

- `.xgd/tickets/hot/request-13a5e206.md` — UU, intent/bookkeeping ticket (rule 2e).
  Sparse-excluded on this branch (DOC-986 2/4.1), so the conflict existed only in
  the index with no working-tree copy; materialized with
  `git checkout --ignore-skip-worktree-bits --ours` (note: `git checkout` has no
  `--sparse` flag, contrary to the step spec) and staged with `git add --sparse`.
  Rule applied: 2e per-fact timeline (NOT a whole-file timestamp pick).

  Incoming is 6caee0c5d1 (2026-08-31 14:12:57 -0700), "content edit: answer
  implementation review — REQ-104 stranded on a resync branch, shared tenants
  registry needs an ALTER, wiring-layer enforcement, bucket name and creation
  step, no HTTP routes; both open questions settled". 99 insertions, 21 deletions.

  Unlike the two preceding commits in this bundle, this one is NOT purely
  redundant: it contains a section that ours deliberately does not carry. See
  below. Flagged for post-merge review.

## Incoming changes preserved

Verified by diffing stage :3: against stage :2:. Every substantive addition in
the incoming commit is present verbatim in the resolved (ours) version:

- "One shared `tenants` registry, and it needs an ALTER" — the 0001_site_store.sql
  collision, the IF NOT EXISTS silent no-op, putTenant() failing on the missing
  config column, ALTER TABLE tenants ADD COLUMN config, and the one-registry
  security argument. Present.
- "1. The schema." rewritten to name 0003_ticket_store.sql. Present.
- "The bucket is `1stcontact-material`." plus the vitest.workers.config.mts
  addition. Present.
- "It must be created before the next production deploy" / wrangler r2 bucket
  create, with the miniflare-conjures-it-locally rationale. Present.
- "Enforcement lives at our wiring layer, not the component's" — ticketStoreFor(env)
  throwing on absent env.BLOBS, and the note that the component's call-time
  refusal is correct upstream behaviour. Present.
- Acceptance bullet rewrites: the attachment-ops bullet naming ticketStoreFor(env),
  and the readable-back bullet expanded with the .workers.test.ts / real D1 and R2
  inside workerd / "No HTTP routes, /api/tickets/* belongs to REQ-161" reasoning.
  Present.
- "## Both open questions are now settled" replacing "## Open questions" — both
  the `reference`-keeps-its-own-type and `brief`-with-fields.site_slug answers.
  Present.
- "## Implementation notes carried from review" — src/generated/ticketing.js via
  1c assets, and the d1-site-factory.ts MIGRATIONS list. Present.

## One incoming hunk deliberately not carried (developer's own retraction)

The incoming commit's section "## Prerequisite: the installed component predates
REQ-104" is absent from the resolution. This is NOT a discard of developer work.

That section claims attachments.js is absent from xgd-working and present only on
resync-577be0d7, cites a60537ee3c as stranded on an in-flight resync scratch
branch, and concludes the real prerequisite is to land REQ-104/107/108 on
xgd-working first.

The developer retracted that six minutes later. Commit 1e28c676bf
(2026-08-31 14:18:42 -0700), on the same working timeline, immediately after
6caee0c5d1, carries the explicit message:

    content edit: correct the prerequisite — REQ-104 is on xgd-working; only the
    shared artifact store is stale, so bin/install is the whole fix

1e28c676bf replaced the section with "## Prerequisite: refresh the installed
component", citing fad535e8a4 and reducing the fix to a single
`bin/install --lang js --component ticketing --env ...` invocation. `git log -S`
on both section headings confirms the ordering: 6caee0c5d1 introduced the first
wording, 1e28c676bf removed it and added the second.

That correction is already integrated into HEAD, via seed overlay commit
8b5aa7c1ec (2026-08-31 17:01:32 -0700), which `git branch --contains` places on
reconcile-REQ-162. HEAD's version of the file carries the corrected section at
line 563.

So this is rule 2e's per-fact timeline applied to the one genuinely conflicting
section: same section, changed differently on each side, keep the side from the
later-positioned intent. Carrying the incoming wording forward would resurrect a
factual error the author themselves corrected, and would contradict the
already-integrated text. Structurally this is the same shape as the BUG-1301
precedence note — the hunk's target was superseded by a legitimate, documented
change already in HEAD — except here the documentation is explicit in the
correcting commit's own message rather than inferred.

The two frontmatter lines also not carried (updated_at 2026-08-31T21:12:57,
status: draft) are superseded by ours' later reconcile bookkeeping.

## Note for the finalize step

The staged tree nets to no diff vs HEAD (`git diff --cached --stat HEAD` is
empty), the third consecutive commit in this bundle to do so. Per STEP 3 this is
redundant, not discarded: the incoming commit's key changes are present in HEAD
via a later route, and the single hunk that is not present was removed by the
author's own follow-up commit already in HEAD. Per STEP 4, --skip was not called;
finalize will detect the clean staged diff. CHERRY_PICK_HEAD left intact.
