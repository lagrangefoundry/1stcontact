---
uid: goal-f0a19e64
id: GOAL-16
type: goal
title: Web editor
created_by: xgd
created_at: '2026-08-06T00:53:28.131390+00:00'
updated_at: '2026-08-06T00:53:28.131390+00:00'
completed_at: null
last_field_updated: created_at
status: in_progress
fields:
  provenance: planned
  children:
  - goal-f0b8e238
  - goal-c1e09ba3
  - goal-1d69bdb8
  implemented_by:
  - request-3cd338cd
  - request-a6740b4a
  - request-41796766
  - request-395b67e6
  - request-66e4c630
  - request-64864801
---

Direct manipulation on the live preview — DOC-28. The user hovers a region on
their own page, clicks it, edits it in a modal, sees it re-render. Every edit is
a structured, validated diff through the same validator the chat AI uses.

**Landed:** the builder shell and multi-mode display panel (REQ-115), the edit
render with derived segments and L1 addresses (REQ-116), copy editing
end-to-end (REQ-117), and the palette colour model the property editors need
(REQ-114).

**Open:** image selection (REQ-118) and request-time renders inside control-app
(REQ-119, which is also the Deployment goal's first step).

The three module children are phase-2 editable surfaces — things the editor must
be able to place and configure on a customer's site once they exist.
