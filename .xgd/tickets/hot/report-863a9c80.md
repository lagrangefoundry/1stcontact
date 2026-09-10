---
uid: report-863a9c80
id: REPORT-3710
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (ac) — attempt 4'
created_by: xgd
created_at: '2026-09-10T09:50:51.919595+00:00'
updated_at: '2026-09-10T09:50:51.919595+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: ac
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (ac)

**Attempt**: 4
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

Findings 1 and 2 of `report-89cba15c` are the same edit to AC-966 seen from the
consistency and the exclusivity side; both are closed by one `ac-edit`. Finding
3 (warning, standing through two checks) was taken opportunistically in the same
pass, as the report's Notes for the Editor invited. Findings 4–8 are `info` with
resolution category `—` and were deliberately not acted on.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-966 (`acceptance_criterion-6fb2bebc`) | Rewrote criterion + verification + title. Removed the pre-REQ-119 premise that a rendered artifact exists to be served, and deleted the exclusion list that named the shipped mechanism ("a re-generation") by name. Narrowed to the display-panel binding. |
| 2 | ac-edit | AC-1036 (`acceptance_criterion-46e9debf`) | Narrowed the confinement paragraph and Verification to the claims AC-978 does not make (unknown page, unknown site); deferred the plain and percent-encoded traversal probes to AC-978 explicitly. |

### Finding 1 + 2 — AC-966

Took the report's **primary** route (narrow), not the acceptable alternative
(`ac-deprecate`), because one claim does survive the fold and is not made
anywhere else in the capability: **the ordinary viewing mode's pane is bound to
the real rendering path for the selected site.** AC-967 owns the *selector* (its
options equal the store; choosing another changes the displayed document) and
AC-1029 owns the *editable* mode; neither asserts that the ordinary mode's pane
renders the operator's real site rather than a stand-in. The three now partition
cleanly — selector / ordinary mode / editable mode — instead of overlapping.

Everything the report identified as belonging elsewhere was moved out by
reference rather than restated:

- **Byte-identity → AC-1032**, which already makes it more strongly (both
  draft-side channels, every artifact including `theme.css`, channel root equals
  `index.html`). AC-1032 was **not** touched — the report's warning against
  "repairing" AC-966 by weakening AC-1032 to match was honoured.
- **No-artifact-on-disk → AC-1031**, which already resolves the stylesheet from
  the document's own `href`. AC-1031 was not touched; the asset clause needed no
  migration because AC-1031's second assertion already covers it more strongly
  than AC-966's directory glob did.
- The new Verification **explicitly forbids** asserting byte-equality against a
  file on disk, naming AC-1031's guarantee as the reason. This is what stops the
  stale assertion being reintroduced by the next uat cycle.

Title also corrected — it carried the stale claim verbatim ("byte-identical to
the rendered artifact") and would have kept the superseded model visible in
every listing of this capability.

The report's code citation was re-verified independently rather than taken on
trust: `apps/control-app/src/router.ts:578` ("`draft` and `edit` render ON
REQUEST from the stored definition, now in workerd") and `:599`
(`servePreview(await openStore(), …)`, defined at `:726`). The served bytes are
a re-generation, so the exclusion AC-966 carried was excluding the shipped
behaviour.

### Finding 3 — AC-1036

Chose the report's first option (narrow) over its second (declare the re-run
deliberate), because the duplication was total — same traversal forms, same
non-delivery guarantee, same wording — and AC-978 makes the claim across all
three served trees while AC-1036 could only ever make it for one. The deferral
is now stated in the AC body rather than left implicit, so a future check reads
the omission as a decision rather than a gap.

## Parent story

**No `story-body-edit` was required or made.** Checked the full STORY-99 body
(39,660 chars, read via `--json` — the default `ticket get` truncates at ~1.5k
and a grep over that output silently returns nothing). It already carries the
request-time model correctly: *"There is no rendered artifact for the workspace
to serve"* (body line 109). The staleness was AC-local, which matches the
report's "There is one repair to make" and the story-level cycle passing today
(`report-e9695d41`).

## Code Edits (if any)

None this call. Both mutations are ticket-body edits.

## Downstream consequence — for the uat cycle, not fixed here

Flagging, as the report asked, without acting:

- `tests/reconciliation-builder-workspace-origin.test.ts:121-147` is AC-966's
  evidence. It repeats the now-deleted exclusion as a comment at `:122-124` and
  asserts against `storage/dist/sites/alpha/draft/index.html`, which exists only
  because that suite's `makeWorkspace` pre-renders it at `:88-96`. It now
  asserts more than AC-966 claims and is a `uat-edit` for the uat-level cycle.
- AC-1036's evidence still contains the two traversal probes this edit deferred
  to AC-978. Harmless (they pass, and AC-978 asserts the same thing), but they
  are no longer AC-1036's evidence.

`uat_coverage` was **not** touched on either AC — that field is owned by the
`check`/`fix_uat_coverage` cycle, and setting it here would manufacture progress
this call did not make.

## needs_review Items Forwarded

None. No finding in `report-89cba15c` was categorized `needs_review`.

## Standing recommendation, third time raised

Neither CAP-85 nor any of its 36 ACs carries an `intent_uid`, and `updated_by`
on STORY-99 is a scalar holding only the most recent updater. Finding 1 — a
2026-08-07 AC left standing under a 2026-08-10 intent that superseded it — would
have been mechanically visible with those fields populated, instead of costing
three reconstructions of the intent ledger across three reports. This is an
operator decision (a backfill, not an ac-level fix), so it is recorded here
rather than acted on.
