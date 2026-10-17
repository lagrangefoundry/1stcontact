---
uid: comment-f0eaf370
id: COMMENT-5440
type: comment
title: Comment on bug BUG-211
created_by: xgd
created_at: '2026-10-17T22:13:49.791613+00:00'
updated_at: '2026-10-17T22:20:14.203656+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-beb7dc74
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "309cca43-0875-4d56-ba14-6c3ff9c482d8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3ab294cd-67ef-47ae-8fd6-b37ebd3a847d-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:12:20.252973+00:00" -->
#### You
The "Change" and "Skip" links on the question cards do not immediately act on the card.

<!-- xgd-turn id="3ab294cd-67ef-47ae-8fd6-b37ebd3a847d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T22:20:07.341143+00:00" -->
#### Claude
Empty ticket. Let me find the question cards.

Now the UAT, with buttons focused before clicking as a browser does.

Passing (not skipped). Confirming they fail without the fix, then running the plan-panel regression scope.

Red without the fix, green with it; all 41 plan-panel tests pass. Checking my notes on this project's version-bump procedure before committing.

I fixed this: **Change** and **Skip** now redraw their card as soon as they're clicked.

**Cause:** when the plan panel redraws, it leaves alone any card that has keyboard focus, so that a redraw can't wipe out something you're in the middle of typing. In a browser, a button you click takes focus. So clicking **Change** or **Skip** made its own card count as "being typed in", and the redraw the click asked for was skipped. The card only caught up on some later redraw. The old tests clicked without focusing, so they never hit this.

**Fix:** in `apps/control-app/src/builder/plan-panel.js`, a card is now left alone only while focus is in a text box, text area, select, checkbox or radio button. Focus on a button no longer counts.
- **Change** opens the card's editor straight away.
- **Skip** on a reopened card shows it as "Skipped", with the editor closed, as soon as the save comes back.
- Typing in a field or ticking a multi-select during a redraw is still safe.

**Tests:** a new test file, `tests/test_UAT_FC_BUG-211_change_and_skip_act_at_once.test.ts`, focuses each button before clicking it, as a browser does. Its 3 tests fail without the fix and pass with it. The third, which checks that typing survives a redraw, uses Change to open the field, so without the fix it fails for that reason rather than on its own point. The 8 plan-panel test files (41 tests) all pass.

**Ticket:** BUG-211 has its title and body filled in and is at `free_coded`. It records the fix commit `b167998f` and the version bump to 0.2.517. The branch is merged into xgd-working and cleaned up.

Skip on a question that's still open already worked; it just waits for the server to reply. I didn't make it fold the card before the reply, so if Skip still feels slow, that wait is the reason.

<!-- xgd-chat-end -->