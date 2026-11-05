---
uid: request-46a26267
id: REQ-646
type: request
title: 'Agent compute: cut consultant and builder rounds over to per-job Cloudflare
  Containers'
created_by: EPIC-32
created_at: '2026-11-04T19:54:13.278652+00:00'
updated_at: '2026-11-05T00:34:56.638453+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-24a2ec33
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-745fa191
  commits:
  - working_sha: 2477dac004f921cfb2ca3a57e2d6bd76884fe38e
    reconcile_sha: null
    main_sha: null
  - working_sha: 1bd46578bfbf2d9c23f38eebfdc810d9653e43d7
    reconcile_sha: null
    main_sha: null
  - working_sha: 0197078fc1c2bd2f8a36a94847933dfbe39e650d
    reconcile_sha: null
    main_sha: null
  - working_sha: 09e9c178897448bf52a60842c4b4e8a94517aee2
    reconcile_sha: null
    main_sha: null
  version: 0.2.770
  story_points: 20
---

## What changes

All agent compute moves out of Worker isolates into Cloudflare Containers, in **one cutover**: consultant rounds, builder passes, and the page capture and screenshots they do. The in-isolate agent path is **deleted** in the same change. There is no switch and no period with two paths. The design is in DOC-86 §3–§6; the policy is DOC-1 items 31–34.

- **Image:** one Docker/OCI image (`linux/amd64`) running the host in Node. This is the code the `1c` CLI runs in-process today. It is built and pushed by `wrangler deploy` (a `[[containers]]` entry in `apps/control-app/wrangler.toml`, repeated under every named environment like the other bindings). Size standard-1, set in config.
- **Addressing:** one instance per job, through a Durable Object keyed by the job id. It is started by the job's Workflow round step and sleeps as soon as the job ends. Nothing is kept awake per site.
- **Orchestration unchanged in shape:** the `ConsultantTurn` Workflow stays. Each round or builder step asks the job's container to run that step and awaits its result. A container that dies fails the step; the Workflow retries it and the round resumes from the junction.
- **No state in the container:** the junction (SessionJunction DO), D1 and R2 remain the only record. The container reaches them only through a new **internal entrypoint** on control-app (a `WorkerEntrypoint`, like `LeadIntake`; no public URL), authenticated per job. It holds no account credentials. Model keys are passed as container env from Worker secrets.
- **Shutdown:** on SIGTERM the container finishes or abandons its current tool call, writes a checkpoint record and exits.
- **Screenshots:** they run in the container's own headless Chromium. Browser Rendering is no longer used for builder capture.
- **Liveness:** the container's step writes the signs of life the follower reads, building on BUG-343.
- **Observability:** each job step records the container's peak memory, CPU seconds, wall time and exit reason on its `turn_log` row. An `exceededMemory` or OOM kill is distinguishable from a deploy SIGTERM.
- **Dev parity:** `bin/dev` runs the same image through `wrangler dev`'s container support. Dev no longer runs agent compute inside workerd.
- **Deploy:** `bin/deploy` builds the image (requires Docker running). DOC-41 records the prerequisite. Extends BUG-342's one-command deploy.
- **Deleted:** `inProcessRunner` as a production path, the in-isolate host steps, and Browser Rendering for builder capture. The `1c` CLI keeps running the host in-process locally, because that is the same code.

## Prerequisite

