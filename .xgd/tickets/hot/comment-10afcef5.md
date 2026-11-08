---
uid: comment-10afcef5
id: COMMENT-7891
type: comment
title: Comment on epic EPIC-32
created_by: xgd
created_at: '2026-11-05T23:35:01.744813+00:00'
updated_at: '2026-11-05T23:35:01.744813+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-24a2ec33
  kind: tool_transcript
---

## Bash cd /Users/martin/lagrangefoundry/1stcontact; python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"epic-…
<!-- xgd-tool name="Bash" id="toolu_01XpqtBsQxYT71qbbvkD3uyc" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:32:48.662275+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"epic-24a2ec33\"}' | head -c 6000; echo; ls .xgd 2>/dev/null | head; grep -rl \"BUG-359\" .xgd/tickets 2>/dev/null | head","description":"Read summary and locate BUG-359"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')

_changes
_locks
_staging
claude_pid_tracking.txt
CLAUDE_XGD.md
config.yaml
dashboard_instance.json
dispatcher_restart_requests
dispatcher.modes
dispatcher.pid
.xgd/tickets/hot/comment-d8c2e561.md
.xgd/tickets/hot/bug-18884a92.md
.xgd/tickets/hot/comment-52a174e9.md
.xgd/tickets/hot/epic-24a2ec33.md
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; ls .venv venv 2>/dev/null | head -3; which xgd; grep -l "BUG-359\|title:.*J…
<!-- xgd-tool name="Bash" id="toolu_016azpQmENru1axbNxW3A1Ap" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:32:53.435777+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; ls .venv venv 2>/dev/null | head -3; which xgd; grep -l \"BUG-359\\|title:.*Job containers\" .xgd/tickets/hot/bug-*.md | head; ","description":"Find python env and BUG-359 file"}
```

**Result**

```
/Users/martin/.xgd/bin/xgd
.xgd/tickets/hot/bug-18884a92.md
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; head -1 /Users/martin/.xgd/bin/xgd; P=$(head -1 /Users/martin/.xgd/bin/xgd…
<!-- xgd-tool name="Bash" id="toolu_01KNT6FATxB91LZVGzoXNwe4" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:32:56.566743+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; head -1 /Users/martin/.xgd/bin/xgd; P=$(head -1 /Users/martin/.xgd/bin/xgd | sed 's/^#!//'); $P -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"epic-24a2ec33\"}' | head -c 5000; echo; wc -c .xgd/tickets/hot/bug-18884a92.md","description":"Read summary with xgd's python"}
```

**Result**

```
#!/bin/sh
/bin/sh: lagrangefoundry.ai.agent_cli: No such file or directory

   13211 .xgd/tickets/hot/bug-18884a92.md
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; cat /Users/martin/.xgd/bin/xgd | head -20; ls ~/.pyenv/versions/
<!-- xgd-tool name="Bash" id="toolu_01D6L9fkxwNwsWUvVMCs8FdU" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:32:59.267776+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; cat /Users/martin/.xgd/bin/xgd | head -20; ls ~/.pyenv/versions/","description":"Inspect xgd launcher"}
```

**Result**

```
#!/bin/sh
# xgd release shim (REQ-934). A pinned run stays on its release; everything
# else follows the newest deployed release.
root="$HOME/.xgd/releases"
if [ -n "$XGD_RUN_RELEASE" ]; then
  case "$XGD_RUN_RELEASE" in
    dev:*)
      if [ -x "$XGD_RUN_PYTHON" ]; then exec "$XGD_RUN_PYTHON" -m xgd_source "$@"; fi
      echo "xgd: pinned interpreter $XGD_RUN_PYTHON is missing" >&2
      exit 3
      ;;
  esac
  target="$root/$XGD_RUN_RELEASE/bin/xgd"
  if [ ! -x "$target" ]; then
    echo "xgd: pinned release $XGD_RUN_RELEASE is missing ($target)" >&2
    exit 3
  fi
else
  target="$root/current/bin/xgd"
