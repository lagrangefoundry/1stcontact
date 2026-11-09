---
uid: comment-b1e58835
id: COMMENT-8150
type: comment
title: Comment on bug BUG-411
created_by: xgd
created_at: '2026-11-09T20:28:37.794964+00:00'
updated_at: '2026-11-09T20:37:20.412052+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-75f3f0d7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e89971f6-1acb-4578-81c8-c6f077e62649",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="09c80eb1-52ed-40c9-acd4-895221ae50e7-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:27:16.497992+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="09c80eb1-52ed-40c9-acd4-895221ae50e7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:37:19.362394+00:00" -->
#### Claude
Not a duplicate (BUG-405 item 10 covers nagging, not the advice-mismatch). Now reading the code.

Not a duplicate; the fix is in `keptLine` matching. Checking how host-core calls it.

Reading the existing BUG-313 UAT to reuse its harness.

Writing the matching code in `layout-keep.ts` now.

Now rewiring `layout-check.ts` to use these.

Now the `set_decision` match report and refusal in plan-core.

Typecheck clean for my files (the two errors are pre-existing, unrelated). Writing the UAT next.

The toolbox shortens long strings in replies, so I'll assert on the line's identity rather than the full text.

Passing. Now the regression scope: the other keep/layout suites (BUG-313, REQ-655, BUG-405, BUG-256, REQ-429, plan surface).

Same failure on clean xgd-working, so it predates this change. Checking nothing pins the old tool description, then committing.

Committing the work, then updating the ticket body before merging back.

Now the merge-back and version bump.

BUG-411 is fixed and merged into xgd-working. The ticket is at `free_coded` (commits `77536859…` and the version bump `85ddb36f…`, version 0.2.854, 3 story points). It isn't a duplicate: BUG-405 item 10 covers the nagging, not why the keep failed to match.

**What changed**
- **A finding now has two parts:** "what is wrong", then a colon, then "what to do". The advice starts at the first `": "` that isn't inside quotes or brackets. The lines the consultant and builder see are unchanged.
- **Keeps match whether or not they include the advice.** A keep now matches on page, width, section and what is wrong, with each measurement within 2px. A trailing full stop or a note added after the line doesn't stop it matching. A keep whose measurements moved further than 2px still doesn't match, as before (BUG-313).
- **Keeps already saved without the advice now work** without being rewritten, so PLATFORM_ISSUE-15's saved keeps should stop the repeat once this is deployed.
- **`set_decision layout_kept` checks each line when it's written.** It compares each line against the lines the last looks actually said (the plan's `layout_said`). It reports which finding each line matched. A line that matches nothing is refused, the line is named, and nothing is recorded.
- **The tool description now says which part to copy:** from the page and width to the end of what is wrong. The advice after the next colon can be left off.

**Choices you may want to revisit**
- **No new `fix` field.** I split on the existing wording instead, because about 90 checks already write "what is wrong: what to do" and a field would mean editing every one. One side effect: in the "rows do not line up from row N: "a" sits beside "b"" finding, the cell names land on the advice side. A keep of that finding therefore holds for that row whatever the cells say.
- **Refuse, not warn,** for a line that matches nothing. A keep like that does nothing, and the consultant can retry in the same turn.

**Tests**
- The four new tests in `tests/test_UAT_FC_BUG-411_keep_matches_without_advice.test.ts` pass, along with the related BUG-313, BUG-287, REQ-415, REQ-356 and REQ-429 suites.
- Three of the related suites were skipped because no browser was available, so REQ-655's browser test didn't run.
- `test_UAT_FC_BUG-405_a_finding_waiting_on_the_client_or_unchanged_is_not_resent` fails, but it fails the same way on xgd-working without this change. That's BUG-405's problem, not this one.
- ESLint couldn't run here because the npm cache has root-owned files. The type check shows no errors in the changed files; the only two errors are in unrelated files.

As the ticket says, the other half of the report (re-firing when nothing changed) belongs to BUG-405 and should be confirmed on production once deployed.

<!-- xgd-chat-end -->