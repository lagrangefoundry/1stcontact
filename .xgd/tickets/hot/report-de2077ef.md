---
uid: report-de2077ef
id: REPORT-4535
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-20T20:19:17.359779+00:00'
updated_at: '2026-09-20T20:19:17.359779+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` — **AA** (both added), intent/bookkeeping
  ticket (`request-*`), rule **2e** (later-positioned intent, per fact) +
  **2b** (one side a strict superset). Staged with `git add --sparse`
  (outside the sparse-checkout cone, DOC-986 §2/§4.1).

  Resolved to **OURS (HEAD)**.

  Evidence:
  - Incoming (`a342dac6`, authored 2026-08-23) is the ticket's **first**
    appearance on the working timeline — `new file mode`, body at
    `updated_at: 2026-08-20T23:16:38`, `status: draft`,
    `last_field_updated: created_at`.
  - HEAD (`771b0857`, 2026-09-17 `seed_local_overlay`) carries the fully
    evolved state: `updated_at: 2026-09-16T01:48:38`,
    `completed_at: 2026-09-14T10:29:03`, `status: bundled`, plus
    `commits`, `version: 0.2.39`, `bundled_in: bundle-8e1807f6`.
  - `git diff <incoming> HEAD -- <path>` yields **no incoming-only fact**.
    Every incoming-only line is a fact HEAD supersedes with a later
    version of the *same* fact:
    - frontmatter lifecycle fields (`draft` -> `bundled`, etc.);
    - "Candidates to weigh rather than assume..." -> superseded by HEAD's
      `## The decision: hand-rolled, dependency-free` section, which
      resolves that exact open question;
    - "Pin it with a fixture corpus: identical output ... within a stated
      bound" -> HEAD: "**exact equality on decoded pixels**, not a
      tolerance band";
    - AC2 and AC4 one-line forms -> HEAD's expanded AC2/AC4;
    - the `[[CHAT-27]]` Origin line appears in the diff only as a
      trailing-context artifact (HEAD appends further sections after
      `## Origin`); the line itself is present verbatim in HEAD.
  - No disjoint edit on the incoming side exists, so BUG-1030's
    "don't pick a winner wholesale" hazard does not arise here: taking
    OURS discards nothing.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path
is an intent ticket, resolved under 2e rather than 2c, so the
"incoming is authoritative" rule for `xgd_source/**`, `tests/**`,
`bin/**` did not apply to any file in this cherry-pick.

No hunk was dropped under the BUG-1301 precedence exception; no UAT test
function was touched or removed.

## Staging state

- `git ls-files -u` -> empty (no unmerged entries).
- `git status --porcelain` -> empty. The resolution is byte-identical to
  HEAD (index blob `efd42480e9` == HEAD blob), so this cherry-pick leaves
  a clean staged diff. Per instruction, `--skip` was **not** invoked;
  the finalize step will detect the empty diff and skip the commit.
- `CHERRY_PICK_HEAD` (`a342dac6d0a90d9376c4ddc41003a01c0031115f`) left
  intact.
