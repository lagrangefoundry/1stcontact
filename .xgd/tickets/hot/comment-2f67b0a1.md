---
uid: comment-2f67b0a1
id: COMMENT-4504
type: comment
title: Comment on bug BUG-161
created_by: xgd
created_at: '2026-09-30T00:55:09.219208+00:00'
updated_at: '2026-09-30T02:06:14.976081+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5659f080
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "4bc104d5-5b9f-4e41-be3e-b98c927c8e2c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="befc0e54-618b-410b-9b23-af3b38cf12ff-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T00:53:42.260191+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="243bb2f7-d64f-46bf-b63d-3aec74bfa65c-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T01:58:20.741430+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="243bb2f7-d64f-46bf-b63d-3aec74bfa65c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T02:06:14.019926+00:00" -->
#### Claude
Now run the full affected regression scope in the foreground on the merged tree:

Now record the ticket as free-coded:

BUG-161 is free-coded and merged to `xgd-working`.

## What landed

**Issue 1 — a band paints what is on top of it** (`capture/extract.ts`). `bandSlicesIn` keeps a coincident backdrop as a `layer` and picks its slice element outermost-first — right for locating bands, wrong for deciding what one paints. New `sliceBackgroundColor` takes the topmost **coincident and opaque** layer, falling back to the slice element. Coincidence excludes REQ-270's hero-inside-a-taller-fill; opacity excludes a scrim (already recorded as `overlay`, and duplicating it would paint it solid). The band's `colorScheme` reads against the same chosen fill, so a dark-green band stops reading `light`; a slice that paints nothing still falls through to `bandTone`, keeping REQ-271's distinction.

**Issue 2 — the exclusion is tested, and either verdict is counted** (`values-diff.ts`, `unmeasured.ts`). The `unpairedActual` / `bandPaintActual` split moved to *after* the section pass — whether a box is "compared against a real counterpart" is a fact about this run's section pairing, which hadn't happened yet. A box whose band record demonstrably reports different paint is now an ordinary unpaired object. Either way it's counted: `values.bandPaintActual` joins `populations`, because a box's own `opacity`/`filter`/`blendMode`/radius/shadow have nowhere to land on a section record. Summed with `sum()`, so a report predating the field reads `≥` rather than manufacturing a zero.

**Issue 3 — a referenced image that paints nothing** (`perceptual-core.ts`, `perceptual.ts`, `gate-core.ts`). `unpaintedImages` (pure variance test over the element's own box) runs in `cmdDiff`, the only stage holding both rasters, reaches `regions.json`, and becomes an `unpainted-image` coverage finding. `CoverageFinding.side` keeps it off `capture-incomplete` — a statement about the *reference* that outranks the delta count — and puts it on `reproduction-wrong` even with zero deltas, since a dropped image moves many pixels and no compared axis.

## Evidence

15 new UATs in `test_UAT_FC_BUG-161_*`, all green and all browser-free. Issue 1's leg drives `sliceBackgroundColor` offline out of `EXTRACT_SCRIPT`'s own source text with a stubbed `getComputedStyle` — BUG-153's pattern, because no browser engine can launch in this sandbox (`chromium_headless_shell` dies immediately; firefox/webkit binaries absent). Regression scope re-run on the merged tree: 30 files, 300 tests passed, 17 Chromium-gated skips, including REQ-351's and REQ-352's own suites.

The full node project run earlier showed 4845 passed / 27 failed across 17 files; I baselined each against HEAD with my files restored — every one fails identically or needs a browser, wrangler socket, webui component store, font mirror or KB index. The one suite this genuinely broke was REQ-277, whose stand-in `gate.json` predated `bandPaintActual`; its harness now defaults it to `0` on the same terms it already defaults `notComparableAxes` to `[]`.

## Merge-back

`xgd-working` moved three times mid-flight. REQ-352 removed `anchorRatioInBox` right where issue 1's change sits — resolved keeping REQ-352's removal plus the new function, and the UAT's text slice re-bounded on the next surviving comment. `package.json` conflicted 0.2.412 vs 0.2.415; took the higher and re-bumped to **0.2.416**.

Ticket `BUG-161` is `free_coded`, `story_points: 5`, commits `20a5937`, `a96e92b`, `7ac9390`, version `0.2.416`. Lock released, worktree and branch torn down.

One thing worth flagging: the fold-side cause of the wrong `#28542d` is the companion gap ticket's issue 3, which is still open — this change makes the comparator see it rather than fixing the reproduction.

<!-- xgd-chat-end -->