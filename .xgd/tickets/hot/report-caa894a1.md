---
uid: report-caa894a1
id: REPORT-4753
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T15:03:54.756978+00:00'
updated_at: '2026-09-21T15:03:54.756978+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — UU, intent/bookkeeping ticket
  (§2e). Outside the sparse-checkout cone, so resolved via editor +
  `git add --sparse`. Nine conflict hunks, all resolved to the HEAD
  side.

  The two sides are the same ticket at two points in its life, not
  two competing edits:

  | | HEAD (ours) | `cda495bd6e` (theirs) |
  |---|---|---|
  | `updated_at` | 2026-09-19T15:15:31Z | 2026-09-01T19:15:17Z |
  | `status` | `free_and_reconciled` | `free_coding` |
  | `completed_at` | 2026-09-14T10:29:13Z | `null` |
  | body | eleven UATs; Cause 2 carries a real defect + the staging fix | ten UATs; Cause 2 "no code change" |
  | `fields` | `commits`, `version: 0.2.33`, `bundled_in: bundle-8e1807f6` | absent |

  `cda495bd6e` is not an ancestor of HEAD (`git merge-base
  --is-ancestor` → false); it is an 18-day-old in-progress snapshot
  being replayed onto state that has since been completed, bundled
  and reconciled. Every hunk is stale-vs-current on the incoming
  side, so this is a per-fact application of §2e's "take the
  LATER-positioned intent" rule that happens to land on the same
  side for all nine facts — not a wholesale winner-picking.

  Facts, and why HEAD is later on each:
  - `title` — HEAD's names eleven UATs and the 30 collection errors;
    theirs names ten and 23 failures. HEAD's is the superset.
  - `updated_at` / `completed_at` / `status` — taking theirs would
    roll the ticket back to `free_coding` and null out a completion
    that has already happened.
  - `fields.commits` / `version` / `bundled_in` — present only on
    HEAD; theirs predates the bundle. Taking theirs would drop
    provenance metadata.
  - Symptom code block — the only non-semantic hunk: `Errors  30
    errors` differs by one leading space. Whitespace; HEAD's kept.
  - Cause 2 heading + body — HEAD documents a real defect (`1c
    assets` emptying `dist-assets/` before refilling it) and its
    staging fix; theirs says "no code change" and leaves a
    note-for-later. HEAD supersedes.
  - Cause 3 items 2/3/4 — HEAD's are strict elaborations of theirs
    (AC-1055 gains the traversal-onto-a-real-site case and the test
    renames; AC-1123 gains the panel assertion; AC-1331 gains the
    deliberate leg ordering).
  - Item 5 (AC-1336/1337/1338) — HEAD adds the origin-keyed fetch
    double; theirs has the one-line version.
  - Item 6 (AC-1341) — same assertions dropped on both sides;
    wording only.
  - Item 7 (AC-1342) + item 8 (AC-964) + Test plan — item 8 exists
    only on HEAD; HEAD's test plan covers the production change
    theirs does not have.

  Result is byte-identical to `HEAD:.xgd/tickets/hot/bug-3ade1af4.md`
  (including its lack of a trailing newline); no conflict markers
  remain.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted
path is a bookkeeping ticket (§2e), so STEP 3's `git show $CPHEAD --
<file>` preservation check does not apply and the BUG-1301
PRECEDENCE exception was not invoked.

For completeness on the ticket itself: the incoming side contributes
nothing that is not already present in, or superseded by, HEAD. Every
incoming hunk is an earlier draft of a fact HEAD states more
completely, or metadata HEAD has since gained. Nothing disjoint was
discarded.

## Notes for the next step

- Staged diff against HEAD is EMPTY — the resolution reproduces HEAD
  exactly, which is the correct outcome for a fully-superseded
  replay. `git status --porcelain` prints nothing. Per STEP 4 this
  was left alone: no `--skip`, no `--continue`; CHERRY_PICK_HEAD
  (`cda495bd6e`) is still present for finalize to detect the clean
  staged diff and skip the commit.
- The auto-enrichment classified intent as unknown on one or both
  sides and asked that the file be flagged for post-merge review.
  Flagging it here: `bug-3ade1af4` (BUG-40). The timestamp rule the
  enrichment prescribed and the per-fact §2e analysis above agree,
  so confidence is high, but the enrichment's own request for review
  is recorded rather than silently dropped.
