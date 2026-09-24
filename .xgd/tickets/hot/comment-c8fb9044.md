---
uid: comment-c8fb9044
id: COMMENT-3674
type: comment
title: Comment on request REQ-314
created_by: xgd
created_at: '2026-09-23T18:03:35.670032+00:00'
updated_at: '2026-09-24T18:01:23.681739+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4732258a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2719c19d-9f18-4985-85ce-f1853f55e12f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="790923cd-3141-41c6-a37b-14307c0b8972-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:02:16.284505+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="790923cd-3141-41c6-a37b-14307c0b8972-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:07:27.624047+00:00" -->
#### Claude
I've read the ticket, the epic, the sibling tickets, and the code. Before I cut a branch, there's one genuine fork I need you to settle — everything else I'll decide myself.

## What I found

**The prerequisites aren't built.** REQ-311 (catalogue generator), REQ-312 (mirror + platform registry tier) and REQ-313 (`use_font`) are all still `draft`. `grep -r use_font` across the tree hits only ticket markdown — no code. The epic's own ordering says REQ-314 comes "any time after REQ-312".

**There is no editor font control to shrink.** The ticket's framing — "a 1,941-family dropdown is unusable" — is anticipatory, not a description of something on screen. `typographyFields` in `packages/site-schema/src/l1/edit.ts:540` exposes Size, Weight, Italic, Capitalisation and nothing else; `grep fontFamily apps/control-app/src/builder/*.js` returns one hit, and it's a preview CSS variable. So REQ-314 doesn't trim a control, it builds the first one.

**`fonts/catalogue.json` and `fonts/CATALOGUE.md` exist but are untracked** — generated ad hoc while scoping the epic. REQ-311 owns making them a committed, regenerable artifact.

Against that, the ticket's four behaviours land like this: "lists under 100 by default" has no control to list in; "a family outside the shortlist is still reachable" has no mirror to reach into; "binds by the same path `use_font` uses" has no `use_font`; only "no effect on what the assistant may choose" is satisfiable today (trivially, by the shortlist not being in the KB).

## The fork

**A — build the shortlist artifact now, wire the UI when REQ-312/313 land.** Hand-curated `fonts/shortlist.yaml` (taste, so authored not generated), a reader/validator in `site-schema` beside `fonts.ts`, and a `1c fonts check` rule that every entry resolves to a live redistributable family in the catalogue — so the list can't rot as the corpus moves. Real, testable, no throwaway. But nothing human-visible ships until REQ-313.

**B — do nothing here until REQ-312 lands.** The epic's stated order, and this is the lowest-priority ticket in the epic.

**C — build the whole vertical slice now**, including the family control, binding straight into `l1.resources.fonts` from the catalogue. This is the only option that puts something on screen this week, and I'd rather not: with no mirror there are no bytes to serve, so it paints families that resolve to the browser default — exactly the silent failure `REF-l1.md:604` warns about — and it means writing a binding path REQ-313 then has to replace, against the ticket's own "one binding mechanism, not two".

**I'd take A.** It's the half that's genuinely independent of the mirror — selection is taste, and taste doesn't need bytes — and it's the half that takes real judgment rather than plumbing. The curation itself I'll do to the ticket's brief: range over popularity, text faces in both serif and sans, display faces with wordmark-capable weight range, at least one monospace, enough spread that two sites don't look alike.

Say "A" (or just "go") and I'll start; say "C" and I'll build the control too and accept the rework.

<!-- xgd-turn id="4be66efd-0d30-49db-9595-3c862dd2e8d9-user" -->

<!-- xgd-chat role="user" ts="2026-09-24T01:45:12.837629+00:00" -->
#### You
3121 has landed

<!-- xgd-turn id="a6eda3b7-9b58-4b11-b6fa-72ff8919eef1-user" -->

<!-- xgd-chat role="user" ts="2026-09-24T07:12:20.068689+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a6eda3b7-9b58-4b11-b6fa-72ff8919eef1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-24T07:43:09.090290+00:00" -->
#### Claude
I have the full picture now. Let me record the design decisions on the ticket and start.

Now let me build. First the data layer:

Now the shortlist and browse corpus:

Now the schema side — the `font` descriptor and its write:

Now the binding in `editCopySet` — through `use_font`'s own resolver:

Now the `/api/fonts` route, next to `/api/copy`:

Now the client. The search rule first:

Now the font popup:

Now the field row, modelled on `color-field.js`:

Now the `api.js` transport and the editor/app wiring:

Now the stylesheet:

Clean. Now the UAT suite:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="f2126791-6352-4d48-9c66-ba6c2204f5b1-user" -->

<!-- xgd-chat role="user" ts="2026-09-24T17:36:21.088192+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="f2126791-6352-4d48-9c66-ba6c2204f5b1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-24T18:01:22.987370+00:00" -->
#### Claude
Now the merge back.

REQ-314 is landed and at `free_coded`.

## What I completed

The prior session had written the implementation but died before it ran the suite. I picked up the uncommitted work in the `free-REQ-314` worktree, finished verification, fixed what the suite found, and landed it.

**Fixes I made this session:**

1. **`BUG-70` audit regression** — `.builder-font__row` and `.builder-font__swap` declared `font: inherit` with nothing after it, so the audit ("every text-bearing control the builder creates is sized") caught them. All four of the control's buttons now take `--builder-control-font-size` rather than a repeated literal (`__current` and `__search` were carrying 13px/14px literals).
2. **`REQ-135` field list** — the run's descriptor list gained `fontFamily` between `color` and `fontSizePx`; updated the assertion with the reason for the position.
3. **Closed-type assertions** — five suites each independently assert "every control is one of the closed types, so none can express CSS". Four already admitted `font` from the prior session; `REQ-135`'s did not. Added it with the justification: the value is a family *name*, resolved against the mirror by the write side.

**Verification (all foreground):**

| Check | Result |
|---|---|
| `tests/test_UAT_FC_REQ-314_font_control.test.ts` | 14 passed |
| Full node project (518 files) | 505 passed, 8 failed |
| Full workers project | 157 files, 1346 tests, all passed |
| `tsc --noEmit` × 5 packages | clean |

The 8 failing node files are **exactly the pre-existing baseline** — I ran the same set on `xgd-working` before touching anything and confirmed each one already failed there (mostly loopback-socket tests, `REQ-273`/`BUG-124`, that can't bind in this sandbox). Two flakes I initially mis-attributed turned out environmental: `BUG-134` failed only because the fresh worktree had no `.xgd/tmp`, and `reconciliation-builder-workspace-chrome` AC960 was order-dependent — both pass now.

**Landed:** commit `00ae98e652` → merged to `xgd-working` as `971e7e64e2`, version `0.2.348`, `story_points: 8`, branch and worktree cleaned. Ticket body appended with where the row sits, why the five closed-type assertions widened, and the BUG-70 note.

**One thing worth knowing:** `tools/generate/src/cli/ai/platform-fonts.json` is committed as an empty placeholder; your local copy in the main checkout is the real 593KB projection, generated before this change and so **without the `slab` flag**. The Slab Serif chip will be empty until you re-run `1c fonts index`.

<!-- xgd-chat-end -->