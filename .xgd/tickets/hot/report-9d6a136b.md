---
uid: report-9d6a136b
id: REPORT-1852
type: report
title: 'Sync-main review: reconcile-REQ-132'
created_by: xgd
created_at: '2026-08-12T17:20:51.854200+00:00'
updated_at: '2026-08-12T17:20:51.854200+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-REQ-132
---

```json
{
  "findings": [
    {
      "risk": "OK",
      "file": "apps/control-app/src/builder/image-picker.js",
      "description": "Briefing artifact, not a defect — verified and cleared. The briefing's 'Changed Files' list is computed in the reverse direction (HEAD..main), so every branch ADDITION appears marked '(deleted)'. A literal reading of the deletion-revert procedure would flag image-picker.js, storage/sites/gigabytealchemy/draft/pages/contact.json, tests/reconciliation-copy-edit-field-format.test.ts, tests/reconciliation-copy-edit-image-picker.test.ts and tests/req132-image-picker-thumbnails.test.ts as resurrections of main deletions. They are not. `git cat-file -e main:<path>` reports all five ABSENT from main and present in HEAD, and `git log --all -- apps/control-app/src/builder/image-picker.js` shows the file has only ever been introduced by REQ-132's own free-coded commit (7ca82800f and its four rebase incarnations) — main never contained it, so it cannot have deleted it. These are the additions REQ-132 exists to make."
    },
    {
      "risk": "OK",
      "file": "package.json",
      "description": "The briefing lists package.json as '(modified)' but it does not appear in `git diff main..HEAD`. Verified identical: `git rev-parse main:package.json HEAD:package.json` both yield 0b9d26030fdbcd671b74139b00d47bd6d9758014. This was a main-side change from the pre-rebase snapshot that is now part of the rebase base and untouched by the branch. No revert."
    },
    {
      "risk": "OK",
      "file": ".",
      "description": "No semantic revert of main's intent is structurally possible in this state. `git merge-base main HEAD` returns 4816008210f04ef3cad7b9be9586564f8741eb98, which is main's tip — main is a strict ancestor of HEAD (`git merge-base --is-ancestor main HEAD` succeeds), so main's tree is fully contained and the branch is a pure fast-forward extension of it. No deletion, rename, value change or move on main's side can have been undone, because main contributes no commits that the branch replayed over. Conflict-marker scan over the entire HEAD tree (excluding .xgd/tickets prose) returns zero matches; `git ls-files -u` reports zero unmerged entries; `git status --porcelain` is empty; neither rebase-merge/ nor rebase-apply/ exists."
    },
    {
      "risk": "OK",
      "file": "apps/control-app/src/builder/editor.js",
      "description": "Composition after replay verified empirically, not just by inspection. Code is byte-identical to the state the quality gate validated — `git diff --name-status 237998218..HEAD -- . ':!.xgd/tickets'` is empty, so the two commits added since (report-42964c39, matrix_verdict) touch bookkeeping only. Symbol wiring is consistent: isImagePicker/mountImagePicker are imported in editor.js and defined in image-picker.js, assetUrl is defined in api.js and consumed at image-picker.js:136, and openLoneControl's narrowed call site (editor.js:321, now passing formFields rather than spec.schema) matches its definition at editor.js:412. I ran the five affected test files (36 passed) and a wider 12-file builder/editor regression set covering the gesture, write-path, edit-loop, modal-dismiss, image-selection and background-selection surfaces (87 passed) — 123 tests, 0 failures."
    },
    {
      "risk": "LOW",
      "file": "storage/sites/gigabytealchemy/draft/pages/contact.json",
      "description": "Scope observation only — not a regression and not a revert. This 6-line site content page enters main through commit 87beb3027 ('xgd(resync): terminal state complete'), a resync bookkeeping commit, rather than through REQ-132's feature commit; it is unrelated to the image picker. It is safe: `git log --all` shows the path has only ever been ADDED (across five resync incarnations) and never deleted on any ref, so it cannot be resurrecting a main-side deletion, and main's pages/ directory holds only home.json. Flagging purely so it is a conscious decision that operator-created draft site content rides into main inside this reconcile bundle."
    }
  ]
}
```
