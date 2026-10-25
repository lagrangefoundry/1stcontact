---
uid: comment-0663dda5
id: COMMENT-2878
type: comment
title: Comment on bug BUG-89
created_by: xgd
created_at: '2026-09-12T21:58:45.370218+00:00'
updated_at: '2026-09-12T22:14:05.055254+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e771acac
  kind: chat_transcript
---

<!-- xgd-turn id="030a67bc-548f-464a-95dd-49c21dc66fa3-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T21:58:08.383793+00:00" -->
#### You
I was looking at a contact on 1st contact then flipped to xgd and open the contacts page - there are no contacts listed on the contacts page but the detail page is populated with the 1st contact contact that I was looking at.

This is not just sloppy UI it is a tenant violation.

<!-- xgd-turn id="030a67bc-548f-464a-95dd-49c21dc66fa3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:09:10.877900+00:00" -->
#### Claude
Diagnosis is clear. Let me record it on the ticket first.

Now the shared helper, then both panels.

Now the two `clear()` bodies.

Now the UAT.

Green. Now confirm it's genuinely RED without the fix:

Now the regression scope — the suites that mount these two panels:

Fixed and landed on `xgd-working` as `376f0063e9` — BUG-89 is now `free_coded`.

**What was happening.** `mountListDetail` in `no-tab` mode keeps the open detail as a record in a map that is *independent of the item list*, so `setItems([])` re-renders the list pane and never touches the detail body. Both panels' `clear()` dropped the rows and left the pane standing — which is why you got an empty list beside a fully populated contact.

**On the tenant question.** You're right that it's a violation, and it's worth being precise about which kind: nothing crossed the boundary on the wire. `personDetail` scopes by tenant *and* id, and the material read goes through a scope-bound handle. What you were looking at was fetched legitimately under 1st Contact and then **outlived the scope it was read in**. That still fails the thing the two-level model rests on — the pane asserts that what it shows belongs to the business currently named — and from the operator's seat it is indistinguishable from a real leak. Severity high, not cosmetic.

**The fix.** A small shared helper, `detail-pane.js` → `clearDetail(listDetail)`: closes the active detail (which destroys the record and restores the blank pane) and drops the selection key, entirely through the component's existing public surface — no change to the out-of-repo `webui-list-detail` primitive.

**I fixed the Library too.** It had the identical defect via the same primitive, and its `clear()` already carried the comment *"leaving the previous business's material on screen under a header naming this one is the one outcome a failure here may not produce."* Both files had written down the promise and kept it only for the list. Hence one helper rather than two copies — the next panel that mounts a list-detail inherits the same trap otherwise.

**Evidence.** 5 UATs in `tests/test_UAT_FC_BUG-89_detail_goes_with_the_business.test.ts`, mounted against the real installed components. I verified they are genuinely RED — all five fail with the two `clearDetail` calls removed. Regression scope green: 38 files / 346 tests covering every suite that mounts either panel, plus `tsc --noEmit` clean.

One thing I did **not** do, and it's worth your call: the panels' `shell.storage` keys aren't per-business (`STORAGE_KEYS.people`), so split position, rail state and the expanded set are shared across businesses. None of that carries tenant *data*, so it isn't this bug — but if you want the panes to remember their shape per business, that's a separate ticket.

<!-- xgd-turn id="fc6705ad-ffd6-42dd-b063-3e29f3f0fac7-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T22:11:55.460400+00:00" -->
#### You
Is this fix something that should be pushed back to lagrange framework?

<!-- xgd-turn id="fc6705ad-ffd6-42dd-b063-3e29f3f0fac7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T22:14:04.888290+00:00" -->
#### Claude
Good question — let me check the upstream source rather than answer from the vendored copy.

Partly, yes — **the affordance belongs upstream; the policy does not.** I checked the vendored copy against the framework source first: `components/webui/list-detail/js/src/*` is byte-identical to `apps/control-app/dist-assets/webui/webui-list-detail/src/*`, so what we're running *is* current upstream.

**What should go upstream: a `clearDetail()` on the controller.**

The documented controller (`components/webui/list-detail/js/README.md:76-88`) has `setItems`, `select`, `openTab`, `closeTab`, `getActiveTab` — and no way to say "nothing is open". My helper composes it from three calls, and leans on two behaviours that upstream neither documents nor tests:

- `closeTab(activeKey)` in `no-tab` mode destroying the record and restoring `emptyDetail` — real (`detail.js:306-322`), but the only `no-tab` test upstream covers *replacement*, never *close* (`test_UAT_FC_REQ-23_detail_modes.test.js:10-33`).
- `select(null)` clearing the selection without opening anything — real, unstated.

So 1stcontact's tenant fix currently rests on incidental behaviour of a vendored component nobody upstream is holding still. That's the real argument, and it's enough on its own. The secondary one: a three-call idiom for "empty this pane" is exactly what hosts get wrong — it already happened twice in one codebase, in Contacts and the Library independently, each having written down the promise it then kept only for the list.

**What must not go upstream: making `setItems()` clear the detail.**

This is the tempting fix and it would be a bug. Both panels call `setItems()` with a *filtered* view — `people.js` `apply()` is `setItems(all.filter(matches))`, `library.js` is `setItems(visible())` over role/kind/text filters — on every keystroke and facet change. Auto-closing the detail when the open key left `items` would slam the open document shut the moment a search box excluded it. Detail lifetime has to stay independent of the visible set, and the primitive cannot tell a business switch from a filter. Only the host knows a switch happened, so "clear on switch" stays here.

**Honest caveat on the cost/benefit:** grepping sanctum, francisconnect and lagrange-biz, nothing else mounts `mountListDetail` today — 1stcontact and the framework's own showcase demo are the only consumers. So this isn't "fix it for everyone", it's "pin the behaviour we now depend on, and stop the next host falling in the same hole."

**What I'd file** (small, low priority, `lagrange-framework` — I checked, no existing ticket mentions `clearDetail`):
- `clearDetail()` on the controller — closes every open detail (all tabs in `tab` mode, the single one in `no-tab`), clears the selection, shows `emptyDetail`. Upstream's call on the tab-mode semantics; that's the one genuine design question.
- Tests pinning it in both modes, plus the currently-untested `no-tab` close → empty pane.
- One line in the README's composition notes saying detail lifetime is independent of the item list — that sentence is the whole trap.
- `PUBLIC-API.md` regenerates via `bin/project/check-boundaries --write`; it's an addition, so cheap.

Then here, `detail-pane.js` collapses into `listDetail.clearDetail()` at both call sites and gets deleted. The route is a framework release plus `bin/install --lang js --component list-detail`, since the dependency is implicit — nothing in our `package.json` records it.

I would not block BUG-89 on any of that: the fix as landed uses only public methods, is tested here, and stays correct either way.

Want me to file that ticket in `lagrange-framework`? I've left BUG-89 alone for now — say the word and I'll also append this rationale to its body, since a reconciler will ask exactly why the fix is a local helper rather than a component change.

<!-- xgd-chat-end -->