fi
3.12.11
3.12.3
whx
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; echo "$XGD_RUN_PYTHON"; P=${XGD_RUN_PYTHON:-$(head -1 ~/.xgd/releases/curre…
<!-- xgd-tool name="Bash" id="toolu_01PUWCLGnXSqXEchbCN66nNp" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:02.171631+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; echo \"$XGD_RUN_PYTHON\"; P=${XGD_RUN_PYTHON:-$(head -1 ~/.xgd/releases/current/bin/xgd | sed 's/^#!//')}; echo $P; $P -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"epic-24a2ec33\"}' | head -c 6000","description":"Read summary with release python"}
```

**Result**

```
/Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/bin/python3
[15:33:04] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2168.04, 'pid': 74922}
{"count":0,"entries":[],"framing":""}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; cat .xgd/tickets/hot/bug-18884a92.md
<!-- xgd-tool name="Bash" id="toolu_016CYYRMyM91QM289BTQgQZb" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:08.807780+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; cat .xgd/tickets/hot/bug-18884a92.md","description":"Read BUG-359 ticket"}
```

**Result**

```
---
uid: bug-18884a92
id: BUG-359
type: bug
title: 'Job containers: stop backstop, image pruning, true memory peak and dev limit'
created_by: EPIC-32
created_at: '2026-11-05T20:47:47.617767+00:00'
updated_at: '2026-11-05T21:48:46.924619+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: high
  parent_uid: epic-24a2ec33
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d8c2e561
  session_id: f90fd1b9-2920-4d12-b11f-587d3153ab58
---

## Scope

Container clean-up and memory accounting for EPIC-32's per-job containers, in **production and dev**. Found reviewing dev runs on 2026-11-05 after the 16:08Z dev deploy (REQ-646). The containers work: 13 turns ran on 3 sites with none lost and none OOM-killed. But nothing guarantees a job's container is gone when the job ends, and dev doesn't reproduce production's memory limit.

## Problems

### Production (and dev)

1. **Only a successful `end` step stops a job's container.** `AgentContainer.end()` (`apps/control-app/src/agent-container.ts`) destroys the container and deletes the job's token, and `runStep` calls it only when an `end` step returns OK. In `turn-job.ts`, a job that ends any other way leaves its container running and its token valid:
   - the `end` step fails all 3 of its attempts, or answers an error;
   - the `abandon` step fails past its retries, so the Workflow errors out before reaching `end`;
   - the Workflow is terminated or cancelled from outside, or a deploy kills it.
   
   In production a leftover container keeps billing until Cloudflare evicts it, and its token can still call the platform's internal entrypoint as that job. That breaks architecture item 31 ("No container is kept awake per site between jobs") and item 32 (containers hold no state and are disposable).
2. **Old job images pile up in the registry.** Every production deploy pushes a new ~1.5 GB image to the account's Cloudflare registry, and nothing deletes the old ones. It only costs storage, but it grows with every deploy. (On 2026-11-05 the registry was still empty: the job container hadn't been deployed to production yet.)

### Dev and test

3. **Dev does not enforce the production memory limit.** Production jobs run as `standard-1` (4 GB). Local dev containers start with no memory limit (`docker inspect` → `HostConfig.Memory=0`) and can use all of Docker's 9.7 GB. A job that would be OOM-killed in production finishes on dev, so dev can't catch memory regressions, which is the reason EPIC-32 exists.
4. **The recorded peak memory leaves out Chromium.** `container/server.ts` `usage()` reports `process.resourceUsage().maxRSS`, which covers the Node server process only. Chromium runs as child processes and counts against the instance's limit, so it should be included. Seen: the live container used 1.7 GB in `docker stats` while its `turn_log.peak_memory_mb` was 854 MB. `exit_reason`/`memory_kills` and any headroom judgement built on this number understate the real risk. (This applies in production too: it's the same server code.)
5. **The container UAT suites leak containers.** 17 `cloudflare/proxy-everything` sidecars named `workerd-1stcontact-control-app-AgentContainer-*-proxy` (the non-dev worker name, i.e. `unstable_dev` test runs) were still running 20+ hours later with no agent container beside them. They were removed by hand on 2026-11-05. Each suite run adds more.
6. **Old local job images pile up.** Every dev-worker start on a new snapshot builds a new `cloudflare-dev/agentcontainer:<hash>` image (~1.5 GB) and nothing removes the old ones: six of them built up in ~24 h.

