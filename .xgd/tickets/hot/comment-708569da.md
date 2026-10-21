---
uid: comment-708569da
id: COMMENT-5537
type: comment
title: Comment on bug BUG-239
created_by: xgd
created_at: '2026-10-21T01:16:50.067580+00:00'
updated_at: '2026-10-21T14:28:58.413569+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f8800a8e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "84d91763-5844-4c51-ae65-eaf4ba02920f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e4155d24-abe5-4afb-8211-32491cbb22c7-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T01:15:48.319742+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e4155d24-abe5-4afb-8211-32491cbb22c7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T01:19:12.542663+00:00" -->
#### Claude
Upstream isn't fixed yet and has no ticket for this, so I'm filing the lagrange-framework ticket first (per the cross-repo rule). Checking the upstream code so the ticket is precise.

Diagnosis confirmed against both the upstream source and the installed copy. Filing the upstream ticket.

Now recording the upstream ticket on BUG-239.

I haven't implemented BUG-239 yet, and no code has been written for it. As the ticket itself says, the fix has to happen upstream in lagrange-framework first, and that hasn't happened.

**What I checked:** the rule that chooses Stop is still the old one, both in lagrange-framework's source (`components/webui/chat/js/src/input.js:489`) and in the copy installed for 1stcontact:

```js
const stopOffered = () => modes.stop && busy && (talking || !stopHidden)
```

The ticket's diagnosis is right. Stop is only hidden once the status widget has been drawn. In the gap between the worker starting and its first progress update, an empty composer therefore shows Stop.

**What I did:**
- **Filed lagrange-framework BUG-89 (`bug-c489db35`)** at `draft`. It has the symptom, root cause, the one-line fix, and a jsdom UAT plan, and it points back to 1stcontact BUG-239. With a talker, only a talker reply would show Stop; sessions without a talker keep today's behaviour. Per the cross-repo rule, I wrote no code in that repo; its own session should implement it.
- **Added a Status section to BUG-239** saying it's blocked on BUG-89, that nothing has landed, and what happens next. It stays at `draft` and I didn't cut a branch.

**Why I stopped here:** BUG-239's only 1stcontact change is the UAT, and that test checks for the fixed behaviour. Written now, it would fail against the installed package, and committing a failing test breaks the free-coding rules.

**Next steps:**
1. Run BUG-89 in a lagrange-framework session.
2. After its release, run `bin/install --lang js --component all`.
3. Re-run this session; I'll write the UAT from the ticket's test plan, commit it, and move BUG-239 to `free_coded`.

<!-- xgd-turn id="b1ba2277-13cf-4ba2-a695-3b2a9051ce36-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T14:28:56.820052+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-chat-end -->