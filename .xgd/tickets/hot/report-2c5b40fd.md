---
uid: report-2c5b40fd
id: REPORT-2031
type: report
title: 'Overlap resolution: cluster 7'
created_by: xgd
created_at: '2026-08-16T00:39:02.548160+00:00'
updated_at: '2026-08-16T00:39:02.548160+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-7ef6a9ea
  cluster_id: '7'
---

## Cluster 7 Resolution

**Boundary**: Which capability owns the local server that serves rendered site output
**Stories resolved**: 3
**Actions**: 3 confirm, 0 reassign, 0 merge

### Finding

The cluster premise assumes one local server. There are in fact **three distinct
servers** in the matrix, and each story names exactly one of them:

1. **The deployed public server** (`public-site`, multi-tenant, edge) — serves
   pre-rendered snapshots out of the shared artifact store to a visitor.
   STORY-95, CAP-82.
2. **The standalone local preview server** (`1c preview`) — serves the locally
   rendered artifact so an author can check the delivered result before it is
   delivered. Appears in STORY-96, CAP-82.
3. **The workspace origin** (a local Node process, with the Worker as a verbatim
   front) — serves the workspace document, its components, its browser source,
   and the draft-side channels produced at request time. STORY-99, CAP-85.

Servers 2 and 3 are the ones that look alike: both run on the operator's machine
and both emit rendered site bytes. They are not the same server, and STORY-99
already says so in its own technical context, naming "the standalone local
preview server (STORY-95 / STORY-96)" as a separate thing that happens to share
one implementation detail (the file-sending path).

### The boundary that separates them

Ownership follows **what the server exists for**, not which bytes it emits:

- **CAP-82 owns the delivery contract** — which URL names which bytes, and the
  guarantee that the answer is the same wherever a site is served from. The local
  preview server is in CAP-82 *only* in that role: it is the second environment
  the agreement has to hold in. CAP-82's scope names this explicitly ("URL
  resolution agreement — the URL an author writes resolves the same way in the
  local preview server and in production").
- **CAP-85 owns the operator's working surface and the origin that hosts it.**
  The workspace origin serves renderings because the display panel must be
  same-origin with the document that frames it — that is a property of the
  workspace being one document, not a delivery contract. CAP-85's scope names it
  explicitly ("The workspace origin — one host serving the workspace document,
  its components, its browser source ... and any rendered channel of any site in
  the store").

Both capabilities already state their half of this boundary in their own scope
sections, and neither claims the other's server. The overlap is nominal — two
things called "a local server" — not a contested ownership.

### AC-level check

No AC crosses the line:

- STORY-96's local-preview criteria (AC-915, AC-922) are about the clean-URL
  mapping and confinement **in the preview server**; STORY-99's analogous
  criteria (AC-977 non-cacheable, AC-978 escape confinement, AC-1036 channel
  addressing) are about **the workspace origin's** trees. Analogous properties,
  distinct servers, no shared assertion.
- STORY-99 does not claim any published-serving behaviour: AC-972 covers the
  workspace *invoking* the existing publish path, and CAP-85's out-of-scope
  ("Publish semantics ... adds none of its own") leaves the serving of the
  published result to STORY-95.
- STORY-95's criteria are entirely about the deployed multi-tenant server and
  touch no local server at all.

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d34eccd8 (STORY-95) | confirm | capability-a12e557f | (no change) | Subject is the deployed public multi-tenant server, not a local server. Sits outside the cluster's ambiguity entirely; CAP-85 explicitly disclaims it. |
| story-66115f6b (STORY-96) | confirm | capability-a12e557f | (no change) | Subject is the URL-resolution *agreement* between the local preview server and production — a delivery-contract property CAP-82 names verbatim in its scope. The workspace origin is not one of the two environments this story is about, so CAP-85 is not a candidate home. |
| story-e674c60a (STORY-99) | confirm | capability-a994b8f3 | (no change) | Subject is the workspace origin, which exists to host the operator's surface same-origin. It serves renderings as a consequence of that, and produces the draft-side channels at request time rather than serving CAP-82's artifacts. Moving it to CAP-82 would drag the chrome, components, toolbar and layout state with it. |

### Residual noted, not actioned

STORY-99 records a real divergence that this resolution does not close: the
non-cacheable directive was added to the shared file-sending path, which the
standalone local preview server also uses, and **no story claims that
behaviour** for that server. If it is ever claimed, it belongs to CAP-82 (the
preview server's own capability), not CAP-85 — STORY-99 correctly declines to
assert it. This is a matrix-coverage gap on CAP-82, already documented on
STORY-99, and is not an ownership ambiguity; closing it would require a content
change or a new story, both outside this step's remit.

### Verification

- Every story belongs to exactly one capability (unchanged: 2 in CAP-82, 1 in CAP-85).
- All 3 stories in the cluster were examined; none skipped.
- No merges performed, so no AC reparenting was required and no test renaming applies.