## Fix

1. **A stop backstop on the container's Durable Object, timed from idleness, not the step timeout.** A round step may legitimately run up to 2 hours (`ROUND_STEP.timeout`), so an alarm set to "longest step + margin" would leave an abandoned container billing for 2 hours. The DO records when a step starts and when it finishes. Between steps the Workflow calls again within seconds (retry delay 1 s), so:
   - **no step in flight** and none started for `IDLE_STOP` (a few minutes) after the last one finished → stop the container and delete the job's token;
   - **a step in flight** longer than the step timeout → stop it (the Workflow has given up on it by then anyway).
   
   `end()` stays the normal path; the alarm is the guarantee. A step arriving after the backstop fired starts a fresh container, as a retry already does (containers hold no state, item 32).
2. **`end` stops the container even when the step fails.** The `end` request destroys the container and deletes the token whatever answer it gets, so a failed `end` attempt never leaves it running.
3. **Prune old registry images on deploy.** After a successful production deploy, `bin/deploy` deletes that app's older images from the Cloudflare registry, keeping the image now deployed plus the one before it for rollback.
4. **Dev catches what production's memory limit would kill.** Local containers are created by workerd itself, which sets no memory limit and ignores `instance_type` (checked in wrangler 4.111 / miniflare: there is no option to pass one). So rather than trying to cap the local container, the job is given its instance type's limit (derived from `instance_type`, not hard-coded) and compares its whole-container peak (item 5) with it. On dev and in the UAT rig, a step whose peak exceeds the limit fails as `exit_reason=oom`, counted in `memory_kills`, the same outcome production's kill produces. In production the platform enforces the limit itself and the comparison is only recorded.
5. **Measure peak memory for the whole container:** the cgroup's peak (`memory.peak`, or the highest `memory.current` sampled during the step) rather than the 
```

[elided — kept 5800 of 13211 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; wc -c .xgd/tickets/hot/comment-d8c2e561.md; tail -c 5000 .xgd/tickets/hot/c…
<!-- xgd-tool name="Bash" id="toolu_01SNjK5GcihTczGiuh8fYLs8" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:12.570476+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; wc -c .xgd/tickets/hot/comment-d8c2e561.md; tail -c 5000 .xgd/tickets/hot/comment-d8c2e561.md","description":"Read tail of BUG-359 chat comment"}
```

**Result**

