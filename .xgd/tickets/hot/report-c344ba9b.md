---
uid: report-c344ba9b
id: REPORT-4650
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:30:03.422933+00:00'
updated_at: '2026-09-21T05:30:03.422933+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` (REQ-164) — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e**. Incoming commit `ac5bb44191` (`xgd(ticket): update request
  request-909e42f8`, 2026-08-31T22:10:20Z, `last_field_updated: body`, +126/-3).

  **Five** conflict hunks this time, not one — the incoming commit appends the entire
  "What landed" implementation narrative to the ticket body, so the conflict extends well past
  the frontmatter. Each hunk was read on both sides before resolving; all five resolve to OURS,
  for two different reasons.

  **Hunk 1 — frontmatter (L9–19): genuine fact conflict.**

  | fact | OURS (HEAD) | THEIRS (`ac5bb44191`) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-09-09T21:32:49Z` | `2026-08-31T22:10:20Z` | **OURS** — later by ~9 days |
  | `status` | `bundled` | `free_coded` | **OURS** — later, lifecycle-forward |
  | `last_field_updated` | `status` | `body` | **OURS** — pairs with OURS' `updated_at` |
  | `completed_at` | `null` | `null` | identical |

  Later-positioned-intent per 2e, matching the enrichment's stated fallback. Incoming sits at
  `free_coded`; HEAD has advanced to `bundled`, so taking incoming would regress the lifecycle.
  `last_field_updated` is a breadcrumb naming the field that the paired `updated_at` edit touched,
  so it travels with the timestamp rather than being resolved independently.

  **Hunks 2–5 — ticket body (L91–97, L103–171, L177–283, L288–294): formatting-only, not a
  content conflict.** Both sides carry the *same prose*, section for section and sentence for
  sentence — `# What landed`, `## 1. Membership is the kind` through `## 4. A short corpus is
  visible, not inferred`, `## Design decisions made during implementation`, `## Test plan`,
  `## Verification`, `## Commits`. They differ only in rendering:

  - OURS: xgd's normalized store form — long unwrapped lines, `_emphasis_`, blank lines between
    list items.
  - THEIRS: the raw authored form — hard-wrapped at ~80 columns, `*emphasis*`, tight list items.

  Neither side is a superset; there is no fact in dispute. Taking OURS therefore discards **no**
  semantic content. Taking THEIRS would have meant reverting a later normalization pass — undoing
  a subsequent transformation rather than applying an earlier intent, which is not what 2e's
  timeline rule asks for.

  An intermediate grep looked at first like git had silently duplicated the body (`## 1.`,
  `## 4.`, `## Test plan`, `## Verification` each appearing twice). It had not — those pairs were
  the two sides of hunks 3 and 4. Verified after resolution: each body heading now occurs exactly
  once, and the full section sequence is intact.

## Incoming changes preserved

Verified against `git show ac5bb441913dfa243838e54519873c8cfe4a5ebc --
.xgd/tickets/hot/request-909e42f8.md`. The commit contributes:

1. The 126-line "What landed" body — **present** in the resolved file (L88–160), in OURS'
   normalized rendering. Confirmed section-by-section against the incoming diff: all nine
   headings, the three `1c kb status` sample output lines, the four design-decision bullets, the
   four test-plan bullets, the superseded-tests and also-repaired notes, all four verification
   bullets, and both commit SHAs (`858d63202f`, `c056002a52`). No paragraph from the incoming
   body is absent.
2. `updated_at` bump — **superseded**, HEAD carries a strictly later value for the same field.
3. `last_field_updated: body` — **superseded**, for the pairing reason above.

No BUG-1301 precedence exception was invoked; no hunk was dropped on refactor grounds. No code or
UAT files were involved in this conflict.

## Flagged for post-merge review

Per the enrichment rule ("flag this file for post-merge review"), one cosmetic defect exists in
the retained OURS rendering and is worth a human glance: in `## Design decisions made during
implementation`, the first bullet reads ``- `kb status`** shells out to the ticket store.**`` —
the opening `**` is misplaced after the inline-code span, so the bold renders broken. THEIRS has
it correctly as ``- **`kb status` shells out to the ticket store.**``. This is an artifact of the
normalization already present in HEAD, not something this resolution introduced, and it is
presentation-only — the sentence text is identical on both sides. It was left as-is rather than
hand-patched, since silently importing one line from the losing side of a hunk would make the
resolution harder to audit than the defect warrants.

## Staging state

`git status --porcelain` and `git ls-files -u` are both empty; a marker grep over the resolved
file returns 0. The resolution is byte-identical to HEAD, so `git diff --cached` carries no net
change. `CHERRY_PICK_HEAD` re-read after staging and confirmed intact at
`ac5bb441913dfa243838e54519873c8cfe4a5ebc`. Per STEP 4, `--skip` was **not** called — the
finalize step owns that decision.
