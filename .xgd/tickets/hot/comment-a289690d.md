---
uid: comment-a289690d
id: COMMENT-2277
type: comment
title: Comment on request REQ-186
created_by: xgd
created_at: '2026-09-05T18:29:00.000137+00:00'
updated_at: '2026-09-05T18:49:19.366436+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7af3f4e4
  kind: chat_transcript
---

<!-- xgd-turn id="527a9273-9902-44f7-9d18-6dd97dd3c914-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T18:28:34.219950+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="527a9273-9902-44f7-9d18-6dd97dd3c914-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T18:49:18.846635+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now the UI side — the Users tab.

The ticket is fully specified. Two judgement calls I'm making rather than blocking on (both recorded in the ticket body):

1. **`provisionInvite`'s deletion blast radius.** It's the setup fixture in 12 test suites. It becomes `tests/support/invite-account.ts` — a fixture that calls the two shipped functions. The composite shape leaves production code (which is the ticket's point) without rewriting 100 call sites.
2. **Refusal without an admission.** On the dev-open loopback path there is no admission, so the invite refuses there too — same reasoning `/api/admin/businesses` gives, but 403 not 404, because every business owner has this control so its existence is no secret.

Starting the protocol.

Now let me verify the baseline test suite runs in the worktree before I change anything.

Worktree is functional. Now the implementation — starting with the origin: `invitePerson` in `people.ts`.

Now delete `provisionInvite` from `identity.ts`.

Now the route.

Pre-existing on `xgd-working`, unrelated. Now the client API and the panel control.

Good — `position: fixed`, so mounting inside the panel is safe. Now the panel control.

Now the test fixture replacing `provisionInvite`, then the test migrations.

Now migrate the 12 test suites off `provisionInvite`.

Now the REQ-167 tests that asserted the composite's own semantics need retargeting to the decomposed pair.

Now the whole identity/people family, to catch fallout from the fixture swap.

The refactor is green. Now the REQ-186 UATs — the origin suite first.

Now the origin UAT suite.

I inserted into the `/api/import` catch. Moving it to the table's own handler.

Now the UI UAT for the tab control.

The UI test surfaced a real defect: `people.js`'s `openDetail` treats the component's second argument as an element, but `list-detail` passes a tab controller — so selecting a person renders an empty pane and throws. Let me confirm and fix.

Now wiring the fulfilment control, which the ticket's composition story depends on but which is currently a dead hook nothing passes.

Adding a UAT for the composition on the tab — the pair that makes a level-1 customer.

Now the regression scope: the whole identity/builder family plus static guardrails.

That was an environment gap, not my change. Running the full suite now.

While that runs, let me update the ticket body so every UAT is motivated by ticket language.

All 11 failures reproduce identically on the untouched `xgd-working` checkout — zero regressions from this change. Now the commit.

Final verification against the merged `xgd-working` checkout:

Done. REQ-186 is at `free_coded`, commit `27345a60cb`, merged into `xgd-working`, version 0.2.73.

## What landed

**The invite** — `invitePerson` in `people.ts`, `POST /api/people/invite`, scoped to the business the caller is in. It **updates** the row `(tenant_id, email)` already decides and inserts only when there is none, so a captured contact who is later invited is promoted rather than duplicated. It writes no entitlement and no membership: the Portal is what membership *is*.

**The gate is `ownsBusiness`, not `ownsPlatformBusiness`** — the mistake the ticket flagged. A UAT asserts Alice may invite into hers and not into 1st Contact's, and a second asserts `platform_operator` (which opens a business you hold no membership on) doesn't thereby make you its owner. 403, not the fulfilment route's 404, because every owner has this control so its existence is no secret. The dev-open loopback path is refused too.

**`provisionInvite` is gone.** It survives as `tests/support/invite-account.ts` — the two shipped calls in order — so twelve suites keep their one-line setup while the composite shape leaves production code. Three REQ-167 cases that asserted the composite's own semantics were retargeted rather than left pointing at a fixture.

## Two things I found and fixed, recorded in the ticket

Both were needed for the ticket's own "Invite + Provision a business composes" claim to be true on screen:

- **The fulfilment control was dead code.** REQ-170 wrote it behind an `onFulfil` callback nothing ever passed — route live, flag reported, button unreachable. Now wired.
- **The User tab's detail pane never rendered.** `list-detail` calls `openDetail(item, tabController)` and reads `descriptor.element`; the panel's version was `async` and treated the second argument as a view. The component mounted its empty placeholder and the append threw into an unhandled rejection — a blank pane for every person, with no visible error. A UAT now asserts the pane has content.

## Evidence

22 UATs — 14 in workerd against real D1 and real RS256 Access tokens, 8 in jsdom against the actually-installed webui components.

Full suite: **11 files / 30 tests failing**, and the identical 11 files / 30 tests fail on untouched `xgd-working` — all KB-index and `bug32-webui-scope` pre-existing failures. Zero regressions.

One environment note: a fresh branch worktree needs `node_modules/@lagrangefoundry` symlinked, `src/generated` copied, and `./bin/1c assets` run before the suite is usable — the KB suites can't pass there at all without Cloudflare embedding credentials.

<!-- xgd-chat-end -->