TODO-21 (the operator's Cloudflare and Docker setup) must be done first. Done 2026-11-04 (Docker running; the API token lists containers).

## How it was built

**The step, end to end.** `ConsultantTurn` (`worker.ts`, `turn-job.ts`) no longer builds a consultant host. Each step — a round, a builder pass, an abandon, the end — is a `StepRequest` (`job-step.ts`) sent to the `AgentContainer` Durable Object keyed by the job id (`agent-container-do.ts`, logic in `agent-container.ts`). The DO starts the job's container on demand, waits for its health check, POSTs the step to it and awaits the answer. The container (`apps/control-app/container/server.ts`) runs the step through `executeStep`, the one step path: `consultantHost(...)` then `runJobStep` / `abandonJob` / `endJob`, the same host code the Worker used to run. On the job's `end` step the DO destroys the container and drops the job token. A step whose container stops answering is raced against the container's own exit (`monitor()`, or `running` turning false), so a killed container fails the step promptly and the Workflow retries it in a fresh one.

**How the container reaches the platform.** The container's `env` is a set of binding proxies (`platform-wire.ts`) over a closed list: D1 (`prepare/bind/first/all/run/raw`, `batch` as one remote batch, `exec`), R2 (`get/put/head/list/delete`, bodies streamed raw with metadata in a header), Durable Object RPC (the junction and the site coordinator, by name), Workers AI `run`, Images (`info`, and `input().transform().output()` as one call) and Workflows (`create`, `get().status()`). Each call goes over HTTP to `10.0.0.1`; the DO intercepts the container's HTTP to that address only (`interceptOutboundHttp`) and hands it to `PLATFORM`, a self service binding onto the `PlatformApi` `WorkerEntrypoint` — no URL reaches it. Every request carries the job id and a 32-byte token minted per job and held in the job's DO; `PlatformApi` asks that DO to verify it and refuses (401) anything else before reading or writing.

**Credentials.** The container is started with an allowlist only: the model keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `FAL_KEY`), plain values the host reads (`TENANT_ID`, `MAIL_FROM`, `STRIPE_MODE`, `ANTHROPIC_BASE_URL`, …), the job id/token and the platform address. Account and provider credentials (`CLOUDFLARE_DNS_TOKEN`, `RESEND_API_KEY`, the Stripe secret keys, `DEVELOPMENT_TICKETS_TOKEN`) never travel: the container sees a placeholder (`held-by-platform`) so the host still composes the capability, and its `fetch` sends requests for those APIs to `/egress/<name>` on the platform, which attaches the real credential (credentialed egress). `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are never given, so the embedder uses the proxied `AI` binding.

**SIGTERM.** The container's server writes a `job_checkpoint` record (reason `sigterm`) on the junction for the step in flight, flushes it, answers the step `{ checkpoint: true }` and exits. The tool call in flight is abandoned and reissued by the retry, which resumes from the junction. A checkpointed try does **not** spend one of the step's attempts (`MAX_STEP_ATTEMPTS` counts only tries that died), so a deploy cannot push a job over its retry budget.

**Screenshots and capture.** The container passes its own launcher (`container/chromium.ts`: `puppeteer-core` over the image's Debian Chromium) into the host's fidelity seam, so the builder's pictures, layout measurements and page captures run there; the in-process preview fulfilment and the egress guard above the launcher are unchanged. The `BROWSER` binding remains only for work outside a job (the comparison-site capture Workflow and the feedback screenshot).

**Observability.** Migration `0048_turn_log_compute.sql` adds `peak_memory_mb`, `cpu_s`, `wall_s`, `exit_reason` and `memory_kills` to `turn_log`. Each step's compute (peak RSS and CPU as the container reports them, wall time as the DO times it) is folded into the turn's row: the peak kept, CPU and wall summed, the latest exit reason. `exit_reason` is `ok`, `error` (the step threw, the container lived), `sigterm` (checkpointed stop), `oom` (an OOM/`exceededMemory` message, or a SIGKILL exit 137) or `crash`; `oom` also increments `memory_kills`.

**No in-isolate path for a deployed Worker.** `POST /api/ai/prompt` starts jobs only through `CONSULTANT_TURN`. A deployment without it refuses the message by name ("This deployment has no agent compute: …") rather than running it in the isolate. Only two non-deployed callers run steps in-process: the `1c` CLI (`RouterDeps.inProcessJobs`, set by `builder.ts`, because the CLI is the host in Node) and the suites, whose model is injected in-process (`setModelClient`; `modelInjected()`), where the Workflow's step also runs in-isolate through the same `executeStep`.

**Deploy and dev.** `bin/deploy.d/assets/20-control-app-container` bundles the container (`container/build.mjs`, esbuild via wrangler) after the asset build and stops the deploy by name when Docker is not running. `wrangler deploy` builds and pushes the image. Every rehearsal (`--dry-run`) passes `--containers-rollout=none`, so a rehearsal needs no Docker. The local dev snapshot (`bin/deploy --env dev`) carries `container/Dockerfile` and the bundle beside the frozen `wrangler.toml`, so `bin/dev`'s `wrangler dev` builds and runs the same image.

## Design decisions made during implementation

- **Proxy the bindings, not the host's operations.** The container runs the same `consultantHost` construction over proxied bindings, so there is one host build and a small closed wire vocabulary, rather than remoting ~30 HostDeps surfaces.
- **Per-host interception, not intercept-all.** Only HTTP to the platform address is intercepted; the model, page captures and everything else go out directly. Verified locally under `wrangler dev`.
- **The suites keep running turns in-process** (178 workers suites inject a scripted model in-process); that seam is the injected model itself, which no deployed Worker has. Only the REQ-646 UATs need Docker.
- **Ending steps run in the container too**, so a Worker never builds a consultant host for a job.

## Test plan

UATs (`tests/test_UAT_FC_REQ-646_agent_compute_in_containers.test.ts`) drive the control app as `wrangler dev` runs it locally — real Worker, real `ConsultantTurn` Workflow, real `AgentContainer` DO, the real image run by Docker — with the model served over HTTP to the container (`tests/support/model-server.ts`, `tests/support/job-container-rig.ts`). They need Docker, and skip without it.
- `test_UAT_FC_REQ-646_full_message_runs_through_a_container` — a consultant round, a builder pass and a delivery round run end to end through a locally run container; the client stream receives every record (progress, the build's line, the delivery round's words, `done complete`); the page was measured by the container's own Chromium (the host's layout findings reach the consultant); the `turn_log` row records peak memory and wall time with `exit_reason ok` and no memory kills; the container is gone once the job ends.
- `test_UAT_FC_REQ-646_killed_container_retries_the_step_once` — killing the container mid-builder-pass makes the Workflow retry that step (and only it) in a fresh container; the job completes once (one end, one write, one closed ledger row).
- `test_UAT_FC_REQ-646_sigterm_checkpoints_and_the_retry_resumes` — SIGTERM mid-step writes a `job_checkpoint` (reason `sigterm`), the retried step resumes after it, the job completes, and no memory kill is counted.
- `test_UAT_FC_REQ-646_container_reaches_stores_only_through_the_entrypoint` — no account credential is in the container's env (provider credentials only as the placeholder), the model key and job token are, a wrong job token is refused 401, and the job's own token reaches D1 through the entrypoint.
- `test_UAT_FC_REQ-646_large_business_builder_pass_fits_the_container` — a builder pass on a business with 400 products and 2,000 Library items completes with `exit_reason ok`, no memory kills, and peak memory under standard-1's 4 GiB.

`tests/test_UAT_FC_REQ-646_no_in_isolate_agent_path.workers.test.ts`:
- `test_UAT_FC_REQ-646_a_worker_without_agent_compute_refuses_the_job` — a deployed Worker (no `CONSULTANT_TURN`, no in-process model) refuses the message by name; nothing runs in the isolate.

Regression: all 178 workers suites that post prompts, the REQ-624 / REQ-627 / BUG-332 / BUG-343 Workflow suites, and the deploy suites (`bin/deploy`'s hooks, rehearsals and dev snapshot) show no failures beyond the ones `xgd-working` already has.

Acceptance on dev and prod (operator): run a full build of a small site and a shop site, and check that `turn_log` shows no memory kills.


## Merge note (for reconcile)

The renumber of this ticket's migration was made while resolving merge `4b69c9ddd3` (xgd-working into free-REQ-646), so it is in no commit listed in `fields.commits`. The intended final shape, as it stands on xgd-working:
- The migration is `db/migrations/0048_turn_log_compute.sql` (commit `2477dac004` added it as `0047_turn_log_compute.sql`; REQ-643's `0047_orders.sql` landed first, and the later ticket renumbers). Its header gains a "WHY `0048`" note; `db/migrations/manifest.json` lists `0047_orders.sql` then `0048_turn_log_compute.sql`.
- `tests/support/d1-site-factory.ts` imports `0047_orders.sql` then `0048_turn_log_compute.sql` last. `atHead()` asks for all three: the `orders_take_unpaid_invoices` trigger present, `shop_settings` dropped, and `turn_log.memory_kills` present.