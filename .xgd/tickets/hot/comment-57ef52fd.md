---
uid: comment-57ef52fd
id: COMMENT-4852
type: comment
title: Comment on bug BUG-179
created_by: xgd
created_at: '2026-10-03T19:56:19.685260+00:00'
updated_at: '2026-10-03T20:36:03.113121+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-edeb23a1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0e3d9f02-f726-4af1-a71c-415408a3abc6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="01b175f8-23a4-4ad2-a797-4926b5dcb106-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T19:47:01.841699+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9f2d448c-9767-4fb5-9bc4-d184240b3e2a-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T19:52:19.356231+00:00" -->
#### You
Please continue

<!-- xgd-turn id="9f2d448c-9767-4fb5-9bc4-d184240b3e2a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T20:23:27.145125+00:00" -->
#### Claude
Branch `free-BUG-179` is cut; now locating the values-diff / capture / fold code the ticket names.

Still reading the comparator (`diffManifests`) before touching anything — it's ~1,600 lines and all seven items touch it.

Comparator read; now checking how `value-axes.ts` declares a both-sides axis so `visibleFraction` (item 1) can be derived from the already-recorded `clip` box on both sides.

Reproduced the exact 23 deltas offline from the iteration-5 manifests, so I can verify each fix against the real bundle. Inspecting the specific elements next.

The clip-derived fraction flags exactly the 5 header links and nothing else on either side. Now looking at how axis rows are projected so I can add `visibleFraction` as a declared both-sides axis.

Now reading the extractor code for items 3 (surface tie-break) and 6 (footer band fill).

Items 3 and 6 are extractor changes. Checking how body-child bands reach `sliceBackgroundColor`, then I'll start editing.

Now item 7b — where `gate.json`'s `layout.findings` are built.

Starting edits. First, the envelope constant for item 4:

Something else is editing this worktree — `values-diff.ts` has a BUG-179 change I didn't make. Checking what it is before going further.

I've stopped work on BUG-179 because another session is already implementing it in the same worktree. I haven't changed any code. If I kept editing, our changes to the same file would overwrite each other.

**What happened**
- I set BUG-179 to `free_coding`, cut the branch `free-BUG-179`, and read the code the ticket names.
- When I went to make my first edit, `values-diff.ts` already had about 100 lines of BUG-179 changes that weren't mine. They cover item 1 (`visibleFraction`), item 4 (comparing z-index as a capped rank) and item 7a (ignoring differences of one rounding step). They are uncommitted and the other session is still writing.
- It is probably the turn from your earlier "Please continue", still running. Two sessions, `1stcontact-4d` and `1stcontact-3f`, show as busy. I've messaged both to say the worktree is theirs; neither has replied yet.

**What I checked that the other session can use**
- I can rerun the comparison offline on the iteration-5 `expected-manifest.json` and `actual-manifest.json`, without a browser. It reproduces the ticket's 23 deltas exactly. The script is at `free-BUG-179/.xgd/tmp/b179.mjs`.
- Working out how much of each run its clipping ancestor leaves visible flags exactly the 5 header nav links on our side, and nothing on the reference. That matches the ticket's "this will add 5 deltas".
- Item 2: the hero and the quote band each have 2–3 reproduction layers on the same rectangle. The pairing takes the first one, not the layer carrying the photo, filter and opacity. That explains the six false deltas.
- Item 6: the footer goes through the top-level band path, which reads only the `<footer>` element's own background. That is a different function from the `sliceBackgroundColor` the ticket names, so that fix has to cover both.
- Item 7b: the probe name is lost in `layoutCollisions` in `gate-core.ts`, which takes the three reports without their names. It has three callers in tests.

**Decision for you:** should I stay out of this and leave BUG-179 to the session that's already running? Or should I take over? Taking over only works once you've stopped that session, and I'd then continue from its uncommitted changes rather than start again.

The other writer is session `1stcontact-3f`, and I've handed BUG-179 to it. It has the worktree and the ticket, and has already added an "Implementation (free-coded)" section to the ticket body. I've stopped and won't touch either again.

None of my changes are in the code or the ticket. The only file I left is a scratch script at `free-BUG-179/.xgd/tmp/b179.mjs`, which reruns the comparison offline on the iteration-5 manifests and reproduces the ticket's 23 deltas.

I sent `1stcontact-3f` that script's location and the points from my last message:
- **Item 1:** measuring how much of each element its clipping ancestor leaves visible flags exactly the 5 header links.
- **Item 2:** the pairing takes the first of several layers sharing a rectangle, which explains the six false deltas.
- **Item 6:** the footer goes through the top-level band code, not `sliceBackgroundColor`.
- **Item 7b:** `layoutCollisions` drops the probe name, and three tests call it.

Its plan covers all seven items, so nothing is left for this session unless you want me to review its work once it lands.

<!-- xgd-turn id="01b175f8-23a4-4ad2-a797-4926b5dcb106-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T20:35:58.097003+00:00" -->
#### Claude
I'm reading the values-diff and capture code to map the ticket's seven items onto real code before I scope and cut the branch.

Still mapping the diff code: I've found where zIndex, filter, opacity and padding get compared. Next I'll look at the text-free pairing pass (items 2 and 7) and section pairing (item 5).

Now checking how element-axis rows in `value-axes.ts` get the bundle schema, so a clip-derived `visibleFraction` reads as unmeasured on bundles older than schema 7.

