---
uid: bug-551cacdf
id: BUG-321
type: bug
title: 'Builder chat box: no text cursor until the first keystroke (fix upstream in
  lagrange-framework)'
created_by: EPIC-19
created_at: '2026-10-31T20:48:24.893866+00:00'
updated_at: '2026-10-31T20:48:57.531848+00:00'
completed_at: null
last_field_updated: parent_uid
status: draft
fields:
  severity: low
  priority: medium
  auto_merge_back: true
  needs_review: false
  parent_uid: epic-95bc3b15
---

## Symptom

Operator, production, 2026-10-31: clicking into the builder's empty chat box shows no text cursor; it only appears after the first character is typed.

## Where the fix lives

The chat box is lagrange-framework's `webui-chat` composer (TipTap/ProseMirror), not 1st Contact code. Diagnosis and fix design are in **lagrange-framework BUG-104** (`bug-9e511842`, "webui-chat composer: text cursor hidden in the empty box until the first keystroke"). Likely cause there: the BUG-23 placeholder is an absolutely positioned `::before` on the empty first paragraph, which loses the caret in WebKit/Chromium until text exists.

**No code lands against this ticket.** It tracks the framework fix reaching 1st Contact: done when the framework version carrying lagrange-framework BUG-104 is picked up here and the builder's chat box shows its cursor on focus before typing.

If 1st Contact's own `builder.css` composer rules turn out to contribute (e.g. a host rule on `.ProseMirror` or the input wrapper), that part is fixed here under this ticket, with a UAT asserting the caret is visible in the focused empty chat box.
