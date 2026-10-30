---
uid: report-3d14c2f3
id: REPORT-4675
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T09:24:32.587315+00:00'
updated_at: '2026-09-21T09:24:32.587315+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU** (both modified), intent/bookkeeping
  ticket (REQ-163, "Ingestion: from a dropped file to an indexed `material` ticket").
  Rule **2e** applied per fact, not per file. Enrichment reported intent unknown on
  both sides (identical `xgd(ticket): update request request-439cd0c8` subjects), so
  the later-positioned side governs — but only after verifying per fact that it is a
  strict superset, not by taking a whole file on a raw timestamp compare.

  Incoming `CHERRY_PICK_HEAD` = `5d360749e5` (127 insertions / 4 deletions), the
  2026-08-31T23:36 body edit that appends the "What was built, and where it departs
  from the decisions above" section, the bundle-measurement table, the Evidence
  section, the origin-wide no-store acceptance criterion, and a third (DNS) open
  question.

  Resolved to **HEAD (ours)** on every competing fact:

  | fact | base | incoming (theirs) | HEAD (ours) | taken |
  |---|---|---|---|---|
  | `updated_at` | `2026-08-31T23:13:20Z` | `2026-08-31T23:36:19Z` | `2026-09-09T21:32:50Z` | **ours** |
  | `last_field_updated` | `status` | `body` | `status` | **ours** |
  | `status` | `free_coding` | *(untouched)* | `bundled` | **ours** |
  | `fields.commits` / `version` / `bundled_in` | absent | *(untouched)* | present | **ours** |
  | AC bullet "every route carries no-store" | absent | added | **already present, identical** | *not a competing fact* |
  | §"What was built…" + bundle table + Evidence | absent | added | **already present, identical** | *not a competing fact* |
  | open question 1 (`describeImage` → AI component) | open | open + one sentence | **deleted; answered below** | **ours** |
  | open question 2 (re-describe policy) | open | open | **deleted; answered below** | **ours** |
  | open question 3 (DNS not resolved pre-fetch) | absent | added | **already present, identical** | *not a competing fact* |

  The only genuinely competing fact is the pair of open questions. Incoming keeps them
  open and appends *"The bundle measurement above adds a reason to prefer whichever
  lands sooner"* to the first. HEAD has since **answered both**, in a
  `## Resolved after implementation (2026-08-31)` section incoming does not have:

  - question 1 → vision moves into the AI component; the consolidation point is
    lagrange-framework REQ-111, **not** REQ-157. HEAD's answer subsumes incoming's
    appended sentence: it cites the same measurement (*"reclaims the +138 KiB the
    measurement above attributes to the SDK"*) and goes further by naming the ticket
    that closes it.
  - question 2 → re-describe splits by field: automatic on
    `description_status ∈ {no_describer, failed}`, operator-triggered on a stale
    `description_model`.

  Taking theirs on those bullets would have reopened two questions the ticket has
  already answered and rewound `status` from `bundled` to `free_coding`, discarding the
  `commits` / `version: 0.2.24` / `bundled_in: bundle-87be4669` bookkeeping.

- No code, test, spec-matrix (`story-` / `acceptance_criterion-` / `capability-`) or
  config files were in this conflict set — the cherry-pick touches exactly one path, an
  xgd bookkeeping ticket. No test function on either side was touched, and the BUG-1301
  precedence exception was **not** invoked.

## Incoming changes preserved

Nothing the incoming side authored was dropped.

A direct diff of the two sides shows incoming contributes **no body region HEAD
lacks**. Its entire 127-line payload — the five departures, the four-build gzip table,
the two UAT file descriptions, the no-store acceptance criterion and the DNS open
question — is byte-identical in HEAD, because HEAD descends from the same authoring
work; git only flagged the file as UU on the frontmatter block and the trailing
open-questions block.

Verified against `CHERRY_PICK_HEAD` per STEP 3:

    git show :1:.xgd/tickets/hot/request-439cd0c8.md   # base   186 lines
    git show :2:.xgd/tickets/hot/request-439cd0c8.md   # ours   355 lines
    git show :3:.xgd/tickets/hot/request-439cd0c8.md   # theirs 310 lines
    git diff --no-index theirs ours   # ours = theirs + bundled-status frontmatter
                                      #             + "Resolved after implementation"
                                      #             - the two now-answered questions

The only facts not carried forward are the superseded `updated_at` /
`last_field_updated` stamps, the `status: free_coding` that a later edit advanced to
`bundled`, and one sentence on an open question HEAD has since closed with a strictly
more specific answer — all bookkeeping or superseded intent, not developer work.

## Staging state

The path sits **outside this branch's sparse-checkout cone** (`!/.xgd/tickets/**`;
11% of tracked files present; DOC-986 §2/§4.1), so it has no working-tree file to edit
— `git ls-files -v` reports `S` (skip-worktree) for all 6250 ticket paths. The
resolution was therefore staged directly into the index, each git write issued as the
sole content of its own call per BUG-1294:

    git update-index --cacheinfo 100644,a8c14c1e9b0a39ba3b2218d64a4515bd38a951a9,.xgd/tickets/hot/request-439cd0c8.md
    git update-index --skip-worktree .xgd/tickets/hot/request-439cd0c8.md

`git ls-files -v` now reports `S` for the path (skip-worktree restored, matching the
other 6249 ticket entries); `git status --porcelain` is empty — no unmerged paths, no
modified paths; a marker grep over the staged blob returns `0`.

The staged blob (`a8c14c1e9b`) is **identical to HEAD's blob**
(`git rev-parse HEAD:…` → `a8c14c1e9b`; `git diff --cached HEAD` empty), so this
cherry-pick carries an empty net change — expected, since its entire substantive
payload is already recorded on HEAD and every remaining difference was a superseded
timestamp, a rewound status, or an open question HEAD has since answered. Per STEP 4
this is staged and exited normally rather than skipped; the finalize step should expect
a clean staged diff.

Per STEP 4, `--continue`, `--skip`, `--quit` and `--abort` were **not** called and
nothing was run that resets or forgets the cherry-pick; `CHERRY_PICK_HEAD`
(`5d360749e53dff1c0c19d2fa83d10c072249bf29`) is intact for the finalize step.
