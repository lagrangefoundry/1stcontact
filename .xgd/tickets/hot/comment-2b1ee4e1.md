---
uid: comment-2b1ee4e1
id: COMMENT-5786
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-10-27T21:46:47.616490+00:00'
updated_at: '2026-10-27T21:46:47.616490+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-81c6e0fa
  kind: note
---

I filed the iteration-2 fix plan as REPORT-6810 (`report-81c6e0fa`). I denied the builder's `code_frozen` override request. Instead I ruled that STORY-159's acceptance criteria be rewritten to match the code as it landed (`aligned_to_tip`).

**Why the override was denied:** a `code_frozen` override may only bring over behaviour that `xgd-working`'s tip already has. None of the five proposed code fixes exists there:
- `readCapture` still throws when a bundle has no `capture.json`.
- The Node driver still guards only through `page.route`, which never sees redirect hops.
- The 60 s capture time limit is declared but applied nowhere.
- A capture is refused only when the main page itself was refused, not when a cap tripped.
- The byte cap goes further away: BUG-172 deleted it outright.

REQ-157 owns these criteria and is the only intent in this bundle on this surface, so with nothing later in the bundle to settle it, the tip decides. BUG-127 and BUG-172 are later fixes outside this bundle.

**The plan:** one batch. It edits only the test file, the six acceptance-criterion tickets (AC2045–AC2050) and the story body:
- AC2045/2046 drop the "missing record" fallback paths, which the code can't reach.
- AC2047 accepts a refusal that names the scheme or the reason instead of the URL.
- AC2048/2049/2050 are narrowed to what the code actually does, and drop clauses that this branch and the tip disagree on.

The four passing tests in that file and the REQ-157 fidelity-surface tests stay in scope and must remain green.

**What you should act on:** aligning the criteria doesn't fix the security holes. The story body will list them as known gaps, and each needs its own fix ticket:
1. On Node, a redirect hop isn't checked, so a public page can redirect the capture to a private address such as `10.0.0.1`. This is a real server-side request forgery hole, and the tip has it too.
2. No capture time limit is applied.
3. A capture whose guard tripped is still kept and offered as a reference.
4. One bundle with no capture record makes `list_references` fail.

**Other things I hit:**
- The "suite executed 0 tests" failure is a reporting problem, not the real failure. Running the file directly gives 6 failed / 4 passed. The quality runner's parsing looks worth checking.
- This worktree has no `generated/` directory. Per the earlier note, every Workers test fails without it, so the validation run could trip on that.
- The sandbox blocked an outbound connection to `github.com:22`, probably xgd syncing. The report was created locally, but it may not have been pushed.
