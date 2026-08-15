---
uid: comment-cd188be0
id: COMMENT-1013
type: comment
title: Comment on request REQ-140
created_by: xgd
created_at: '2026-08-15T00:35:29.825039+00:00'
updated_at: '2026-08-15T00:43:24.197610+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3c0fec69
  kind: chat_transcript
---

<!-- xgd-turn id="212bc158-7497-4c1e-9195-f4a69077af7b-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T00:35:25.815119+00:00" -->
#### You
Are we ready to add a color picker to the text editor? Text color and bg color from a pallet...

<!-- xgd-turn id="646cf98a-ee65-4aec-a3b0-26095b82de05-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T00:40:49.382356+00:00" -->
#### You
Are we ready to add a color picker to the text editor? Text color and bg color from a pallet...

<!-- xgd-turn id="646cf98a-ee65-4aec-a3b0-26095b82de05-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-15T00:43:23.983295+00:00" -->
#### Claude
Yes — the blocker is cleared. Here's the actual state, since this was gated on a chain:

| | Status |
|---|---|
| REQ-114 — L1 palette colour model (literal base, palette-ref overlay) | `free_and_reconciled` |
| REQ-137 — entry = one colour, continuous `shade` on the reference | landed |
| REQ-133 — the palette popup (manage **and** pick modes) | implemented, on `xgd-working`, `ready_to_reconcile` |
| REQ-135 Phase A — typography (size/weight/italic/caps) | `free_and_reconciled` |
| **REQ-135 Phase B — colour** | **the remaining work — this is what you're asking for** |

`openPalettePopup` already implements pick mode and resolves to `{ref, shade}` (`apps/control-app/src/builder/palette-popup.js:58`), but its only caller today is the toolbar's Colors button in manage mode (`app.js:112`). So the picker exists and has no field wired to it.

## What Phase B is

Per REQ-135 §2/§3, three pieces:

1. **Text colour** on the text segment → `axes.color`, writing a palette *reference*, never a hex.
2. **Panel background** on the container segment → `surfaceFill`. Deliberately not on the text node — a folded run's box is glyph-tight, so a fill there is a rectangle behind the words, not "the background".
3. **The escalation row** — because innermost-wins means clicking words opens the text modal and the panel behind it may be fully occluded. A read-only swatch labelled *from the panel behind this text* with an `edit the panel ↗` link that saves-then-navigates.

## Two things to settle before coding

**REQ-135 §3.1 is stale, and in our favour.** It specs a ramp grid of named steps writing `{ref:'slate', step:'900'}`. REQ-137 deleted named steps. The picker is therefore not a new control built into the modal — it's REQ-133's popup in pick mode, which already returns the right shape. Phase B gets materially smaller: a caller, not a picker.

**The field vocabulary can't carry a colour today.** `L1FieldValue = string | number | boolean` (`edit.ts:244`) and `L1FieldDescriptor.type` has no colour case — `format` only knows `'image'`. A colour value is a typed object. Two options:

- **A** — widen the descriptor with a colour type and let `applyCopyFields` validate `{ref, shade}` against the site's palette. Keeps every field deriving from one function and one Save → one diff.
- **B** — the colour row sits outside `mountFields` as a swatch that opens the popup and stages the result into the modal's change map.

I'd take **A**: the write side is the authority, and a colour needs the same membership check images get — otherwise a stale client can post a `ref` the palette doesn't hold. B pushes validation to the client.

One caveat worth knowing up front: `1stcontact` and `harbor-cafe` have **zero palette entries** — folded sites are all literals. On those, picking opens a popup with nothing to pick. Manage-edit lives in the same surface so the recovery is one gesture, but the empty state is the common case at first, not an edge.

Want me to scope REQ-140 as Phase B along those lines (option A, all three pieces), or narrow it to just text colour first?

<!-- xgd-chat-end -->