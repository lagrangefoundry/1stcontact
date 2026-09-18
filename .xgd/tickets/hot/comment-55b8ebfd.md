---
uid: comment-55b8ebfd
id: COMMENT-3045
type: comment
title: Comment on bug BUG-107
created_by: xgd
created_at: '2026-09-18T00:42:28.922851+00:00'
updated_at: '2026-09-18T00:54:28.279881+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-19aa37c2
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0f927d4b-9441-47c3-9437-44fe3fcb6ef9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0104d436-c7cf-4509-be95-9fbdf5b62ec6-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T00:41:15.879113+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0104d436-c7cf-4509-be95-9fbdf5b62ec6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T00:54:27.200678+00:00" -->
#### Claude
Now cutting a branch.

Now let me implement the change.

Now the edits. First the type unions:

Now the `ObjectKind` union and `objectKindOf`:

Now `KIND_PARAMS`, `PARAM_PROPS`, `paramValue`:

Now the severity tables:

Now the comparison itself in the text pass:

Now the `surfaceFill` comparison on the textless pass, so the box card's fill row is actually checked:

Now update the ticket body so every behaviour the UATs pin is motivated there, then bump and commit.

Now lock, merge back into `xgd-working`, and claim the ticket.

Done. BUG-107 is at `free_coded` on `xgd-working`, branch merged and cleaned.

**What I built** (`tools/generate/src/cli/capture/values-diff.ts`)

1. **`a11yRole` is a first-class diffed property**, under a new `semantics` delta kind — **HIGH**, leading the HIGH band, Type **A**. I chose HIGH rather than CRITICAL deliberately: CRITICAL is reserved for a diff that can't be trusted (`viewport`), content that's absent (`presence`, `text`), or structure that visibly re-composed (`arrangement`, `containment`). A role regression is none of those; it moves no pixel. It still outranks every tonal and treatment axis because it's structural.
   Compared on the **text pass only** — a textless field *joins* on `a11yRole`, so comparing it there could only ever report equality. Guarded on both sides carrying the field, so older manifests stay inert.

2. **`headingLevel` alongside it** — a technical consequence I added rather than a separate ask: `a11yRole` flattens h1–h6 to one word, so an h2 reproduced as an h4 agrees on the role and still builds the wrong outline. That's the next thing to go silent once (1) lands.

3. **The role leads the text object card's parameter table** — the card is the primary human read, so a lost heading has to be visible there, not only in the flat list.

4. **New `box` `ObjectKind`**; `objectKindOf` now decides `control` from a positive set of interactive a11y roles instead of falling through to it. The old inverse default is why seven painted section bands read as seven unpaired *form controls*.

5. **A box card carries `surfaceFill` / `backgroundImage` / `box`** — which required running the `surfaceFill` comparison on the textless pass, where it had never run (it only fired where a text run sat on the surface). Without that the new row would have rendered a value it never checked — this ticket's own defect in a new place.

6. Repaired a stale `req51` assertion pinned to the pre-REQ-265 control table — it had been red on a clean tree since REQ-265; I was editing that same table and didn't want to leave a red test that reads as mine.

**Verified against the real evidence.** Re-diffing the exact gigabytealchemy iteration-1 manifests:

```
deltas 13 {"a11yRole":13}
unpaired kinds box,box,box,box,box,box,box
A Different Approach: heading->generic  … (11 headings) · LinkedIn/GitHub: link->generic
```

Exactly the ticket's "right result", with zero noise — the 42 runs whose roles agreed raise nothing.

**Tests**: `tests/test_UAT_FC_BUG-107_semantic_role_diff.test.ts`, 6 UATs (pure, browser-free). Regression scope: all 22 suites exercising `diffManifests` — green, plus the REQ-265 assertion repaired. Typecheck clean across all five packages.

Two notes on process: the version claim collided twice (0.2.248 taken by BUG-108, then the working-merge lock held by BUG-106 mid-run), so the ticket carries two commits — the fix `5b7f6c58` and a bump-only `3fac6aaa` — at version 0.2.249. And the ticket body now documents items 2, 5 and 6, which the original "Proposed fix" didn't name.

<!-- xgd-chat-end -->