```
    7301 .xgd/tickets/hot/comment-d8c2e561.md
ne before it. Should I build it to run for real, or as a dry run that only logs what it would delete until you've seen it work once? Also, should a delete that fails stop the deploy, or just warn? I'd make it a warning, because the deploy has already succeeded by that point.

2. **How long the backstop waits (fix 1).** Steps are allowed 2 hours (`turn-job.ts`), so "the longest a step may run plus a margin" means a leaked container can keep running, and billing, for about 2¼ hours. I'd use two deadlines instead: 2 h plus a margin while a step is running, and a shorter idle deadline (say 15 minutes) once a step has answered and no next step has arrived. That works if a job never waits a long time between steps, for example for the client. Can you confirm it doesn't, or should I keep the single long deadline?

3. **Recording which memory figure was used (fix 5).** I plan to add a `turn_log.peak_memory_source` column (`cgroup` or `process_rss`) in a new migration, `0050`. That also means updating the migration manifest and the test schema list. Is a new column acceptable, or would you rather it only appear in the job's log records?

4. **Pruning local images vs. the test suites (fix 7).** Local images are named only by class (`cloudflare-dev/agentcontainer:<id>`), so dev and the test rigs share the same names. I'd keep the tag this start built and remove only the older ones. Docker itself refuses to remove an image a container is using. One risk remains: if a dev deploy happens while a container test suite is running, the suite's image can be removed between two of its jobs, and its next job fails. Is that acceptable?

Three things I'll do unless you say otherwise:
- **How the memory limit gets set.** `wrangler dev` has no memory setting, so I'll pass its Docker traffic through a small local proxy. The proxy adds the limit, taken from `instance_type`, when a job container is created, and it records every container the run creates. That record is what the suite cleanup uses.
- **Making dev fail like production.** When the limit is hit, Docker kills only the largest process (usually Chromium), so the step would end as an `error`, not `oom`. To make it fail as production does, the container's server will notice the memory kill and end the whole container. That gives `exit_reason=oom`, counted in `memory_kills`. I'll add a line saying this to the ticket.
- **Sizing.** I'll record this as about 13 story points.

<!-- xgd-turn id="46d18f71-71b2-46af-96fb-015ed6e9debb-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T21:47:55.260562+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="46d18f71-71b2-46af-96fb-015ed6e9debb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T21:48:57.249132+00:00" -->
#### Claude
Yes, I'm ready to code. Your edits answer the two big questions:

- **Backstop:** it's timed from idleness, with `IDLE_STOP` set to 5 minutes. A step still running is left alone until the step timeout.
- **Memory on dev:** no proxy. The job is given its instance type's limit and compares its whole-container peak with it. Where no cgroup figure exists, the peak comes from the process tree's summed memory, never `maxRSS`.

Your edits didn't settle five smaller points, so I've added them to the ticket as "Implementation defaults". The rest of the body is unchanged.

1. **Where the figures go:** a new migration, `0050`, adds two `turn_log` columns. `peak_memory_source` (`cgroup` or `process_tree`) records which method produced the peak, and `memory_limit_mb` records the limit it was compared with. That is what "only recorded" means in production.
2. **How dev knows to enforce:** the limit comes from `instance_type` through a table of Cloudflare instance types, for example `standard-1` = 4 GiB. A var, `JOB_MEMORY_ENFORCE=1`, is set in `[env.dev.vars]` and by the UAT rig, and absent in production. With it set, a step over the limit ends as `exit_reason=oom`.
3. **Registry pruning:** it deletes for real. A delete that fails only warns; the deploy still counts as successful.
4. **Which containers belong to a suite run:** the agent containers and proxy sidecars named after the test worker that were created after the rig started. The rig's stop fails if any of them remain.
5. **Local images:** the tag this dev start built is kept and older tags are removed with a plain `docker rmi`, which Docker refuses for an image a container uses. The accepted risk is that a dev deploy during a container test run can remove that run's image between two of its jobs.

If any of these is wrong, change it in the ticket. Otherwise say go and I'll start in the `free-BUG-359` worktree. Four of the seven UATs run real Docker containers, and memory notes say the REQ-646 container suite this builds on hangs in this sandbox, so their runs may need several tries.

<!-- xgd-chat-end -->
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app; ls migrations 2>/dev/null | tail -3; grep -n "instance_typ…
<!-- xgd-tool name="Bash" id="toolu_01S19xMDVEey4yebKjGYu2NW" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:25.944353+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app; ls migrations 2>/dev/null | tail -3; grep -n \"instance_type\\|\\[env.dev.vars\\]\\|\\[\\[containers\\]\\]\" wrangler.toml | head; grep -rn \"maxRSS\\|usage()\" container/server.ts 2>/dev/null | head -5; ls ../../container 2>/dev/null | head; git -C ../.. worktree list | grep -i 359","description":"Check migrations, wrangler config, container server"}
```

**Result**

```
504:[[containers]]
507:instance_type = "standard-1"
771:instance_type = "standard-1"
874:[env.dev.vars]
984:instance_type = "standard-1"
container/server.ts:32:    peakMemoryMb: Math.round((now.maxRSS / 1024) * 10) / 10,
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-359         852b76acbe [free-BUG-359]
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app; find . -path ./node_modules -prune -o -name "0049*" -print…
<!-- xgd-tool name="Bash" id="toolu_01KRkCcgdobuZWJkEcdBz2zs" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:32.705078+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app; find . -path ./node_modules -prune -o -name \"0049*\" -print -o -name \"0050*\" -print | head; sed -n 20,60p container/server.ts","description":"Find migration numbering and usage code"}
```

**Result**

