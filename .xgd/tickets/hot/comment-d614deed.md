---
uid: comment-d614deed
id: COMMENT-405
type: comment
title: Comment on bug BUG-18
created_by: xgd
created_at: '2026-07-23T23:43:35.930903+00:00'
updated_at: '2026-07-23T23:43:35.930903+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-5186fa0c
  kind: note
---

SCOPE BROADENED (round-3 values-diff): the responsive flat-type-axis gap is not only fontSizePx. The A-structural cluster is fontSizePx x8 + lineHeightPx x8 + letterSpacingPx x2 — all single-valued at desktop, all must be keyframed per width by the same mechanism. Treat font-size + line-height + letter-spacing as one responsive-type-axis fix. Acceptance extends: lineHeight + letterSpacing also match at 320/375.