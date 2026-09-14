---
uid: comment-673ed807
id: COMMENT-2998
type: comment
title: Comment on request REQ-246
created_by: xgd
created_at: '2026-09-14T20:42:05.361496+00:00'
updated_at: '2026-09-14T21:11:22.426775+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-062e8231
  kind: chat_transcript
---

<!-- xgd-turn id="c6ec8275-d094-4c77-b594-767ab4a17b10-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T20:41:38.046204+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c6ec8275-d094-4c77-b594-767ab4a17b10-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T21:11:21.427698+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me look at the store write path — `editAssetAdd`, `isUnsafeName`, `assetKey`, `assetKind`.

Now let me read `editAssetAdd` and the fs store's counterpart.

I have what I need. Let me set up the branch and start.

Now let me write the canonical content-type module.

Now the asset-name module:

Now wire the store adapters:

Now update `store/index.ts` exports and the four other table/reader sites.

Now `reextract.ts` and `capture-material.ts`:

Now the public-site worker — delete its copy and read the canonical one.

Now the sanitisation call sites — `editAssetAdd` and `freeAssetName`.

Both workers typecheck clean. Now let me run the existing affected tests.

Now let me write the UATs. First the content-type suite:

All three new suites pass. Now let me run the broader regression scope.

Let me update the ticket body while the sweep runs.

That one is mine — two more tests import the deleted module.

A fifth table surfaced, in `tools/generate/bin/smoke.mjs`. Let me look at how it's used before deciding.

Resolution works. Now wire `smoke.mjs` to it.

Bare node resolves it. Now update the two tests that imported the removed exports.

Now extend the AC2 guard to scan `bin/` too, and repoint it at the `.js` module.

Both Workers bundle cleanly with the table inlined. Running the full sweep again.

Zero new failures — all three also fail on the `xgd-working` baseline. Committing now.

I bumped the wrong worktree. Reverting that and doing it in the branch worktree.

Now lock, merge back, then move the ticket to `free_coded`.

Done. REQ-246 is at `free_coded`, commit `5d86989` merged into `xgd-working`, version `0.2.199`.

## What landed

**One content-type table.** There were five, not the two the ticket named — `capture-material.ts` and `capture/reextract.ts` each carried their own, and `bin/smoke.mjs` carried a fifth. All four are folded into `store/content-type`, the table is no longer exported (one reader, `contentTypeOf`), and the reader is path-aware so it answers for a served key and a stored name both. `pdf` and the rest of the inert document/archive/media formats are in; active and inert are separate literals behind an enumerated `ACTIVE_CONTENT_TYPES`, and nothing a browser executes was added.

**The module is now `.js` + `.d.ts`.** This is the one decision that went beyond the ticket's text and is worth flagging: `smoke.mjs` runs under bare `node` after a deploy and genuinely cannot load TypeScript — its "duplication pinned by a UAT rather than by hope" justification was the same one `public-site`'s copy carried, and that one drifted anyway, because a pinning test only compares rows both sides happen to have. JavaScript is the one language all five consumers read. TypeScript resolves to the declaration and never reads the implementation, so no `allowJs` anywhere; both Workers typecheck clean and both bundle (verified via `wrangler --dry-run`). Its asset crawl also got stricter as a consequence — it used to skip any extension its own list lacked, which is exactly where a drifted copy needs checking.

**Names are made safe once.** `sanitizeAssetName` runs at `editAssetAdd` (the write path every surface reaches) and in `freeAssetName` ahead of it, so the collision that function decides about is the real one. `editAssetReplace` deliberately does *not* sanitise — it addresses a name rather than minting one, and legacy awkward names must go on resolving. `isUnsafeName` is one statement obeyed by every adapter (the filesystem one never checked at all, so a separator composed a path outside the assets directory) and throws over the whole change set before the first byte.

**Evidence:** 20 new cases across three suites — ACs 6–11 run through the real `promoteToSiteAsset` over real D1/R2, so the property is proved about an actual key. AC2's guard scans the production tree including `bin/` and fails on a second table rather than comparing two.

**Full suite: 4125 passing, 3 failures — all three fail identically on the `xgd-working` baseline** (`bug32-webui-scope-rebrand`, `BUG-67_backend_settings`, and `platform-build-deploy-smoke` AC1331). Zero new failures.

Two notes: the existing `How_Can_You_Trust...?.pdf` key on the XGD site is untouched, per §4 — correcting it is manual and outside this. And I briefly ran the version bump in the main worktree by mistake; it's reverted and the bump landed on the branch.

<!-- xgd-chat-end -->