---
uid: comment-c682c825
id: COMMENT-2841
type: comment
title: Comment on request REQ-229
created_by: xgd
created_at: '2026-09-11T23:52:26.300424+00:00'
updated_at: '2026-09-12T00:06:51.775044+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4b5c10e9
  kind: chat_transcript
---

<!-- xgd-turn id="c5a1d557-919e-45df-a21f-bf0f46ee2d8c-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T23:52:03.343081+00:00" -->
#### You
Let me just try to state the principle clearly:

When I edit a photo, I expect the edit to replace the existing photo - same name, everything.

When a photo is edited we actually retain the original and store the sequence of operations so nothing is lost here. Saving the photo under a different name after such an edit is layering version mechanism on version mechanisms. It is totally redundant.

<!-- xgd-turn id="b7792272-aaa8-4a47-badf-5b33821a3a6a-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T23:54:12.338871+00:00" -->
#### You
Let me just try to state the principle clearly:

When I edit a photo, I expect the edit to replace the existing photo - same name, everything.

When a photo is edited we actually retain the original and store the sequence of operations so nothing is lost here. Saving the photo under a different name after such an edit is layering version mechanism on version mechanisms. It is totally redundant.

<!-- xgd-turn id="4901a225-6357-4504-938c-fa7327266f87-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T23:57:04.386096+00:00" -->
#### You
Let me just try to state the principle clearly: When I edit a photo, I expect the edit to replace the existing photo - same name, everything. When a photo is edited we actually retain the original and store the sequence of operations so nothing is lost here. Saving the photo under a different name after such an edit is layering version mechanism on version mechanisms. It is totally redundant.

<!-- xgd-turn id="4901a225-6357-4504-938c-fa7327266f87-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T23:57:24.377475+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your monthly spend limit · raise it at claude.ai/settings/usage?from=cc_cli_limit_message

<!-- xgd-turn id="43328e80-bdca-42a9-a11d-b8fd9b6a4047-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T00:05:38.642265+00:00" -->
#### You
Let me just try to state the principle clearly:

When I edit a photo, I expect the edit to replace the existing photo - same name, everything.

When a photo is edited we actually retain the original and store the sequence of operations so nothing is lost here. Saving the photo under a different name after such an edit is layering version mechanism on version mechanisms. It is totally redundant.

<!-- xgd-turn id="43328e80-bdca-42a9-a11d-b8fd9b6a4047-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-12T00:06:51.711625+00:00" -->
#### Claude
The principle is already what the ticket decides — let me record your statement of it explicitly, since it closes the "why not a new name" question with a better argument than the one the body currently carries.

Agreed, and that's a cleaner argument than the one the ticket was carrying. Recorded in REQ-229's body under "Replacement is explicit", in three beats:

- **The principle verbatim** — an edit replaces the existing photo, same name, everything. A crop that arrives as `logo-2.png` is not an edit, it's a copy.
- **Why a second name is redundant** — the material already keeps the original bytes and the operation sequence, so the site's copy is a *derived artifact*, re-derivable at any moment. Minting a name to preserve the old derivation preserves nothing that isn't preserved already, and costs an orphan per commit plus a page still pointing at the stale bytes.
- **What the name addresses** — the site asset name is a stable pointer to *this material's picture as currently edited*. Versions live in the material; one mechanism, one place.

That's the same conclusion the ticket already required mechanically (replace-in-place, not delete-then-add, and `freeAssetName` bypassed on re-promotion) — it just now has the principle behind it rather than only the failure-mode argument.

One consequence worth keeping visible, already in the body: because the name is a pointer rather than a version, a re-promotion that finds **nothing** at the recorded name reports instead of re-adding. If someone deleted the asset, silently putting it back would be the version mechanism sneaking in through the back door.

<!-- xgd-chat-end -->