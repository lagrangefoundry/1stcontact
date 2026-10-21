---
uid: bug-f8800a8e
id: BUG-239
type: bug
title: 'Chat composer: Stop shows while only the consultant''s worker is running'
created_by: REQ-419
created_at: '2026-10-20T23:33:17.148650+00:00'
updated_at: '2026-10-21T01:21:41.289295+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: medium
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-708569da
---

## Symptom

When the consultant starts working, the chat's ▶ Send button turns into a **Stop** button while the composer is empty. At that point only the worker is running, and no talker reply is being generated. The client reads the stop sign as "you can't write now", and has to know to type anyway, which is when it turns back into Send. Reported by the operator on 2026-10-20, during the Bob's Salon 3 session, as a follow-on to REQ-419.

## Required behaviour

For a consultant with a talker (the 1stcontact consultant, `session.talker === true`):

- While the worker is running and no talker reply is generating, the composer shows **Send**, never Stop, whether or not the box is empty. A message written then goes to the talker, as now.
- The composer shows **Stop** only while a talker reply is generating, and it stops only that reply. This part is unchanged.
- **Stop building** in the status widget remains the only way to stop the worker. This part is unchanged.
- Sessions with no talker keep their current Stop behaviour.

This is what lagrange-framework REQ-210 already specifies: item 15, and its UI test "the composer shows Send during a worker round".

## Root cause (diagnosed, not yet fixed)

The rule lives upstream, in `@lagrangefoundry/webui-chat`'s `src/input.js`:

```js
const stopOffered = () => modes.stop && busy && (talking || !stopHidden)
```

`index.js`'s `applyBusy()` sets `stopHidden` from `statusWidget.isShown()`. So Stop is hidden only once the status widget is drawn. Between the worker turn opening and its first `progress` frame, the session is busy, the widget isn't shown yet, and nothing is talking, so an empty composer gets Stop. With `turnModes.talk` on, the condition should be `talking` alone. Something like:

```js
const stopOffered = () => modes.stop && busy && (modes.talk ? talking : talking || !stopHidden)
```

1stcontact can't fix this from the host side. Its only lever is `turnModes.stop: false`, and that would also take away the composer's Stop for a talker reply.

## Fix

1. In lagrange-framework: change `stopOffered` in `webui-chat/src/input.js` as above, and add a jsdom UAT there: talk mode, a worker turn streaming, no `progress` frame yet, empty composer → Send shown, Stop hidden.
2. In 1stcontact: once the upstream release is installed, add a UAT here.

No 1stcontact source change is expected beyond the test. Per the cross-repo rule, the upstream change belongs to a lagrange-framework ticket and session, not this one.

## Test plan

- `test_UAT_FC_<this ticket>_*`, mounting the real builder in jsdom with a talker session (`session.talker: true`, `interpose` on the transport).
  - Start a turn whose stream has not sent a `progress` frame yet. With an empty composer, `.chat-widget-send-btn` is visible and `.chat-widget-stop-btn` is hidden.
  - Feed a talker `start` frame. Stop is offered, and pressing it calls `transport.stop` with the talker's turn id.
- Regression: the REQ-416 talker suites and the builder chat suites.



## Status (2026-10-20)

**Blocked on lagrange-framework BUG-89 (bug-c489db35)**, filed with the diagnosis and fix above. Confirmed that neither the upstream source (`components/webui/chat/js/src/input.js:489`) nor the installed shared store has the fix yet. No code has landed against this ticket. Once BUG-89 is released and `bin/install --lang js --component all` has been run, this ticket's UAT (Test plan above) gets written here. It's the only 1stcontact change.


## Review (EPIC-19, 2026-10-21)

Diagnosis and fix confirmed; still blocked on lagrange-framework BUG-89 (still `draft`; `stopOffered` unchanged upstream and in the shared install). Added to BUG-89: in talk mode the status widget with **Stop building** must appear as soon as a worker round opens, not at the first `progress` frame — otherwise the fix leaves a window in which the worker can't be stopped at all. This ticket's UAT should also assert that: worker turn open, no `progress` frame yet → the widget with Stop building is shown and the composer shows Send.