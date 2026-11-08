---
uid: comment-f9350d82
id: COMMENT-7887
type: comment
title: Comment on bug BUG-364
created_by: xgd
created_at: '2026-11-05T23:30:32.795254+00:00'
updated_at: '2026-11-05T23:30:32.795254+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-07767738
  kind: note
---


## Resolution: won't fix (duplicate of BUG-365)

**Root cause (confirmed in code):** commit `3fea82eeee` (BUG-355, 2026-11-05) changed the `overlay` case of `composeSection` in `packages/site-schema/src/l1/design.ts`. A video in an overlay section is now drawn as a layer filling the section (pin `fill`), with the scrim as a second fill layer, and the clip's own `sizing` is removed. Because of that, the stored `sizing.height: fixed 720` no longer gives the section its height. This hero's text group is also placed `absolute`, so nothing left in the flow holds the section open. The section shrinks to about its padding (~270px at 1280), and the text group and its gradient spill below it. The scrim, stretched over the shorter hero, makes it look darker. The page data is unchanged.

**Why this ticket is closed:** BUG-365 (bug-313c192b), "Overlay hero with a clip: halved in height and darker since BUG-355's fill layers", reports the same regression and has the same diagnosis. Its fix spec is fuller: the section keeps its picture's stated height or aspect as a minimum height, the scrim and gradient cover what they covered before, and existing heroes render as they did. The fix is tracked there, so this ticket is not fixed separately. No code was changed under BUG-364.
