---
uid: report-36850b1e
id: REPORT-5144
type: report
title: 'Resync resolve conflicts: d7587990b588ef6c03b752fe16afa93745aa9da3'
created_by: xgd
created_at: '2026-09-26T21:46:59.885633+00:00'
updated_at: '2026-09-26T21:46:59.885633+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — **AA (both added)**, intent/bookkeeping
  ticket (STEP 2b + 2e). Resolved to the **HEAD (ours)** blob
  `505e6129efbc1a93600b2410351b00678eeb3fd5`, byte-exact (`git hash-object`
  confirms). The conflict had materialized in the working tree with real markers
  at lines 8 and 58 despite `.xgd/tickets/` being a sparse-checkout edge case;
  staged with `git add --sparse`.

  **Why ours, per fact.** The two sides' bodies are byte-identical — the entire
  diff is four frontmatter facts, and HEAD is later and a strict superset on
  every one:

  | fact | ours (HEAD) | theirs (incoming) | winner |
  |---|---|---|---|
  | `status` | `free_and_reconciled` | `ready_to_reconcile` | ours — strictly downstream in the lifecycle |
  | `completed_at` | `2026-08-31T14:22:38.684806+00:00` | `null` | ours |
  | `updated_at` | `2026-08-31T14:22:38.684806+00:00` | `2026-08-20T02:59:27.927030+00:00` | ours — 11 days later |
  | `bundled_in` | `bundle-b3b7c399` | *absent* | ours — addition with no competing value |

  Commit positions agree with the field timestamps: the HEAD-side write is
  `9981276295410edc72834ae1a72c051ea6cd2fb7` (authored 2026-08-31 07:22:38 -0700
  = the exact `updated_at` above, on top of `434f316f194` `seed_local_overlay`);
  the incoming write is `458b7fc9c239c9e76eb9bc17687c05f0906bcc91` (authored
  2026-08-23) but carries a 2026-08-20 ticket state. Taking incoming would have
  regressed `free_and_reconciled` → `ready_to_reconcile`, cleared `completed_at`,
  and dropped the `bundled_in` link to `bundle-b3b7c399`.

  Net effect is a no-op against HEAD, so `git status --porcelain` is empty and
  the finalize step will see a clean staged diff. `--skip` was **not** called.

## Incoming changes preserved

- `.xgd/tickets/hot/request-0cdfdc5b.md` — no code file; nothing dropped. The
  incoming commit `458b7fc9c` adds this path as a new file (370 lines, pure
  insertion). Its **entire body is byte-identical** to HEAD's — verified by
  diffing the two blobs, which yields only the four frontmatter lines tabulated
  above. Every substantive line the developer wrote on the incoming side (the
  REQ-146 narrative, §1–§5, the "What landed (2026-08-18)" section, the Evidence
  section) is present verbatim in the resolved file.

  The only incoming facts not carried forward are the four older frontmatter
  values, which are superseded lifecycle bookkeeping rather than developer
  intent. The BUG-1301 precedence exception was **not** invoked and no test
  function was deleted on either side.

## Cherry-pick state

`CHERRY_PICK_HEAD` is still present at `458b7fc9c239c9e76eb9bc17687c05f0906bcc91`.
No `--continue` / `--skip` / `--quit` / `--abort` was issued.
