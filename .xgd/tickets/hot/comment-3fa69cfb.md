---
uid: comment-3fa69cfb
id: COMMENT-7895
type: comment
title: Comment on bug BUG-359
created_by: xgd
created_at: '2026-11-06T01:07:44.332711+00:00'
updated_at: '2026-11-06T01:40:07.539110+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-18884a92
  kind: chat_summary
  framing: 'Implementing BUG-359 (job container cleanup + memory accounting) by FREE
    CODING in worktree ~/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-359
    (branch free-BUG-359). Ticket status free_coding. 7 fixes / 7 UATs per ticket
    body incl. Implementation defaults section (migration 0050 peak_memory_source+memory_limit_mb;
    JOB_MEMORY_ENFORCE=1 in dev/UAT; registry prune warn-only, keep current+previous;
    suite teardown by name+created-after; local prune keep tags from this start).
    Operator said go on 2026-11-05. REJECTED: docker-API memory proxy and docker update
    --memory (racy/hacky; operator chose in-job limit compare); single long backstop
    deadline (2h billing; operator chose IDLE_STOP=5min idleness); sleepAfter Container
    helper class.'
---

<!-- xgd-summary-entry -->
2026-11-05 ~17:25 PT: code for fixes 1-7 is written but UNCOMMITTED in the worktree (agent-container.ts backstop+always-stop end, container/memory.ts sampler, server.ts wiring, turn-log + migration 0050, wrangler.toml vars, job-container-rig teardown, tools/generate/src/cli/container-images.ts + `1c images prune`, dev.ts devUp/devRefresh local prune, bin/deploy prune step after cloud deploy). Typecheck is clean (tools/generate has 2 pre-existing TS errors in material-import.ts/zip-reader.ts). The worktree node_modules was wired by hand (branch-cut-blocked-by-hookspath recipe); run node_modules/.bin/vitest, never npx/pnpm. Deploy suites: smoke AC1332/AC1333 fail WITHOUT my change too, so pre-existing. Operator re-trigger at 15:31 changed only whitespace in the body. Agent CLI python: ~/.xgd/releases/<current>/bin/python3. NEXT: write the 7 UAT files and run them.


<!-- xgd-summary-entry -->
2026-11-05 ~17:40 PT: 6 of 7 UAT files written and passing (backstop, failed_end, registry prune, dev-start prune, peak_memory_counts_child_processes, dev_step_over_instance_limit_fails_as_oom). Memory UATs run the real memory.ts in a node:22-slim Linux container (ps is blocked in the macOS sandbox; prod is Linux /proc). Fixes found by the UATs: sampler now swallows failed reads (was an unhandled rejection); server waits OOM_EXIT_GRACE_MS=250 after the 507 oom answer before exit 137, else JobContainer sees the exit first and records crash. Remaining: suite_leaves_no_containers UAT, full regression, commit, promote.
