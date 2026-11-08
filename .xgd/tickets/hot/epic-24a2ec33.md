---
uid: epic-24a2ec33
id: EPIC-32
type: epic
title: Performance issues
created_by: martin-github@westhead.me
created_at: '2026-11-04T18:50:09.717766+00:00'
updated_at: '2026-11-05T21:26:56.157179+00:00'
completed_at: null
last_field_updated: body
status: ongoing
fields:
  priority: medium
  chat_comment: comment-52a174e9
  epic_children:
  - todo-5708968f
  - bug-d381393d
  - request-b559a8df
  - request-46a26267
  - request-52538890
  - ticket://lagrangefoundry/lagrange-framework/bug-774721dc
  - doc-a058e491
  - bug-ca01d2d1
  - bug-105779dd
  - bug-18884a92
  - ticket://lagrangefoundry/lagrange-framework/bug-ff9ea440
  session_id: fbdce008-c589-4d26-afe2-73964d76dfd0
---

## What this epic is for

Consultant and builder turns keep stopping, on prod and in dev. About ten point
fixes since late October (BUG-288, BUG-312, REQ-483, BUG-320, BUG-324, REQ-624,
REQ-627, BUG-332, BUG-340, BUG-341, framework log-tail and record-cache fixes)
have each removed one cause, and a new one has replaced it every time. This epic
reviews the execution architecture: where an agent turn runs on Cloudflare, and
whether that is the right place for work of that shape.

## Findings, 2026-11-04

**Production site (small, no shop), after the 18:17Z deploy:**
- One turn ran. Its Workflow **completed** (wall 1,759 s, CPU 165.6 s, 9 consultant
  rounds, 5 builder passes). There were no exceededMemory or exceededCpu kills.
- The client still saw it stop. At 18:24:29 the follow stream (`POST /api/ai/prompt`,
  `followJob` → `closeDeadJob` in host-core) declared the job dead: 60 s with no job
  record, and a lapsed 30 s claim. With REQ-627, builder passes no longer hold the
  round's claim, so a long tool call inside a builder pass looks like death. The
  stream wrote a "lost" ending and closed, while the Workflow worked on for 24
  minutes unseen. This is a **false negative in liveness detection**, not a crash.
- **The whole turn ran in one Workflow invocation.** All rounds and builder steps
  shared one isolate (128 MB) and one CPU budget. 165 s of the 300 s `cpu_ms` cap
  was used by a turn of average length. Before the deploy, the same shape died with
  exceededMemory (3 Nov, 1,384 s wall, 139 s CPU).

**Dev shop site (~364 products, 1,616 Library items):**
- Four workerd OOMs at ~1.4 GB, each right as a builder pass starts.
- The cause is confirmed: dev records a builder replay case, and building it runs one
  full ticket-store scan of the comment corpus per Library item, all 1,616 in
  parallel. That is ≈2 GB measured offline. BUG-341's second fix (`ff8f6fbb56`, one
  scan) is committed but not yet deployed to dev or prod.
- The ticket store's `query` loads every ticket of a type and filters afterwards, so
  any per-item query remains a hazard.

## The architectural question

Everything runs in one Worker script (`1stcontact-control-app`, a 12 MB bundle):
the API, the SessionJunction and SiteCoordinator DOs, four Workflows, cron, and the
browser driver. An agent turn is a long-running (15–30 min), stateful, memory- and
CPU-heavy process. On Workers it gets 128 MB per isolate, shared with whatever else
the isolate hosts, and 5 min of CPU per invocation. Workflows give durability, not
more memory: a step runs in a Worker isolate under the same limits. Steps can also
share one invocation, as observed.

Options under discussion:
1. **Stay on Workers and make each step genuinely small:** a model call or a tool
   call per step, with no whole-session state in memory, and the sizes of the
   catalog, Library and log bounded everywhere. This is the most change to the
   framework, and every new feature re-opens the budget.
