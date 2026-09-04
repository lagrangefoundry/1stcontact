---
uid: report-01e106b3
id: REPORT-3420
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-23'
created_by: xgd
created_at: '2026-09-04T00:10:42.897643+00:00'
updated_at: '2026-09-04T00:10:42.897643+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-23
---

## Files resolved

- `.xgd/tickets/hot/request-439cd0c8.md` — **UU**, intent/bookkeeping ticket (§2e).
  Path is outside the sparse-checkout cone (DOC-986 §2/§4.1): the conflict existed
  only in the index, with no working-tree markers. Resolved with
  `git checkout --ours` + `git add --sparse`.

  **Rule applied — §2e "one side is a strict superset":** HEAD is a strict superset
  of the incoming commit on every fact the incoming commit touches.

  - Incoming (`a473afd7`, free_coded, 2026-08-31T15:57:11-07:00) is a pure content
    edit: rename the "shadow" concept to "description"/"describe", and
    `shadow_status`/`shadow_model` -> `description_status`/`description_model`.
  - HEAD (`31823f5b7c`, seed_local_overlay, 2026-09-02T10:50:06-07:00) already
    contains that identical rename, applied to the same lines, **plus** a large
    body of later content: the "What was built, and where it departs from the
    decisions above" section, the bundle measurement table, the Evidence section,
    the "Resolved after implementation (2026-08-31)" section, a new Acceptance
    bullet on the no-store directive, and a replacement Open questions section.
  - Frontmatter: the same fields (`updated_at`, `last_field_updated`, `status`)
    are changed on both sides. Per §2e's per-fact timeline rule the later-positioned
    intent wins, and HEAD is later on every one: `updated_at` 2026-09-02T17:48:27
    vs incoming 2026-08-31T22:57:11, and HEAD carries the bundle bookkeeping the
    incoming side predates -- `status: bundled`, `bundled_in: bundle-203b1dc2`,
    `commits[0].working_sha: d99c1f438572f2da868db0bc384c798858681cac`,
    `version: 0.2.24`. Taking the incoming side would have reverted `status` from
    `bundled` back to `draft` and dropped the bundle linkage.

  No content was invented, and no field was modified beyond what one side's own
  version already declares.

## Incoming changes preserved

Verified against `git show a473afd7 -- .xgd/tickets/hot/request-439cd0c8.md`.
The incoming commit has 14 changed lines across 12 hunks. 11 of the 12 hunks are
present verbatim in the resolved file; a `grep -i shadow` over the resolved blob
returns **zero** matches, confirming the rename is complete rather than partial:

- `3. **Describe.**` (line 49)
- `| Input | Description |` table header
- `**Create the ticket** with that description as its body, plus SS9's fields.`
- `The description is what the knowledge base indexes.`
- `A weak description is not a cosmetic problem`
- `whose body is a usable description` (line 108)
- `selectable by \`description_status\`` (line 119)
- `**The image description takes a second LLM path, deliberately.**`
- `**\`description_status\` is one mechanism for three degraded cases**` (line 150)
- `for a later re-describe pass. \`description_model\` is recorded alongside it.` (line 154)
- `no automatic re-describe` (line 159)

### One hunk dropped under the BUG-1301 precedence exception

The 12th hunk renames "re-shadow" -> "re-describe" inside this bullet in the
Open questions section:

    - **Whether a re-shadow pass is operator-triggered or automatic** once a better
      model exists. The fields make either possible; nothing chooses yet.

- **HEAD-side commit that removed the target:** `31823f5b7c`
  ("xgd(ticket): seed_local_overlay request request-439cd0c8", 2026-09-02).
- **Why that removal is a legitimate, documented decision and not a resolution
  shortcut:** the commit did not delete the question -- it *answered* it, and says
  so in the file itself. It adds a section headed
  "## Resolved after implementation (2026-08-31)" whose opening sentence reads:
  "Two of the questions left open at hand-off have since been answered. Recorded
  here rather than by deleting them, so what made them questions stays legible."
  The bullet's specific question is resolved under the heading
  "**Re-describe splits by field: automatic where there is no description,
  operator-triggered where there is one that could be better.**", which then
  distinguishes the `no_describer`/`failed` predicates (automatic) from
  `no_text`/`unsupported`/`too_large` (not defects) and from `description_model`
  (operator-triggered). The sibling open question about `describeImage` moving into
  the AI component is resolved in the same section, naming lagrange-framework
  REQ-111 as the consolidation point in place of REQ-157.
- **The incoming intent is honoured, not discarded:** HEAD's replacement text
  already uses the renamed vocabulary throughout ("re-describe", "description",
  `description_status`, `description_model`). Re-applying the incoming hunk is
  impossible -- its target paragraph no longer exists -- and unnecessary, because
  the rename it performs is already in effect at the line that superseded it.

### Net result

The staged tree has no diff against HEAD: the incoming commit's effect had already
landed through the later local-overlay commit. Per STEP 4 this is a genuinely
redundant commit (BUG-1109/BUG-1122), not a discarded one -- STEP 3's test
distinguishes them, and here the incoming commit's key changes are demonstrably
**present** in HEAD rather than absent. `--skip` was not called; CHERRY_PICK_HEAD
(`a473afd7faef6c0f781f061d73c9e4864a30c57b`) is left intact for
cherry_pick_finalize_resolution.