```
./.wrangler/state/v3/r2/1stcontact-sites/blobs/0050af731910ba274e5f5b072b09cbced8369cadd32535de03d8636972de224b000001a15028ab13
./.wrangler/state/v3/r2/1stcontact-sites/blobs/0050ba81ebf3c62f495e238b75c1111aca110ed8564179991435447f09ebd4aa000001a1ac8d560f
./.wrangler/state/v3/r2/1stcontact-material/blobs/00493a2aa6fe5e4b03e63ebb8a63e79985f9a0d63732ca9d44c1a91088b71791000001a17420f7a7
 */
import http from 'node:http'
import { consultantHost, clientPerson } from '../src/router'
import { executeStep, type StepRequest } from '../src/job-step'
import { platformFetch, platformTransport, remoteEnv } from '../src/platform-wire'
import { checkpointJobStep, type HostDeps } from '../../../tools/generate/src/cli/ai/host-core'
import { chromiumLauncher } from './chromium'

/** What one step's process used: its peak resident set and the CPU this step spent. */
function usage(cpuBefore: number): { peakMemoryMb: number; cpuS: number } {
  const now = process.resourceUsage()
  return {
    peakMemoryMb: Math.round((now.maxRSS / 1024) * 10) / 10,
    cpuS: Math.round(((now.userCPUTime + now.systemCPUTime - cpuBefore) / 1e6) * 1000) / 1000,
  }
}

function cpuNow(): number {
  const now = process.resourceUsage()
  return now.userCPUTime + now.systemCPUTime
}

function send(res: http.ServerResponse, status: number, body: unknown): Promise<void> {
  return new Promise((resolve) => {
    if (res.writableEnded) return resolve()
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body), () => resolve())
  })
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** Start the job's server. Exported for the suites, which run it in-process. */
export function startJobServer(opts: {
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git ls-files | grep -E "migrations/00(4[7-9]|5[0-9])" | head; git ls-files…
<!-- xgd-tool name="Bash" id="toolu_01F5qfRTVubCwR1uWk2Unk32" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:35.787600+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git ls-files | grep -E \"migrations/00(4[7-9]|5[0-9])\" | head; git ls-files | grep -i \"migration.*manifest\" | head -3","description":"Locate latest D1 migrations"}
```

**Result**

```
db/migrations/0047_orders.sql
db/migrations/0048_turn_log_compute.sql
db/migrations/0049_item_collections.sql
db/migrations/0050_estimate_outcomes.sql
db/migrations/0051_item_live_set_by.sql
bin/migration-manifest
db/migrations/manifest.json
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.gi…
<!-- xgd-tool name="Bash" id="toolu_014kQ7dyWT4pbXaMXfAT2823" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:40.789882+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-359; ls $W/db/migrations | tail -3; git log --oneline -1 -- db/migrations/0051_item_live_set_by.sql db/migrations/0050_estimate_outcomes.sql; git log --format='%h %ci %s' -2 -- db/migrations/0051_item_live_set_by.sql; grep -n \"max_instances\\|image\" apps/control-app/wrangler.toml | sed -n 1,8p","description":"Compare migrations in BUG-359 worktree"}
```

**Result**