Still reading: item 6's fill fallback lives in `sliceBackgroundColor`. I'm checking how a transparent result becomes `{"kind":"none"}` before I change it.

Code map is done. Item 7b is a `probe` field on `LayoutCollision`. Checking its other callers, then I'll update the ticket, cut the branch and start coding.

Updating the ticket with the agreed approach before I write code.

Ticket is updated and at `free_coding`, and the branch is cut. Now writing the code in the worktree.

Now the edits to `values-diff.ts`: first the type tables.

Type tables are in. Now the comparator changes: zIndex clamp, `visibleFraction`, and the line-height quantum.

Now item 2, resolving paint axes across coincident reproduction layers.

Only my edits are in the worktree. Continuing with item 2, the coincident layers.

That's a useful harness. I'll use it to verify and delete it before committing. Now item 5, section coalescing.

On the real iteration-5 manifests, items 1, 2, 4, 5 and 7a behave as specified: the 5 clip deltas are added and the 11 false deltas are gone. Now the extract.ts items (3, and 6 on both paths).

Now verifying the browser script still parses, since Chromium is blocked in the sandbox.

The script parses. Now item 7b in `gate-core.ts`.

Now the UAT file, then the typecheck and the regression scope.

I'll exercise items 3 and 6 offline too, by slicing the real functions out of `EXTRACT_SCRIPT` (the same pattern as the BUG-174 tests).

All 11 pass. Next, the typecheck and the regression scope: the values-diff, gate, band-paint and collision suites.

The only type errors are the known missing control-app `generated/` artifacts in a fresh worktree; there are none in the files I touched. Running the regression scope.

Whole suites are failing at load time. Checking the error.

This is the known fresh-worktree gap: `apps/control-app/src/generated` is missing. I'm copying the gitignored build artifact from the main checkout so the suites can load.

Three failures. BUG-64 is a known upstream regression. Checking BUG-112 and BUG-161.

The only failure left is BUG-64, a known upstream regression that doesn't touch these files. Running a wider fold/capture sweep as well.

The only failure is REQ-180, which also fails on clean working. Preparing the commit: version bump, and leaving out the harness files.

Working moved forward during the session. The fast-forward was clean; re-running the core suites on top of it before committing.

Committed. Now: lock, merge into xgd-working, move to `free_coded`, clean up.

Fast-forwarded. Moving to `free_coded` first, since a ticket auto-commit landing after the bump would block the version gate.

Status is `free_coded` with the commit recorded. Now the story points, a body correction for item 6 (it also covers the top-level band path, as the other session pointed out), and cleanup.

BUG-179 is implemented and merged into `xgd-working` as `ee378c143e` (version 0.2.455). The ticket is at `free_coded` with that commit recorded, story points set to 5, and the body updated to match what landed.

**Effect on the real iteration-5 manifests:** I re-ran the diff offline on the saved manifests and it goes from 23 deltas to 17. The 11 false deltas from items 2, 4, 5 and 7 are gone: `zIndex`, `backgroundImage` ×2, `filter`, `opacity` ×2, `lineHeightPx` ×3 and padding ×2. The five header links now report CRITICAL `visibleFraction 100% → 0%`. The `surfaceFill` rows that remain are items 3 and 6, which only change once the page is captured again in a browser.

**What changed, by item:**
1. **Clipped runs:** `visibleFraction` is computed from the `box` and `clip` both sides already record, so it works on this bundle without a re-capture. It only looks at the *nearest* clipping ancestor, and it stays silent on bundles that never recorded clipping.
2. **Several reproduction layers at the same box:** paint axes (`backgroundImage`, `filter`, `opacity`, blend, mask, padding) are read from all reproduction layers sharing the paired box. This only applies when the reference value actually paints something, so an extra image on our side is still reported.
3. **`paintedSurfaces`:** when two surfaces have equal area, the one painted on top now comes first.
4. **`zIndex`:** both sides are clamped to the same range the fold uses before comparing, so `9999` against `1000` agrees, but a real reordering still shows.
5. **Coalesced section:** a reference section now claims the unpaired reproduction bands inside it, and an axis agrees if any band in the group agrees. I changed this from the ticket's "area-weighted" wording, because a weighted mean reads 0.9 against the reference's 0.5 here and would keep the false delta.
6. **Band fill painted by a descendant:** if a band paints no fill itself, a child covering at least 99% of it supplies the fill. This applies to both band paths, including the top-level one the reference footer actually uses. That gap was pointed out by another session that had started on BUG-179; it stopped and left this work to me.
7. **Small ones:** a line-height or letter-spacing difference of 0.01px or less is no longer reported. Every `gate.json` `layout.findings` entry now names its probe (`onSample`, `offSample` or `contentRobustness`).

**Tests:**
- The new UAT file `tests/test_UAT_FC_BUG-179_values_diff_measures_what_paints.test.ts` has 11 tests, all passing. Items 3 and 6 are tested by running the real browser-script functions on stub elements, because Chromium is blocked in the sandbox.
- I updated four existing UATs for the new contract: BUG-112, BUG-143, BUG-158 and BUG-161.
- Across about 145 related suites the only failures are BUG-64 and REQ-180, which also fail on a clean tree.

**Still to do:**
- Items 3 and 6 have not run in a real browser. To confirm them, capture the reference again and re-run the gate command from the ticket's "How to see it" section.
- The ticket is ready for you to promote to `ready_to_reconcile` when you're happy with it.

<!-- xgd-chat-end -->