---
uid: bug-fd780c38
id: BUG-231
type: bug
title: 'Builder banners: error banners can''t be dismissed — give every actionable
  banner a dismiss ×'
created_by: EPIC-19
created_at: '2026-10-19T23:31:13.561400+00:00'
updated_at: '2026-10-19T23:31:13.561400+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: medium
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Symptom

The yellow failure banner, for example *"This site was not published. …"* (`builder-banner--publish-failed`, `apps/control-app/src/builder/app.js` around line 2469), can't be dismissed. It stays at the top of the preview until something else replaces it, so a client who has read it, or already fixed the cause, still has an alarming message on screen (operator, 2026-10-19).

## Fix

1. **Every error or notice banner the client can act on has a dismiss ×**, at its top right:
   - it's a real `<button>` with `aria-label="Dismiss"`, reachable by keyboard;
   - Escape dismisses the banner when focus is inside it;
   - it meets the builder's minimum tap size on a phone.
2. **Dismissing removes the banner and nothing else.** The state behind it isn't changed: a failed publish is still unpublished, and pressing Publish again reports again. A new failure shows a new banner, even when its message is the same as the one dismissed.
3. **Banners that explain why the builder can't be used aren't dismissible.** That's "this builder is not configured" (the blocking banner, around line 2333), the no-business banner (around line 2511), and the progress banner while a publish runs (around line 2424). Each describes something still true and the reason the screen is locked, so hiding it would leave a locked builder with no explanation. The rule is written beside the banner code so later banners follow it.
4. **One way of building banners.** The × comes from a single shared helper used by every dismissible banner, so it can't be missing on some of them. The commit lists every banner it converted, including `builder-operator-banner` in `business.js`, whose existing "back" control stays.
5. **Same look everywhere:** the × matches the builder's other close controls (modal close, chip remove).

Related: BUG-230 changes what the publish failure banner says. This ticket only makes banners dismissible.

## Test plan

UATs `test_UAT_FC_<id>_*`, in the builder (jsdom):
- a failed publish's banner has a Dismiss button; clicking it removes the banner; a second failed publish shows it again;
- Escape inside the banner dismisses it;
- the not-configured, no-business and publishing banners have no Dismiss button;
- every banner the shared helper produces as dismissible has exactly one Dismiss button, with the accessible name "Dismiss".
