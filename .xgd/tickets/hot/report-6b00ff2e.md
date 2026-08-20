---
uid: report-6b00ff2e
id: REPORT-2296
type: report
title: 'Overlap resolution: cluster 6'
created_by: xgd
created_at: '2026-08-20T01:15:14.265167+00:00'
updated_at: '2026-08-20T01:15:14.265167+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: overlap_resolution
  subject_uid: report-2485c83c
  cluster_id: '6'
---

## Cluster 6 Resolution

**Boundary**: Two local HTTP surfaces serve a site's pages, with confinement, URL resolution and miss semantics split across them
**Capabilities**: capability-a12e557f (CAP-82, Site Delivery: Deploy & Public Serving), capability-a994b8f3 (CAP-85, Builder Workspace: Chrome, Origin & Display Panel)
**Stories resolved**: 3 (3 confirmed, 0 reassigned, 0 merged)

### Actions

| Story | Action | From | To | Rationale |
|-------|--------|------|-----|-----------|
| story-d34eccd8 (STORY-95) | confirm | capability-a12e557f | (no change) | Owns the *deployed* multi-tenant public server — addressing forms, store-tree confinement, address grammar, caching, miss semantics. Not a local surface at all; it is the delivery endpoint CAP-82 exists for. No AC touches either local server. |
| story-66115f6b (STORY-96) | confirm | capability-a12e557f | (no change) | Owns the clean-URL *agreement* between `1c serve` (local preview) and the deployed site. CAP-82's declared scope names this explicitly: "URL resolution agreement — the URL an author writes resolves the same way in the local preview server and in production." The story's own framing is "the agreement is the capability, not the mapping", which is a delivery property, not a workspace one. |
| story-e674c60a (STORY-99) | confirm | capability-a994b8f3 | (no change) | Owns the `1c builder` workspace origin — a different process, different command, different address space (chrome, `/webui/`, `/builder/`, `/framework/`, `/preview/<slug>/<channel>/`, `/api/*`) with request-time rendering. This is CAP-85's raison d'être; no part of it belongs in delivery. |

### Why this overlap is acceptable

The dividing line is **which observable surface a behaviour is asserted at**, and
each surface has exactly one owning capability:

- `1c serve` (single-site static preview server, `startServe` in
  `tools/generate/src/cli/serve.ts`) and the deployed public server → **CAP-82**.
- `1c builder` (the workspace origin, `startBuilder` in
  `tools/generate/src/cli/builder.ts`, serving three distinct file trees plus
  request-time channel renders) → **CAP-85**.

Verified in code, not just in ticket prose: these are two separate CLI commands
starting two separate `http.createServer` instances over different roots.

Confinement, URL resolution and miss semantics appear on both sides because
`resolveStaticFile` / `sendFile` / `MIME` in `cli/serve.ts` are a **shared
helper** invoked from both entry points (`startServe` directly, and the builder
origin via its own `serveTree`). That is shared *implementation*, not a shared
*claim*. Each capability asserts the behaviour at its own entry point and
neither asserts the other's:

- AC-922 (STORY-96) pins confinement on the local preview server, specifically
  that the clean-URL mapping cannot widen reach beyond the served site.
- AC-978 (STORY-99) pins confinement across the builder origin's three trees,
  and that it is identical on every tree — a property that only exists because
  that origin serves more than one tree.
- AC-979 / AC-1036 (STORY-99) pin the builder origin's miss semantics and
  channel addressing; AC-1036 references the public site's addressing as a
  *consistency reference point*, not as a restatement of STORY-96's mapping.

Collapsing these into one capability would leave one of the two surfaces
unverified, since neither set of ACs is reachable from the other's entry point.

The boundary is already declared explicitly on both sides of the matrix: CAP-82's
scope names the local preview server for the URL-resolution agreement, and
STORY-99's technical context explicitly disclaims the local preview server's
freshness change ("that server's own intent says nothing about caching, and no
criterion here claims it... the matrix for those stories follows their own
intent"). Two capabilities that each name the boundary the same way is the
signature of a clean split, not an ambiguous one.

### Residual note (not a cluster ambiguity, not resolvable here)

The local preview server's own caching behaviour is claimed by **no AC in either
capability**. STORY-99 changed it by adding `NO_STORE` to the shared file-sending
path and deliberately declined to claim the effect on `1c serve`; STORY-95/96
predate the change. This is a coverage gap for a future ticket against CAP-82,
not an overlap between the two capabilities — no reassignment or merge would
close it, since the behaviour has no story on either side.
