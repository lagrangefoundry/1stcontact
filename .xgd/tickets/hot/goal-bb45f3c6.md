---
uid: goal-bb45f3c6
id: GOAL-17
type: goal
title: Editor chat
created_by: xgd
created_at: '2026-08-06T00:53:31.946480+00:00'
updated_at: '2026-08-06T00:53:31.946480+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: planned
---

The conversational half of the builder — the pane beside the preview where the
AI does everything the direct-manipulation editor deliberately will not.

DOC-28 §2 is explicit that the AI remains the primary mode of interaction and
the only way a page is created; the editor is the fast path for small tweaks and
an escalation to the AI for everything else. So this is not a nice-to-have
beside the editor, it is the surface the editor escalates *to*.

Named in DOC-28 §12 "Not in phase 1": `webui-chat` + `webui-markdown` +
`webui-scroll`, with the card registry as the seam for rendering AI edits.

No REQ yet.