```
0048_turn_log_compute.sql
0049_item_collections.sql
manifest.json
7ef8b91a4d fix(shop): untracked stock imports live; import-held items recover; Make these live (BUG-366)
7ef8b91a4d 2026-11-05 15:15:26 -0800 fix(shop): untracked stock imports live; import-held items recover; Make these live (BUG-366)
408:# regardless, because REQ-219's recipe renderer uses it for every other image
424:# binding, `imagesHeicConverter` returns null, and every iPhone photograph is
427:[images]
494:# image is the host in Node (`container/Dockerfile`), built and pushed by
506:image = "./container/Dockerfile"
508:max_instances = 50
737:[env.production.images]
770:image = "./container/Dockerfile"
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; P=$XGD_RUN_PYTHON; S=epic-24a2ec33 $P -m lagrangefoundry.ai.agent_cli Agent…
<!-- xgd-tool name="Bash" id="toolu_01JRAJYPZ7v2XepiuNLJBArQ" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:33:59.289697+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; P=$XGD_RUN_PYTHON; S=epic-24a2ec33\n$P -m lagrangefoundry.ai.agent_cli AgentSummaryFrame --in \"$(python3 -c 'import json,sys;print(json.dumps({\"session\":\"epic-24a2ec33\",\"text\":sys.stdin.read()}))' <<'EOF'\nEPIC-32 (Performance issues) watch session. This EPIC session scopes and files tickets and reviews runs; it does not code (memory: epic-session-does-not-code).\nSettled: agent/batch compute moved to per-job Cloudflare Containers orchestrated by Workflows (REQ-646 landed, dev deploy 2026-11-05 16:08Z ace08312da). Stability first: no new functionality until EPIC-32 tickets land.\nCurrent focus: BUG-359 (bug-18884a92) \"Job containers: stop backstop, image pruning, true memory peak and dev limit\", high, being coded in worktree free-BUG-359 by its own session. Operator chose ONE ticket for prod+dev clean-up.\nBUG-359 decisions (in its body): DO alarm backstop timed from idleness, IDLE_STOP=5 min, in-flight step left to step timeout; end always destroys container+token; registry prune keeps current+previous image; dev does not cap container memory (workerd/wrangler 4.111 can't) - job compares whole-container peak to instance_type limit and fails as oom on dev/UAT; peak = cgroup, fallback summed /proc process-tree RSS, never maxRSS; suites tear down all containers; dev start prunes old local images.\nRejected: separate prod bug (operator wants one ticket); alarm = step timeout+margin (2h billing); Container helper class sleepAfter (needs class swap); docker update --memory after start (racy); Docker-API proxy to inject limits (BUG-359 session's idea, replaced by compare-and-fail); maxRSS fallback (is the bug).\nOther filed: lagrange-framework BUG-113 (talker claim poll loop ~50ms, 2 log writes + whole-log read per poll). Production has no containers/registry images yet (checked 2026-11-05).\nOut of scope here: writing code; bin/build -production:worker images (BUG-352); REQ-646 one-off images.\nEOF\n)\" >/dev/null && echo frame-ok\nfor t in \"2026-11-05: reviewed dev runs after 16:08Z deploy: 13 turns/3 sites in per-job containers, none lost/OOM; peaks 250-904MB recorded but maxRSS misses Chromium (1.7GB in docker stats vs 854MB recorded).\" \"2026-11-05: filed lagrange-framework BUG-113 (claim poll loop) and BUG-359; removed 17 orphan test-rig proxy containers with docker rm -f; gave operator a docker rmi command for ~12GB old images (not run).\" \"2026-11-05: BUG-359 widened to production (end-only stop leaks container+token; registry images accumulate), renamed, severity high; operator chose one ticket.\" \"2026-11-05: reviewed BUG-359 decisions against code: changed backstop to idleness (ROUND_STEP 2h), dev limit to compare-and-fail (wrangler can't set memory), peak fallback to /proc tree; wrote Design decisions section into body.\" \"2026-11-05: BUG-359 session added 'Implementation defaults' (migration 0050 cols, JOB_MEMORY_ENFORCE var, prune warn-only, suite container attribution, local image prune risk). Checked: 0050_estimate_outcomes and 0051_item_live_set_by already on xgd-working (BUG-366 etc.), branch free-BUG-359 stops at 0049 -> must use next free number at merge.\"; do $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in \"$(python3 -c 'import json,sys;print(json.dumps({\"session\":\"epic-24a2ec33\",\"text\":sys.argv[1]}))' \"$t\")\" >/dev/null && echo log-ok; done","description":"Rewrite summary frame and append log entries"}
```

**Result**

