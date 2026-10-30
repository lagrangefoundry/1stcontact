---
uid: report-b21d12b8
id: REPORT-5459
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:46:20.501355+00:00'
updated_at: '2026-09-29T04:46:20.501355+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bug-3ade1af4.md` — **UU**, intent/bookkeeping ticket
  (STEP 2e, `bug-*.md`). Six conflict hunks: frontmatter block
  (`title`/`updated_at`/`completed_at`/`status`), the `commits`/`version`/
  `bundled_in` metadata block, the `Errors 30 errors` whitespace line, the
  Cause-2 heading and body, the Cause-3 heading and items 2/3/4, the AC-1336
  and AC-1341 paragraphs, and the AC-1342 / test-plan tail.

  **Rule applied: superset.** The incoming side (`cda495bd6e`,
  `updated_at: 2026-09-01T19:15:17Z`, `status: free_coding`,
  `completed_at: null`) is an *earlier revision of the same ticket*. HEAD
  carries the later revision (`updated_at: 2026-09-19T15:15:31Z`,
  `status: free_and_reconciled`, `completed_at: 2026-09-14`, plus
  `commits`/`version: 0.2.33`/`bundled_in: bundle-8e1807f6`). Every
  statement the incoming revision makes is present in HEAD in superseding
  form, so HEAD was taken whole. This is 2e's "one side a strict superset:
  keep the superset", not a per-fact timeline tiebreak — no field is
  changed *disjointly* on the two sides; every conflicting hunk is the same
  fact restated later.

  Mechanics: `.xgd/tickets/` is outside this branch's sparse-checkout cone
  (DOC-986 §2/§4.1), so `git checkout --ours` refused. Restored from
  `git show HEAD:<path>` and staged with `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the sole conflicted path is
a bookkeeping ticket, so STEP 3's `git show $CPHEAD -- <file>` code-hunk
check does not apply, and the BUG-1301 precedence exception was not needed.

For completeness, the incoming→HEAD delta on this ticket was audited
hunk-by-hunk. Exactly one passage exists only on the incoming side:

> "Note for later: nothing in the suite builds these assets, so the failure
> recurs on any fresh checkout. Out of scope here; worth a ticket of its
> own."

It is absent from HEAD because HEAD *resolved* what that note deferred:
Cause 2 on the HEAD side is rewritten from "environment, no code change"
to a diagnosed production defect — `1c assets` `rm -rf`'d `dist-assets/`
before refilling it — fixed by staging the new tree in
`dist-assets.staging/` and swapping it in atomically. The note's own
follow-up is therefore discharged, not discarded. Every other
incoming-side assertion appears in HEAD, expanded: ten UATs became eleven
(AC-964 added), and AC-1055 / AC-1123 / AC-1331 / AC-1336 / AC-1341 /
AC-1342 each carry strictly fuller rationale.

## Staging state

`git ls-files -u` is empty; no conflict-class entries remain. The staged
tree is byte-identical to HEAD (`git diff --cached HEAD` empty), so this
cherry-pick resolves to a no-op — left for the finalize step to detect and
skip, per instructions. `CHERRY_PICK_HEAD` (`cda495bd6e`) is intact; no
`--continue`/`--skip`/`--quit`/`--abort` was issued.
