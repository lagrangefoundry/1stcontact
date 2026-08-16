---
uid: comment-d5ce4e72
id: COMMENT-1032
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-16T00:39:35.082918+00:00'
updated_at: '2026-08-16T00:39:35.082918+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-2c5b40fd
  kind: note
---

Cluster 7 resolved. Working tree clean.

## Outcome: 3 × confirm, 0 reassign, 0 merge

The cluster premise — "*the* local server" — was the source of the ambiguity. There are **three** distinct servers, and each story names exactly one:

| Server | Story | Capability |
|---|---|---|
| Deployed public multi-tenant server (`public-site`, edge) | STORY-95 | CAP-82 |
| Standalone local preview server (`1c preview`) | STORY-96 | CAP-82 |
| Workspace origin (local Node process, Worker as verbatim front) | STORY-99 | CAP-85 |

Servers 2 and 3 are the pair that look alike — both run on the operator's machine, both emit rendered site bytes. They are not the same server, and STORY-99's own technical context already says so, naming "the standalone local preview server (STORY-95 / STORY-96)" as a separate thing that merely shares one implementation detail (the file-sending path).

**The separating principle**: ownership follows what the server *exists for*, not which bytes it emits.

- **CAP-82 owns the delivery contract** — which URL names which bytes, and that the answer agrees across environments. The preview server is in CAP-82 only in that role: it's the second environment the agreement must hold in. CAP-82's scope names this verbatim.
- **CAP-85 owns the operator's working surface and the origin hosting it.** It serves renderings because the display panel must be same-origin with its framing document — a property of the workspace being one document, not a delivery contract. CAP-85's scope names this verbatim too.

Both capabilities already state their half of the boundary, and neither claims the other's server. AC-level check found no crossing: STORY-96's preview criteria (AC-915, AC-922) and STORY-99's analogous origin criteria (AC-977, AC-978, AC-1036) are the same *properties* asserted against different servers, with no shared assertion. STORY-99's AC-972 covers *invoking* publish, leaving published-serving to STORY-95.

**One residual, recorded not actioned**: STORY-99 flags that the non-cacheable directive was added to the shared file-sending path used by the standalone preview server, and no story claims that behaviour. That's a matrix-coverage gap belonging to CAP-82 if ever claimed — not an ownership ambiguity, and closing it would need a content change or new story, both outside this step's remit.

**Report**: REPORT-2031 (`report-2c5b40fd`), verified `cluster_id: '7'` (string), `report_kind: overlap_resolution`, `subject_uid: report-7ef6a9ea`, `result: pass`.

Two notes on the prompt's templates, since both would fail as written: the `--fields` example carries doubled braces (`{{...}}`), and it pairs `--stdin` with `report_kind`/`subject_uid` inside `--fields` — this CLI rejects those two keys there, as they're owned by `--kind`/`--subject`. I used the supported flag form instead.