```
Exit code 127
(eval):2: command not found: -m
(eval):12: command not found: -m
(eval):12: command not found: -m
(eval):12: command not found: -m
(eval):12: command not found: -m
(eval):12: command not found: -m
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; P=/Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/bin/python3…
<!-- xgd-tool name="Bash" id="toolu_01AbZi2GPsY7iBevbFpuYepv" turn="aa077fa109e34554aa0395f71ee457af" ts="2026-11-05T23:34:12.485609+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; P=/Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/bin/python3\n$P -m lagrangefoundry.ai.agent_cli AgentSummaryFrame --in \"$(python3 -c 'import json,sys;print(json.dumps({\"session\":\"epic-24a2ec33\",\"text\":sys.stdin.read()}))' <<'EOF'\nEPIC-32 (Performance issues) watch session. This EPIC session scopes and files tickets and reviews runs; it does not code (memory: epic-session-does-not-code).\nSettled: agent/batch compute moved to per-job Cloudflare Containers orchestrated by Workflows (REQ-646 landed, dev deploy 2026-11-05 16:08Z ace08312da). Stability first: no new functionality until EPIC-32 tickets land.\nCurrent focus: BUG-359 (bug-18884a92) \"Job containers: stop backstop, image pruning, true memory peak and dev limit\", high, being coded in worktree free-BUG-359 by its own session. Operator chose ONE ticket for prod+dev clean-up.\nBUG-359 decisions (in its body): DO alarm backstop timed from idleness, IDLE_STOP=5 min, in-flight step left to step timeout; end always destroys container+token; registry prune keeps current+previous image; dev does not cap container memory (workerd/wrangler 4.111 can't) - job compares whole-container peak to instance_type limit and fails as oom on dev/UAT; peak = cgroup, fallback summed /proc process-tree RSS, never maxRSS; suites tear down all containers; dev start prunes old local images.\nRejected: separate prod bug (operator wants one ticket); alarm = step timeout+margin (2h billing); Container helper class sleepAfter (needs class swap); docker update --memory after start (racy); Docker-API proxy to inject limits (BUG-359 session's idea, replaced by compare-and-fail); maxRSS fallback (is the bug).\nOther filed: lagrange-framework BUG-113 (talker claim poll loop ~50ms, 2 log writes + whole-log read per poll). Production has no containers/registry images yet (checked 2026-11-05).\nOut of scope here: writing code; bin/build -production:worker images (BUG-352); REQ-646 one-off images.\nEOF\n)\" >/dev/null && echo frame-ok\nfor t in \"2026-11-05: reviewed dev runs after 16:08Z deploy: 13 turns/3 sites in per-job containers, none lost/OOM; peaks 250-904MB recorded but maxRSS misses Chromium (1.7GB in docker stats vs 854MB recorded).\" \"2026-11-05: filed lagrange-framework BUG-113 (claim poll loop) and BUG-359; removed 17 orphan test-rig proxy containers with docker rm -f; gave operator a docker rmi command for ~12GB old images (not run).\" \"2026-11-05: BUG-359 widened to production (end-only stop leaks container+token; registry images accumulate), renamed, severity high; operator chose one ticket.\" \"2026-11-05: reviewed BUG-359 decisions against code: changed backstop to idleness (ROUND_STEP 2h), dev limit to compare-and-fail (wrangler can't set memory), peak fallback to /proc tree; wrote Design decisions section into body.\" \"2026-11-05: BUG-359 session added 'Implementation defaults' (migration 0050 cols, JOB_MEMORY_ENFORCE var, prune warn-only, suite container attribution, local image prune risk). Checked: 0050_estimate_outcomes and 0051_item_live_set_by already on xgd-working (BUG-366 etc.), branch free-BUG-359 stops at 0049 -> must use next free number at merge.\"; do $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in \"$(python3 -c 'import json,sys;print(json.dumps({\"session\":\"epic-24a2ec33\",\"text\":sys.argv[1]}))' \"$t\")\" >/dev/null && echo log-ok; done","description":"Rewrite summary frame and append log entries"}
```

**Result**

```
[15:34:15] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2130.32, 'pid': 84047}
frame-ok
[15:34:20] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2195.71, 'pid': 84486}
log-ok
[15:34:22] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2101.64, 'pid': 84691}
log-ok
[15:34:25] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2153.32, 'pid': 85009}
log-ok
[15:34:28] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2255.85, 'pid': 85138}
log-ok
[15:34:31] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2161.95, 'pid': 85411}
log-ok
```
