---
uid: comment-fdd88bac
id: COMMENT-7890
type: comment
title: Comment on epic EPIC-32
created_by: xgd
created_at: '2026-11-05T23:34:16.867797+00:00'
updated_at: '2026-11-05T23:34:31.985216+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-24a2ec33
  kind: chat_summary
  framing: |-
    EPIC-32 (Performance issues) watch session. This EPIC session scopes and files tickets and reviews runs; it does not code (memory: epic-session-does-not-code).
    Settled: agent/batch compute moved to per-job Cloudflare Containers orchestrated by Workflows (REQ-646 landed, dev deploy 2026-11-05 16:08Z ace08312da). Stability first: no new functionality until EPIC-32 tickets land.
    Current focus: BUG-359 (bug-18884a92) "Job containers: stop backstop, image pruning, true memory peak and dev limit", high, being coded in worktree free-BUG-359 by its own session. Operator chose ONE ticket for prod+dev clean-up.
    BUG-359 decisions (in its body): DO alarm backstop timed from idleness, IDLE_STOP=5 min, in-flight step left to step timeout; end always destroys container+token; registry prune keeps current+previous image; dev does not cap container memory (workerd/wrangler 4.111 can't) - job compares whole-container peak to instance_type limit and fails as oom on dev/UAT; peak = cgroup, fallback summed /proc process-tree RSS, never maxRSS; suites tear down all containers; dev start prunes old local images.
    Rejected: separate prod bug (operator wants one ticket); alarm = step timeout+margin (2h billing); Container helper class sleepAfter (needs class swap); docker update --memory after start (racy); Docker-API proxy to inject limits (BUG-359 session's idea, replaced by compare-and-fail); maxRSS fallback (is the bug).
    Other filed: lagrange-framework BUG-113 (talker claim poll loop ~50ms, 2 log writes + whole-log read per poll). Production has no containers/registry images yet (checked 2026-11-05).
    Out of scope here: writing code; bin/build -production:worker images (BUG-352); REQ-646 one-off images.
---

<!-- xgd-summary-entry -->
2026-11-05: reviewed dev runs after 16:08Z deploy: 13 turns/3 sites in per-job containers, none lost/OOM; peaks 250-904MB recorded but maxRSS misses Chromium (1.7GB in docker stats vs 854MB recorded).


<!-- xgd-summary-entry -->
2026-11-05: filed lagrange-framework BUG-113 (claim poll loop) and BUG-359; removed 17 orphan test-rig proxy containers with docker rm -f; gave operator a docker rmi command for ~12GB old images (not run).


<!-- xgd-summary-entry -->
2026-11-05: BUG-359 widened to production (end-only stop leaks container+token; registry images accumulate), renamed, severity high; operator chose one ticket.


<!-- xgd-summary-entry -->
2026-11-05: reviewed BUG-359 decisions against code: changed backstop to idleness (ROUND_STEP 2h), dev limit to compare-and-fail (wrangler can't set memory), peak fallback to /proc tree; wrote Design decisions section into body.


<!-- xgd-summary-entry -->
2026-11-05: BUG-359 session added 'Implementation defaults' (migration 0050 cols, JOB_MEMORY_ENFORCE var, prune warn-only, suite container attribution, local image prune risk). Checked: 0050_estimate_outcomes and 0051_item_live_set_by already on xgd-working (BUG-366 etc.), branch free-BUG-359 stops at 0049 -> must use next free number at merge.
