---
uid: report-7877bc03
id: REPORT-3758
type: report
title: 'Fix Site Delivery: Deploy & Public Serving (story) — attempt 6'
created_by: xgd
created_at: '2026-09-10T16:15:11.052227+00:00'
updated_at: '2026-09-10T16:15:11.052227+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a12e557f
  level: story
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Site Delivery: Deploy & Public Serving (story)

**Attempt**: 6
**Fixes applied this call**: 1 (one capability-body rewrite resolving findings 1–4)
**Violations remaining**: 0
**Needs more work**: false

REPORT-2ab4e505's four actionable findings all carried the same resolution
category (`story-body-edit` on the capability body) and the same root cause: CAP-82
is the one element BUNDLE-20's 2026-08-31 reconciliation never reached, so its body
still described REQ-110's retired design. They are a cluster, not four independent
repairs, and were applied as a single coherent rewrite per Step 4.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | CAP-82 (`capability-a12e557f`), Scope bullet 2 | Replaced the "shareable, immutable preview that costs the site nothing" channel with the split that survives — the builder-rendered mutable draft vs. immutable numbered published revisions. Retirement recorded, not deleted, citing REQ-149 D7 |
| 2 | story-body-edit | CAP-82, Scope bullet 1 | "naming it by its contents" → "naming it by the revision number it was minted as"; added STORY-94's distinction that the content digest is an audit value, not an address (REQ-149 D6) |
| 3 | story-body-edit | CAP-82, out-of-scope parenthetical | Exclusion kept, reason corrected: definitions stay canonical in whichever store holds the site — operator's filesystem or the cloud store — and delivery never becomes that store (REQ-143, REQ-149 AC-1) |
| 4 | story-body-edit | CAP-82, opening framing paragraph | Re-framed off the local-origin premise: "out of the store it was authored in", "stops at rendered output", "anyone who is not the author", "from *the site has been rendered*". The paragraph's surviving claim (other capabilities stop at rendered output; this one owns the path to a visitor) preserved |
| — | story-body-edit | CAP-82, Scope bullet 5 | Per finding 7's guidance, since the bullet was touched while repairing 1–4: "what a deploy reports … will and will not delete" re-anchored to STORY-94's forward-only guarantee ("never removed, renumbered or reused") rather than to the retired `--dry-run` / `--prune` flags |

Findings 5 and 6 are `info` with `Suggested edit: none` and required no action.

### House style honored

Per the report's "Precedent for the wording" note, the retirements are recorded in
a named section — **"What was retired, and why it was recorded rather than
ported"** — matching STORY-94's "What was removed, and why it was removed rather
than ported" / "Draft preview snapshots are dropped, not ported" and STORY-96's "A
second addressing form was retired, recorded rather than absorbed". Each of the
three retirements names its retiring intent decision (D6, D7, D6 respectively).

### Verification performed

Term sweep of the rewritten body for retired-premise vocabulary — `naming it by
its contents`, `operator's machine`, `operator's laptop`, `bytes exist locally`,
`on disk`, `dry-run`, `--prune`, `manifest`: **zero hits**. `shareable` returns a
single hit, inside the explicit retirement record ("The shareable, immutable draft
preview channel is dropped, not ported"), which is the shape this check asks for
and matches how STORY-94/95/96 passed.

Cross-checked against the stories so the capability no longer contradicts them:
the new bullet 2 agrees with STORY-95's "There is no second addressing form"; the
new bullet 1 uses STORY-94's own words for the digest; the new out-of-scope reason
agrees with STORY-94's opening ("Publishing no longer happens on the operator's
machine").

## Code Edits (if any)

None this call. The report is explicit that no production code change is implied —
the code is the thing the capability text disagreed with, and its tier-3
implementation check confirmed the retired behaviour is absent from the code
(`tools/generate/src/deploy/` does not exist; `parseRoute` has no draft/sha
branch). No tests were run because no AC, UAT or code was touched: `uat_coverage`
remains `pass` on the capability and all three stories, and this was a matrix-text
repair only.

## Not cascaded (deliberate)

Per the report's "Do not cascade this into the ACs" instruction, no AC was edited,
deprecated or added, and no `uat_coverage` field was written. This finding has no
AC-level echo — STORY-94's and STORY-95's ACs already sit under bodies describing
the one-channel, revision-numbered world, and STORY-96's nine ACs were swept in
attempt 5 and re-checked by this report.

## needs_review Items Forwarded

None. No finding in REPORT-2ab4e505 was categorized `needs_review`
(`needs_review_count: 0`).

## Carried forward, still not a finding

STORY-96's documented in-code drift at `tools/generate/src/cli/serve.ts:72-74` —
the comment still citing the false "Cloudflare Pages auto-serves `.html`" premise —
remains present. The report notes it has now survived at least two alignment
cycles and that a one-line comment fix would retire the note from STORY-96's body,
but it is explicitly not raised as a finding and sits outside this scope path, so
it was left untouched. Flagging it here for the operator: it is a one-line comment
edit whenever someone wants the note gone.
