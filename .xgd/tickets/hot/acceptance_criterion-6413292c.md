---
uid: acceptance_criterion-6413292c
id: AC-2087
type: acceptance_criterion
title: A link in a material's description opens outside the builder, leaving the workspace
  and any unsaved edit in place
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T02:17:16.439890+00:00'
updated_at: '2026-11-01T12:33:26.483274+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A link in a material's rendered description — including the link to the captured site that a
capture's description opens with — opens in a **new browsing context**, never in the builder's
own tab. Following it leaves the builder, the Library and any unsaved edit exactly where they
were. The opened page is given no handle back to the builder (no opener) and is sent no
referrer.

This holds for every material's description, not only a capture's, and it holds after every
repaint of the description: after the rendering engines settle, after a committed correction,
after a failed write is rolled back, and after a cancelled edit, every link in the rendered
description still opens away.

## Verification

Select a capture whose description opens with a markdown link to the captured site. Observe that
the rendered link carries the captured address, targets a new browsing context, and is marked so
the opened page receives neither an opener nor a referrer. Select an ordinary material whose
description contains a link and observe the same. Commit a correction containing a link, and
separately open and cancel an edit, and observe that in each repainted description every link is
still marked to open away with no opener and no referrer.