2. **Run agent turns in Cloudflare Containers** (standard-1: 4 GiB, ½ vCPU; up to
   12 GiB), addressed through a Durable Object per site or turn. Workers keep the
   edge (API, auth, the junction stream, forms, publishing). The host already runs
   in Node in-process (the `1c` CLI's `inProcessRunner`), so the turn code moves
   largely as is. Dev parity would come from running the same container image
   locally.
3. Hybrid: Workers orchestrate, and containers run only the heavy steps (builder
   passes, capture, screenshots).

In every option, liveness is reported by the runner (Workflow or container) and the
follow stream only reads it. It never declares death on its own heuristics.

Architecture policy items 2, 7 and 8 name Workers, DOs and Workflows for AI
orchestration. Option 2 or 3 needs a policy amendment. Containers are a Cloudflare
product, so item 1 still holds.

## Immediate items (not architecture)
- Fix the false "lost" verdict in `followJob`/`closeDeadJob` under REQ-627.
- Deploy `ff8f6fbb56` to dev, then prod.
- Framework: an indexed or limited ticket `query`, instead of a whole-type scan.


## Containers: maintenance and robustness (discussion, 2026-11-04)

Facts from the Cloudflare docs:
- **Images:** standard Docker/OCI images (`linux/amd64`), built and pushed by `wrangler deploy`.
- **Addressing and idling:** an instance is addressed through its Durable Object ID and started on demand. It sleeps after an idle timeout (`sleepAfter`, default 10 min) and scales to zero. There is no fleet to keep alive.
- **Cold start:** typically 1–3 s.
- **Disk:** ephemeral. Only DO storage, D1 and R2 persist.
- **Deploy or host move:** SIGTERM, up to 15 min grace, then SIGKILL. Cloudflare guarantees no minimum runtime.
- **Billing:** per 10 ms of activity. A 30-min turn on standard-1 costs about $0.02–0.03, far below its model spend.
- **Local dev:** `wrangler dev` runs the container in Docker.

Working position:
- **The long-running process already exists.** Today's Workflow invocations run for 29 minutes and hold the turn in a 128 MB isolate. A container makes that process visible and gives it enough memory. It does not create it.
- **The container is disposable compute, never a home for state.** The junction, D1 and R2 stay the record. Workflows stay the orchestrator, and its round step awaits the container: wall time is unlimited, and the step's CPU is a few seconds. A killed container is a retried step, exactly as today, but the kill becomes rare (deploys, host moves) instead of routine (memory). SIGTERM is used to checkpoint.
- **Only the authoring and agent path moves.** Published sites, forms, the portal and the API stay on Workers, so their stability is unchanged. A container failure stops a builder chat, never a live site.
- **Blast radius shrinks.** Today a heavy turn shares an isolate with other requests and can take them down with it. In a container it is alone.
- **Added maintenance:** a Dockerfile and base image (Node, Chromium if screenshots move in) to rebuild periodically, Docker required to deploy and run dev, and a second runtime (Node) beside workerd. The `1c` CLI already runs the host in Node, which limits the drift.


## Decision, 2026-11-04

Containers it is. Agent and batch compute move to per-job Cloudflare Containers,
orchestrated by Workflows, with state only in the junction, D1 and R2. This is
recorded in [[DOC-86]] (new), [[DOC-1]] (items 2, 7 and 8 amended; 31–35 added)
and [[DOC-5]] (new "Containers" section). Stability is the priority: **no new
functionality until this epic's tickets have landed.**

## Tickets (filed 2026-11-04)

| Ticket | What |
|---|---|
| **TODO-21** | Operator: API token Containers permission, Docker Desktop running, sandbox access to Docker. **Blocks REQ-646.** |
| **BUG-343** | Follow stream declares a working job lost (REQ-627 regression); the runner owns liveness. **Do first.** |
| **lagrange-framework BUG-109** | Ticket store `query` scans a whole type before filtering. |
| **REQ-645** | Bounded-by-construction sweep of control-app. |
| **REQ-646** | Agent compute cutover to per-job containers (one ticket, many commits), deleting the in-isolate path. |
| **REQ-647** | Shop catalog: static photo renditions, rebuilds as a debounced background job, checkout re-check. |

Operational: deploy `ff8f6fbb56` (BUG-341's second fix) to dev and prod. BUG-342 (one-command deploy) gains the image build under REQ-646.

**Parallel lanes:**
- **Lane A:** BUG-343, then REQ-646. REQ-646 builds on BUG-343's liveness and also needs TODO-21.
- **Lane B:** lagrange-framework BUG-109, at any time (separate repo).
- **Lane C:** REQ-647 items 1 and 3 now; item 2 after REQ-646.
- **Lane D:** REQ-645 now, scoped away from host-core and the catalog path.
- **Operator:** TODO-21, and the deploy of `ff8f6fbb56` after EPIC-16's resync cleanup.

## Published-site performance notes (catalog and inventory)

- **Good:** catalog grids and product pages are prerendered at publish (REQ-633),
  24 to a page, and edge-cached. Serving pages costs almost nothing.
- **Shop photos are the exception.** Every `/shop-photos/…` request goes from
  public-site to control-app's gate, then to D1, then to a Library read, and returns
  the **full-size original** with `max-age=60`.
  - A 24-card grid makes 24 such calls.
  - A visitor's page then depends on control-app's health, which is the same
    isolate pool where agent turns run out of memory.
  - No resized renditions are served, so phones download originals.
- **Rebuild cost grows with the catalog.** Each item Save, delete or import
  re-renders every page of every published site of the business, inside the request
  (`catalogItemChanged`). A bulk edit of n items does O(n × catalog) work.
- **Static means a visible lag.** A price or stock change shows after the rebuild
  plus up to 60 s of edge cache. Buy must re-check availability and price on the
  server at checkout. This is still to be confirmed.
- **Later:** catalog search or filtering should use a static JSON index rather than
  a Worker query, and rebuilds should touch only the pages an item appears on.



### 2026-11-05 dev-run review (post 16:08Z deploy)
13 turns on 3 sites ran in per-job containers; none lost, none OOM. Filed:
- **BUG-359** (this repo): dev has no 4 GB memory limit; recorded peak omits Chromium; container suites leak proxy containers.
- **lagrange-framework BUG-113**: a talker waiting for its slot polls claimTalker every ~50 ms, writing two log records per poll and re-reading the whole log (~4,500 records in 2 min on one site).


- BUG-359 widened (one ticket, operator decision): it also covers production. A job container is stopped only by a successful `end` step, so a failed `end`, a failed `abandon` or an externally killed Workflow leaves it running with a live token (fix: a stop alarm on the container's DO, and `end` always destroys). Registry images are pruned on deploy. Severity raised to high.