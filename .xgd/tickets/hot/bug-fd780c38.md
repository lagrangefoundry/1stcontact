---
uid: bug-fd780c38
id: BUG-231
type: bug
title: 'Builder banners: error banners can''t be dismissed — give every actionable
  banner a dismiss ×'
created_by: EPIC-19
created_at: '2026-10-19T23:31:13.561400+00:00'
updated_at: '2026-10-20T00:04:40.325680+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  severity: medium
  priority: medium
  story_points: 2
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-fa32dc04
  commits:
  - working_sha: 6c2cc3084356554829d108273e8de7cfd5aa53ff
    reconcile_sha: null
    main_sha: null
  - working_sha: 75da3b266bfae7480b1dd024fa187e1d86e9736e
    reconcile_sha: null
    main_sha: null
  version: 0.2.546
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


## What landed

- New `apps/control-app/src/builder/banner.js` — `createBanner({ className, role, content, dismissible })` is the one way builder banners are drawn. `dismissible: true` appends a `<button type="button" class="builder-banner__dismiss" aria-label="Dismiss">` as the banner's last child (top right) and binds Escape on the banner; both just remove the element. The rule about which banners may be dismissed is written in that module's header.
- Converted: `builder-banner--publish-failed` (dismissible); `builder-operator-banner` in `business.js` (dismissible, its "back" button kept and still the first button, × after it); `builder-banner` not-configured, `builder-banner--no-business`, `builder-banner--publishing` (all not dismissible). The session notice (BUG-52, `session.js`) is the same kind of lock-explaining fact and stays non-dismissible; it was not converted.
- Look: the × glyph is CSS `::before` content (so the banner's `textContent` stays exactly its sentence), muted with no box like the chip remove control, full opacity on hover/focus, and a 44×44px minimum under `@media (pointer: coarse)`. The builder has no modal close glyph, so the chip remove is the reference.

## UATs

`tests/test_UAT_FC_BUG-231_dismissible_banners.test.ts` — failed-publish banner dismisses and a second identical failure shows a fresh one; Escape inside dismisses; not-configured / no-business / publishing banners have no Dismiss; every dismissible banner from the helper (plain, operator with and without back) has exactly one Dismiss as its last child, and the CSS draws the glyph and the 44px coarse-pointer target.


**Note (after merge):** BUG-230 (`f365ba1cfa`) now builds its publish-failure banner with `createBanner` too. It also updated this ticket's first UAT to expect its new wording, a plain line with the server's sentence behind a Details toggle. The banner is still dismissible and its text is still only its words, because the × is drawn by CSS. All four BUG-231 UATs pass on xgd-working after the merge.