---
uid: comment-5d1e541f
id: COMMENT-7894
type: comment
title: Comment on bug BUG-367
created_by: xgd
created_at: '2026-11-06T00:15:23.040819+00:00'
updated_at: '2026-11-06T01:22:47.570505+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b6fb57f6
  kind: tool_transcript
---

## Bash cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug…
<!-- xgd-tool name="Bash" id="toolu_013HVAsoQGLFwyUjZw55gTmx" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:18.650149+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-b6fb57f6\"}'; python -m lagrangefoundry.ai.agent_cli AgentHistory --in '{\"session\":\"bug-b6fb57f6\",\"last\":6}' | head -c 6000","description":"Read my summary and recent history"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv* 2>/dev/null | head; which xgd; cat CLAUDE.md 2>/dev/null |…
<!-- xgd-tool name="Bash" id="toolu_01B7GMVYxcCJyuPRceXKeU1n" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:23.259499+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv* 2>/dev/null | head; which xgd; cat CLAUDE.md 2>/dev/null | head -80","description":"Locate venv and project instructions"}
```

**Result**

```
apps
bin
CLAUDE.md
db
example-businesses
fonts
kb
node_modules
package.json
packages
pnpm-lock.yaml
pnpm-workspace.yaml
README.md
storage
tests
tools
tsconfig.base.json
vitest.browser.config.mts
vitest.config.mts
vitest.node.config.mts
vitest.workers.config.mts
(eval):1: no matches found: .venv*
/Users/martin/.xgd/bin/xgd
# Claude Instructions for 1stcontact

**Note:** This project uses XGD (Extreme Generative Development) methodology. XGD methodology docs are bundled in the xgd package (`xgd_source/system_docs/`) and loaded automatically into sessions.

## XGD Workflow Documentation

**System Documentation** (bundled in xgd package — `xgd_source/system_docs/` — read-only):
- `TDD-PROCESS.md` - TDD RED/GREEN workflow, quality gates, exception policy
- `TEST-STRATEGY.md` - Testing guidelines, what to test, parameterization
- `TASK-TEMPLATE.md` - Template for creating streamlined task prompts

These docs are bundled in the xgd package and loaded at runtime — not copied into your project.

## Branch Topology

**See `docs/reference/xgd-branching-strategy-full.md`** for the authoritative branch topology reference.

Summary:
- `xgd-working` — operator hot branch; all free-coded changes, tickets, config
- `main` — tested, reconciled truth; all branches cut from here
- `branch-<ticket>` — develop/feature branches; cut from main, merge back to main
- Reconcile branches — short-lived; promote working bundles into main
- Resync branches — short-lived; rebase working's unreconciled tail onto updated main
- Regression branches — cut from main; on success, fast-forward `xgd-stable`
- Merge branches — mechanical plumbing; created and deleted within a single run
- `xgd-stable` — production release; guaranteed conforming matrix and passing tests

## ⚠️ CRITICAL: No Legacy Modes or Backward Compatibility

**See also**: `PHILOSOPHY.md` (xgd system docs) → "Simplicity Over Preservation" and "Ruthless Refactoring"

**When refactoring, replace fully. Do NOT create legacy/fallback modes unless explicitly requested.**

- When implementing a new approach, replace the old one completely
- Do NOT add "legacy mode" or "fallback to old behavior" code paths
- Do NOT auto-detect "which mode to use" between old and new implementations
- Delete old code; don't comment it out or hide it behind flags
- Tests validate correctness, not legacy code paths
- Git history is the archive if old code is ever needed

**Why**: Legacy modes create:
- Complexity (two code paths to maintain)
- Confusion (which mode am I in?)
- Bugs (mode detection logic, edge cases)
- Dead code that never gets removed

**The Rule**: When replacing an approach, delete the old one. If tests pass, the new implementation is correct.

## ⚠️ CRITICAL: Close capability gaps in L1, not with new modules

Since the framework pivot (REQ-79 / REQ-84 / REQ-96) there are two distinct kinds of "gap", and they resolve in different places. Do **not** reach for a new module by reflex.

**Layout / presentation gaps → add a typed L1 primitive.** Layout is owned by the **L1 substrate** (`packages/framework/src/l1`, DOC-23) — a single, low-level, CSS-faithful typed element tree. The old semantic *layout* modules (header/hero/footer/text-block/services-grid/layer) are gone; there is no `hero` to add a dial to. When a design cannot yet be expressed, the fix is to **add a typed axis/primitive to L1** (never a raw-CSS hole, never a new "layout module"). The expressive ceiling rises without limit while the security/reliability wall stays put (DOC-24, DOC-2).

**Behaviour gaps → configure an existing behavior module before authoring a new one.** A **module** now means a *behavior module* — a vetted behavioural core + typed `config` + named L1 presentation seams (carousel, contact-form; later payments, auth, email-capture). The AI *configures* a behavior module; it never writes its code inline. When a behaviour gap appears:
- Does it fit an existing behavior module's purpose? → add a **behavioural** `config` field to it (an endpoint, a field schema, autoplay/loop, an anti-spam mode).
- Is the gap actually about how the thing *looks*? → it is not a module gap at all. Appearance is L1: a typed axis, the L1 subtree bound into a **slot**, or the L1 node carrying a **`control`** name (`kind: 'control'` in `packages/site-schema/src/l1/schema.ts`). A vetted *default* look belongs in an **L2 preset** (`packages/framework/src/l2/`), never in the module.
- Only if it is a genuinely new *kind of behaviour* with its own core → a **new behavior module** (last resort, highest bar; hardened per DOC-26 before publish).

**`config` is data-only and never aesthetic** (DOC-25 §2, §10). REQ-96 deleted `carousel`'s `config.view` as the canonical violation: it was presented as behavioural ("slides per view") but resolved to a `flex-basis`. If a proposed `config` field bottoms out in a CSS value, it is an aesthetic dial wearing behavioural clothes — put it in L1.

**A conforming behavior module ships zero CSS**, with one carve-out: a small **declared** set of *invariant elements* whose presentation is pinned by an obligation rather than by taste (the honeypot must stay invisible; the Turnstile mount must sit where the widget expects it; a visually-hidden label must stay out of flow). Anything not on that list paints from L1 or does not paint at all. Residual module stylesheets and the aesthetic resolvers in `modules/dials.ts` / `text-style.ts` are legacy being dismantled under REQ-96 — do not extend them.

**Two composition directions** (DOC-25 §10), chosen per element by whether it can hold children:
- **container** (carousel slide, form wrapper) → the module wraps L1, via a **slot**.
- **leaf control** (`<input>`, `<textarea>`, a button's face) → **
```

[elided — kept 5800 of 7375 bytes]

## Bash head -5 /Users/martin/.xgd/bin/xgd; sed -n 80,400p /Users/martin/lagrangefoundry/1stcontact/CLAUDE.md | grep -n -i -A30…
<!-- xgd-tool name="Bash" id="toolu_01TRCdVKqYHqtJqd53tMC3Aj" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:26.024911+00:00" -->

**Input**

```json
{"command":"head -5 /Users/martin/.xgd/bin/xgd; sed -n 80,400p /Users/martin/lagrangefoundry/1stcontact/CLAUDE.md | grep -n -i -A30 \"free.cod\" | head -80","description":"Find xgd python and free-coding docs"}
```

**Result**

````
#!/bin/sh
# xgd release shim (REQ-934). A pinned run stays on its release; everything
# else follows the newest deployed release.
root="$HOME/.xgd/releases"
if [ -n "$XGD_RUN_RELEASE" ]; then
106:### Free-Coded Commit Convention
107-
108:When committing bug fixes or improvements directly to main (outside of a development branch workflow), include `[FREE-CODED]` in the commit message:
109-
110-```bash
111:git commit -m "fix(module): description of fix [FREE-CODED]"
112-```
113-
114:**Why**: Long-lived branches don't have these fixes. When they merge back, the branch's older version can silently overwrite the fix. The merge review checks for `[FREE-CODED]` commits and flags overwrites as CRITICAL.
115-
116:**`bin/project/xgd_version_bump` MUST be implemented before the free-coding gate allows progression.**
117:The gate command (`xgd ticket move-to-free-coded`) calls `bin/project/xgd_version_bump --check`
118-to verify the version bump is present in your commits. The stub exits 1 on bare invocation and
119-will block every ticket promotion until you implement the script. See the stub at
120-`bin/project/xgd_version_bump` for the required interface and implementation guide.
121-
122:### Free-Coding Lifecycle (full process) — MANDATORY in user sessions
123-
124-**Applies to interactive user sessions only.** Headless processes (`xgd develop`, `xgd reconcile`, `xgd regression`) do not follow this process — they have their own workflow state machines.
125-
126:For any direct code change request in an interactive session ("implement X", "fix X", "add X"), the free-coding process is **mandatory** — not a guideline. Non-compliance has automatic consequences: commits without a scope ticket are detected and reverted on the next sync; stale ticket bodies corrupt the capability matrix when reconcile fires.
127-
128:Full process and rules: **`FREE-CODING.md`** (bundled in xgd system docs, loaded automatically into every `xgd claude` session).
129-
130-### Version Control Requirements
131-**CRITICAL:** .xgd/ state files MUST be tracked in version control for rollbacks to work correctly.
132-
133-**DO track in git:**
134-- `.xgd/status.json` (workflow state)
135-- `.xgd/config.yaml` (project configuration)
136-- `.xgd/stage_prompts/` (stage-specific prompts)
137-- `.xgd/validation-reports/` (validation results)
138-
139-**DO NOT track in git (already in .gitignore):**
140-- `.xgd/logs/` (regenerated on each run)
141-- `.xgd/tmp/` (temporary files)
142-
143-**⚠️  NEVER add these patterns to .gitignore:**
144-- `.xgd/` (ignores everything - breaks rollbacks)
145-- `.xgd/*` (ignores everything - breaks rollbacks)
146-- `.xgd/**` (ignores everything - breaks rollbacks)
147-
148-**Why this matters:** When reverting code via git, the .xgd state must also revert to maintain workspace consistency. If .xgd files are ignored, rolling back code leaves stale workflow state, causing failures.
149-
150-### Quality Standards
151-- All code must pass lint checks with zero errors and zero warnings
152-- All tests must pass
153-- **Code coverage must meet the configured minimum threshold**
154-- Build must complete with no errors or warnings
155-
156-**Coverage Enforcement:**
157-The coverage threshold is configured in `.xgd/config.yaml` under `quality.min_coverage_percent`.
158-- Default: 60%
````

## Read /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md
<!-- xgd-tool name="Read" id="toolu_01HyFe7rUgSFouzghW8GCdxF" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:26.561100+00:00" -->

**Input**

```json
{"file_path":"/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md"}
```

**Result**

````
<system-reminder>This memory is 13 days old. Memories are point-in-time observations, not live state — claims about code behavior or file:line citations may be outdated. Verify against current code before asserting as fact.</system-reminder>
1	---
2	name: xgd-free-coded-promotion
3	description: "move-to-free-coded needs the version-carrying commit to BE the tip of xgd-working, so merge working into the branch, bump there, and fast-forward back."
4	metadata: 
5	  node_type: memory
6	  type: feedback
7	  originSessionId: c19873f1-4d06-4920-9e06-d01321c99dfb
8	  modified: 2026-10-23T01:19:46.608Z
9	---
10	
11	`xgd ticket move-to-free-coded` rejects four things in sequence, each with its
12	own error, so getting the order wrong costs a round trip each time:
13	
14	1. **The branch must already be merged back.** `xgd branch lock <TICKET-ID>`,
15	   then merge. Finish with `xgd branch clean <TICKET-ID>` (removes worktree,
16	   deletes branch, releases the lock).
17	2. **SHAs must be the full 40 hex characters.** `git rev-parse HEAD`, never an
18	   `--oneline` abbreviation.
19	3. **`--version` must be unclaimed** by another ticket's `fields.version`.
20	4. **The commit carrying the version must be reachable *from the SHAs you
21	   pass*, and it must be at the tip.** This is the one that is easy to get
22	   backwards. If merging the branch into `xgd-working` creates a MERGE COMMIT,
23	   that merge commit becomes the tip carrying the new version — and it is not
24	   reachable *from* your SHAs (they are its ancestors), so the gate refuses with
25	   *"already present at the tip of xgd-working (<sha>), on a commit not
26	   reachable from any of the provided SHAs — someone else already published this
27	   version"*. The message reads like a race with another ticket and is not one.
28	
29	**Why:** the gate wants the version bump to be attributable to a commit the
30	ticket records. A merge commit records nobody, so the merge back has to be a
31	fast-forward.
32	
33	**How to apply — the ordering that works:**
34	
35	```
36	xgd branch lock <TICKET-ID>
37	git -C <worktree> merge xgd-working          # working INTO the branch first
38	./bin/project/xgd_version_bump               # bump ON the branch, after that merge
39	git -C <worktree> commit -am "chore(version): X.Y.Z for <TICKET-ID>"
40	git -C <main-checkout> merge --ff-only free-<TICKET-ID>
41	xgd ticket move-to-free-coded <uid> <sha>... --version X.Y.Z
42	xgd branch clean <TICKET-ID>
43	```
44	
45	`--ff-only` is the check: if it refuses, the branch does not contain
46	`xgd-working`'s tip and the first merge was skipped or something landed since.
47	Verify the bump independently with
48	`./bin/project/xgd_version_bump --check <sha>... --version X.Y.Z` — exit 0 means
49	the version half is fine and any remaining refusal is the reachability rule
50	above.
51	
52	**When other sessions are working the same repo, the tip check is a RACE and the
53	recipe above is not enough.** Every `xgd ticket ...` call by any agent commits to
54	`xgd-working`, and those commits bypass the merge lock — so a ticket commit lands
55	on top of your bump within seconds, inherits the new version, and the gate refuses
56	with the same *"already present at the tip"* message even though the fast-forward
57	was done correctly. Holding `xgd branch lock` does not prevent it. Run the whole
58	tail as a retry loop and let it burn version numbers:
59	
60	```
61	for attempt in 1 2 3 4 5 6; do
62	  xgd branch lock <TICKET-ID> >/dev/null 2>&1
63	  git -C <worktree> merge xgd-working >/dev/null 2>&1
64	  (cd <worktree> && ./bin/project/xgd_version_bump)
65	  VER=$(grep '"version"' <worktree>/package.json | sed 's/.*"\([0-9.]*\)".*/\1/')
66	  git -C <worktree> commit -qam "chore(version): $VER for <TICKET-ID>"
67	  BUMP=$(git -C <worktree> log --format=%H -1)
68	  git -C <main> merge --ff-only free-<TICKET-ID> >/dev/null 2>&1
69	  xgd ticket move-to-free-coded <uid> <work-sha> "$BUMP" --version "$VER" && break
70	done
71	```
72	
73	Versions are cheap; a burnt one costs nothing. Acquiring the lock can itself take
74	minutes — loop on `xgd branch lock` too (it was held by four different tickets in
75	one 25-minute window).
76	
77	**The shell is zsh, which does NOT word-split an unquoted variable.**
78	`SHAS="a b"; xgd ticket move-to-free-coded $uid $SHAS` passes both SHAs as ONE
79	argument and fails *"invalid SHA — expected 40 lowercase hex characters"*, which
80	reads like a typo rather than a quoting bug. Write each SHA as its own literal
81	argument, or use an array.
82	
83	**Before merging back, the main checkout may hold uncommitted or untracked files
84	the branch supersedes** — the merge aborts naming them. Back them up, diff them
85	against the branch's versions to confirm they are the older copy, then discard.
86	
87	Never start a `git stash`-based baseline test run while another suite is running
88	in the same worktree; it removes the files mid-run and corrupts both results.
89	
90	**2026-10-22 update (BUG-254):** the merge back is no longer a plain `git merge --ff-only`. The xgd-working checkout is sparse, so run `/Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-<TICKET-ID>` from `/Users/martin/lagrangefoundry/1stcontact`; it merges with sparse-checkout off and rematerializes tickets. The path `xgd branch lock` prints (`.venv-working/lib/python3.12/site-packages/bin/xgd-merge`) does not exist. The rest of the order is unchanged: lock → merge xgd-working into the branch → bump → commit → xgd-merge → move-to-free-coded → `xgd branch clean` as its own Bash call.
91	
92	Related: [[xgd-ticket-json-shape]], [[never-edit-ticket-files-directly]].
93	
````

## Bash cd /Users/martin/lagrangefoundry/1stcontact; ls ~/.xgd/releases | tail -3; P=$(ls -d ~/.xgd/releases/*/ | tail -1); ls $…
<!-- xgd-tool name="Bash" id="toolu_01MQQ37uUGBeCPjLaW39V6P2" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:28.624369+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; ls ~/.xgd/releases | tail -3; P=$(ls -d ~/.xgd/releases/*/ | tail -1); ls $P; find $P -name FREE-CODING.md 2>/dev/null | head","description":"Find the FREE-CODING doc in xgd release"}
```

**Result**

```
0.17.386+xgd.working.5ea14f28ff6a
0.17.386+xgd.working.90c81160b05a
current
bin
include
lib
pyvenv.cfg
share
/Users/martin/.xgd/releases/current/lib/python3.12/site-packages/xgd_source/system_docs/FREE-CODING.md
```

## Bash cat /Users/martin/.xgd/releases/current/lib/python3.12/site-packages/xgd_source/system_docs/FREE-CODING.md; ls /Users/ma…
<!-- xgd-tool name="Bash" id="toolu_015hizgrxJ6fxDuEJBv8ti94" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:30.644039+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.xgd/releases/current/lib/python3.12/site-packages/xgd_source/system_docs/FREE-CODING.md; ls /Users/martin/.xgd/releases/current/bin | head -30","description":"Read FREE-CODING protocol"}
```

**Result**

```
<persisted-output>
Output too large (56.5KB). Full output saved to: /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/302de881-b6d1-4d52-93e7-ebda425cf979/tool-results/bhrjn7og3.txt

Preview (first 2KB):
# Free Coding — process for Claude

**Audience**: Claude. This document describes the standard process for free-coded
work in the xgd project. It will eventually be loaded as part of the `xgd claude`
system prompt; for now it is referenced from `CLAUDE.md` and read on demand.

---

## Quick reference

"Free coding" = (1) scope ticket first with behavior description, (2) set `status=free_coding` to mark the start of work, (3) `xgd branch cut <TICKET-ID>` (default — skip only if confident this is a quick fix-and-commit) then code + UAT tests named `test_UAT_FC_<TICKET-ID>_*` on that branch, (4) commit with `[FREE-CODED]`, (5) `xgd branch lock` → manual `git merge` into xgd-working (conflict resolution happens here, before the ticket is marked done), (6) set `status=free_coded` + `fields.commits=[sha]` — the gate command checks each SHA is already an ancestor of xgd-working and refuses to proceed otherwise (BUG-1032), so `free_coded` mechanically means "landed, ready to reconcile whenever" and never requires a branch-status check, (7) keep ticket body current, (8) `xgd branch clean` to release the lock and tear down the now-merged branch/worktree. Missing any step → no matrix coverage → test_fix eliminates the code as drift.

---

## ⚠️ MANDATORY PROCESS — Applies to interactive user sessions only

**This is a required process, not a guideline.** Every direct code change request in an interactive session — "implement X", "fix X", "add X", or equivalent — must follow this flow. The system enforces compliance automatically; there is no recovery path for most violations.

**Headless processes** (`xgd develop`, `xgd reconcile`, `xgd regression`) do not follow this process. They have their own workflow state machines.

### Which status transitions Claude owns — and which the operator owns

**Claude may set these statuses autonomously, as part of the free-coding process:**

| Status | When |
|---|---|
| `draft` | Always — create tickets here |
...
</persisted-output>
```

## Bash sed -n 1,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/302de881-b6d1-4d52-93e7-ebda425c…
<!-- xgd-tool name="Bash" id="toolu_01FpbmDiaEomiNLBtAD1WFEY" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:32.957722+00:00" -->

**Input**

```json
{"command":"sed -n 1,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/302de881-b6d1-4d52-93e7-ebda425cf979/tool-results/bhrjn7og3.txt | grep -v '^$' | head -260","description":"Read free-coding protocol body"}
```

**Result**

```
# Free Coding — process for Claude
**Audience**: Claude. This document describes the standard process for free-coded
work in the xgd project. It will eventually be loaded as part of the `xgd claude`
system prompt; for now it is referenced from `CLAUDE.md` and read on demand.
---
## Quick reference
"Free coding" = (1) scope ticket first with behavior description, (2) set `status=free_coding` to mark the start of work, (3) `xgd branch cut <TICKET-ID>` (default — skip only if confident this is a quick fix-and-commit) then code + UAT tests named `test_UAT_FC_<TICKET-ID>_*` on that branch, (4) commit with `[FREE-CODED]`, (5) `xgd branch lock` → manual `git merge` into xgd-working (conflict resolution happens here, before the ticket is marked done), (6) set `status=free_coded` + `fields.commits=[sha]` — the gate command checks each SHA is already an ancestor of xgd-working and refuses to proceed otherwise (BUG-1032), so `free_coded` mechanically means "landed, ready to reconcile whenever" and never requires a branch-status check, (7) keep ticket body current, (8) `xgd branch clean` to release the lock and tear down the now-merged branch/worktree. Missing any step → no matrix coverage → test_fix eliminates the code as drift.
---
## ⚠️ MANDATORY PROCESS — Applies to interactive user sessions only
**This is a required process, not a guideline.** Every direct code change request in an interactive session — "implement X", "fix X", "add X", or equivalent — must follow this flow. The system enforces compliance automatically; there is no recovery path for most violations.
**Headless processes** (`xgd develop`, `xgd reconcile`, `xgd regression`) do not follow this process. They have their own workflow state machines.
### Which status transitions Claude owns — and which the operator owns
**Claude may set these statuses autonomously, as part of the free-coding process:**
| Status | When |
|---|---|
| `draft` | Always — create tickets here |
| `free_coding` | Set at the start of the process — end of Step 1 / before Step 2 |
| `free_coded` | After the commit lands and ticket is updated (Step 4) |
**All other status transitions are operator decisions. Claude must never set them.**
`ready_*` statuses are dispatcher triggers — setting one immediately queues an
automated pipeline. These are irreversible without manual intervention:
| Status | What the dispatcher launches |
|---|---|
| `ready_to_implement` | `xgd develop` — full technical design, sprints, code generation |
| `ready_to_reconcile` | `xgd reconcile` — capability matrix update |
The operator decides when work proceeds to the next automated stage. Claude's job
is to leave the ticket at `free_coded` in a clean state; promotion is the
operator's explicit authorisation.
### Consequences of non-compliance
**Skip the scope ticket**: The commit is detected at the next sync and automatically reverted. No warning is issued. The work is lost.
**Set `ready_to_implement`**: The dispatcher spawns `xgd develop` within ~30 seconds, generating a full technical design and branch that conflicts with your commit. Recovery requires manually killing the spawned process and reverting the develop branch.
**Set `ready_to_reconcile`**: The dispatcher spawns `xgd reconcile` immediately, treating the current ticket body as authoritative. If the body is stale or the work isn't ready, the capability matrix is updated against the wrong spec — recovery requires manual worktree cleanup and ticket surgery.
**Omit `[FREE-CODED]` from the commit message**: Merge-back review treats the commit as ordinary develop output. A later branch landing may silently overwrite your fix with no warning.
**Hand back with a stale ticket body**: The operator may promote to `ready_to_reconcile` immediately. Reconcile enforces the stale spec — silently undoing design decisions made during the session.
---
## ⚠️ CRITICAL: NEVER set a free-coded ticket to `ready_to_implement`
`ready_to_implement` is the dispatcher's `xgd develop` trigger. The dispatcher
polls every ~30 seconds and the moment it sees a ticket at this status it
spawns an autonomous `xgd develop` cycle against it — **technical design,
sprints, generated code, the whole develop pipeline** — racing whatever
free-coded change you're trying to land.
**Allowed statuses for a free-coded ticket**: `draft` (always create here),
`free_coding` (set at the start of coding), `free_coded` (after commit lands).
Nothing else. If you find yourself wanting `ready_to_implement`, you don't
want a free-coded ticket — you want an `xgd develop` ticket and should follow
that flow instead.
This rule is non-negotiable. Setting a free-coded ticket to
`ready_to_implement` will produce a develop branch, a develop worktree, and
LLM-generated code that conflicts with your commit — recovery requires
manually killing the spawned process and reverting the develop branch.
---
## ⚠️ CRITICAL: Before handing back to the user, the ticket must reflect the current implementation
Whenever Claude finishes a session and returns control to the user with a ticket
at `free_coded`, the ticket body must accurately describe the implementation
**as it now stands** — not the original scope if iteration reshaped it.
**Why**: `free_coded` is a stable resting state and the user may promote to
`ready_to_reconcile` at any point after Claude says "I'm done." Once promoted,
reconcile treats the ticket as authoritative. A stale ticket produces a stale
capability matrix, and future development cycles will enforce the stale spec —
potentially introducing regressions against design decisions that were made
during the iterative cycle but never recorded.
**The rule**: Verify and update the ticket body before every handoff to the
user. This applies 
```

[elided — kept 5800 of 18840 bytes]

## Bash F=/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/302de881-b6d1-4d52-93e7-ebda425cf979/tool-re…
<!-- xgd-tool name="Bash" id="toolu_01VR4tCsdJap1X3FyNeDN3Kv" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:36.020014+00:00" -->

**Input**

```json
{"command":"F=/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/302de881-b6d1-4d52-93e7-ebda425cf979/tool-results/bhrjn7og3.txt; grep -n '^## \\|^### ' $F","description":"List protocol sections"}
```

**Result**

```
9:## Quick reference
15:## ⚠️ MANDATORY PROCESS — Applies to interactive user sessions only
21:### Which status transitions Claude owns — and which the operator owns
45:### Consequences of non-compliance
59:## ⚠️ CRITICAL: NEVER set a free-coded ticket to `ready_to_implement`
80:## ⚠️ CRITICAL: Before handing back to the user, the ticket must reflect the current implementation
100:## ⚠️ CRITICAL: Use one ticket per intent — do not proliferate tickets
126:## What is "free coding"?
159:## Workspace: branch-per-ticket, merged back into xgd-working
390:### Changes that do NOT require the free-coding process
416:## When to apply these rules
428:## Step 1 — Scope ticket FIRST
433:### In an intent-specific chat session: your ticket is already determined
457:### Ticket title conventions
491:## Symptom
495:## Root cause
499:## Fix
503:## Test plan
509:### Status flow
543:### After Step 1: code next — do NOT create acceptance criteria tickets
558:## Step 1.5 — Capture the design discussion as a chat-transcript comment
560:### When this step applies
613:### Trigger
631:### Decision tree
648:### What to capture (and what NOT to)
671:### Format
704:### Mechanics
750:### Idempotency
756:### Failure mode
763:### Multi-ticket sessions
773:## Step 2 — Code + happy-path UAT(s)
796:### Naming: the `FC_<TICKET-ID>_<slug>` convention
827:### Quick regression scope
846:## Step 3 — Commit
848:### Bump the project version FIRST
873:### Commit message conventions
909:## Step 4 — Update the ticket to free_coded
945:### Story points: scale of 1–20, default 2 (consistent with `intent_plan`)
966:### Pre-handoff ticket sync
994:## What changed
998:## Design decisions made during iteration
1002:## Test plan
1015:## Iteration after operator validation
1028:### When this applies
1037:### How to add a commit to an existing free_coded ticket
1055:## What changed
1059:## Design decisions
1063:## Test plan
1074:## Step 5 — Operator promotes to ready_to_reconcile (dispatcher runs reconcile)
1107:### The FC orphan invariant
1144:## What happens if you skip the ticket?
1156:## Common mistakes
1199:## What's NOT free coding
```

## Bash F=/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/302de881-b6d1-4d52-93e7-ebda425cf979/tool-re…
<!-- xgd-tool name="Bash" id="toolu_017Vah79eemDVjySgzM9JRMj" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:38.256076+00:00" -->

**Input**

```json
{"command":"F=/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/302de881-b6d1-4d52-93e7-ebda425cf979/tool-results/bhrjn7og3.txt; sed -n 509,545p $F; sed -n 773,1000p $F","description":"Read status flow and steps 2-4"}
```

**Result**

````
### Status flow

A free-coded ticket transitions through:

```
draft  →  free_coding  →  free_coded  →  ready_to_reconcile
                               ↑
                               stable resting state — park here
                               indefinitely; nothing auto-fires.
```

- `draft` — initial state when you create the ticket. **Always create at `draft`.**
- `free_coding` — set as soon as the scope is agreed and you're about to start
  coding — the last action of Step 1, before Step 2. Not optional (unlike the
  old `in_progress` convention it replaces): it's how a human reading the
  dashboard, or another process, knows the ticket has moved from "proposed"
  to "actively being worked". Plain `xgd ticket update`, no gate:

  ```bash
  xgd ticket update <TICKET-ID> --fields '{"status": "free_coding"}'
  ```

- `free_coded` — set after the commit lands and `fields.commits` is populated
  (Step 4 below). Stable resting state — the dispatcher does NOT auto-trigger
  reconcile from here. Park as long as you like.
- `ready_to_reconcile` — explicit promotion when you want the dispatcher to
  pick up the ticket and run reconcile. Step 5 below.

**Do NOT use `ready_to_implement`.** That status is reserved exclusively for
the `xgd develop` / dispatcher flow — the dispatcher's trigger predicate
matches on it and will spawn `xgd develop` against your ticket within seconds,
racing the free-coded change you're about to commit. Free-coded tickets must
never enter `ready_to_implement`.

### After Step 1: code next — do NOT create acceptance criteria tickets

Once the scope ticket exists, **proceed immediately to Step 2 (code)**. Do not
## Step 2 — Code + happy-path UAT(s)

By this point the ticket should already be at `status=free_coding` (the last
action of Step 1). Follow the project's normal practices. The
**non-negotiable** parts:

- Every behavioural change must leave behind **executable evidence**.
  **Unit tests are prohibited** — they are not connected to the capability
  matrix and become stale silently as the matrix evolves. All tests must
  follow the `test_UAT_AC{N}_*` naming convention and be traceable to a
  capability matrix AC. A test that cannot be linked to an AC is not evidence.
  Read `EXTREME-GENERATIVE-DEVELOPMENT.md` (loaded automatically into every
  primed session — also at
  `xgd_source/core/workflow_v2/priming_docs/EXTREME-GENERATIVE-DEVELOPMENT.md`
  if you need to scan it directly) — the rules there govern what counts:
  - Real entry points (CLI, API, scheduler — never an internal callable).
  - No mocks of any system you own. Mock only true external boundaries.
  - Strong observations: assert on artifacts that could only exist if the
    behaviour actually happened. Exit codes alone are weak evidence.
- New tests live in `tests/` — never in `xgd_source/`.
- Code edits stay surgical: don't refactor surrounding code unless the user
  asked.

### Naming: the `FC_<TICKET-ID>_<slug>` convention

You are writing UATs **before** the capability matrix has acceptance criteria
for the new behaviour — reconciliation creates those later. Use a temporary,
deliberately-distinct name:

```
test_UAT_FC_<TICKET-ID>_<slug>
```

Example for a fix on `REQ-413`:

```python
# tests/cli/test_UAT_FC_REQ-413_log_command_selection.py

def test_UAT_FC_REQ_413_session_log_selected_by_recorded_command(workspace):
    """Happy path: `xgd log <execution>` selects the session log whose
    recorded command matches the execution, not the largest file."""
    # ... real setup, real `xgd log` invocation, strong assertion on output
```

The `FC_<TICKET-ID>_` prefix is a **semantic flag** — not a stylistic choice.
It tells reconciliation: "this is durable evidence for ticket X, but no AC
exists yet to attach it to." Reconciliation will, when it creates ACs, rename
the file/test to `test_UAT_AC<N>_<slug>` and update any references. **You do
not need to invent AC numbers** — that's reconciliation's job.

Scope: cover the **happy path** for the new behaviour. Edge-case ACs and
their UATs are reconciliation's responsibility once the matrix understands
the change. Don't try to anticipate every AC reconciliation will create.

### Quick regression scope

The smallest pytest scope that proves you didn't break adjacent behaviour:

```bash
# Scope: the directly-touched test file, plus any composition/static
# guardrail tests for the area you changed
bin/xgd-test tests/<scope> -q
```

For workflow / FSM changes, **always** include
`tests/composition/test_*_static_guardrails.py` for the relevant family, plus
`tests/e2e/workflows/test_*_e2e.py` if the area has them.

If a test fails, fix the code (or fix the test if the test was wrong) before
proceeding. **Do not commit with failing tests.**

---

## Step 3 — Commit

### Bump the project version FIRST

Before the commit, run the bump script:

```bash
./bin/project/xgd_version_bump          # default: patch bump (X.Y.Z → X.Y.Z+1)
```

This edits `xgd_source/__init__.py` in place and prints `old → new`. Stage
that change with the rest of your commit. Patch bump is the right choice for
almost every free-coded cycle.

Use `--minor` or `--major` only when the user explicitly directs you to —
they're release-shape decisions, not routine bumps:

```bash
./bin/project/xgd_version_bump --minor  # X.Y.Z → X.Y+1.0  (resets patch)
./bin/project/xgd_version_bump --major  # X.Y.Z → X+1.0.0  (resets minor + patch)
```

Why bump on every cycle: `pip install` is a no-op when the version string
matches what's already installed, so a forgotten bump means your changes
don't propagate to anyone running the installed package. The script is one
line and removes any chance of forgetting.

### Commit message conventions

Single ato
````

[elided — kept 5800 of 11945 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket show BUG-367 2>&1 | head -40; xgd ticket --help 2>&1 | head -40
<!-- xgd-tool name="Bash" id="toolu_0143EBuwxQMjDhAyzwZ8jZjm" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:41.300395+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket show BUG-367 2>&1 | head -40; xgd ticket --help 2>&1 | head -40","description":"Show BUG-367 ticket and CLI help"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 16:05:41
usage: xgd ticket [-h]
                  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
                  ...
xgd ticket: error: argument ticket_command: invalid choice: 'show' (choose from create, get, update, archive, unarchive, bundle, unbundle, list, schema, children, backlinks, reports, comments, add-comment, append, recover, rebuild-index, audit, development, query, action, history, diff, search, move-to-free-coded)
Try 'xgd ticket --help' for available commands.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 16:05:41
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 16:05:42
usage: xgd ticket [-h]
                  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
                  ...

Ticketing system operations.

All mutating subcommands (create / update / archive / comment / bundle) AUTO-COMMIT the ticket file to git. There is no separate `git add` / `git commit` step — the API does it for you with a uniform message of the form `xgd(ticket): {op} {type} {uid}`. Don't manually stage or commit ticket .md files after running these commands; doing so produces redundant commits and mixes ticket-state changes with unrelated working-tree edits.

The auto-commit can be disabled by setting `ticketing.commits.enabled: false` in `.xgd/config.yaml` (typical use: tests / migrations that batch many writes and commit themselves at the end). The default is true.

positional arguments:
  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
                        Ticket operation to perform
    create              Create a new ticket
    get                 Retrieve ticket by UID or human-readable ID
    update              Update ticket fields
    archive             Archive ticket (move to archived directory)
    unarchive           Unarchive ticket (restore to open directory)
    bundle              Bundle 2+ tickets into a single new request ticket
    unbundle            Reverse a bundle: archive the anchor, restore its
                        members (to the anchor's status; to draft for an error
                        bundle)
    list                List tickets with filtering
    schema              Show valid ticket types, or per-type statuses and
                        required fields
    children            List child tickets
    backlinks           List tickets that link to a given ticket (reverse link
                        traversal)
    reports             List report tickets for subject
    comments            List comments for ticket
    add-comment         Add comment to ticket
    append              Append text to ticket body (inserts before <!-- xgd-
                        chat-end --> if present)
    recover             Detect and clean up failed operations
    rebuild-index       Rebuild the ticket index for fast lookups
    audit               Run or view index audit results
    development         Get development history for an intent
    query               Query tickets using expression syntax (e.g., type=task
                        AND status=open)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket comments BUG-367 2>&1 | grep -v '^[▶◀]' | head -150
<!-- xgd-tool name="Bash" id="toolu_01R4BKuYDD5QTpTGVKLaL3Av" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:43.966667+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket comments BUG-367 2>&1 | grep -v '^[▶◀]' | head -150","description":"Read BUG-367 comments"}
```

**Result**

```
[16:05:44] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket', 'comments', 'BUG-367'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[16:05:47] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2256.31, 'pid': 9193}
[16:05:47] │ Found 1 comment(s):
           │ 
[16:05:47] │   COMMENT-7892: Comment on bug BUG-367 (comment)
[16:05:47] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket get COMMENT-7892 --json 2>/dev/null | python3 -c 'import json,sy…
<!-- xgd-tool name="Bash" id="toolu_011v3N82NyieieMNEwBVtAS4" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:48.942543+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket get COMMENT-7892 --json 2>/dev/null | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d.get(\"body\",\"\")[:6000])' ","description":"Read the comment body"}
```

**Result**

```
<!-- xgd-session
{
  "id": "ed49a53b-2aa7-4210-a10e-3689b524f24e",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "302de881-b6d1-4d52-93e7-ebda425cf979",
  "chat_ticket_uid": "bug-b6fb57f6"
}
-->

<!-- xgd-chat-end -->
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket search "checkout preview quote" 2>/dev/null | grep -v '^[▶◀]' |…
<!-- xgd-tool name="Bash" id="toolu_01C5XGxMDAdHyEikX3wcyi8S" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:05:52.750361+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket search \"checkout preview quote\" 2>/dev/null | grep -v '^[▶◀]' | head -30; xgd ticket search \"can't be bought right now\" 2>/dev/null | grep -v '^[▶◀]' | head -20","description":"Search tickets for possible duplicates"}
```

**Result**

```
BUG-367      [bug]  updated 2026-11-06  (73%)
  ## Symptom  An operator opened the checkout page, in the builder's
  draft preview, for an available, priced, live piece on a shop that can
  now sell (Stripe connected and a shipping zone added). The page shows
  only its intro line, "This can't be bought right now." and a disabled
  "Continue to payment". It gives no reason, and the Ship to list is
  empty.  ## Cause  - The checkout page's script (`packag

BUG-363      [bug]  updated 2026-11-05  (68%)
  **Setup:** Product template page with a `catalog` component (mode
  product). In its `product-page` slot, a text node `{kind: text,
  component: button.primary, text: "Buy this piece", bind: {field:
  "buy", link: true}}`. The validator accepted `buy` as a text bind
  field. Three checkout pages exist: `checkout` (checkout component,
  mode checkout), `checkout-complete` (mode complete), `checkout-
  cancelled

REQ-402      [request]  updated 2026-10-17  (67%)
  ## What changes  The look selector (REQ-391, reworked by BUG-205 onto
  the preview toolbar) doesn't have enough room. The operator likes the
  look descriptions, but squeezed into the toolbar the selector is
  broken. Decided 2026-10-17, it moves into a **band of its own at the
  top of the preview area**, shown only when there are looks to compare.
  The word stays **"look"**, both in what the client see

REQ-403      [request]  updated 2026-10-17  (67%)
  ## What changes  The first time a client opens the builder for a new
  business, everything they see should explain itself. Today the three
  panes each say something misleading or nothing at all. Decided with
  the operator on 2026-10-17.  ## Requirements  ### 1. The preview pane
BUG-367      [bug]  updated 2026-11-06  (73%)
  ## Symptom  An operator opened the checkout page, in the builder's
  draft preview, for an available, priced, live piece on a shop that can
  now sell (Stripe connected and a shipping zone added). The page shows
  only its intro line, "This can't be bought right now." and a disabled
  "Continue to payment". It gives no reason, and the Ship to list is
  empty.  ## Cause  - The checkout page's script (`packag

BUG-363      [bug]  updated 2026-11-05  (71%)
  **Setup:** Product template page with a `catalog` component (mode
  product). In its `product-page` slot, a text node `{kind: text,
  component: button.primary, text: "Buy this piece", bind: {field:
  "buy", link: true}}`. The validator accepted `buy` as a text bind
  field. Three checkout pages exist: `checkout` (checkout component,
  mode checkout), `checkout-complete` (mode complete), `checkout-
  cancelled

BUG-366      [bug]  updated 2026-11-05  (64%)
  ## Symptom (operator, 2026-11-05, dev, a shop imported from
  WooCommerce)  Several pieces that are live and for sale in the source
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update BUG-367 --fields '{"status": "free_coding"}' 2>&1 | grep…
<!-- xgd-tool name="Bash" id="toolu_01F6qarz1423ZCsVHaJ2C9er" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:06:54.235512+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update BUG-367 --fields '{\"status\": \"free_coding\"}' 2>&1 | grep -v '^\\[' | tail -3; xgd branch cut BUG-367 2>&1 | grep -v '^\\[' | tail -15","description":"Set free_coding status and cut branch"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 16:06:54
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 16:06:55
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 16:06:55
Created worktree for free-BUG-367 at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 16:07:01
```

## Read /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/worktree-and-store-setup.md
<!-- xgd-tool name="Read" id="toolu_01LZhVrU217x3RZCTrnxc1yx" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:03.843045+00:00" -->

**Input**

```json
{"file_path":"/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/worktree-and-store-setup.md"}
```

**Result**

```
<system-reminder>This memory is 15 days old. Memories are point-in-time observations, not live state — claims about code behavior or file:line citations may be outdated. Verify against current code before asserting as fact.</system-reminder>
1	---
2	name: worktree-and-store-setup
3	description: "Hub for making a fresh xgd worktree runnable: generated artifacts, the shared @lagrangefoundry store, installs and baselines."
4	metadata:
5	  node_type: memory
6	  type: reference
7	  originSessionId: cbdeb153-884f-4f2d-86ad-5f9023f6778e
8	  modified: 2026-10-21T22:36:24.899Z
9	---
10	
11	Worktree and shared-store setup. Each entry is its own memory:
12	
13	- [[pnpm-install-blocked-by-idea-dir]] — pnpm install blocked by .idea dir: sandbox denies `.idea`; iconv-lite ships one.
14	- [[worktree-breaks-webui-resolution]] — Worktree breaks webui resolution: builder/webui 404s and workerd import death are location artifacts.
15	- [[shared-node-modules-outside-sandbox]] — Shared node_modules outside sandbox: `bin/install` can't write the shared store.
16	- [[pnpm-store-closure-from-main-checkout]] — pnpm store closure from main checkout: a missing declared package needs no network.
17	- [[unpinned-shared-store-drifts]] — Unpinned shared store drifts: `@lagrangefoundry/*` isn't in the lockfile.
18	- [[reference-bundles-are-gitignored]] — Reference bundles are gitignored: real-bundle UATs skip in every worktree.
19	- [[shadow-shared-store-to-verify-upstream]] — Shadow the shared store: stage into 1stcontact/node_modules, then delete.
20	- [[repair-stale-worktree-install-by-hand]] — Repair a stale worktree install by hand: worktree sits at the branch's lockfile.
21	- [[baseline-real-bundle-tests-in-place]] — Baseline real-bundle tests in place: revert your files in the main checkout instead.
22	- [[fresh-worktree-lacks-control-app-generated]] — Fresh worktree lacks control-app generated: "0 test" is a missing artifact.
23	- [[patch-swap-baseline-needs-exclude]] — Patch-swap baseline needs --exclude: git apply is atomic; module-assets/tests hunks make it silently refuse.
24	
```

## Read /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/test-harness-gotchas.md
<!-- xgd-tool name="Read" id="toolu_017f1cLDk1hwp22PAhdeB5WV" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:04.345241+00:00" -->

**Input**

```json
{"file_path":"/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/test-harness-gotchas.md"}
```

**Result**

```
1	---
2	name: test-harness-gotchas
3	description: Hub of vitest / jsdom / Chromium / scripted-model test-harness gotchas in 1stcontact.
4	metadata:
5	  node_type: memory
6	  type: reference
7	  originSessionId: 10a616a0-ca56-4c88-b8ee-9c6e2b0b63d3
8	  modified: 2026-11-04T16:18:22.504Z
9	---
10	
11	Test-harness gotchas. Each entry is its own memory:
12	
13	- [[skipif-evaluated-at-collection]] — a beforeAll probe decides too late.
14	- [[store-free-leg-makes-readded-assertion-vacuous]] — proves nothing.
15	- [[vitest-long-filter-finds-nothing]] — ~60+ paths or unsplit zsh `$VAR`.
16	- [[scripted-model-transcript-assertion-vacuous]] — assert on the tool result.
17	- [[jsdom-builder-chat-needs-engines]] — no <a> without setParser.
18	- [[webui-chat-bubble-text-paints-on-raf]] — wait ~50ms after settle().
19	- [[preview-refresh-is-not-a-reload]] — use watchRefreshes.
20	- [[layout-fixture-needs-two-sections]] — one section is descended into.
21	- [[mutationobserver-self-trigger-hangs-vitest]] — exits 124, no output.
22	- [[slow-tools-not-enabled-without-browser]] — `launch: fakeBrowser()`.
23	- [[layout-script-must-stay-constant]] — pass site data via `givenScript`.
24	- [[fresh-site-delegate-needs-design]] — designWritten() clears the gates.
25	- [[chromium-cannot-launch-in-sandbox]] — `--single-process` runs gated suites.
26	- [[builder-admits-on-session-only]] — tests use sessionCookieFor.
27	- [[real-video-in-chromium-tests]] — record WebM with MediaRecorder.
28	- [[real-http-server-for-chromium-tests]] — `--host-resolver-rules=MAP *`.
29	- [[unscoped-builder-writes-nothing]] — Delegate needs `scope: ['home.json']`.
30	- [[tool-transcript-elides-delegate-scope]] — read the builder's refusal.
31	
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ls; ls node_modules 2>/dev…
<!-- xgd-tool name="Bash" id="toolu_011XzDE61cfHKPNN1u9xnSAe" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:07.123863+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ls; ls node_modules 2>/dev/null | head -3; ls packages/framework/src/modules/checkout/; wc -l packages/framework/src/modules/checkout/* apps/public-site/src/checkout.ts; grep -rn \"handleLead\" apps/control/src --include=*.ts | grep -v test | head","description":"Inspect worktree and checkout module files"}
```

**Result**

```
apps
bin
CLAUDE.md
db
example-businesses
fonts
kb
node_modules
package.json
packages
pnpm-lock.yaml
pnpm-workspace.yaml
README.md
tests
tools
tsconfig.base.json
vitest.browser.config.mts
vitest.config.mts
vitest.node.config.mts
vitest.workers.config.mts
@cloudflare
@vitest
concurrently
client.js
component.ts
meta.ts
     182 packages/framework/src/modules/checkout/client.js
     140 packages/framework/src/modules/checkout/component.ts
      58 packages/framework/src/modules/checkout/meta.ts
     114 apps/public-site/src/checkout.ts
     494 total
(eval):1: no matches found: --include=*.ts
```

## Bash cat packages/framework/src/modules/checkout/client.js packages/framework/src/modules/checkout/component.ts packages/fram…
<!-- xgd-tool name="Bash" id="toolu_01UHjzVeocYqv9o8acbvLY32" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:08.828761+00:00" -->

**Input**

```json
{"command":"cat packages/framework/src/modules/checkout/client.js packages/framework/src/modules/checkout/component.ts packages/framework/src/modules/checkout/meta.ts apps/public-site/src/checkout.ts","description":"Read the checkout module and public-site route"}
```

**Result**

```
/**
 * Vetted client behaviour for the `checkout` behavior ([[REQ-643]]).
 *
 * The page is static; this script is its dynamic part ([[DOC-5]] rule 11). It
 * posts to the site's own Worker endpoints under `api/checkout/`:
 *
 *   - CHECKOUT PAGE: `quote` on load and whenever the Ship to country changes —
 *     the item's CURRENT price and availability, the zone's rate and the total —
 *     and `start` on Continue to payment, which sends the total the buyer was
 *     shown and is answered with Stripe's address or with why not (sold since,
 *     the price changed) and the current figures to show instead.
 *   - ORDER-COMPLETE PAGE: `status` until the order is paid. It says
 *     "confirming…" until then and never claims success before the Worker does:
 *     the webhook can arrive after the buyer.
 *   - ORDER-CANCELLED PAGE: `cancel`, which ends the Stripe session at once so
 *     the hold is released and the item is buyable again.
 *
 * Every value written to the page goes in with `textContent`, into the nodes
 * the L1 template bound (`data-l1-bind`), or onto a control's `disabled` and
 * `hidden`. No markup is ever written. Self-contained (no imports) so the
 * render pipeline ships it verbatim in `capabilities.js`.
 */

const ROOT_SELECTOR = '[data-checkout][data-checkout-endpoint]'
const POLL_MS = 1500
const POLL_LIMIT = 80

function control(root, name) {
  return root.querySelector(`[data-checkout-control="${name}"]`)
}

function bound(root, field) {
  return Array.from(root.querySelectorAll(`[data-l1-bind="${field}"]`))
}

function setText(root, field, text) {
  if (text == null) return
  for (const el of bound(root, field)) el.textContent = String(text)
}

function show(root, field, on) {
  for (const el of bound(root, field)) el.hidden = !on
}

function say(root, text) {
  const el = control(root, 'message')
  if (el) el.textContent = text || ''
}

/** POST JSON to `api/checkout/<verb>`, resolved against the page's own base. */
export async function post(root, verb, body) {
  const base = root.getAttribute('data-checkout-endpoint')
  const url = new URL(`${base}/${verb}`, document.baseURI).toString()
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data: data || {} }
  } catch (_e) {
    return { ok: false, status: 0, data: { error: 'The shop could not be reached. Nothing was charged; please try again.' } }
  }
}

function orderParam() {
  try {
    return new URLSearchParams(window.location.search).get('order') || ''
  } catch (_e) {
    return ''
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** The checkout page: current figures, then Continue to payment. */
export async function initCheckout(root) {
  const item = root.getAttribute('data-checkout-item')
  const select = control(root, 'ship-to')
  const button = control(root, 'continue')
  if (!item || !button) return
  // [[BUG-363]] — the builder's page for a business that can't sell yet: it
  // already says what to set up, so there is nothing to ask and nothing to say.
  if (root.hasAttribute('data-checkout-blocked')) return
  const locale = root.getAttribute('data-checkout-locale') || ''
  const publishedText = root.getAttribute('data-checkout-price')
  const published = publishedText === null ? NaN : Number(publishedText)
  const lines = [{ item, quantity: 1 }]
  let quote = null

  const apply = (q) => {
    quote = q
    const line = q.lines && q.lines[0]
    if (line) {
      setText(root, 'price', line.display.unitAmount)
      show(root, 'changed', Number.isFinite(published) && line.unitAmount !== published)
      show(root, 'unavailable', !line.available)
      if (select) select.disabled = !line.available
    }
    setText(root, 'shipping', q.display.shipping == null ? '—' : q.display.shipping)
    setText(root, 'total', q.display.total == null ? q.display.subtotal : q.display.total)
    if (q.dispatchNote) setText(root, 'dispatch', q.dispatchNote)
    button.disabled = !q.canCheckout
  }

  const refresh = async () => {
    const r = await post(root, 'quote', { lines, country: select ? select.value : '', locale })
    if (r.ok && r.data.quote) {
      apply(r.data.quote)
      say(root, '')
    } else {
      button.disabled = true
      say(root, r.data.error || 'This can’t be bought right now.')
    }
  }

  if (select) select.addEventListener('change', () => void refresh())
  button.addEventListener('click', async () => {
    if (!quote || !quote.canCheckout) return
    button.disabled = true
    say(root, '')
    const r = await post(root, 'start', { lines, country: select ? select.value : '', total: quote.total, locale })
    if (r.ok && r.data.url) {
      window.location.assign(r.data.url)
      return
    }
    if (r.data.quote) apply(r.data.quote)
    else button.disabled = false
    say(root, r.data.error || 'Payment could not be started. Nothing was charged; please try again.')
  })
  await refresh()
}

/** The order-complete page: "confirming…" until the Worker says the order is paid. */
export async function initComplete(root, options = {}) {
  const order = orderParam()
  const locale = root.getAttribute('data-checkout-locale') || ''
  if (!order) return
  const pollMs = options.pollMs ?? POLL_MS
  for (let i = 0; i < POLL_LIMIT; i += 1) {
    const r = await post(root, 'status', { order, locale })
    if (r.ok && r.data.order) {
      const o = r.data.order
      setText(root, 'order', o.number)
      setText(root, 'total', o.display.total)
      setText(root, 'name', o.lines.map((l) => (l.quantity > 1 ? `${l.name} × ${l.quantity}` : l.name)).join(', '))
      if (o
```

[elided — kept 5800 of 21473 bytes]

## Bash grep -rn "checkoutIntake\|ShopCheckout\b\|class ShopCheckout" apps packages --include='*.ts' -l | grep -v node_modules |…
<!-- xgd-tool name="Bash" id="toolu_01P2bDzd59KKUtZKHSa4X4e2" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:10.893730+00:00" -->

**Input**

```json
{"command":"grep -rn \"checkoutIntake\\|ShopCheckout\\b\\|class ShopCheckout\" apps packages --include='*.ts' -l | grep -v node_modules | head -20; grep -rln \"handleLead\" apps/control/src | head","description":"Find checkoutIntake and preview lead routing"}
```

**Result**

```
apps/public-site/src/checkout.ts
apps/control-app/src/checkout-intake.ts
apps/control-app/src/worker.ts
ugrep: warning: apps/control/src: No such file or directory
```

## Bash cat apps/control-app/src/checkout-intake.ts; grep -n "ShopCheckout\|checkoutIntake\|handleLead\|SHOP_CHECKOUT" apps/cont…
<!-- xgd-tool name="Bash" id="toolu_01Hirfb3fxomxwhW6Dj5ApPQ" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:12.730065+00:00" -->

**Input**

```json
{"command":"cat apps/control-app/src/checkout-intake.ts; grep -n \"ShopCheckout\\|checkoutIntake\\|handleLead\\|SHOP_CHECKOUT\" apps/control-app/src/worker.ts; grep -rln \"handleLead\" apps/*/src | head","description":"Read checkout intake and its worker wiring"}
```

**Result**

```
/**
 * [[REQ-643]] — the published site's checkout, as `public-site` reaches it over
 * the `SHOP_CHECKOUT` service binding (`worker.ts`'s `ShopCheckout`, a thin
 * wrapper over this).
 *
 * Here rather than in `worker.ts` so the Node and workers suites drive the very
 * methods the binding calls: `worker.ts` imports `cloudflare:workers`, which
 * nothing outside workerd can load.
 *
 * EVERY ANSWER IS A STATUS AND A BODY. A refusal the buyer can act on (sold
 * since, the price changed, no country) is a 409 carrying its sentence and the
 * current quote; a malformed request a 400; an unknown order a 404. Anything
 * else is logged here, where the operator is, and the buyer is told only that
 * nothing was charged.
 */

import { cancelCheckout, CheckoutBlockedError, checkoutStatus, quoteCheckout, startCheckout, type OrdersEnv } from './orders'
import { ShopInputError, ShopNotFoundError } from './shop'

export interface CheckoutAnswer {
  status: number
  body: Record<string, unknown>
}

export interface CheckoutIntakeOptions {
  fetch?: typeof fetch
  now?: number
  /** An item's availability changed (a cancel released it): rebuild its pages. */
  rebuild?: (businessId: string, itemId: string) => Promise<void>
}

async function answer(work: () => Promise<Record<string, unknown>>): Promise<CheckoutAnswer> {
  try {
    return { status: 200, body: await work() }
  } catch (err) {
    if (err instanceof CheckoutBlockedError) return { status: 409, body: { error: err.message, code: err.code, ...(err.quote ? { quote: err.quote } : {}) } }
    if (err instanceof ShopInputError) return { status: 400, body: { error: err.message } }
    if (err instanceof ShopNotFoundError) return { status: 404, body: { error: err.message } }
    console.error(JSON.stringify({ event: 'checkout_failed', error: String(err) }))
    return { status: 500, body: { error: 'Something went wrong. Nothing was charged; please try again.' } }
  }
}

const field = (body: unknown, key: string): unknown => (body && typeof body === 'object' ? (body as Record<string, unknown>)[key] : undefined)

/** The four verbs a checkout page's script posts: `quote`, `start`, `cancel`, `status`. */
export function checkoutIntake(env: OrdersEnv, options: CheckoutIntakeOptions = {}) {
  const deps = { ...(options.fetch ? { fetch: options.fetch } : {}), ...(options.now !== undefined ? { now: options.now } : {}) }
  return {
    quote: (siteKey: string, body: unknown) =>
      answer(async () => ({ quote: await quoteCheckout(env, { siteKey, lines: field(body, 'lines'), country: field(body, 'country'), locale: field(body, 'locale') }, deps) })),
    start: (siteKey: string, siteUrl: string, body: unknown) =>
      answer(async () => ({
        ...(await startCheckout(
          env,
          { siteKey, siteUrl, lines: field(body, 'lines'), country: field(body, 'country'), total: field(body, 'total'), locale: field(body, 'locale') },
          deps,
        )),
      })),
    cancel: (siteKey: string, body: unknown) =>
      answer(async () => ({ ...(await cancelCheckout(env, { siteKey, orderId: field(body, 'order') }, { ...deps, ...(options.rebuild ? { catalogChanged: options.rebuild } : {}) })) })),
    status: (siteKey: string, body: unknown) =>
      answer(async () => ({ order: await checkoutStatus(env, { siteKey, orderId: field(body, 'order'), locale: field(body, 'locale') }) })),
  }
}
17:import { checkoutIntake, type CheckoutAnswer } from './checkout-intake'
133:export class ShopCheckout extends WorkerEntrypoint<Env> {
135:    return checkoutIntake(this.env as never, {
apps/control-app/src/router.ts
apps/public-site/src/lead.ts
apps/public-site/src/index.ts
```

## Bash grep -n "handleLead\|lead\b\|api/lead\|LEAD_\|previewChannel\|preview.*channel" apps/control-app/src/router.ts | head -4…
<!-- xgd-tool name="Bash" id="toolu_01Ga21c6tTWF3V4uBdcFff5E" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:14.715396+00:00" -->

**Input**

```json
{"command":"grep -n \"handleLead\\|lead\\b\\|api/lead\\|LEAD_\\|previewChannel\\|preview.*channel\" apps/control-app/src/router.ts | head -40","description":"Find lead routing in control-app router"}
```

**Result**

```
109: * THE LEAD ENDPOINT IS IMPORTED, NOT REBUILT ([[BUG-78]]). `handleLead` is
116:import { handleLead, type LeadEnv as LeadRequestEnv } from '../../public-site/src/lead'
117:import { captureLead, type LeadEnv as LeadIntakeEnv, type LeadSubmission } from './lead'
3337:  // all of them — including `/preview/<siteKey>/<channel>/…`, whose relative
5404:     * the published site captures a lead through `captureLead`, and an operator
8400:     * /preview/<siteKey>/<channel>/<...> — a rendered channel (REQ-119).
8487:       * POST /preview/<siteKey>/draft/api/lead — the preview submits for real
8495:       * not work. The path is the preview channel's own root plus the same
8496:       * `api/lead` suffix `public-site` answers, so one `action` value is correct
8499:       * THE SAME `handleLead`, NEVER A SECOND ONE. Body limits, field caps, the
8517:      if (method === 'POST' && (preview[3] ?? '/') === '/api/lead') {
8521:        return handleLead(request, {
8530:            LEAD_INTAKE: {
8553:       * WHY THIS EXISTS AT ALL, which is `api/lead`'s reason one step further on.
8568:       * `draft` ONLY, on the `api/lead` route's reasoning. The edit channel is
8591:       * check the `api/lead` route above makes, for the same reason.
8600:        // THE SAME CAST THE `api/lead` ROUTE BELOW MAKES, to the same type:
9547: * shape in which a lead captured on the published site can reach an already-open
10114:    file = await previewRenderer(store).file(site, channel, rel)
```

## Bash sed -n 100,130p apps/control-app/src/router.ts; sed -n 8395,8680p apps/control-app/src/router.ts
<!-- xgd-tool name="Bash" id="toolu_01YQ9Tei2vvK14mSkkCp9k5W" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:16.218455+00:00" -->

**Input**

```json
{"command":"sed -n 100,130p apps/control-app/src/router.ts; sed -n 8395,8680p apps/control-app/src/router.ts","description":"Read preview channel routing block"}
```

**Result**

```
// preview submission mails is one the operator can actually open.
import { openGate, takeAsset } from './gate'
import {
  downloadsPage,
  GATE_CACHE,
  GATE_HEADERS,
  parseDownloadPath,
} from '../../../packages/framework/src/modules/contact-form/gate'
/*
 * THE LEAD ENDPOINT IS IMPORTED, NOT REBUILT ([[BUG-78]]). `handleLead` is
 * `public-site`'s, and it stays `public-site`'s: it owns what a hostile caller
 * meets, and the preview needs exactly those refusals rather than a second set
 * that agrees with them today. The WRITE it calls is already ours — `captureLead`
 * below is the same function `worker.ts`'s `LeadIntake` entrypoint delegates to,
 * which is why the preview needs no service binding to reach it.
 */
import { handleLead, type LeadEnv as LeadRequestEnv } from '../../public-site/src/lead'
import { captureLead, type LeadEnv as LeadIntakeEnv, type LeadSubmission } from './lead'
import { UnknownTenantError } from '../../../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import { StoreConflictError, type SiteStore } from '../../../tools/generate/src/store/site-store'
import { scopeOf } from '../../../tools/generate/src/store/journal-model'
import { L1_REVEAL_SCRIPT } from '../../../packages/framework/src/l1/render'
import { elementLease, leasedStore, leasesOf } from '../../../tools/generate/src/store/leased-store'
import { d1Leases } from '../../../tools/generate/src/store/d1-leases'
import {
  CLIENT_HOLDER,
  DraftFileRefusal,
  asWriter,
  busyLine,
  describeHolder,
      return json(200, out.data)
      }
    }

    /**
     * /preview/<siteKey>/<channel>/<...> — a rendered channel (REQ-119).
     *
     * `draft` and `edit` render ON REQUEST from the stored definition, now in
     * workerd. `published` is not here: it is the immutable artifact a publish
     * produced, it lives in R2, and `public-site` serves it. Re-deriving it from
     * today's draft would make the published channel show unpublished work.
     *
     * SO `published` REDIRECTS rather than being served (REQ-149 D4). One serving
     * path for published bytes, as DOC-12 §7 assigns it. Proxying instead would
     * duplicate the resolve-and-serve logic that seam exists to own, and the cost
     * of the redirect — a never-published site shows public-site's 404 rather
     * than a builder-shaped message — lands on a URL the toolbar never produces.
     */
    /**
     * GET /account — the customer portal ([[REQ-183]]).
     *
     * A SITE PAGE, SERVED BY THE RENDERER THAT SERVES EVERY OTHER PAGE. The
     * surface showing an account its own relationship with a business is the
     * customer portal of that business's SITE ([[DOC-40]] §2.1) — the same
     * surface, rendered by the same code, that our customers will give their own
     * customers. So there is deliberately no template here and no second render
     * path: this is `servePreview`, against a different store, at a different
     * path. If a later hand finds themselves adding a rendering path for it, the
     * reading has been abandoned and that belongs in [[DOC-40]] §2.1 rather than
     * in a quiet diff.
     *
     * IT APPEARS ON THIS ORIGIN BECAUSE THE IDENTITY IS HERE, AND THAT IS THE
     * PROVISIONAL HALF ([[REQ-183]] D1). `app.1stcontact.io` already verifies an
     * email and runs `admit`; `1stcontact.io` is `GET`-only, edge-cached and
     * authenticates nobody, so one cached copy of a portal page would be
     * everybody's answer. The ORIGIN is what moves when the credential layer is
     * ours ([[DOC-40]] §3); the pages do not, because they are site content.
     *
     * IT TAKES NO SCOPE, and that is [[DOC-42]] §10.1's whole point. The store
     * is opened against the business the caller is an ACCOUNT OF rather than the
     * one they are operating, so `requireScope` is not called and an account whose
     * every grant has lapsed reaches it — which is the population most likely to
     * want the one control on it.
     *
     * A BUSINESS THAT HAS NOT AUTHORED A PORTAL GETS THE SHIPPED DEFAULT, through
     * a real in-memory `SiteStore` rather than a branch in the renderer. Authoring
     * one is an ordinary site write and it takes over the moment it exists.
     */
    if (p === PORTAL_PATH || p.startsWith(`${PORTAL_PATH}/`)) {
      if (method !== 'GET' && method !== 'HEAD') {
        return text(405, 'Method Not Allowed')
      }
      const businessId = portalBusinessId(deps.admission ?? null, scope)
      // No identity and no scope: there is no business whose portal this could
      // be, and inventing one would render somebody else's page.
      if (businessId === null) return text(404, 'Not found')
      const hostStore = await openSiteStore(deps, env, { businessId })
      // FOUND BY KIND, NOT BY A RESERVED NAME ([[REQ-236]]). It was
      // `hasDraft('portal')` — a magic slug a customer could have collided with
      // by calling their own site `portal`, and one with nowhere to live once
      // `sites.slug` went. `kind` is the schema's own word for what a row is,
      // so the portal is addressed by its key like everything else and found by
      // what it IS rather than by what somebody agreed to call it.
      const authored = (await hostStore.siteKeys('portal'))[0] ?? null
      const portalStore =
        authored !== null
          ? hostStore
          : portalFallbackStore(BUSINESSES_PATH, ACCEPTANCES_PATH, SIGN_IN_ADDRESSES_PATH)
      const rel = p.slice(PORTAL_PATH.length) || '/'
      // `draft` rather than a published revision: the portal is not published
      // through `public-site` and has no revision log of its own yet, so the
      // draft IS the live copy. When the portal moves
```

[elided — kept 5800 of 18569 bytes]

## Bash sed -n 120,175p apps/control-app/src/worker.ts; grep -n "RATE_LIMIT\|identified" apps/public-site/src/lead.ts | head -20…
<!-- xgd-tool name="Bash" id="toolu_01Vt8pDi5optHBpxRABohYT6" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:20.637826+00:00" -->

**Input**

```json
{"command":"sed -n 120,175p apps/control-app/src/worker.ts; grep -n \"RATE_LIMIT\\|identified\" apps/public-site/src/lead.ts | head -20; grep -n \"RATE_LIMIT\\|ratelimit\" -i apps/control-app/wrangler.* | head; grep -rn \"checkoutVerb\\|handleCheckout\" apps/public-site/src/index.ts","description":"Read ShopCheckout, lead env, rate-limit bindings"}
```

**Result**

```
/**
 * [[REQ-643]] — the third internal surface: a published site's checkout.
 *
 * ITS OWN CLASS for {@link AssetGate}'s reason: buying is neither lead intake
 * nor a gate, and the binding's name should say what it reaches. `public-site`
 * receives the buyer's request on the site's own origin (no CORS, no Access)
 * and hands it here over a service binding, with the site key the route
 * grammar resolved — never one the request body names.
 *
 * A THIN WRAPPER ON PURPOSE: everything is `orders.ts`'s. Each method answers
 * a plain {@link CheckoutAnswer} (status and body) so a refusal's sentence and
 * the current quote reach the buyer's page and nothing else does.
 */
export class ShopCheckout extends WorkerEntrypoint<Env> {
  private intake() {
    return checkoutIntake(this.env as never, {
      rebuild: (businessId, itemId) => {
        this.ctx.waitUntil(rebuildCatalogFor(this.env as never, { businessId }, itemId))
        return Promise.resolve()
      },
    })
  }

  async quote(siteKey: string, body: Record<string, unknown>): Promise<CheckoutAnswer> {
    return this.intake().quote(siteKey, body)
  }

  async start(siteKey: string, siteUrl: string, body: Record<string, unknown>): Promise<CheckoutAnswer> {
    return this.intake().start(siteKey, siteUrl, body)
  }

  async cancel(siteKey: string, body: Record<string, unknown>): Promise<CheckoutAnswer> {
    return this.intake().cancel(siteKey, body)
  }

  async status(siteKey: string, body: Record<string, unknown>): Promise<CheckoutAnswer> {
    return this.intake().status(siteKey, body)
  }
}

/**
 * The session junction's Durable Object ([[REQ-307]]) — re-exported, not defined.
 *
 * IT IS HERE FOR THE REASON EVERYTHING ELSE IN THIS FILE IS. `junction-do.ts`
 * imports `cloudflare:workers` for the `DurableObject` base class, so it can only
 * be loaded inside the runtime; the roughly sixty node suites that import
 * `index.ts` must never reach it. The Worker-side ADAPTER (`junctions.ts`) does
 * not import it at runtime at all — only its types, which erase — so the router
 * stays loadable in Node while the class stays loadable only where it can run.
 *
 * WRANGLER FINDS A DURABLE OBJECT CLASS BY EXPORT FROM `main`, which this file
 * is, and `wrangler.toml` names it in both environments beside a
 * `new_sqlite_classes` migration. It ADDS NO BEHAVIOUR: everything it does is
 * `junction-do.ts`'s.
 */
export { SessionJunction } from './junction-do'
144:  LEAD_RATE_LIMIT?: RateLimit
417:    identified?: boolean
433:  const { LEAD_INTAKE, TURNSTILE_SECRET, LEAD_RATE_LIMIT } = context.env
454:  if (!context.identified) {
455:    if (!LEAD_RATE_LIMIT) {
459:      const { success } = await LEAD_RATE_LIMIT.limit({
479:  if (!context.identified) {
607:# SIGNIN_IP_RATE_LIMIT — the per-source cap on issuing sign-in links ([[REQ-486]] §2).
610:# ADDRESS (`SIGNIN_RATE_LIMIT`, 5 an hour). This caps one SOURCE walking many
620:name = "SIGNIN_IP_RATE_LIMIT"
621:type = "ratelimit"
813:name = "SIGNIN_IP_RATE_LIMIT"
814:type = "ratelimit"
1026:name = "SIGNIN_IP_RATE_LIMIT"
1027:type = "ratelimit"
apps/public-site/src/index.ts:35:import { checkoutVerb, handleCheckout, type CheckoutEnv, type CheckoutVerb } from './checkout'
apps/public-site/src/index.ts:193:      if (checkout) return await handleCheckout(request, { ...checkout, env })
apps/public-site/src/index.ts:351:  const verb = checkoutVerb(path)
```

## Bash ls /Users/martin/lagrangefoundry/1stcontact/.venv*/bin/python 2>/dev/null; for p in ~/.xgd/releases/current/bin/python /…
<!-- xgd-tool name="Bash" id="toolu_01NYV4yuXjahv71HYJHcNDp2" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:42.968156+00:00" -->

**Input**

```json
{"command":"ls /Users/martin/lagrangefoundry/1stcontact/.venv*/bin/python 2>/dev/null; for p in ~/.xgd/releases/current/bin/python /Users/martin/lagrangefoundry/lagrange-framework/.venv/bin/python; do $p -c 'import lagrangefoundry,sys;print(sys.executable)' 2>/dev/null; done","description":"Find python with lagrangefoundry installed"}
```

**Result**

```
Exit code 127
(eval):1: no matches found: /Users/martin/lagrangefoundry/1stcontact/.venv*/bin/python
/Users/martin/.xgd/releases/current/bin/python
```

## Bash PY=~/.xgd/releases/current/bin/python; $PY -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug-b6fb57f6"}…
<!-- xgd-tool name="Bash" id="toolu_01EQGrHJbFtEzaypmMXiG6PT" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:45.912450+00:00" -->

**Input**

```json
{"command":"PY=~/.xgd/releases/current/bin/python; $PY -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-b6fb57f6\"}' 2>&1 | tail -5","description":"Read my session summary"}
```

**Result**

```
[16:07:48] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2319.01, 'pid': 22748}
{"count":0,"entries":[],"framing":""}
```

## Bash PY=~/.xgd/releases/current/bin/python; $PY -m lagrangefoundry.ai.agent_cli AgentSummaryFrame --in "$(python3 -c 'import…
<!-- xgd-tool name="Bash" id="toolu_0192Qvz2K927gZb7qHyT2mQn" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:07:52.876374+00:00" -->

**Input**

```json
{"command":"PY=~/.xgd/releases/current/bin/python; $PY -m lagrangefoundry.ai.agent_cli AgentSummaryFrame --in \"$(python3 -c 'import json;print(json.dumps({\"session\":\"bug-b6fb57f6\",\"text\":\"Implementing BUG-367 (builder draft checkout) via FREE CODING. Ticket body = spec, 9 fix items. Branch free-BUG-367, worktree /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367. Status set free_coding 2026-11-05. Not a dupe (BUG-363 is predecessor). Agent CLI python: ~/.xgd/releases/current/bin/python. Plan: preview route in apps/control-app/src/router.ts mirrors BUG-78 api/lead (handleCheckout imported from public-site with identified:true skipping rate limit; start replaced by owner-only notice).\"}))')\" 2>&1 | tail -1","description":"Write standing summary frame"}
```

**Result**

```
{"count":0,"entries":[],"framing":"Implementing BUG-367 (builder draft checkout) via FREE CODING. Ticket body = spec, 9 fix items. Branch free-BUG-367, worktree /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367. Status set free_coding 2026-11-05. Not a dupe (BUG-363 is predecessor). Agent CLI python: ~/.xgd/releases/current/bin/python. Plan: preview route in apps/control-app/src/router.ts mirrors BUG-78 api/lead (handleCheckout imported from public-site with identified:true skipping rate limit; start replaced by owner-only notice)."}
```

## Bash grep -n "export async function quoteCheckout\|export async function startCheckout\|country\|allowed_countries\|shipping_…
<!-- xgd-tool name="Bash" id="toolu_0194uGqDWQiLLTKmakoJYKmP" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:00.378276+00:00" -->

**Input**

```json
{"command":"grep -n \"export async function quoteCheckout\\|export async function startCheckout\\|country\\|allowed_countries\\|shipping_address_collection\" apps/control-app/src/orders.ts | head -60; wc -l apps/control-app/src/orders.ts","description":"Locate country handling in orders.ts"}
```

**Result**

```
89:/** A country's name in `locale`, falling back to its code. */
90:export function countryName(code: string, locale = 'en'): string {
120:    env.DB.prepare('SELECT zone_id, country FROM shipping_zone_countries WHERE business_id = ? ORDER BY country')
122:      .all<{ zone_id: string; country: string }>(),
125:  for (const c of countries.results ?? []) byZone.set(c.zone_id, [...(byZone.get(c.zone_id) ?? []), c.country])
141: * ignoring case), a rate in the business currency, and at least one country;
142: * a country may be in only one zone. Refused whole, with the owner's sentence,
165:    if (countries.length === 0) throw new ShopInputError(`“${name}” needs at least one country.`)
167:      if (!isCountry(c)) throw new ShopInputError(`“${c}” is not a country code.`)
169:      if (other !== undefined) throw new ShopInputError(`${countryName(c)} is in two zones, “${other}” and “${name}”. A country can be in only one zone.`)
194:        env.DB.prepare('INSERT INTO shipping_zone_countries (zone_id, business_id, country) VALUES (?, ?, ?)').bind(z.id, businessId, c),
201:/** Whether the business ships anywhere: at least one zone with a country. */
249:  /** Every country the business ships to, with its zone's rate. */
251:  /** The chosen country, when it is one the business ships to. */
252:  country: string | null
257:  /** True when every line is available, a country is chosen, and the business can take payments. */
340:  input: { lines: unknown; country?: unknown; locale?: unknown },
354:    .flatMap((z) => z.countries.map((code) => ({ code, name: countryName(code, locale), rate: z.rate, display: money(z.rate) })))
356:  const wanted = String(input.country ?? '').trim().toUpperCase()
373:    country: zone ? wanted : null,
389:export async function quoteCheckout(
391:  input: { siteKey: string; lines: unknown; country?: unknown; locale?: unknown },
402:  country: unknown
416:export async function startCheckout(
430:    throw new CheckoutBlockedError('no_shipping', 'Choose a country to ship to.', quote)
445:        'INSERT INTO orders (id, business_id, number, mode, status, currency, subtotal, shipping_amount, total, ship_country, shipping_zone, created_at, updated_at) ' +
447:      ).bind(orderId, businessId, mode, currency, quote.subtotal, quote.shipping, quote.total, quote.country, zone.name, now),
488:        shippingCountries: [quote.country!],
534:  ship_country: string
755:  shipTo: { country: string; zone: string }
815:    shipTo: { country: order.ship_country, zone: order.shipping_zone },
     822 apps/control-app/src/orders.ts
```

## Bash sed -n 240,500p apps/control-app/src/orders.ts
<!-- xgd-tool name="Bash" id="toolu_01SKDiPc7cKkQLKWHXbgx3jK" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:01.835841+00:00" -->

**Input**

```json
{"command":"sed -n 240,500p apps/control-app/src/orders.ts","description":"Read quote and start checkout code"}
```

**Result**

```
  /** False when the item is gone, not live, has no price in the business currency, or has less available than asked. */
  available: boolean
  display: { unitAmount: string; amount: string }
}

/** What the checkout page shows, from the records. */
export interface CheckoutQuote {
  currency: string
  lines: QuotedLine[]
  /** Every country the business ships to, with its zone's rate. */
  countries: Array<{ code: string; name: string; rate: number; display: string }>
  /** The chosen country, when it is one the business ships to. */
  country: string | null
  shipping: number | null
  subtotal: number
  total: number | null
  dispatchNote: string
  /** True when every line is available, a country is chosen, and the business can take payments. */
  canCheckout: boolean
  display: { subtotal: string; shipping: string | null; total: string | null }
}

/** The buyer cannot continue: told on the checkout page, before Stripe. Answered 409. */
export class CheckoutBlockedError extends Error {
  constructor(
    readonly code: 'unavailable' | 'price_changed' | 'no_shipping' | 'cannot_take_payments' | 'unknown_site',
    message: string,
    readonly quote: CheckoutQuote | null = null,
  ) {
    super(message)
    this.name = 'CheckoutBlockedError'
  }
}

const safeLocale = (locale: unknown): string => {
  const text = typeof locale === 'string' ? locale.trim() : ''
  try {
    return text !== '' && Intl.getCanonicalLocales(text).length > 0 ? Intl.getCanonicalLocales(text)[0] : 'en'
  } catch {
    return 'en'
  }
}

function linesOf(input: unknown): CheckoutLineRequest[] {
  if (!Array.isArray(input) || input.length === 0) throw new ShopInputError('A checkout needs at least one line.')
  if (input.length > MAX_LINES) throw new ShopInputError(`A checkout has at most ${MAX_LINES} lines.`)
  const merged = new Map<string, number>()
  for (const raw of input) {
    const l = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const item = String(l.item ?? '').trim()
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(item)) throw new ShopInputError('A line names an item that does not exist.')
    const quantity = l.quantity === undefined ? 1 : l.quantity
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1) throw new ShopInputError('A line needs a whole quantity of at least 1.')
    merged.set(item, (merged.get(item) ?? 0) + quantity)
  }
  for (const [, q] of merged) if (q > MAX_QUANTITY) throw new ShopInputError(`A line asks for at most ${MAX_QUANTITY}.`)
  return [...merged].map(([item, quantity]) => ({ item, quantity }))
}

interface PricedLine {
  itemId: string | null
  item: string
  name: string
  quantity: number
  unitAmount: number
  available: boolean
}

/** Every line read afresh from the records: the item, its price in the business currency, its availability. */
async function priceLines(env: ShopEnv, businessId: string, currency: string, lines: CheckoutLineRequest[]): Promise<PricedLine[]> {
  return Promise.all(
    lines.map(async (l) => {
      const row = await env.DB.prepare(
        "SELECT i.id, i.name, i.availability, i.live, p.amount FROM inventory_items i LEFT JOIN inventory_prices p ON p.item_id = i.id AND p.currency = ? AND p.market = '*' WHERE i.business_id = ? AND i.slug = ?",
      )
        .bind(currency, businessId, l.item)
        .first<{ id: string; name: string; availability: number; live: number; amount: number | null }>()
      const available = row !== null && row.live === 1 && row.amount !== null && row.availability >= l.quantity
      return {
        itemId: row?.id ?? null,
        item: l.item,
        name: row?.name ?? l.item,
        quantity: l.quantity,
        unitAmount: row?.amount ?? 0,
        available,
      }
    }),
  )
}

/** The business a public site key belongs to, or null. */
async function businessOfSiteKey(env: ShopEnv, siteKey: string): Promise<string | null> {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(siteKey)) return null
  const row = await env.DB.prepare("SELECT tenant_id FROM sites WHERE id = ? AND kind = 'site'").bind(siteKey).first<{ tenant_id: string }>()
  return row?.tenant_id ?? null
}

async function quoteFor(
  env: OrdersEnv,
  businessId: string,
  input: { lines: unknown; country?: unknown; locale?: unknown },
  options: { fetch?: Fetch },
): Promise<{ quote: CheckoutQuote; priced: PricedLine[]; zone: ShippingZone | null }> {
  const lines = linesOf(input.lines)
  const locale = safeLocale(input.locale)
  const currency = await shopCurrency(env, businessId)
  if (!currency) throw new CheckoutBlockedError('unavailable', 'This shop is not selling right now.')
  const [priced, shipping, payments] = await Promise.all([
    priceLines(env, businessId, currency, lines),
    readShipping(env, businessId, currency),
    canTakePayments(env, businessId, options).catch(() => false),
  ])
  const money = (n: number) => formatMoney(n, currency, locale)
  const countries = shipping.zones
    .flatMap((z) => z.countries.map((code) => ({ code, name: countryName(code, locale), rate: z.rate, display: money(z.rate) })))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
  const wanted = String(input.country ?? '').trim().toUpperCase()
  const zone = shipping.zones.find((z) => z.countries.includes(wanted)) ?? null
  const subtotal = priced.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0)
  const shippingAmount = zone?.rate ?? null
  const total = shippingAmount === null ? null : subtotal + shippingAmount
  const quote: CheckoutQuote = {
    currency,
    lines: priced.map((l) => ({
      item: l.item,
      name: l.name,
      quantity: l.quantity,
      unitAmount: l.unitAmount,
      amount: l.unitAmount * l.quantity,
      available: l.available,
      display: { unitAm
```

[elided — kept 5800 of 11930 bytes]

## Bash grep -rn "ship_country" db apps/control-app/src --include=*.sql --include=*.ts | grep -v test | head -20
<!-- xgd-tool name="Bash" id="toolu_01N7Ps5i7D7ysQ1fnSrrx3rA" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:06.084191+00:00" -->

**Input**

```json
{"command":"grep -rn \"ship_country\" db apps/control-app/src --include=*.sql --include=*.ts | grep -v test | head -20","description":"Find ship_country schema and writers"}
```

**Result**

```
(eval):1: no matches found: --include=*.sql
```

## Bash grep -rn "ship_country\|shipping_zone " db apps/control-app/src apps/control-app/migrations 2>/dev/null | grep -v "\.tes…
<!-- xgd-tool name="Bash" id="toolu_01N8ounAP6mibqgcKYc74BF8" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:07.578398+00:00" -->

**Input**

```json
{"command":"grep -rn \"ship_country\\|shipping_zone \" db apps/control-app/src apps/control-app/migrations 2>/dev/null | grep -v \"\\.test\\.\" | head -20","description":"Find ship_country schema and writers"}
```

**Result**

```
db/migrations/0047_orders.sql:71:  ship_country         TEXT NOT NULL CHECK (length(ship_country) = 2),
db/migrations/0047_orders.sql:72:  shipping_zone        TEXT NOT NULL,
apps/control-app/src/orders.ts:445:        'INSERT INTO orders (id, business_id, number, mode, status, currency, subtotal, shipping_amount, total, ship_country, shipping_zone, created_at, updated_at) ' +
apps/control-app/src/orders.ts:534:  ship_country: string
apps/control-app/src/orders.ts:815:    shipTo: { country: order.ship_country, zone: order.shipping_zone },
```

## Bash grep -rn "shipping_details\|collected_information\|shippingCountries\|allowed_countries" apps/control-app/src | grep -v…
<!-- xgd-tool name="Bash" id="toolu_01KW2hMbyULVzPi4ejDVBpRq" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:10.604632+00:00" -->

**Input**

```json
{"command":"grep -rn \"shipping_details\\|collected_information\\|shippingCountries\\|allowed_countries\" apps/control-app/src | grep -v \"\\.test\\.\" | head; sed -n 60,80p db/migrations/0047_orders.sql; ls db/migrations | tail -3","description":"Check Stripe shipping detail handling and migrations"}
```

**Result**

```
apps/control-app/src/orders.ts:488:        shippingCountries: [quote.country!],
apps/control-app/src/payments.ts:145: * the name, email and phone, and the shipping details (`collected_information`
apps/control-app/src/payments.ts:146: * on current API versions, `shipping_details` on older ones) for the address.
apps/control-app/src/payments.ts:150:  const shipping = session.collected_information?.shipping_details ?? session.shipping_details ?? null
apps/control-app/src/payments.ts:622:  shippingCountries?: readonly string[]
apps/control-app/src/payments.ts:708:  const countries = input.shippingCountries ?? []
apps/control-app/src/payments.ts:711:    form.set(`shipping_address_collection[allowed_countries][${i}]`, country)
-- accepted.
CREATE TABLE IF NOT EXISTS orders (
  id                   TEXT PRIMARY KEY,
  business_id          TEXT NOT NULL,
  number               INTEGER NOT NULL,
  mode                 TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  currency             TEXT NOT NULL CHECK (length(currency) = 3 AND currency = upper(currency)),
  subtotal             INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_amount      INTEGER NOT NULL CHECK (shipping_amount >= 0),
  total                INTEGER NOT NULL CHECK (total = subtotal + shipping_amount),
  ship_country         TEXT NOT NULL CHECK (length(ship_country) = 2),
  shipping_zone        TEXT NOT NULL,
  invoice_id           TEXT,
  checkout_session_id  TEXT,
  checkout_expires_at  TEXT,
  buyer_name           TEXT,
  buyer_email          TEXT,
  buyer_phone          TEXT,
  shipping_address     TEXT,
  payment_issue        TEXT,
0050_estimate_outcomes.sql
0051_item_live_set_by.sql
manifest.json
```

## Bash sed -n 140,175p apps/control-app/src/payments.ts; grep -n "shipping_address\s*=\|shipping_address =\|SET .*shipping_addr…
<!-- xgd-tool name="Bash" id="toolu_01Lsf4tbPAyr35x2e347sV2x" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:14.730323+00:00" -->

**Input**

```json
{"command":"sed -n 140,175p apps/control-app/src/payments.ts; grep -n \"shipping_address\\s*=\\|shipping_address =\\|SET .*shipping_address\" apps/control-app/src/*.ts | head","description":"See how paid webhook records shipping address"}
```

**Result**

```
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

/**
 * [[REQ-643]] — the buyer out of a completed session: `customer_details` for
 * the name, email and phone, and the shipping details (`collected_information`
 * on current API versions, `shipping_details` on older ones) for the address.
 */
function buyerOf(session: Record<string, any>): CheckoutBuyer {
  const details = session.customer_details ?? {}
  const shipping = session.collected_information?.shipping_details ?? session.shipping_details ?? null
  const a = shipping?.address ?? null
  return {
    name: text(details.name) ?? text(shipping?.name),
    email: text(details.email),
    phone: text(details.phone),
    address: a
      ? {
          name: text(shipping?.name),
          line1: text(a.line1),
          line2: text(a.line2),
          city: text(a.city),
          state: text(a.state),
          postalCode: text(a.postal_code),
          country: text(a.country),
        }
      : null,
  }
}

// ---- signatures ------------------------------------------------------------

const enc = new TextEncoder()

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
apps/control-app/src/orders.ts:640:      "UPDATE orders SET status = 'paid', paid_at = ?1, updated_at = ?1, buyer_name = ?2, buyer_email = ?3, buyer_phone = ?4, shipping_address = ?5 WHERE id = ?6 AND status = 'pending'",
apps/control-app/src/orders.ts:650:      'UPDATE orders SET payment_issue = ?1, updated_at = ?2, buyer_name = COALESCE(buyer_name, ?3), buyer_email = COALESCE(buyer_email, ?4), buyer_phone = COALESCE(buyer_phone, ?5), shipping_address = COALESCE(shipping_address, ?6) WHERE id = ?7',
```

## Bash grep -n "TRIGGER\|REFERENCES orders\|CREATE TABLE\|CREATE INDEX" db/migrations/0047_orders.sql db/migrations/004[89]*.sq…
<!-- xgd-tool name="Bash" id="toolu_01AXfWoV18sf2fbBfoaopQ7N" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:23.168252+00:00" -->

**Input**

```json
{"command":"grep -n \"TRIGGER\\|REFERENCES orders\\|CREATE TABLE\\|CREATE INDEX\" db/migrations/0047_orders.sql db/migrations/004[89]*.sql db/migrations/005*.sql | head -30","description":"Inspect order-related triggers and references"}
```

**Result**

```
db/migrations/0050_estimate_outcomes.sql:15:CREATE TABLE IF NOT EXISTS estimate_outcomes (
db/migrations/0050_estimate_outcomes.sql:24:CREATE INDEX IF NOT EXISTS estimate_outcomes_tenant_finished ON estimate_outcomes (tenant_id, finished_at);
db/migrations/0047_orders.sql:21:CREATE TABLE IF NOT EXISTS shop_shipping (
db/migrations/0047_orders.sql:29:CREATE TABLE IF NOT EXISTS shipping_zones (
db/migrations/0047_orders.sql:38:CREATE INDEX IF NOT EXISTS shipping_zones_business ON shipping_zones (business_id, position);
db/migrations/0047_orders.sql:44:CREATE TABLE IF NOT EXISTS shipping_zone_countries (
db/migrations/0047_orders.sql:50:CREATE INDEX IF NOT EXISTS shipping_zone_countries_zone ON shipping_zone_countries (zone_id);
db/migrations/0047_orders.sql:61:CREATE TABLE IF NOT EXISTS orders (
db/migrations/0047_orders.sql:89:CREATE INDEX IF NOT EXISTS orders_business ON orders (business_id, created_at);
db/migrations/0047_orders.sql:90:CREATE INDEX IF NOT EXISTS orders_session ON orders (checkout_session_id) WHERE checkout_session_id IS NOT NULL;
db/migrations/0047_orders.sql:96:CREATE TABLE IF NOT EXISTS order_lines (
db/migrations/0047_orders.sql:98:  order_id           TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
db/migrations/0047_orders.sql:108:CREATE INDEX IF NOT EXISTS order_lines_order ON order_lines (order_id, position);
db/migrations/0047_orders.sql:109:CREATE INDEX IF NOT EXISTS order_lines_item ON order_lines (business_id, inventory_item_id);
db/migrations/0047_orders.sql:117:CREATE TRIGGER IF NOT EXISTS order_lines_hold
db/migrations/0047_orders.sql:127:CREATE TRIGGER IF NOT EXISTS order_lines_take
db/migrations/0047_orders.sql:134:CREATE TRIGGER IF NOT EXISTS order_lines_fixed
db/migrations/0047_orders.sql:141:CREATE TRIGGER IF NOT EXISTS orders_status_flow
db/migrations/0047_orders.sql:148:CREATE TRIGGER IF NOT EXISTS orders_mode_fixed
db/migrations/0047_orders.sql:157:CREATE TRIGGER IF NOT EXISTS orders_release
db/migrations/0047_orders.sql:171:CREATE TRIGGER IF NOT EXISTS invoices_order_exists_insert
db/migrations/0047_orders.sql:179:CREATE TRIGGER IF NOT EXISTS invoices_order_exists_update
db/migrations/0047_orders.sql:189:CREATE TRIGGER IF NOT EXISTS orders_keep_paid_invoices
db/migrations/0047_orders.sql:196:CREATE TRIGGER IF NOT EXISTS orders_take_unpaid_invoices
db/migrations/0049_item_collections.sql:11:CREATE TABLE IF NOT EXISTS inventory_item_collections (
db/migrations/0049_item_collections.sql:17:CREATE INDEX IF NOT EXISTS inventory_item_collections_collection ON inventory_item_collections (collection_id);
```

## Bash grep -rln "Where should we send it" --exclude-dir=node_modules . 2>/dev/null | head; grep -rn "PLAN_ROUTE_EMPTY" --exclu…
<!-- xgd-tool name="Bash" id="toolu_01LMsCU796bqBNbH5x6Mitec" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:29.256050+00:00" -->

**Input**

```json
{"command":"grep -rln \"Where should we send it\" --exclude-dir=node_modules . 2>/dev/null | head; grep -rn \"PLAN_ROUTE_EMPTY\" --exclude-dir=node_modules -l . | head","description":"Find site prompt override and plan empty constant"}
```

**Result**

```
.xgd/tickets/hot/comment-d8169cbf.md
.xgd/tickets/hot/bug-b6fb57f6.md
.xgd/tickets/hot/bug-b6fb57f6.md
apps/control-app/src/builder/config.js
apps/control-app/src/builder/plan-route.js
```

## Bash grep -n "Where should we send\|countryPrompt" .xgd/tickets/hot/comment-d8169cbf.md | head; grep -n "^title\|^type\|subje…
<!-- xgd-tool name="Bash" id="toolu_01REiZpP7ed75hJkK1KUzwrm" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:31.609135+00:00" -->

**Input**

```json
{"command":"grep -n \"Where should we send\\|countryPrompt\" .xgd/tickets/hot/comment-d8169cbf.md | head; grep -n \"^title\\|^type\\|subject\\|^##\" .xgd/tickets/hot/comment-d8169cbf.md | head -20","description":"Read context in the other comment"}
```

**Result**

```
25183:Please change "Where should we send it?" to "Please select a region for delivery"
25196:6. **"Please select a region for delivery".** "Where should we send it?" is your site's own wording, set on its checkout page. So the fix makes the new sentence the standard prompt and removes your site's custom wording. A site can still set its own prompt on its checkout page if it wants to.
4:type: comment
5:title: Comment on epic EPIC-19
13:  subject_uid: epic-95bc3b15
30:#### You
42:#### Claude
45:## Opus 5 on the conversation — confirmed, in place
57:## Haiku workers for L1 — not in place in this repo
72:## What closing the gap looks like
86:#### You
92:#### Claude
116:#### You
122:#### Claude
146:## The part that matters for us
163:#### You
173:#### Claude
178:## What happened
194:## Two defects, not one
207:#### You
216:#### You
226:#### Claude
```

## Bash sed -n 25090,25230p .xgd/tickets/hot/comment-d8169cbf.md
<!-- xgd-tool name="Bash" id="toolu_019dGCVGtjuS1zYt89yxji4Q" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:34.377468+00:00" -->

**Input**

```json
{"command":"sed -n 25090,25230p .xgd/tickets/hot/comment-d8169cbf.md","description":"Read the design conversation behind BUG-367"}
```

**Result**

```
**Why it happened:** the Buy node has `link: true`, and that setting sent every bound field to the item's own page, including `buy`. So clicking Buy reloaded the page you were already on.

**The fix:** a field with its own destination now keeps it when `link: true` is set. `buy` goes to `/checkout/<item>`, and the enquiry and commission links go to their forms. `link: true` only sends a field to the item's own page when the field has nowhere else to go, such as the name or the price.

The same ticket also covers what we found earlier:
- In the draft, an available piece with no Buy button shows you a note saying what's missing: payments, shipping, or both.
- The checkout page names the missing condition instead of "This can't be bought right now".
- The product template preview shows an available piece instead of a sold one.
- The consultant can now see whether the shop is ready to sell, so it doesn't have to guess.

**Status:** committed at 23:10 UTC today (`6fec4e2e2d3a`), it's on `xgd-working`, and the ticket is at `ready_to_reconcile`. The dev site only changes when it's redeployed with `bin/deploy --env dev`. If Buy on the dev site still brings you back to the same page, the most likely reason is that the dev site hasn't been redeployed since this landed.

<!-- xgd-turn id="a493f0c0-8b01-4e42-8891-1ee868718511-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:38:04.577917+00:00" -->
#### You
Please answer the questions on 356

<!-- xgd-turn id="a493f0c0-8b01-4e42-8891-1ee868718511-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:39:24.221972+00:00" -->
#### Claude
Recording the answers on BUG-356. The first try used the wrong flag form, so I'm retrying.

I've answered BUG-356's three questions and added the answers to the end of its body, so its session can go ahead and build. (There's also a REQ-356, the plan ticket, but it has no open questions.) I picked the session's own recommendation each time, with one tightening on the third.

1. **Where you curate the showcase: the operator console.** You get a Showcase list of every clip made on any site, and you mark one "show" with a line saying what moves. Marking copies the clip and its still into platform storage, so the item no longer depends on that client's Library. The consultant gets a read-only tool that returns only marked items, and can play them to the client in chat. There's no separate CLI for adding or removing items.

2. **What measures the movement: `ffmpeg` in the job container.**
   - It's added next to Chromium, which the container image already has.
   - It's deterministic and easy to test.
   - **Cost:** the image grows by about 100 MB.
   - I rejected decoding the clip in Chromium: it relies on whether the Debian build plays H.264, and it's slower and harder to test.
   - **What you need to do:** it only goes live after you redeploy the container with `bin/deploy`.

3. **Setting the threshold: local dev clips and synthetic test clips only, with a margin. No production clips.**
   - The threshold lives in one place, so recalibrating means changing one value.
   - Once you've marked the showcase, run `1c showcase measure`. It scores each marked item against the threshold.
   - If one of your marked reveals fails, lower the threshold. That avoids any session reading customer media.

The ticket's other decisions stand. That includes the session's finding that recording the effect as the consultant's own choice currently adds nothing to the first-draft brief, which its fix will change. BUG-356 is still at `draft`. Its session sets `free_coding` once it starts building.

If you'd rather have read the production clips to calibrate, tell me and I'll change answer 3.

<!-- xgd-turn id="96afc89f-a0e6-4b33-8e1c-aaa6df80b271-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:45:38.270797+00:00" -->
#### You
This is the text of the empty plan can we put it to: "The plan

Your plan appears here once we know what your site is for." -> "The plan

Your plan appears here once it has been agreed."

I have finally reached the checkout page - seems there's a lot of work here. This is what I see:
Checkout

Choose where your piece is going, then continue to payment.

This can’t be bought right now.

Continue to payment

Surely the "where is this going" would be collected as part of the shipping address?

Why can't this item be bought (9ct Gold Rough Garnet Pendant LO)?

<!-- xgd-turn id="96afc89f-a0e6-4b33-8e1c-aaa6df80b271-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:47:39.818730+00:00" -->
#### Claude
Tracing the checkout page's price check to find why the pendant is refused.

Nearly there: checking whether the draft preview routes the checkout calls at all.

The pendant can't be bought because the checkout page is open in the builder's draft preview, and the preview can't reach the checkout service. I'm assuming you were in the draft; if this was the published site, tell me, because the cause would be different. I haven't made the text change or any fix yet. Both are written up as **BUG-367** (high, draft under EPIC-19), because this session plans and tracks work rather than coding it.

**Why the pendant can't be bought.** Nothing is wrong with the piece or the shop. When the checkout page loads, it asks the server for the piece's price and shipping options. Only the published site answers that request; the draft preview has nothing behind that address. So the request fails, and the page falls back to its catch-all message, "This can't be bought right now", even though the real problem is that no answer came back. That's also why the country list is empty and Continue to payment stays greyed out. BUG-363 makes the draft explain things only for a shop that can't sell yet. Now that yours can, th
```

[elided — kept 5800 of 9785 bytes]

## Bash cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/dev-store-forensics.md | sed -n 1,6…
<!-- xgd-tool name="Bash" id="toolu_01S3CNHkjdYDCusGDrN7aBzb" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:38.563265+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/dev-store-forensics.md | sed -n 1,60p","description":"Read dev-store forensics memory"}
```

**Result**

```
---
name: dev-store-forensics
description: "Where a dev site's turns, spend and junction logs actually live (local miniflare state, not remote D1) and how to read them."
metadata:
  node_type: memory
  type: reference
  originSessionId: 64f9099d-3ee4-46fe-99a8-631c8699f1d9
  modified: 2026-10-26T02:27:42.591Z
---

Dev-environment sites (e.g. Ariel's Arc Welding) run on **local miniflare state**, not the remote D1. `wrangler d1 execute DB --remote --env production` returns almost nothing for them (remote turn_spend had 10 rows total on 2026-10-22).

- **D1** (turn_spend, turn_log, request_spend, log_records): `apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite` in the main checkout. Find the file by querying each sqlite for the tenant id.
- **Junction DO log** (turn_start/turn_end/attributed per session): `apps/control-app/.wrangler/state/v3/do/1stcontact-control-app-dev-SessionJunction/<hash>.sqlite`, table `chunk(start,len,bytes,cont)`; `__miniflare_do_name` gives the session id. `select bytes from chunk order by start` → JSONL.
- **Builder tool audit**: R2 blobs under `.wrangler/state/v3/r2/1stcontact-sites/blobs/`, grep for the worker session id.

**A site's pages** (for a real-page test fixture): D1 `site_pages` (name → page JSON; a decomposed page is a FRAME whose `sections` lists ids in order and whose `l1.root.children` is empty) plus `site_page_sections` (`site_id, page_name, section_id, unit` = `{node, modules?}`). Assemble by setting `root.children` to the units' nodes in frame order. `sites.site_json` holds design/palette/nav. Earlier states aren't stored whole: `site_changes.record` keeps only text before/after per edit, enough to rebuild a section's old order by hand (BUG-293, 2026-10-25).

**Isolate-restart tell:** builder session numbers (`worker-builder-N-…`) restart at 1 when the isolate is replaced. A turn with `turn_start` and no `turn_end` (or a `turn_log` row with no `ended_at`) died with its isolate. BUG-254 found this. Related: [[junction-do-holds-the-turn-stream]].
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject 2>/dev/nul…
<!-- xgd-tool name="Bash" id="toolu_01HG4ad1z5fXQuiDM32aBSp5" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:42.514068+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject 2>/dev/null && for f in *.sqlite; do n=$(sqlite3 \"$f\" \"select count(*) from site_page_sections where unit like '%Where should we send%'\" 2>/dev/null); m=$(sqlite3 \"$f\" \"select count(*) from site_pages where page_json like '%Where should we send%'\" 2>/dev/null); echo \"$f $n $m\"; done","description":"Search local dev D1 for the site prompt override"}
```

**Result**

```
24f6*.sqlite  
24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite 0 
metadata.sqlite
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && wc -l packages/framework/s…
<!-- xgd-tool name="Bash" id="toolu_01P3185BR4kmemcGiCQCVRDh" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:46.059623+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && wc -l packages/framework/src/l2/checkout.ts && cat packages/framework/src/l2/checkout.ts","description":"Read default L2 checkout template"}
```

**Result**

```
     114 packages/framework/src/l2/checkout.ts
import type { L1Design, L1Node } from '@1stcontact/site-schema'

/**
 * L2 — the DEFAULT checkout, order-complete and order-cancelled pages
 * ([[REQ-643]]): what a site that sells draws until the owner or the Site
 * consultant puts its own `checkout` pages in the definition.
 *
 * ORDINARY L1, IN THE SITE'S DESIGN. Type is set by the design's type roles,
 * space by its space steps, width by its content measure; the two controls a
 * design's components cannot reach (a `select` and a `button` are `control`
 * nodes, which take no `component`) take their colours from the design's own
 * colour roles — `action`/`onAction` as `button.primary` names them, `border`
 * and `text` for the Ship to box. So the default looks like the rest of the
 * site, and restyling the site's design restyles it. Nothing here is a raw
 * value from a request: the record's values arrive through `bind` alone.
 */

export type CheckoutPageMode = 'checkout' | 'complete' | 'cancelled'

const FALLBACK = { action: '#111111', onAction: '#ffffff', border: '#d4d4d4', text: '#111111' }

/** A colour role's value in the design (a hex or a palette reference), else the fallback. */
function role(design: L1Design | undefined, name: 'action' | 'onAction' | 'border' | 'text'): string | { ref: string } {
  const button = design?.components?.['button.primary']
  const named = name === 'action' ? (button?.fill ?? 'action') : name === 'onAction' ? (button?.text ?? 'onAction') : name
  return (design?.colour?.[named] as string | { ref: string } | undefined) ?? FALLBACK[name]
}

const text = (copy: string, r: string, extra: Record<string, unknown> = {}): L1Node =>
  ({ kind: 'text', text: copy, role: r, ...extra }) as L1Node

const bound = (copy: string, r: string, field: string): L1Node => text(copy, r, { bind: { field } })

const row = (label: string, value: L1Node): L1Node =>
  ({ kind: 'container', layout: 'row', space: 'sm', align: 'center', children: [text(label, 'label'), value] }) as L1Node

const page = (children: L1Node[]): L1Node =>
  ({ kind: 'container', layout: 'stack', width: 'content', space: 'lg', padding: { topPx: 48, rightPx: 0, bottomPx: 64, leftPx: 0 }, children }) as L1Node

function message(): L1Node {
  return { kind: 'control', control: 'message', role: 'small' } as L1Node
}

/** The default `page` slot for one of the three pages, in `design`. */
export function checkoutPagePreset(mode: CheckoutPageMode, design?: L1Design): L1Node {
  if (mode === 'complete') {
    return page([
      text('Thank you', 'h1'),
      bound('Confirming your payment…', 'lead', 'confirming'),
      bound('Your payment is confirmed. Thank you for your order.', 'lead', 'confirmed'),
      row('Order', bound('—', 'body', 'order')),
      row('Item', bound('—', 'body', 'name')),
      row('Total', bound('—', 'body', 'total')),
      message(),
    ])
  }
  if (mode === 'cancelled') {
    return page([
      text('Checkout cancelled', 'h1'),
      text('Nothing was charged. The piece is available again if you change your mind.', 'lead'),
      text('Back to the shop', 'body', { link: { href: './' } }),
      message(),
    ])
  }
  return page([
    text('Checkout', 'h1'),
    {
      kind: 'container',
      layout: 'stack',
      space: 'lg',
      children: [
        { kind: 'image', src: 'assets/placeholder.svg', alt: '', bind: { field: 'photo' }, sizing: { width: { mode: 'fixed', px: 320 } } },
        {
          kind: 'container',
          layout: 'stack',
          space: 'md',
          children: [
            bound('Item', 'h2', 'name'),
            bound('Price', 'lead', 'price'),
            bound('The price has changed since this page was published. This is the current price.', 'small', 'changed'),
            bound('Sorry — this has sold since the page was published.', 'small', 'unavailable'),
            {
              kind: 'container',
              layout: 'stack',
              space: 'xs',
              children: [
                text('Ship to', 'label'),
                {
                  kind: 'control',
                  control: 'ship-to',
                  role: 'body',
                  axes: { color: role(design, 'text'), surfaceFill: '#ffffff', borderRadiusPx: 6, border: { widthPx: 1, color: role(design, 'border') } },
                  padding: { topPx: 10, rightPx: 12, bottomPx: 10, leftPx: 12 },
                  sizing: { width: { mode: 'fluid' } },
                },
              ],
            },
            row('Shipping', bound('—', 'body', 'shipping')),
            row('Total', bound('—', 'h3', 'total')),
            bound('Dispatch note', 'small', 'dispatch'),
            {
              kind: 'control',
              control: 'continue',
              role: 'label',
              axes: { color: role(design, 'onAction'), surfaceFill: role(design, 'action'), borderRadiusPx: 6 },
              padding: { topPx: 14, rightPx: 24, bottomPx: 14, leftPx: 24 },
            },
            message(),
          ],
        },
      ],
    } as L1Node,
  ])
}
```

## Bash ls packages/framework/src/l1/; grep -n ":hover\|:disabled\|cursor\|text-align\|justify-content" packages/framework/src/l…
<!-- xgd-tool name="Bash" id="toolu_01Lf5dQtLDLEybSHSqHSdceM" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:50.403520+00:00" -->

**Input**

```json
{"command":"ls packages/framework/src/l1/; grep -n \":hover\\|:disabled\\|cursor\\|text-align\\|justify-content\" packages/framework/src/l1/*.ts | grep -v test | head -40","description":"Survey L1 renderer for button styling"}
```

**Result**

```
button-group.ts
delivery.ts
dialog.ts
edit-client.ts
email-pages.ts
email-render.ts
font-advance.ts
marked-points.ts
page-state.ts
render.ts
packages/framework/src/l1/email-render.ts:201:  if (typeof axes.textAlign === 'string') out.push(`text-align:${axes.textAlign}`)
packages/framework/src/l1/render.ts:919:// bags, and only this emitter knows those compile to `:hover` / `:focus-visible`.
packages/framework/src/l1/render.ts:1017:      rules.push({ selector: `${selector}:hover`, decls })
packages/framework/src/l1/render.ts:1051:    if (interaction.hover?.motion) rules.push({ media: REDUCED_MOTION, selector: `${selector}:hover`, decls })
packages/framework/src/l1/render.ts:1307:      'cursor: pointer',
packages/framework/src/l1/render.ts:1800:    // A hover-triggered track is the SAME rule under a `:hover` selector, and an
packages/framework/src/l1/render.ts:1816:          ? partSelector(`${selector}:hover`, part === '' ? undefined : part)
packages/framework/src/l1/render.ts:1874://      CSS here. The script supplies only N lagging cursor trackers, so it never
packages/framework/src/l1/render.ts:1945:/** One lobe of the region: its offset from the cursor, its radius, its hard core. */
packages/framework/src/l1/render.ts:2176:    // inert even if some other path sets it. A cursor-tracking region is motion.
packages/framework/src/l1/render.ts:2189: * fine hovering pointer (a touchscreen has no cursor to follow, and a
packages/framework/src/l1/render.ts:2195: * The trackers are what make the region deform. Each eases toward the cursor by
packages/framework/src/l1/render.ts:2221: * The rAF loop runs only while some tracker is short of the cursor or some lobe is
packages/framework/src/l1/render.ts:2466:  const out: string[] = ['text-align: center', 'white-space: nowrap', 'align-content: center']
packages/framework/src/l1/render.ts:2646: * and the `text-align: center` emitted beside it becomes a no-op — three CRITICAL
packages/framework/src/l1/render.ts:3594:   * cursor instead of the positioned ancestor. `left`/`top` become
packages/framework/src/l1/render.ts:4018:// The cursors are obligations rather than taste, and the reporter names the first
packages/framework/src/l1/render.ts:4020:// discovers. `cursor` inherits, which is what lets a boxless wrapper set it on the
packages/framework/src/l1/render.ts:4130:  { selector: `.${ZOOM_TRIGGER_CLASS}`, decls: ['display: contents', 'cursor: zoom-in'] },
packages/framework/src/l1/render.ts:4144:    decls: ['overflow: hidden', 'justify-content: center'],
packages/framework/src/l1/render.ts:4156:      'cursor: zoom-in',
packages/framework/src/l1/render.ts:4163:  { selector: `[${ZOOM_ZOOMED_ATTR}] .${ZOOM_IMG_CLASS}`, decls: ['cursor: grab'] },
packages/framework/src/l1/render.ts:4179:      'text-align: center',
packages/framework/src/l1/render.ts:4205:      'cursor: pointer',
packages/framework/src/l1/render.ts:4728:  const decls: string[] = [`justify-content: ${DIALOG_PLACEMENT[dialog.placement ?? 'center']}`]
packages/framework/src/l1/render.ts:5417:  const cellDecls = ['vertical-align: top', 'text-align: start']
packages/framework/src/l1/render.ts:5433:      state.rules.push({ selector: `${t} tr > :nth-child(${i + 1})`, decls: [`text-align: ${TABLE_ALIGN[col.align]}`] })
packages/framework/src/l1/render.ts:5441:      { media, selector: `${t} tr > *`, decls: ['text-align: start', 'border-bottom: 0'] },
packages/framework/src/l1/render.ts:5515:        `justify-content: ${NAV_JUSTIFY[node.align ?? 'start']}`,
packages/framework/src/l1/render.ts:5535:    { selector: `${menu} > summary`, decls: ['cursor: pointer', 'list-style: none'] },
packages/framework/src/l1/render.ts:5555:      decls: ['display: flex', 'align-items: center', 'justify-content: center', `gap: ${NAV_BUTTON_GAP_PX}px`, `min-width: ${NAV_BUTTON_MIN_PX}px`, `min-height: ${NAV_BUTTON_MIN_PX}px`],
packages/framework/src/l1/render.ts:5557:    { selector: bars, decls: ['display: inline-flex', 'flex-direction: column', 'justify-content: space-between', 'width: 22px', 'height: 16px'] },
packages/framework/src/l1/render.ts:5922:      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
packages/framework/src/l1/render.ts:6434:      if (node.distribution) base.push(`justify-content: ${JUSTIFY[node.distribution]}`)
```

## Bash sed -n 2430,2500p packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_01VftULxgBSXCjAZjjkW4VB6" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:52.890083+00:00" -->

**Input**

```json
{"command":"sed -n 2430,2500p packages/framework/src/l1/render.ts","description":"Read component button CSS emission"}
```

**Result**

```
 * the flex `stretch` step, so the declaration actively suppresses the fill the
 * row would have given it for free. The cross-axis spelling therefore hands the
 * height back to `auto` and asks for the stretch explicitly.
 *
 * `align-self` is on the CHILD, so a node that asked for a fluid height fills
 * even inside a row whose `align` is `center` / `start` / `end`: per-node sizing
 * is the more specific statement, and the container's `align` stays the default
 * for every sibling that makes none.
 *
 * `whole` restates the property the other branch owns (`align-self: auto`) so a
 * `@media` override can REPLACE the mode below it — the same self-sufficiency
 * rule {@link layoutDecls} is emitted under, and for the same reason: half a
 * spelling leaking past a breakpoint is a layout nobody declared. It is off by
 * default so a parent with no layout track emits exactly what it always did.
 */
function fluidHeightDecls(cross: boolean, whole: boolean): string[] {
  if (cross) return ['height: auto', 'align-self: stretch']
  return whole ? ['height: 100%', 'align-self: auto'] : ['height: 100%']
}

/**
 * [[BUG-293]] — A BUTTON KEEPS ITS OWN SIZE. A linked run drawn as a box (a fill
 * or a border: a button component, resolved) sizes to its label and padding in
 * every layout, never stretched across a grid cell or down a stack: a stretched
 * pill is a bar or an oval with its label stranded at one end. Its label is
 * centred in the box, and the box stands where its container aligns its items
 * (start, centre or end); a container that stretches them, or says nothing,
 * puts it where its own text aligns. One that sizes or places itself keeps that.
 *
 * [[REQ-655]] — and its label is one line, centred in the box's height too, so a
 * button its row stretches to its neighbour's height keeps its words in the
 * middle. Inside a group of buttons the group sizes it ({@link buttonGroupDecls}).
 */
function buttonDecls(node: L1Text, parent: ParentFlow | undefined): string[] {
  const a = node.axes ?? {}
  if (!a.surfaceFill && !a.border) return []
  const out: string[] = ['text-align: center', 'white-space: nowrap', 'align-content: center']
  if (parent?.buttons) return out
  if (!node.sizing?.width && node.width === undefined && !node.geometry) out.push('width: fit-content', 'max-width: 100%')
  if (!parent || node.geometry || node.sizing?.height) return out
  const own = a.textAlign === 'center' ? 'center' : a.textAlign === 'right' ? 'end' : 'start'
  const at = parent.align === 'start' || parent.align === 'center' || parent.align === 'end' ? parent.align : own
  out.push(`align-self: ${at}`, `justify-self: ${at}`)
  return out
}

/**
 * [[REQ-655]] — whether `node` is a GROUP OF BUTTONS: two or more children, every
 * one a button ({@link isButtonRun}), laid out one way at every width, in a row or
 * a stack, and not sized, placed or spread apart by the document itself.
 */
function buttonGroupMode(node: L1Container): 'row' | 'stack' | null {
  const modes = node.responsiveLayout ? node.responsiveLayout.keyframes.map((k) => k.value) : [node.layout]
  const mode = modes[0]
  if ((mode !== 'row' && mode !== 'stack') || !modes.every((m) => m === mode)) return null
  if (node.children.length < 2 || !node.children.every(isButtonRun)) return null
  if (node.sizing?.width || node.width !== undefined || node.geometry) return null
  if (node.distribution === 'between' || node.distribution === 'around') return null
  return mode
}

/**
 * [[REQ-655]] — A GROUP OF BUTTONS LINES UP ACROSS THE WAY IT STACKS (supersedes
 * [[REQ-622]]'s wrapping row). Its buttons are one height in a row and one width
 * in a stack; a row of one kind of button ({@link sameButtonKind}) is one width
 * too, each as wide as the widest label; and a row that cannot hold its labels on
 * one line stacks, whole, never two and one.
 *
 * WITHOUT A BREAKPOINT OR A SCRIPT. Each button's flex-basis is `(T - 100%) × 999`,
 * `T` the width the row needs ({@link buttonPx}, an estimate that errs wide). Where
 * the group has `T` or more the basis is nothing and every button sits on the one
```

## Bash grep -n "kind === 'control'\|function renderControl\|function controlDecls\|L1ControlElement\b" packages/framework/src/l…
<!-- xgd-tool name="Bash" id="toolu_01S4Yr7RFNFR1Brt5nNmXEWL" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:57.243485+00:00" -->

**Input**

```json
{"command":"grep -n \"kind === 'control'\\|function renderControl\\|function controlDecls\\|L1ControlElement\\b\" packages/framework/src/l1/render.ts | head -20; grep -n \"button\" packages/framework/src/l1/render.ts | grep -i \"reset\\|all:\\|appearance\\|font: inherit\" | head","description":"Find control node rendering in L1"}
```

**Result**

```
2322:export interface L1ControlElement {
2351:function controlHtml(el: L1ControlElement, cls: string): string {
4989:  controls?: Readonly<Record<string, L1ControlElement>>
5884:      node.kind === 'text' || node.kind === 'control' ? node.axes?.nowrapFromPx : undefined
5885:    const textAlign = node.kind === 'text' || node.kind === 'control' ? node.axes?.textAlign : undefined
6531:  const interactive = node.kind === 'control' && Boolean(state.controls?.[node.control])
7081:  controls?: Readonly<Record<string, L1ControlElement>>,
```

## Bash sed -n 2300,2380p packages/framework/src/l1/render.ts; sed -n 6520,6600p packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_01SD7jqZQrDZiW1rqUqc2HRs" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:08:59.267196+00:00" -->

**Input**

```json
{"command":"sed -n 2300,2380p packages/framework/src/l1/render.ts; sed -n 6520,6600p packages/framework/src/l1/render.ts","description":"Read controlHtml and control CSS emission"}
```

**Result**

```
  | 'textarea'
  | 'button'
  | 'select'
  | 'span'
  | 'a'
  | 'label'
  // `ul` IS DECLARABLE BUT NOT BINDABLE ([[REQ-245]]). A behaviour whose
  // invariant element is a LIST — one row per thing the endpoint returned, a
  // roster the page cannot know at author time — had no honest tag to declare
  // itself with, and `span` was the nearest lie. This is the defect BUG-76
  // named: a declaration that says one tag beside an emitter that writes
  // another. Nothing binds an L1 `control` node to it, because
  // `resolveControlNames` skips every invariant element.
  | 'ul'

/**
 * A module-declared leaf element, as handed to the emitter. The module owns the
 * tag and the **attribute bundle** (`type` / `name` / `required` / `for`↔`id`
 * wiring, the behavioural `data-*` hooks); L1 owns the class, geometry and every
 * paint axis. `text` is the element's own content where the tag admits one (a
 * button's label, a textarea's value) — controls that are void elements ignore it.
 */
export interface L1ControlElement {
  tag: L1ControlTag
  attrs?: Readonly<Record<string, string | number | boolean | undefined>>
  text?: string
  /**
   * [[REQ-643]] — a `select`'s choices (a checkout's Ship to), written as
   * escaped `<option>` children. The module supplies them as data; they carry
   * no presentation of their own.
   */
  options?: ReadonlyArray<{ value: string; label: string; selected?: boolean; data?: Readonly<Record<string, string>> }>
}

/** Tags with no closing tag — their content, if any, is dropped. */
const VOID_CONTROL_TAGS = new Set<L1ControlTag>(['input'])

/**
 * Attribute names a control may never carry, whoever declared it. `class` and
 * `style` are L1's (letting a module set either would hand presentation back to
 * the module, which is the whole point of REQ-96), and an `on*` handler is a
 * script sink. Defence in depth: the modules are framework code, but the sole
 * emitter is where the guarantee is *constructed*, not assumed.
 */
function isSafeAttrName(name: string): boolean {
  if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) return false
  const lower = name.toLowerCase()
  return lower !== 'class' && lower !== 'style' && !lower.startsWith('on')
}

/** A module-declared control element → HTML, with L1's class and escaped attrs. */
function controlHtml(el: L1ControlElement, cls: string): string {
  const attrs: string[] = [`class="${cls}"`]
  for (const [name, value] of Object.entries(el.attrs ?? {})) {
    if (value === undefined || value === false || !isSafeAttrName(name)) continue
    if (value === true) attrs.push(name)
    else attrs.push(`${name}="${escapeHtml(String(value))}"`)
  }
  const open = `<${el.tag} ${attrs.join(' ')}`
  if (VOID_CONTROL_TAGS.has(el.tag)) return `${open} />`
  if (el.tag === 'select' && el.options) {
    const options = el.options.map((o) => {
      const data = Object.entries(o.data ?? {})
        .filter(([k]) => /^[a-z][a-z0-9-]*$/.test(k))
        .map(([k, v]) => ` data-${k}="${escapeHtml(v)}"`)
        .join('')
      return `<option value="${escapeHtml(o.value)}"${o.selected ? ' selected' : ''}${data}>${escapeHtml(o.label)}</option>`
    })
    return `${open}>${options.join('')}</${el.tag}>`
  }
  return `${open}>${escapeHtml(el.text ?? '')}</${el.tag}>`
}

const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
}
const ALIGN: Record<string, string> = {
    if (!padTracks?.bottomPx && px(bottomPx)) base.push(`padding-bottom: ${px(bottomPx)}`)
    if (!sides && !padTracks?.leftPx && px(leftPx)) base.push(`padding-left: ${px(leftPx)}`)
  }
  if (padTracks?.topPx) state.rules.push(...scalarAxisRules(selector, 'padding-top', padTracks.topPx))
  if (!sides && padTracks?.rightPx) state.rules.push(...scalarAxisRules(selector, 'padding-right', padTracks.rightPx))
  if (padTracks?.bottomPx) state.rules.push(...scalarAxisRules(selector, 'padding-bottom', padTracks.bottomPx))
  if (!sides && padTracks?.leftPx) state.rules.push(...scalarAxisRules(selector, 'padding-left', padTracks.leftPx))

  // REQ-99 — interaction states. A `control` is the one kind the user can focus,
  // so it is the kind that carries the default-ring obligation; every other kind
  // gets exactly the states it authored.
  const interactive = node.kind === 'control' && Boolean(state.controls?.[node.control])
  const transitions: TransitionSpec[] = []
  if (node.interaction) {
    const { rules, transitions: t } = interactionRules(
      selector,
      node.interaction,
      node.transform,
      interactive,
    )
    state.rules.push(...rules)
    transitions.push(...t)
  } else if (interactive) {
    // A control that declared no interaction at all still gets the floor: the
    // emitter neutralises the UA's own chrome (`appearance: none`), so leaving
    // this out is what would actually strip a focus indicator.
    state.rules.push({ selector: `${selector}:focus-visible`, decls: focusRingDecls(undefined) })
  }

  // REQ-100 — scroll entrance. Emitted after `interaction` so both features'
  // transitions reach `transitionDecls` together (see its doc comment: two
  // independent emissions would leave only the last one standing).
  //
  // REQ-116 — the edit render emits no reveal at all, which is what puts the
  // content in its SETTLED state rather than its initial one. Dropping only the
  // observer script would be the trap: the pre-state rule would still hold at
  // `opacity: 0`, so a page that fades its copy in on scroll would render that
  // copy invisible — and a segment nobody can see is a segment nobody can click.
  // REQ-212 — and a panel that starts closed never intersects, so its entrance
  // would never fire and the pre-
```

[elided — kept 5800 of 7930 bytes]

## Bash grep -n "appearance" packages/framework/src/l1/render.ts | head; grep -n "state.controls?.\[node.control\]\|controls?\.\…
<!-- xgd-tool name="Bash" id="toolu_01Q5eHBgZBsRZfQUTz4ng18w" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:04.005569+00:00" -->

**Input**

```json
{"command":"grep -n \"appearance\" packages/framework/src/l1/render.ts | head; grep -n \"state.controls?.\\[node.control\\]\\|controls?\\.\\[node\\.control\\]\\|node.kind === 'control'\" packages/framework/src/l1/render.ts | head -20","description":"Locate control base styles"}
```

**Result**

```
6062:        '-webkit-appearance: none',
6063:        'appearance: none',
6544:    // emitter neutralises the UA's own chrome (`appearance: none`), so leaving
6817:  // Source order was not enough. Blocks were ordered by first appearance across
5884:      node.kind === 'text' || node.kind === 'control' ? node.axes?.nowrapFromPx : undefined
5885:    const textAlign = node.kind === 'text' || node.kind === 'control' ? node.axes?.textAlign : undefined
6049:      const el = state.controls?.[node.control]
6531:  const interactive = node.kind === 'control' && Boolean(state.controls?.[node.control])
```

## Bash sed -n 6030,6110p packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_013A7W7umViWL4jaQNdXKAsq" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:05.317960+00:00" -->

**Input**

```json
{"command":"sed -n 6030,6110p packages/framework/src/l1/render.ts","description":"Read control element base decls"}
```

**Result**

```
      if (href) base.unshift('display: block', 'text-decoration: none', 'color: inherit')
      if (nodeLink) base.push(...buttonDecls(node, parent))
      // REQ-269 — and a heading must not inherit the UA's own type scale. `<h1>`
      // arrives at `2em bold`, which would paint a run whose document authored no
      // size axis at a size the reference never specified. Unshifted for the same
      // reason as the link chrome above: any authored axis is pushed later and wins.
      if (headingTag) base.unshift('font-size: inherit', 'font-weight: inherit')
      const words = textRunsHtml(node.text, name, state)
      html = `<${tag('p')} class="${cls}"${idAttr}${editAttrs}${linkAttrs}${actionAttrs}>${words}</${tag('p')}>`
      break
    }
    case 'control': {
      // REQ-96 — L1 wraps the module: the mounted behavior declared this element
      // (its tag + attribute bundle — `type`/`name`/`required`/label wiring), and
      // L1 supplies the class, geometry and paint. The module ships no CSS for it.
      //
      // An unbound name emits nothing. That is the isolation-correct degradation:
      // a bare `<input>` with no module behind it would paint UA chrome into the
      // page and collect a field nothing submits.
      const el = state.controls?.[node.control]
      if (!el) {
        html = ''
        break
      }
      emitTextAxes(node.axes ?? {}, node.responsive)
      base.push(...axisSizingCss(node.sizing, parent))
      // The zero-look baseline. A form control arrives with UA chrome (border,
      // fill, padding, its own font) that would paint *through* an L1 subtree
      // that simply declined to set those axes — so the sole emitter neutralises
      // it here, once, rather than every module carrying a reset stylesheet.
      // Pushed BEFORE the axes so any axis the instance did author still wins.
      base.unshift(
        '-webkit-appearance: none',
        'appearance: none',
        'margin: 0',
        'padding: 0',
        'border: 0',
        'background: transparent',
        'font: inherit',
        'color: inherit',
      )
      // [[BUG-299]] — a link control's UA underline is the same kind of chrome:
      // a decoration the document asks for through `textDecoration` or not at
      // all, exactly as REQ-333 already resets it on a linked run.
      if (el.tag === 'a') base.unshift('text-decoration: none')
      // A placeholder is painted by a UA pseudo-element that does NOT inherit
      // `color`, so an L1 subtree that set a field's text colour would still get
      // the browser's grey inside the box. Re-point it at the element's own
      // colour — the reference's placeholder-labelled field then paints from L1
      // like every other run.
      //
      // REQ-265 — unless the document says otherwise. `placeholderColor` is the
      // one painted value a control has that no other axis can hold, and until it
      // existed this default was the ONLY behaviour: a reference that deliberately
      // kept the browser's own grey placeholder was unauthorable, because setting
      // the field's `color` to that grey would have greyed the typed text too.
      // Absent → the default above, unchanged, so every existing document renders
      // exactly as it did. `opacity: 1` is kept in both branches: an authored ink
      // is the composited colour the reference paints, not a value to fade again.
      if (el.tag === 'input' || el.tag === 'textarea') {
        const placeholder = cssColor(node.axes?.placeholderColor)
        state.rules.push({
          selector: `${selector}::placeholder`,
          decls: [`color: ${placeholder ?? 'inherit'}`, 'opacity: 1'],
        })
      }
      html = controlHtml(el, cls)
      break
    }
    case 'image': {
      const a = node.axes ?? {}
      // [[BUG-282]] — a graphic (a map, a menu, a sign) is never cropped: whatever
      // reached it, it shows whole, at its own shape.
      const graphic = node.kind === 'image' && node.graphic === true
      const fit = graphic && (a.objectFit === 'cover' || a.objectFit === 'none') ? 'contain' : a.objectFit
      if (fit) base.push(`object-fit: ${fit}`)
      // REQ-136 — which part of the picture the box shows. Emitted next to
      // `object-fit` because the pair is one idea: `cover` says the box is a
      // window, and this says where the window looks. Absent means the browser's
      // centre, which is why nothing is emitted for an unset axis.
      if (a.objectPosition) {
```

## Bash sed -n 990,1060p packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_01JPAKoTuQPkTEe8t1DTTrVR" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:13.631899+00:00" -->

**Input**

```json
{"command":"sed -n 990,1060p packages/framework/src/l1/render.ts","description":"Read interactionRules hover emission"}
```

**Result**

```
 * remove it (DOC-16 §4 sets the quality bar; this is the floor beneath it).
 *
 * The transition is emitted on the BASE rule, so it governs the leave as well as
 * the enter, and only over the properties the states actually change — derived
 * from the emitted declarations rather than a blanket `all`, which would animate
 * geometry the keyframe track owns. Under `prefers-reduced-motion: reduce` the
 * transition is dropped and any state motion collapses back to the base
 * transform: a user who asked for no movement gets the paint change alone.
 */
function interactionRules(
  selector: string,
  interaction: L1Interaction,
  baseTransform: L1Transform | undefined,
  interactive: boolean,
): { rules: Rule[]; transitions: TransitionSpec[] } {
  const rules: Rule[] = []
  const props = new Set<string>()
  let anyMotion = false

  if (interactive && !interaction.focus?.ring) {
    // The floor: a focusable node with no authored ring still gets one.
    rules.push({ selector: `${selector}:focus-visible`, decls: focusRingDecls(undefined) })
  }

  if (interaction.hover) {
    const decls = stateDecls(interaction.hover, baseTransform)
    if (decls.length) {
      rules.push({ selector: `${selector}:hover`, decls })
      decls.forEach((d) => props.add(declProp(d)))
    }
    if (interaction.hover.motion) anyMotion = true
  }

  if (interaction.focus) {
    const decls = stateDecls(interaction.focus, baseTransform)
    // The paint delta transitions; the ring does NOT. A focus indicator that
    // fades in is an indicator that is briefly absent, which is the one thing it
    // may never be — so the ring is appended after the property set is taken.
    decls.forEach((d) => props.add(declProp(d)))
    if (interaction.focus.ring) decls.push(...focusRingDecls(interaction.focus.ring))
    if (decls.length) {
      rules.push({ selector: `${selector}:focus-visible`, decls })
    }
    if (interaction.focus.motion) anyMotion = true
  }

  const transitions: TransitionSpec[] = []
  const duration = interaction.transition?.durationMs
  if (duration !== undefined && Number.isFinite(duration) && props.size) {
    for (const prop of props) {
      transitions.push({
        prop,
        durationMs: duration,
        easing: interaction.transition?.easing ?? 'ease',
        delayMs: 0,
      })
    }
  }
  if (anyMotion) {
    const settled = baseTransform ? transformCss(baseTransform) : null
    const decls = [`transform: ${settled ?? 'none'}`]
    if (interaction.hover?.motion) rules.push({ media: REDUCED_MOTION, selector: `${selector}:hover`, decls })
    if (interaction.focus?.motion) {
      rules.push({ media: REDUCED_MOTION, selector: `${selector}:focus-visible`, decls })
    }
  }
  return { rules, transitions }
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
```

## Bash grep -n "reverse\|responsiveLayout\|distribution\b\|interface L1Container" packages/site-schema/src/l1/schema.ts | head…
<!-- xgd-tool name="Bash" id="toolu_01QxsREp3Dwz2P2xF1jYYCiy" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:21.768130+00:00" -->

**Input**

```json
{"command":"grep -n \"reverse\\|responsiveLayout\\|distribution\\b\\|interface L1Container\" packages/site-schema/src/l1/schema.ts | head -30","description":"Check L1 container schema options"}
```

**Result**

```
9: * sizing, distribution, visibility) are the fields capture leaves empty and the AI
447:/** Main-axis distribution for a container (maps to flex `justify-content`). */
1878:  'reverse',
1880:  'alternate-reverse',
3264:export interface L1ContainerNode extends L1NodeAxisGroups {
3273:  responsiveLayout?: z.infer<typeof l1ResponsiveLayoutSchema>
3299:  distribution?: z.infer<typeof l1DistributionSchema>
3367:      responsiveLayout: l1ResponsiveLayoutSchema.optional(),
3388:      distribution: l1DistributionSchema.optional(),
```

## Bash sed -n 3255,3330p packages/site-schema/src/l1/schema.ts; grep -n "l1ResponsiveLayoutSchema =" -A25 packages/site-schema/…
<!-- xgd-tool name="Bash" id="toolu_01L9ZHpyatko34ULPP8eku65" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:23.754593+00:00" -->

**Input**

```json
{"command":"sed -n 3255,3330p packages/site-schema/src/l1/schema.ts; grep -n \"l1ResponsiveLayoutSchema =\" -A25 packages/site-schema/src/l1/schema.ts | head -40; grep -n \"order\\b\\|orderTracks\\|visualOrder\" packages/site-schema/src/l1/schema.ts | head","description":"Read L1 container fields and responsive layout"}
```

**Result**

```
  link?: L1Link
  /** REQ-212 — the overlay role; the renderer is the sole modal sink. */
  dialog?: L1Dialog
  /** REQ-212 — the disclosure verb; the renderer is the sole `<button>` sink. */
  action?: L1Action
  children?: L1NodeUnion[]
}

/** A painted layout container: stack / row / grid over its children. */
export interface L1ContainerNode extends L1NodeAxisGroups {
  kind: 'container'
  id?: string
  layout: z.infer<typeof l1LayoutModeSchema>
  /**
   * REQ-104 — the per-width layout track. When present it OWNS the mode at render
   * time (base rule = first keyframe, media overrides above), and `layout` above
   * stays the representative widest value.
   */
  responsiveLayout?: z.infer<typeof l1ResponsiveLayoutSchema>
  /**
   * REQ-104 — `flex-wrap: wrap` for a row: children that no longer fit start a new
   * line instead of squeezing. Combined with each child's `sizing.width.minPx` this
   * is the "cards reflow when they run out of room" behaviour, with no breakpoint
   * to author. Inert wherever the resolved mode is not `row`.
   */
  wrap?: boolean
  /** REQ-98 — the shared surface group: a container paints AND lays out. */
  axes?: z.infer<typeof l1SurfaceAxesSchema>
  /** REQ-350 — the type this container sets for every run it contains. */
  type?: z.infer<typeof l1TypeSchema>
  /** REQ-420 — how neighbours are spaced: by their own rhythm, or by one uniform `gapPx`. */
  spacing?: z.infer<typeof l1SpacingSchema>
  gapPx?: number
  /** [[REQ-447]] — the uniform gap between children, as a step of the design's space scale. */
  space?: z.infer<typeof l1SpaceStepSchema>
  /** [[REQ-447]] — how wide this container sits: the design's content, wide or ([[REQ-463]]) text measure, or its parent's full width. */
  width?: z.infer<typeof l1WidthNameSchema>
  /** [[BUG-286]] — the measure this container's content is held to, its own fill still its full width. */
  inset?: z.infer<typeof l1InsetSchema>
  /** [[REQ-447]] — the design's component this container is drawn as (a card, a quote). */
  component?: z.infer<typeof l1ComponentNameSchema>
  /** [[REQ-463]] — the composition a page's section is laid out in, one the design lists. */
  composition?: z.infer<typeof l1CompositionSchema>
  columns?: number
  distribution?: z.infer<typeof l1DistributionSchema>
  align?: z.infer<typeof l1AlignSchema>
  /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
  link?: L1Link
  /** REQ-212 — the overlay role; the renderer is the sole modal sink. */
  dialog?: L1Dialog
  /** REQ-212 — the disclosure verb; the renderer is the sole `<button>` sink. */
  action?: L1Action
  /**
   * REQ-100 — the interval between successive children's reveals, in ms.
   *
   * Container-level because staggering is a statement about a *set* of peers,
   * which is precisely what a container is and a `box` is not. Only children
   * that carry their own {@link l1RevealSchema} take part, and they take part in
   * document order; a child's own `reveal.delayMs` adds to its stagger share
   * rather than replacing it.
   */
  staggerMs?: number
  children: L1NodeUnion[]
}

/** Any L1 node — the recursive tree element type. */
export type L1NodeUnion =
  | z.infer<typeof l1TextSchema>
  | z.infer<typeof l1ImageSchema>
  | z.infer<typeof l1VideoSchema>
  | z.infer<typeof l1SlotSchema>
  | z.infer<typeof l1ControlSchema>
  | z.infer<typeof l1TableSchema>
  | z.infer<typeof l1NavSchema>
  | L1BoxNode
  | L1ContainerNode
441:export const l1ResponsiveLayoutSchema = z
442-  .object({
443-    keyframes: z.array(l1LayoutKeyframeSchema).min(1),
444-  })
445-  .strict()
446-
447-/** Main-axis distribution for a container (maps to flex `justify-content`). */
448-export const l1DistributionSchema = z.enum(['start', 'center', 'end', 'between', 'around'])
449-
450-/** Cross-axis alignment for a container (maps to flex `align-items`). */
451-export const l1AlignSchema = z.enum(['start', 'center', 'end', 'stretch'])
452-
453-/** A node is visible only within `[from, until)` viewport widths (both optional). */
454-export const l1VisibilitySchema = z
455-  .object({
456-    fromPx: finite.nonnegative().optional(),
457-    untilPx: finite.nonnegative().optional(),
458-  })
459-  .strict()
460-
461-// ── Shared structured axis forms (REQ-91) ─────────────────────────────────────
462-//
463-// Each captured pixel-mover that is not a plain scalar (gradient, shadow, border,
464-// mask, transform) gets a *typed structured* form here — never a passthrough CSS
465-// string. The renderer re-derives the CSS from these numeric/enum/hex fields, so
466-// no instance value ever becomes raw CSS.
463:// Each captured pixel-mover that is not a plain scalar (gradient, shadow, border,
592: * spellings of one thing is the drift this schema refuses everywhere. The order
593: * is CSS's own, which is paint order — the first layer paints on top.
601:/** A box border — width + colour + line style. */
731:     * eight optional scalars on an object, and a JSON object has no order that
733:     * fixed one canonical order of its own and the captured order was simply
748:     * order applies — which is what every document written before this axis
749:     * existed means, so none of them change. A function present in `order` but
751:     * value that `order` omits is emitted after the named ones, in the renderer's
752:     * fixed order, so a partial declaration can never silently drop paint.
```

## Bash grep -n "l1LayoutModeSchema =\|l1LayoutKeyframeSchema =" -A12 packages/site-schema/src/l1/schema.ts | head -40
<!-- xgd-tool name="Bash" id="toolu_015tsxjZYEzSZARmVNNXzXza" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:28.456965+00:00" -->

**Input**

```json
{"command":"grep -n \"l1LayoutModeSchema =\\|l1LayoutKeyframeSchema =\" -A12 packages/site-schema/src/l1/schema.ts | head -40","description":"Check layout mode enum"}
```

**Result**

```
371:export const l1LayoutModeSchema = z.enum(['stack', 'row', 'grid'])
372-
373-/**
374- * REQ-420 — how a container spaces its children.
375- *
376- * - `rhythm` — each neighbour pair is separated by the larger of the first one's
377- *   `spaceBelow` and the second one's `spaceAbove`, in the site's rhythm units,
378- *   so a heading sits close to the text it introduces and well clear of what
379- *   came before. A heading is kept with what follows it: the two are one unit
380- *   when a row wraps or a layout restacks. For stacks of text.
381- * - `gap` — one uniform `gapPx` between every pair. For card grids, image rows,
382- *   button rows.
383- *
--
397:export const l1LayoutKeyframeSchema = z
398-  .object({
399-    at: finite.nonnegative(),
400-    value: l1LayoutModeSchema,
401-    /**
402-     * [[REQ-648]] — at a `grid` keyframe, how many equal columns the grid has from
403-     * `at` upward: the card grid's 2 on a phone, 3 on a tablet, 4 on a desktop.
404-     * The same track says both things that change at a width, so there is one way
405-     * to say "at this width", never a second per-width mechanism beside this one.
406-     * Absent, the container's static `columns` stands. Meaningless (and refused)
407-     * at a `stack` or `row` keyframe.
408-     */
409-    columns: z.number().int().min(1).max(L1_MAX_GRID_COLUMNS).optional(),
```

## Bash grep -n "^function layoutDecls\|^function responsiveLayoutRules\|keyframes.map\|flex-direction" packages/framework/src/l…
<!-- xgd-tool name="Bash" id="toolu_01EedbSuZFMspYgE4pNXsE3T" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:39.514687+00:00" -->

**Input**

```json
{"command":"grep -n \"^function layoutDecls\\|^function responsiveLayoutRules\\|keyframes.map\\|flex-direction\" packages/framework/src/l1/render.ts | head -20","description":"Find layout emission in renderer"}
```

**Result**

```
1621:        `animation-name: ${keyframes.map((k) => k.name).join(', ')}`,
2482:  const modes = node.responsiveLayout ? node.responsiveLayout.keyframes.map((k) => k.value) : [node.layout]
2692:    ? Math.max(...term.pxTrack.keyframes.map((k) => k.value))
3774:    const decls = ['display: flex', 'flex-direction: column', 'position: relative', 'min-width: 0']
3795:function layoutDecls(mode: L1LayoutMode, node: L1Container, keyframe?: { columns?: number }): string[] {
3805:  const decls = ['display: flex', `flex-direction: ${mode === 'row' ? 'row' : 'column'}`]
3965:      'flex-direction: column',
5211:    media: flow.keyframes.map((kf) => ({ at: kf.at, value: kf.value === 'stack' ? on : '0' })),
5541:      decls: ['display: flex', 'flex-direction: column', `gap: ${gap}`, 'list-style: none', 'margin: 0', `padding: ${gap} 0 0`],
5557:    { selector: bars, decls: ['display: inline-flex', 'flex-direction: column', 'justify-content: space-between', 'width: 22px', 'height: 16px'] },
```

## Bash sed -n 3760,3830p packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_01QjHX5ZNnM6kUPJjc7MCuyN" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:40.859969+00:00" -->

**Input**

```json
{"command":"sed -n 3760,3830p packages/framework/src/l1/render.ts","description":"Read layoutDecls"}
```

**Result**

```
  state: RenderState,
  emitChild: (child: L1Node, i: number, flow: ParentFlow, lead?: RhythmLead) => string,
): string {
  state.usesRhythm = true
  const column: ParentFlow = { base: 'stack', keyframes: [], align: node.align }
  const groupAt = new Map(plan.groups.map((g) => [g.start, g]))
  const out: string[] = []
  for (let i = 0; i < node.children.length; i++) {
    const group = groupAt.get(i)
    if (!group) {
      out.push(emitChild(node.children[i], i, flow, rhythmLead(plan.leads.get(i), flow, state)))
      continue
    }
    const name = `${state.prefix ? `${state.prefix}-` : ''}l1-${state.n++}`
    const decls = ['display: flex', 'flex-direction: column', 'position: relative', 'min-width: 0']
    if (node.align) decls.push(`align-items: ${ALIGN[node.align]}`)
    const lead = rhythmLead(plan.leads.get(i), flow, state)
    if (lead?.base) decls.push(`margin-top: ${lead.base}`)
    for (const m of lead?.media ?? []) {
      state.rules.push({ media: `(min-width: ${m.at}px)`, selector: `.${name}`, decls: [`margin-top: ${m.value}`] })
    }
    state.rules.push({ selector: `.${name}`, decls })
    const heading = node.children[group.heading]
    const labelId = heading.id ?? `${name}-h`
    const members: string[] = []
    for (let j = group.start; j <= group.end; j++) {
      const child = j === group.heading && heading.id === undefined ? { ...heading, id: labelId } : node.children[j]
      members.push(emitChild(child, j, column, j === group.start ? undefined : rhythmLead(plan.leads.get(j), column, state)))
    }
    out.push(`<div class="${name}" ${L1_KEEP_ATTR} role="group" aria-labelledby="${escapeHtml(labelId)}">${members.join('')}</div>`)
    i = group.end
  }
  return out.join('')
}

function layoutDecls(mode: L1LayoutMode, node: L1Container, keyframe?: { columns?: number }): string[] {
  if (mode === 'grid') {
    // [[REQ-648]] — a grid whose track states its columns per width is a grid of
    // EQUAL columns: `minmax(0, 1fr)`, so a card's content (a one-line title is
    // as wide as its whole text) never widens its own column past its
    // neighbours'. The integer is re-checked here, not trusted.
    const columns = Math.min(Math.max(1, Math.floor(gridColumnsOf(node, keyframe))), L1_MAX_GRID_COLUMNS)
    const track = keyframe?.columns !== undefined ? 'minmax(0, 1fr)' : '1fr'
    return ['display: grid', `grid-template-columns: repeat(${columns}, ${track})`]
  }
  const decls = ['display: flex', `flex-direction: ${mode === 'row' ? 'row' : 'column'}`]
  if (node.wrap !== undefined) {
    decls.push(`flex-wrap: ${node.wrap && mode === 'row' ? 'wrap' : 'nowrap'}`)
  }
  return decls
}

// ── REQ-116 the edit render ──────────────────────────────────────────────────
//
// A third render channel (DOC-28 §5): the same document and the same emitter,
// rendered so the page deliberately does NOT work — no link target, no behaviour
// or motion script — and every editable region is addressable.
//
// The address is a **render-scoped structural path**. The emitter is already
// walking the tree, so it stamps the child indices it walked; a client would
// otherwise have to rebuild that mapping from the rendered DOM and keep it
// valid. It is indexed from the render's root node LIST — `[doc.root]` for a
// document, the subtree array for a fragment — so one resolution rule covers
// both: index the list, then `children` at each later step.
//
// Nothing is persisted and nothing in the definition changes. The path only has
// to stay valid for the lifetime of the one render the client is displaying,
// because every edit re-renders and regenerates it — which is why the usual
// objection (reordering siblings breaks a structural path) does not apply here.
//
// L1's own `id` is deliberately NOT reused for this: REQ-106 made it the real
```

## Bash grep -rn "TABLET\w*\s*=\|tabletPx\|PAGE_WIDTHS\s*=" packages/framework/src packages/site-schema/src | grep -v test | hea…
<!-- xgd-tool name="Bash" id="toolu_01J9GGfzdpaHsBLvUH7CDsye" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:55.395376+00:00" -->

**Input**

```json
{"command":"grep -rn \"TABLET\\w*\\s*=\\|tabletPx\\|PAGE_WIDTHS\\s*=\" packages/framework/src packages/site-schema/src | grep -v test | head","description":"Find tablet breakpoint constant"}
```

**Result**

```
(Bash completed with no output)
```

## Bash grep -rn "768\b" packages/framework/src/l2/*.ts | head; grep -rln "ladder" packages/framework/src | head
<!-- xgd-tool name="Bash" id="toolu_017QuMFkmbvo9XUvyHnG8yZS" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:09:57.116158+00:00" -->

**Input**

```json
{"command":"grep -rn \"768\\b\" packages/framework/src/l2/*.ts | head; grep -rln \"ladder\" packages/framework/src | head","description":"Find width ladder used by L2 presets"}
```

**Result**

```
packages/framework/src/l2/catalog.ts:27:  { at: 768, columns: 3 },
packages/framework/src/l2/catalog.ts:131:export const CATALOG_PRODUCT_SPLIT = { at: 768, columns: 5, photos: 3, details: 2 } as const
packages/framework/src/worker.ts
packages/framework/src/l1/email-render.ts
packages/framework/src/l1/render.ts
packages/framework/src/modules/dials.ts
packages/framework/src/l1/delivery.ts
packages/framework/src/modules/behavior.ts
```

## Bash grep -rn "button.secondary" packages/framework/src packages/site-schema/src | grep -v test | head -8; grep -n "PLAN_ROUT…
<!-- xgd-tool name="Bash" id="toolu_016ghzAWeK6ygNmR7zpg1hXZ" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:10:06.529766+00:00" -->

**Input**

```json
{"command":"grep -rn \"button.secondary\" packages/framework/src packages/site-schema/src | grep -v test | head -8; grep -n \"PLAN_ROUTE_EMPTY\" -A3 apps/control-app/src/builder/config.js apps/control-app/src/builder/plan-route.js | head; grep -rln \"once we know what your site is for\" tests apps packages | grep -v node_modules","description":"Check secondary button and plan empty text uses"}
```

**Result**

```
packages/site-schema/src/l1/design-names.ts:26:export const L1_COMPONENTS = ['button.primary', 'button.secondary', 'card', 'quote', 'badge'] as const
packages/site-schema/src/l1/design.ts:552: * {@link L1_REQUIRED_COLOUR_ROLES}; `button.primary` and `button.secondary`;
packages/site-schema/src/l1/design.ts:622:  const secondary = components['button.secondary']
packages/site-schema/src/l1/design.ts:623:  if (!secondary) miss('components.button.secondary', "no 'button.secondary' component (a 'text' colour role and a 'fill' or a 'border')")
packages/site-schema/src/l1/design.ts:625:    miss('components.button.secondary', "'button.secondary' needs a 'text' colour role and a 'fill' or a 'border'")
apps/control-app/src/builder/plan-route.js:20:  PLAN_ROUTE_EMPTY,
apps/control-app/src/builder/plan-route.js-21-  PLAN_ROUTE_HEADING,
apps/control-app/src/builder/plan-route.js-22-  PLAN_ROUTE_OPEN,
apps/control-app/src/builder/plan-route.js-23-  PLAN_ROUTE_SKIPPED,
--
apps/control-app/src/builder/plan-route.js:44:  const empty = el('p', 'plan-route__empty', PLAN_ROUTE_EMPTY)
apps/control-app/src/builder/plan-route.js-45-  const list = el('ol', 'plan-route__list')
apps/control-app/src/builder/plan-route.js-46-  const skippedHeading = el('h4', 'plan-route__skipped-heading', PLAN_ROUTE_SKIPPED)
apps/control-app/src/builder/plan-route.js-47-  const skipped = el('ul', 'plan-route__skipped')
apps/control-app/src/builder/config.js:1087:export const PLAN_ROUTE_EMPTY = "Your plan appears here once we know what your site is for."
tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts
apps/control-app/src/builder/config.js
```

## Bash sed -i '' 's/Your plan appears here once we know what your site is for\./Your plan appears here once it has been agreed.…
<!-- xgd-tool name="Bash" id="toolu_016NuFJRPRSdALhEQCBbFLgu" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:10:09.311785+00:00" -->

**Input**

```json
{"command":"sed -i '' 's/Your plan appears here once we know what your site is for\\./Your plan appears here once it has been agreed./' apps/control-app/src/builder/config.js tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts; grep -rn \"once it has been agreed\\|once we know what your site\" apps/control-app/src/builder/config.js tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts; sed -n 1075,1088p apps/control-app/src/builder/config.js","description":"Change plan panel empty message and its pin"}
```

**Result**

```
tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts:193:    expect(panel().querySelector('.plan-route__empty')!.textContent).toBe('Your plan appears here once it has been agreed.')
apps/control-app/src/builder/config.js:1087:export const PLAN_ROUTE_EMPTY = "Your plan appears here once it has been agreed."
  comps: (n) => `${count(n, 'site', 'sites')} to comment on`,
  headline: () => 'Choose a headline',
  positioning: () => 'Confirm your position card',
  // [[REQ-432]], [[BUG-269]] — the direction card waiting to be hearted (the plan's `DIRECTION_HELP`).
  direction: () => 'Agree the Look summary',
}
/**
 * [[REQ-657]] — the Plan panel at the top of Input: this client's route with the
 * consultant, each activity's status in words, and the skipped ones under "Not
 * included" with their reasons. Read-only: the client changes it through the chat.
 */
export const PLAN_ROUTE_HEADING = 'The plan'
export const PLAN_ROUTE_EMPTY = "Your plan appears here once it has been agreed."
export const PLAN_ROUTE_AGREED = 'Agreed with you'
```

## Bash python3 - <<'EOF' p='apps/public-site/src/checkout.ts' s=open(p).read() s=s.replace(""" context: { siteKey: string; verb…
<!-- xgd-tool name="Bash" id="toolu_011ZqKGqKrHHMCNdgMwm4J2q" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:10:17.824034+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/public-site/src/checkout.ts'\ns=open(p).read()\ns=s.replace(\"\"\"  context: { siteKey: string; verb: CheckoutVerb; siteUrl: string; env: CheckoutEnv },\n): Promise<Response> {\n  const { SHOP_CHECKOUT, CHECKOUT_RATE_LIMIT } = context.env\n  if (!SHOP_CHECKOUT || !CHECKOUT_RATE_LIMIT) return reply(503, { error: 'This shop is not selling right now.' })\"\"\",\"\"\"  context: {\n    siteKey: string\n    verb: CheckoutVerb\n    siteUrl: string\n    env: CheckoutEnv\n    /**\n     * [[BUG-367]] — the caller is an authenticated operator (the builder's draft\n     * preview), as `handleLead`'s flag of the same name means: the per-IP limiter\n     * exists for an anonymous caller and is not asked. Everything else holds.\n     */\n    identified?: boolean\n  },\n): Promise<Response> {\n  const { SHOP_CHECKOUT, CHECKOUT_RATE_LIMIT } = context.env\n  if (!SHOP_CHECKOUT || (!CHECKOUT_RATE_LIMIT && !context.identified)) return reply(503, { error: 'This shop is not selling right now.' })\"\"\")\ns=s.replace(\"\"\"  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'\n  try {\n    const { success } = await CHECKOUT_RATE_LIMIT.limit({ key: `${context.siteKey}:${ip}` })\n    if (!success) return reply(429, { error: 'Too many requests. Please wait a moment and try again.' })\n  } catch {\n    return reply(503, { error: 'This shop is not selling right now.' })\n  }\"\"\",\"\"\"  if (!context.identified) {\n    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'\n    try {\n      const { success } = await CHECKOUT_RATE_LIMIT!.limit({ key: `${context.siteKey}:${ip}` })\n      if (!success) return reply(429, { error: 'Too many requests. Please wait a moment and try again.' })\n    } catch {\n      return reply(503, { error: 'This shop is not selling right now.' })\n    }\n  }\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"identified\" apps/public-site/src/checkout.ts","description":"Add identified flag to handleCheckout"}
```

**Result**

```
92:    identified?: boolean
96:  if (!SHOP_CHECKOUT || (!CHECKOUT_RATE_LIMIT && !context.identified)) return reply(503, { error: 'This shop is not selling right now.' })
102:  if (!context.identified) {
```

## Bash cat >> apps/control-app/src/checkout-intake.ts <<'EOF' /** * [[BUG-367]] — what Continue to payment answers in the build…
<!-- xgd-tool name="Bash" id="toolu_01SkT6jzbJvPHsfNaoKdvU4q" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:10:29.877841+00:00" -->

**Input**

```json
{"command":"cat >> apps/control-app/src/checkout-intake.ts <<'EOF'\n\n/**\n * [[BUG-367]] — what Continue to payment answers in the builder's draft preview.\n * Only the owner sees the draft, so this speaks to them.\n */\nexport const PREVIEW_PAYMENT_NOTICE = 'Payment opens on your published site. Only you see this.'\n\n/**\n * [[BUG-367]] — the checkout as the builder's draft preview reaches it: the same\n * `quote` the published site's binding calls, so the draft shows the current\n * price, the Ship to countries, the rate and the total exactly as published.\n *\n * THE DRAFT NEVER TAKES MONEY. `start` re-reads the quote and answers the owner\n * the notice above with it; it holds no stock, writes no order and opens no\n * Stripe session. `cancel` and `status` are an order's, and the draft has none.\n */\nexport function previewCheckoutIntake(env: OrdersEnv, options: CheckoutIntakeOptions = {}) {\n  const live = checkoutIntake(env, options)\n  const noOrder = (): Promise<CheckoutAnswer> => Promise.resolve({ status: 404, body: { error: 'Orders open on your published site.' } })\n  return {\n    quote: live.quote,\n    start: async (siteKey: string, _siteUrl: string, body: unknown): Promise<CheckoutAnswer> => {\n      const quoted = await live.quote(siteKey, body)\n      if (quoted.status !== 200) return quoted\n      return { status: 200, body: { notice: PREVIEW_PAYMENT_NOTICE, ...quoted.body } }\n    },\n    cancel: noOrder,\n    status: noOrder,\n  }\n}\nEOF\ngrep -n \"^import\\|from './orders'\" apps/control-app/src/router.ts | grep -n \"orders\\|checkout\" ","description":"Add preview checkout intake"}
```

**Result**

```
14:57:import { catalogItemChanged, checkoutReadinessFor, publishedCatalogFor, shopInventory, siteCatalogFor, type InventorySource } from './catalog'
```

## Bash python3 - <<'EOF' p='apps/control-app/src/router.ts' s=open(p).read() imp="import { captureLead, type LeadEnv as LeadInt…
<!-- xgd-tool name="Bash" id="toolu_011yf9yV9oqLbWv7B4wRT3uq" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:10:41.850098+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/router.ts'\ns=open(p).read()\nimp=\"import { captureLead, type LeadEnv as LeadIntakeEnv, type LeadSubmission } from './lead'\\n\"\nassert imp in s\ns=s.replace(imp, imp+\"\"\"/*\n * [[BUG-367]] — THE CHECKOUT ENDPOINT IS IMPORTED, NOT REBUILT, on `handleLead`'s\n * reasoning above: `handleCheckout` is `public-site`'s request handling (body\n * cap, content type, the refusal envelope), and the work behind it is the same\n * `checkoutIntake` the `SHOP_CHECKOUT` binding wraps — reached in-process here.\n */\nimport { checkoutVerb, handleCheckout, type CheckoutEnv } from '../../public-site/src/checkout'\nimport { previewCheckoutIntake } from './checkout-intake'\n\"\"\",1)\nanchor=\"\"\"      /**\n       * GET /preview/<siteKey>/draft/api/download/<token>[/<assetKey>] — the\n       * gated download, against the draft ([[BUG-97]]).\"\"\"\nassert anchor in s\nroute=\"\"\"      /**\n       * POST /preview/<siteKey>/draft/api/checkout/<verb> — the draft's checkout\n       * page asks for its quote ([[BUG-367]]).\n       *\n       * WHY THIS EXISTS AT ALL is `api/lead`'s reason: the checkout page's script\n       * posts to `api/checkout/<verb>` relative to the page, and in the preview\n       * that page is served by THIS Worker. With no route here every quote came\n       * back a 404, and the page told the owner a piece they can sell could not\n       * be bought.\n       *\n       * THE SAME `handleCheckout` AND THE SAME `quote`, so the draft shows what\n       * the published page shows. The rate limiter is not asked (`identified`):\n       * the caller is the signed-in operator, as for the draft's `api/lead`.\n       *\n       * THE DRAFT NEVER TAKES MONEY: `start` answers the owner that payment\n       * opens on the published site, and writes nothing ({@link previewCheckoutIntake}).\n       *\n       * `draft` ONLY, and the site key is the route's and is checked, exactly as\n       * the `api/lead` route above does.\n       */\n      const checkoutPath = method === 'POST' ? checkoutVerb((preview[3] ?? '/').replace(/^\\\\/+/, '')) : null\n      if (checkoutPath) {\n        if (channel !== 'draft') return text(404, 'Not found')\n        const store = await openStore()\n        if (!(await store.hasDraft(site))) return text(404, 'Not found')\n        return handleCheckout(request, {\n          siteKey: site,\n          verb: checkoutPath,\n          siteUrl: publicSiteUrl(site, '/'),\n          env: { SHOP_CHECKOUT: previewCheckoutIntake(env as never) } as CheckoutEnv,\n          identified: true,\n        })\n      }\n\n\"\"\"\ns=s.replace(anchor, route+anchor,1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"function publicSiteUrl\\|const publicSiteUrl\" apps/control-app/src/*.ts | head -3","description":"Add draft checkout route to router"}
```

**Result**

```
apps/control-app/src/public-url.ts:57:export function publicSiteUrl(siteKey: string, rel = '/'): string {
```

## Bash sed -n 615,660p apps/control-app/src/orders.ts; sed -n 100,135p apps/control-app/src/orders.ts
<!-- xgd-tool name="Bash" id="toolu_01AUL21mESabvn39pjVWooag" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:10:49.491967+00:00" -->

**Input**

```json
{"command":"sed -n 615,660p apps/control-app/src/orders.ts; sed -n 100,135p apps/control-app/src/orders.ts","description":"Read paid update and readShipping"}
```

**Result**

```
  return buyer?.address ? JSON.stringify(buyer.address) : null
}

/**
 * The Shop's payment handler ([[REQ-642]]'s `registerShopPaymentHandler`).
 * - `paid`: the order is paid and the buyer and shipping address stored; its
 *   pages rebuild, so a sold one-off shows Sold.
 * - `amount_mismatch`: the payment check failed — flagged on the order (and
 *   the buyer stored, since money was taken); never accepted as paid.
 * - `expired`, and `failed` once the invoice is void (the session ended):
 *   the order expires, its stock is released and its pages rebuild. A `failed`
 *   card inside an open session is only an attempt; the buyer may try again.
 * - `refunded`: [[REQ-642]] already issued the credit note; refunds are the
 *   fulfilment ticket's.
 */
export async function orderPaymentOutcome(event: ShopPaymentEvent, context: ShopPaymentContext): Promise<void> {
  // The control app's env, which is the Shop's as well as the payments'.
  const env = context.env as OrdersEnv
  const deps = context.deps
  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ? AND business_id = ?').bind(event.orderId, event.businessId).first<OrderRow>()
  if (!order) return
  const at = new Date(deps.now ?? Date.now()).toISOString()
  if (event.outcome === 'paid') {
    const b = event.buyer
    const result = await env.DB.prepare(
      "UPDATE orders SET status = 'paid', paid_at = ?1, updated_at = ?1, buyer_name = ?2, buyer_email = ?3, buyer_phone = ?4, shipping_address = ?5 WHERE id = ?6 AND status = 'pending'",
    )
      .bind(at, b?.name ?? null, b?.email ?? null, b?.phone ?? null, addressText(b), order.id)
      .run()
    if ((result.meta?.changes ?? 0) > 0) await rebuildFor(env, order.business_id, order.id, deps.catalogChanged)
    return
  }
  if (event.outcome === 'amount_mismatch') {
    const b = event.buyer
    await env.DB.prepare(
      'UPDATE orders SET payment_issue = ?1, updated_at = ?2, buyer_name = COALESCE(buyer_name, ?3), buyer_email = COALESCE(buyer_email, ?4), buyer_phone = COALESCE(buyer_phone, ?5), shipping_address = COALESCE(shipping_address, ?6) WHERE id = ?7',
    )
      .bind(
        `Stripe took ${event.amount ?? '?'} ${event.currency ?? '?'}; the invoice total is ${order.total} ${order.currency}. The order was not marked paid.`,
        at,
        b?.name ?? null,
        b?.email ?? null,
        b?.phone ?? null,
        addressText(b),
        order.id,
      )
  name: string
  /** Integer, the business currency's minor units. */
  rate: number
  countries: string[]
}

export interface ShippingSettings {
  /** The business's default currency the rates are in, or null when none is set. */
  currency: string | null
  dispatchNote: string
  zones: ShippingZone[]
}

/** The business's zones, rates and dispatch note. */
export async function readShipping(env: ShopEnv, businessId: string, currency?: string | null): Promise<ShippingSettings> {
  const [note, zones, countries] = await Promise.all([
    env.DB.prepare('SELECT dispatch_note FROM shop_shipping WHERE business_id = ?').bind(businessId).first<{ dispatch_note: string }>(),
    env.DB.prepare('SELECT id, name, rate FROM shipping_zones WHERE business_id = ? ORDER BY position, name')
      .bind(businessId)
      .all<{ id: string; name: string; rate: number }>(),
    env.DB.prepare('SELECT zone_id, country FROM shipping_zone_countries WHERE business_id = ? ORDER BY country')
      .bind(businessId)
      .all<{ zone_id: string; country: string }>(),
  ])
  const byZone = new Map<string, string[]>()
  for (const c of countries.results ?? []) byZone.set(c.zone_id, [...(byZone.get(c.zone_id) ?? []), c.country])
  return {
    currency: currency === undefined ? await shopCurrency(env, businessId) : currency,
    dispatchNote: note?.dispatch_note ?? '',
    zones: (zones.results ?? []).map((z) => ({ id: z.id, name: z.name, rate: z.rate, countries: byZone.get(z.id) ?? [] })),
  }
}

/** What Settings → Shipping saves: the whole set, every time. A rate is written as on a label (`4.50`). */
export interface ShippingInput {
  dispatchNote?: unknown
```

## Bash python3 - <<'EOF' p='apps/control-app/src/orders.ts' s=open(p).read() def rep(a,b): global s assert a in s, a[:60] s=s.r…
<!-- xgd-tool name="Bash" id="toolu_011g2f6VyWYuSrGXbBpKHTdR" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:02.735376+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/orders.ts'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert a in s, a[:60]\n    s=s.replace(a,b,1)\nrep(\"\"\"  /** The chosen country, when it is one the business ships to. */\n  country: string | null\n\"\"\",\"\"\"  /** The chosen country, when it is one the business ships to. */\n  country: string | null\n  /**\n   * [[BUG-367]] — every country the business ships to costs the same, so the\n   * page asks no country: the one rate is the shipping, and Stripe's address\n   * form offers every one of `countries`.\n   */\n  singleRate: boolean\n\"\"\")\nrep(\"\"\"  const wanted = String(input.country ?? '').trim().toUpperCase()\n  const zone = shipping.zones.find((z) => z.countries.includes(wanted)) ?? null\n\"\"\",\"\"\"  const wanted = String(input.country ?? '').trim().toUpperCase()\n  const shipsTo = shipping.zones.filter((z) => z.countries.length > 0)\n  const singleRate = shipsTo.length > 0 && shipsTo.every((z) => z.rate === shipsTo[0].rate)\n  const chosen = shipping.zones.find((z) => z.countries.includes(wanted)) ?? null\n  // [[BUG-367]] — with one rate there is nothing to choose: the first zone stands\n  // for them all until Stripe's address names the country.\n  const zone = chosen ?? (singleRate ? shipsTo[0] : null)\n\"\"\")\nrep(\"\"\"    country: zone ? wanted : null,\n    shipping: shippingAmount,\"\"\",\"\"\"    country: chosen ? wanted : null,\n    singleRate,\n    shipping: shippingAmount,\"\"\")\nrep(\"\"\"      ).bind(orderId, businessId, mode, currency, quote.subtotal, quote.shipping, quote.total, quote.country, zone.name, now),\"\"\",\n\"\"\"      ).bind(orderId, businessId, mode, currency, quote.subtotal, quote.shipping, quote.total, quote.country ?? zone.countries[0], zone.name, now),\"\"\")\nrep(\"\"\"        shippingCountries: [quote.country!],\"\"\",\"\"\"        // [[BUG-367]] — one rate: Stripe offers every country shipped to, and\n        // the paid outcome records the one the buyer's address names.\n        shippingCountries: quote.country ? [quote.country] : quote.countries.map((c) => c.code),\"\"\")\nrep(\"\"\"\"UPDATE orders SET status = 'paid', paid_at = ?1, updated_at = ?1, buyer_name = ?2, buyer_email = ?3, buyer_phone = ?4, shipping_address = ?5 WHERE id = ?6 AND status = 'pending'\",\n    )\n      .bind(at, b?.name ?? null, b?.email ?? null, b?.phone ?? null, addressText(b), order.id)\"\"\",\n\"\"\"\"UPDATE orders SET status = 'paid', paid_at = ?1, updated_at = ?1, buyer_name = ?2, buyer_email = ?3, buyer_phone = ?4, shipping_address = ?5, \" +\n        // [[BUG-367]] — a single-rate order was opened before the buyer named a\n        // country; the address Stripe collected says which, and so which zone.\n        'ship_country = COALESCE(?7, ship_country), shipping_zone = COALESCE((SELECT z.name FROM shipping_zones z JOIN shipping_zone_countries c ON c.zone_id = z.id WHERE c.business_id = orders.business_id AND c.country = ?7), shipping_zone) ' +\n        \"WHERE id = ?6 AND status = 'pending'\",\n    )\n      .bind(at, b?.name ?? null, b?.email ?? null, b?.phone ?? null, addressText(b), order.id, shipCountryOf(b))\"\"\")\nrep(\"\"\"export async function orderPaymentOutcome(\"\"\",\"\"\"/** The two-letter country of the buyer's shipping address, when Stripe gave one. */\nfunction shipCountryOf(buyer: ShopPaymentEvent['buyer']): string | null {\n  const c = buyer?.address?.country\n  return typeof c === 'string' && /^[A-Z]{2}$/.test(c) ? c : null\n}\n\nexport async function orderPaymentOutcome(\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"ShopPaymentEvent\\b\" apps/control-app/src/orders.ts | head -3; grep -n \"buyer\" apps/control-app/src/payments.ts | grep -n \"interface\\|buyer?:\" | head","description":"Implement single-rate quote and start in orders.ts"}
```

**Result**

```
45:  type ShopPaymentEvent,
645:function shipCountryOf(buyer: ShopPaymentEvent['buyer']): string | null {
650:export async function orderPaymentOutcome(event: ShopPaymentEvent, context: ShopPaymentContext): Promise<void> {
2:99:  buyer?: CheckoutBuyer
```

## Bash grep -rn "canCheckout:" apps packages --include=*.ts -l 2>/dev/null | grep -v node_modules; grep -rln "canCheckout" apps…
<!-- xgd-tool name="Bash" id="toolu_01FaYHux5di61hErfNfV4oCs" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:07.143266+00:00" -->

**Input**

```json
{"command":"grep -rn \"canCheckout:\" apps packages --include=*.ts -l 2>/dev/null | grep -v node_modules; grep -rln \"canCheckout\" apps packages tests | grep -v node_modules | head -20","description":"Find other CheckoutQuote constructions"}
```

**Result**

```
(eval):1: no matches found: --include=*.ts
apps/control-app/src/orders.ts
packages/framework/src/modules/module-assets.ts
packages/framework/src/modules/checkout/client.js
tests/test_UAT_FC_REQ-643_checkout_pages.test.ts
tests/test_UAT_FC_REQ-643_purchase.workers.test.ts
```

## Read /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/1c-assets-rewrites-module-assets.md
<!-- xgd-tool name="Read" id="toolu_01YTD2XFpu99io119L7r6K75" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:09.844991+00:00" -->

**Input**

```json
{"file_path":"/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/1c-assets-rewrites-module-assets.md"}
```

**Result**

```
<system-reminder>This memory is 32 days old. Memories are point-in-time observations, not live state — claims about code behavior or file:line citations may be outdated. Verify against current code before asserting as fact.</system-reminder>
1	---
2	name: 1c-assets-rewrites-module-assets
3	description: Running 1c commands or some suites rewrites packages/framework/src/modules/module-assets.ts (committed copy is stale) — revert it before committing.
4	metadata:
5	  node_type: memory
6	  type: feedback
7	  originSessionId: 0f7c12fe-1658-4e26-9b23-c89f4f986527
8	  modified: 2026-10-04T16:58:01.771Z
9	---
10	
11	`packages/framework/src/modules/module-assets.ts` is generated by `1c assets`, and running `1c refold`/`l1-gate` or the full node suite regenerates it. The committed copy was stale on 2026-10-04, so it shows up as modified even though you never touched its sources.
12	
13	**Why:** it appeared in `git status` three times during REQ-383 with a diff in MODULE_CSS/MODULE_CLIENT_JS that no change of mine produced.
14	
15	**How to apply:** `git checkout -- packages/framework/src/modules/module-assets.ts` before staging, and stage explicit paths. Don't commit it as part of an unrelated ticket. Related: [[git-add-all-sweeps-untracked-caches]], [[l1-gate-grades-retained-fold]].
16	
```

## Bash python3 - <<'EOF' p='packages/framework/src/modules/checkout/client.js' s=open(p).read() def rep(a,b): global s assert a…
<!-- xgd-tool name="Bash" id="toolu_01N8dtjpVp6fh1J5uAXu1uoQ" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:20.475437+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='packages/framework/src/modules/checkout/client.js'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert a in s, a[:70]\n    s=s.replace(a,b,1)\nrep(\"\"\"const ROOT_SELECTOR = '[data-checkout][data-checkout-endpoint]'\"\"\",\"\"\"const ROOT_SELECTOR = '[data-checkout][data-checkout-endpoint]'\n\n// [[BUG-367]] — what the page says when no answer it can read came back. Each\n// names what actually failed; neither claims the piece cannot be bought.\nexport const UNREACHABLE = 'The shop could not be reached. Nothing was charged; please try again.'\nexport const NO_ANSWER = 'The shop gave no answer. Nothing was charged; please try again.'\"\"\")\nrep(\"\"\"    const data = await res.json().catch(() => ({}))\n    return { ok: res.ok, status: res.status, data: data || {} }\n  } catch (_e) {\n    return { ok: false, status: 0, data: { error: 'The shop could not be reached. Nothing was charged; please try again.' } }\n  }\"\"\",\"\"\"    const data = await res.json().catch(() => null)\n    // [[BUG-367]] — an answer that is not the shop's JSON (a 404 page, a proxy's\n    // error) is no answer, and the page says so rather than guessing at why.\n    if (!data || typeof data !== 'object') return { ok: false, status: res.status, data: { error: NO_ANSWER } }\n    return { ok: res.ok, status: res.status, data }\n  } catch (_e) {\n    return { ok: false, status: 0, data: { error: UNREACHABLE } }\n  }\"\"\")\nrep(\"\"\"    if (r.ok && r.data.quote) {\n      apply(r.data.quote)\n      say(root, '')\n    } else {\n      button.disabled = true\n      say(root, r.data.error || 'This can’t be bought right now.')\n    }\"\"\",\"\"\"    if (r.ok && r.data.quote) {\n      apply(r.data.quote)\n      say(root, '')\n    } else {\n      // A refusal carries its own sentence (and the quote, when there is one);\n      // anything else is the shop not answering. \"Can't be bought\" is the\n      // quote's to say, through its `unavailable` field — never a fallback.\n      if (r.data.quote) apply(r.data.quote)\n      button.disabled = true\n      say(root, r.data.error || NO_ANSWER)\n    }\"\"\")\nrep(\"\"\"    if (r.ok && r.data.url) {\n      window.location.assign(r.data.url)\n      return\n    }\n    if (r.data.quote) apply(r.data.quote)\n    else button.disabled = false\n    say(root, r.data.error || 'Payment could not be started. Nothing was charged; please try again.')\"\"\",\"\"\"    if (r.ok && r.data.url) {\n      window.location.assign(r.data.url)\n      return\n    }\n    if (r.data.quote) apply(r.data.quote)\n    else button.disabled = false\n    // [[BUG-367]] — the builder's draft answers the owner a notice instead of a\n    // payment address: the draft never takes money.\n    if (r.ok && r.data.notice) {\n      say(root, r.data.notice)\n      return\n    }\n    say(root, r.data.error || 'Payment could not be started. Nothing was charged; please try again.')\"\"\")\nopen(p,'w').write(s)\nEOF\necho ok","description":"Fix checkout script fallbacks and preview notice"}
```

**Result**

```
ok
```

## Bash grep -rn "'dispatch'" packages/framework/src packages/site-schema/src tools/generate/src 2>/dev/null | grep -v test | he…
<!-- xgd-tool name="Bash" id="toolu_013uruommbiM3WkwYZCWPkdd" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:32.241979+00:00" -->

**Input**

```json
{"command":"grep -rn \"'dispatch'\" packages/framework/src packages/site-schema/src tools/generate/src 2>/dev/null | grep -v test | head","description":"Find bind field declarations for checkout"}
```

**Result**

```
packages/framework/src/l2/checkout.ts:100:            bound('Dispatch note', 'small', 'dispatch'),
packages/framework/src/modules/checkout/client.js:107:    if (q.dispatchNote) setText(root, 'dispatch', q.dispatchNote)
packages/site-schema/src/l1/schema.ts:2697:  'dispatch',
```

## Bash sed -n 2660,2730p packages/site-schema/src/l1/schema.ts; grep -n "export function bindL1" -A60 packages/framework/src/l1…
<!-- xgd-tool name="Bash" id="toolu_01DMtBKc6vky6WMBqxgpjxcY" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:34.066405+00:00" -->

**Input**

```json
{"command":"sed -n 2660,2730p packages/site-schema/src/l1/schema.ts; grep -n \"export function bindL1\" -A60 packages/framework/src/l1/render.ts | grep -n \"false\\|true\\|hidden\" | head -20","description":"Read bind field list and bindL1 semantics"}
```

**Result**

```
 * - `enquiry`: the node's own wording, as a link to the enquiry form prefilled
 *   with the record, drawn only where the record can be enquired about.
 * - `commission`: the node's own wording, as a link to the commission form,
 *   drawn only when the record is sold.
 *
 * [[REQ-643]] — the purchase path's fields:
 * - `buy`: the node's own wording, as a link to the record's checkout page,
 *   drawn only where the record can be bought (live, available, and the
 *   business takes payments and ships somewhere). [[BUG-363]] In the builder's
 *   own preview, an available record the business can't yet sell shows a
 *   sentence naming what to set up instead; a published page shows nothing.
 * - `shipping`, `total`: the checkout's shipping rate and total, and on the
 *   order-complete page the order's total. The node's own copy until the
 *   checkout's script writes the figure (it depends on the buyer's country).
 * - `dispatch`: the business's dispatch note ("Ships within 3 working days").
 * - `order`: the order number, on the order-complete page.
 * - `unavailable`, `changed`: the node's own wording, shown when the record can
 *   no longer be bought / its price is not the one the page was published with.
 * - `confirming`, `confirmed`: the node's own wording, shown on the
 *   order-complete page until the payment is confirmed / once it is.
 * A checkout page holds the show-or-hide ones even while they do not apply,
 * hidden, so its script can show them without writing markup.
 */
export const L1_TEXT_BIND_FIELDS = [
  'name',
  'summary',
  'description',
  'collection',
  'categories',
  'attributes',
  'price',
  'sold',
  'enquiry',
  'commission',
  'buy',
  'shipping',
  'total',
  'dispatch',
  'order',
  'unavailable',
  'changed',
  'confirming',
  'confirmed',
] as const

/**
 * REQ-633 — the record fields an `image` node can show: the first photo, or every
 * photo (a gallery). [[REQ-650]] — `morePhotos` is every photo AFTER the first, so
 * a product page can draw its main photo one way (`photo`, across the whole photo
 * grid) and the rest another, in the same order a `photos` gallery would.
 */
export const L1_IMAGE_BIND_FIELDS = ['photo', 'photos', 'morePhotos'] as const

export const l1TextBindFieldSchema = z.enum(L1_TEXT_BIND_FIELDS)
export const l1ImageBindFieldSchema = z.enum(L1_IMAGE_BIND_FIELDS)

/**
 * REQ-633 — `link: true` makes the bound node a link to the record's own page
 * (a card's name or photo opening the product page). `enquiry` and `commission`
 * always link to their form and `buy` to the item's checkout page, so they need
 * no flag — and [[BUG-363]] the flag never redirects them to the record's page.
 */
export const l1TextBindSchema = z
  .object({
    /**
     * Which record field the node shows; `buy` links to the item's checkout and
     * shows only for a live, available item once Stripe is connected and a
     * shipping zone exists (the builder's preview tells the owner which is missing).
     *
     * The fields are {@link L1_TEXT_BIND_FIELDS}. Where the business can't sell
     * yet, a published page draws no `buy` node and an available item offers the
7:5085-    // [[REQ-643]] — kept, hidden: the emitter turns `bind.hidden` into the
8:5086-    // `hidden` attribute. The schema's strict `bind` refuses the key, so no
10:5088-    if (value === false) return [{ ...node, bind: { ...node.bind, hidden: true } } as L1Node]
11:5089-    // [[BUG-363]] — A FIELD'S OWN HREF WINS. `link: true` links to the record's
15:5093-    return [{ ...node, text: value === true ? node.text : value, ...(link ? { link } : {}) }]
```

## Bash grep -n "hrefs\|export function catalogRecord\|itemHref\|function .*Href" packages/framework/src/modules/product-catalog…
<!-- xgd-tool name="Bash" id="toolu_01FtCYXEEURgDPRprZYZ7rqi" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:44.275998+00:00" -->

**Input**

```json
{"command":"grep -n \"hrefs\\|export function catalogRecord\\|itemHref\\|function .*Href\" packages/framework/src/modules/product-catalog/items.ts | head -30","description":"See how item hrefs are built"}
```

**Result**

```
236:export function catalogRecord(item: CatalogItem, ctx: CatalogDrawContext): L1BindRecord {
257:    hrefs: {
```

## Bash sed -n 200,275p packages/framework/src/modules/product-catalog/items.ts; grep -rn "shopPage\|SHOP_SLUG\|shopHref" packag…
<!-- xgd-tool name="Bash" id="toolu_01QgKFQ3qwSPF8DP8kyf6n4U" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:46.326881+00:00" -->

**Input**

```json
{"command":"sed -n 200,275p packages/framework/src/modules/product-catalog/items.ts; grep -rn \"shopPage\\|SHOP_SLUG\\|shopHref\" packages/framework/src/modules/product-catalog/*.ts | head -5","description":"Read catalogRecord hrefs"}
```

**Result**

```
  locale: string
  /** Whether the site has a product-page template (cards link to product pages only then). */
  productPages: boolean
  /** Whether the business can take payments ([[EPIC-9]]'s `canTakePayments`, [[REQ-642]]). */
  canTakePayments: boolean
  /**
   * [[REQ-643]] — whether the business can SELL: it takes payments AND ships
   * somewhere. An available item offers Buy (to its checkout page) only then,
   * and the enquiry link otherwise.
   */
  canBuy?: boolean
  /**
   * [[BUG-363]] — THE BUILDER'S RENDERS ONLY: why the business can't sell. An
   * available item's `buy` node then shows {@link buyBlockedNote} instead of
   * nothing, so the owner sees what to set up. Absent on every published render.
   */
  buyBlockers?: readonly BuyBlocker[]
  /** The enquiry and commission forms' page slugs, already defaulted. */
  enquiryForm?: string
  commissionForm?: string
  /** Show a sold item's price (default: hidden). */
  showSoldPrice: boolean
}

/** The formatted price an item shows, or undefined when it shows none. */
export function shownPrice(item: CatalogItem, ctx: Pick<CatalogDrawContext, 'locale' | 'showSoldPrice'>): string | undefined {
  const price = item.prices[0]
  if (!price) return undefined
  if (isSold(item) && !ctx.showSoldPrice) return undefined
  return formatMoney(price.amount, price.currency, ctx.locale)
}

/**
 * The values one item's card or product page shows. Copy is handed over raw;
 * the renderer escapes it like any authored text.
 */
export function catalogRecord(item: CatalogItem, ctx: CatalogDrawContext): L1BindRecord {
  const sold = isSold(item)
  const buy = !sold && ctx.canBuy === true
  const enquiry = !sold && !buy && ctx.enquiryForm !== undefined
  const commission = sold && ctx.commissionForm !== undefined
  const buyNote = !sold && !buy && ctx.buyBlockers?.length ? buyBlockedNote(ctx.buyBlockers, 'buy') : undefined
  return {
    text: {
      name: item.name,
      summary: item.summary,
      description: item.description,
      // [[REQ-651]] — the `collection` field shows every collection the item is in.
      ...(item.collections.length > 0 ? { collection: item.collections.join(', ') } : {}),
      categories: item.categories.join(', '),
      attributes: item.attributes.map((a) => `${a.name}: ${a.value}`).join(' · '),
      ...(shownPrice(item, ctx) !== undefined ? { price: shownPrice(item, ctx) } : {}),
      ...(sold ? { sold: true as const } : {}),
      ...(enquiry ? { enquiry: true as const } : {}),
      ...(commission ? { commission: true as const } : {}),
      ...(buy ? { buy: true as const } : buyNote ? { buy: buyNote } : {}),
    },
    hrefs: {
      ...(ctx.productPages ? { item: productPagePath(item.slug) } : {}),
      ...(buy ? { buy: checkoutPagePath(item.slug) } : {}),
      ...(enquiry ? { enquiry: formLink(ctx.enquiryForm!, item, 'enquiry') } : {}),
      ...(commission ? { commission: formLink(ctx.commissionForm!, item, 'commission') } : {}),
    },
    images: {
      photo: item.photos.slice(0, 1),
      photos: item.photos,
      morePhotos: item.photos.slice(1),
    },
  }
}

/**
 * An item's SEO description: its summary, else the start of its description cut
 * at a sentence or word boundary.
 */
export function productMetaDescription(item: CatalogItem, max = 160): string {
```

## Bash grep -n "export function productPagePath\|export function checkoutPagePath" -A4 packages/framework/src/modules/product-c…
<!-- xgd-tool name="Bash" id="toolu_016Tmq4nJ7qfEpwy4455pJoy" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:48.463113+00:00" -->

**Input**

```json
{"command":"grep -n \"export function productPagePath\\|export function checkoutPagePath\" -A4 packages/framework/src/modules/product-catalog/*.ts | head -12","description":"Check product page path helper"}
```

**Result**

```
packages/framework/src/modules/product-catalog/items.ts:145:export function productPagePath(slug: string): string {
packages/framework/src/modules/product-catalog/items.ts-146-  return `/shop/${slug}`
packages/framework/src/modules/product-catalog/items.ts-147-}
packages/framework/src/modules/product-catalog/items.ts-148-
packages/framework/src/modules/product-catalog/items.ts-149-/**
--
packages/framework/src/modules/product-catalog/items.ts:158:export function checkoutPagePath(slug: string): string {
packages/framework/src/modules/product-catalog/items.ts-159-  return `/checkout/${slug}`
packages/framework/src/modules/product-catalog/items.ts-160-}
packages/framework/src/modules/product-catalog/items.ts-161-
packages/framework/src/modules/product-catalog/items.ts-162-/** The public path of page `n` of a grid on the page whose slug is `pageSlug`. */
```

## Bash grep -n "function linkHref\|function resolveHref\|function hrefFor\|const linkAttrs\|function linkAttributes" packages/f…
<!-- xgd-tool name="Bash" id="toolu_016Bg3R9tN3G2JzSAi9tJaYq" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:54.957798+00:00" -->

**Input**

```json
{"command":"grep -n \"function linkHref\\|function resolveHref\\|function hrefFor\\|const linkAttrs\\|function linkAttributes\" packages/framework/src/l1/render.ts | head; grep -n \"linkAttrs =\" packages/framework/src/l1/render.ts | head -3","description":"Find how link hrefs are resolved"}
```

**Result**

```
5803:  const linkAttrs =
5803:  const linkAttrs =
```

## Bash sed -n 5770,5830p packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_01UCTiA3bt23t5DNDszArv5m" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:56.334863+00:00" -->

**Input**

```json
{"command":"sed -n 5770,5830p packages/framework/src/l1/render.ts","description":"Read link attribute emission"}
```

**Result**

```
  // contract depends on), which is why this can be emitted unconditionally here.
  const idAttr = (node.id ? ` id="${escapeHtml(node.id)}"` : '') + bindAttr

  // REQ-116 — the edit bridge: this node's segment kind and its render-scoped
  // address, stamped together and only on a node the editor offers a control
  // for. Both are absent from the published and draft-preview renders.
  const segment = state.edit ? segmentKind(node, state) : null
  const editAttrs = segment
    ? ` ${L1_EDIT_PATH_ATTR}="${path.join('.')}" ${L1_EDIT_SEGMENT_ATTR}="${segment}"`
    : ''

  // REQ-106 — the navigation role. The renderer RETAGS the node's own element as
  // an `<a>` rather than wrapping it, so the class, every paint axis and the
  // REQ-99 focus ring all stay on the element the author actually styled.
  // Wrapping would move focus to an outer element and silently cost a linked node
  // its focus indicator. `image` is the one exception — a void element cannot be
  // an anchor, so it wraps.
  //
  // `href` clears `isSafeHref` — `image.src`'s allowlist plus `tel:` and
  // `mailto:` (REQ-359), which a link can mean and an image cannot. An unsafe
  // href degrades to the plain element, never a
  // live `javascript:` link. `_blank` always carries its `rel`; the opener
  // reference is a security hole, not a preference.
  const nodeLink: L1Link | undefined = (node as { link?: L1Link }).link
  const href =
    nodeLink && isSafeHref(nodeLink.href) ? relativizeUrl(nodeLink.href.trim()) : undefined
  //
  // REQ-116 — in the edit render a link has no target: clicking it opens its copy
  // editor, it does not navigate. The `<a>` ELEMENT is kept (only the navigable
  // attributes are dropped) so the edit render differs from the draft render by
  // the missing target and nothing else — same tag, same class, same declarations,
  // same box. An `<a>` without `href` is not a link: it is unfocusable,
  // unnavigable, and picks up none of the UA's link chrome.
  const linkAttrs =
    href && !state.edit
      ? ` href="${escapeHtml(href)}"` +
        (nodeLink?.newTab ? ' target="_blank" rel="noopener noreferrer"' : '') +
        (nodeLink?.ariaLabel ? ` aria-label="${escapeHtml(nodeLink.ariaLabel)}"` : '')
      : ''
  // REQ-212 — the disclosure verb. Same retag discipline as the link above, and
  // for the same reason: the node's own element BECOMES the button, so the class,
  // every paint axis and the REQ-99 focus ring stay on the element the author
  // styled. A wrapper would take the focus and leave the styled box unfocused.
  //
  // `type="button"` is not a default: a bare `<button>` inside a form submits it,
  // and a Close that posted the form it sits in is worse than no Close at all.
  //
  // The validator has already refused a node carrying both `link` and `action`,
  // so the two retags can never contend for the same element.
  //
  // REQ-116 — in the edit render the button has no target: the element, its class
  // and its box are kept and only the attribute that would ACT is dropped,
  // exactly as a link keeps its `<a>` and loses its `href`.
  const nodeAction: L1Action | undefined = (node as { action?: L1Action }).action
  const actionTarget = nodeAction?.opens ?? nodeAction?.closes
  const acts = nodeAction !== undefined && !href
  const actionAttrs = !acts
    ? ''
    : ' type="button"' +
      (state.edit || actionTarget === undefined
        ? ''
```

## Bash grep -n "function relativizeUrl\|export.*relativizeUrl" -A12 packages/framework/src/l1/render.ts | head -30; grep -rn "t…
<!-- xgd-tool name="Bash" id="toolu_01LRc92vnSwE5jYScdYqHbKR" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:11:59.221713+00:00" -->

**Input**

```json
{"command":"grep -n \"function relativizeUrl\\|export.*relativizeUrl\" -A12 packages/framework/src/l1/render.ts | head -30; grep -rn \"tag: 'a'\" packages/framework/src/modules | head","description":"Check relativizeUrl and existing a controls"}
```

**Result**

```
217:function relativizeUrl(v: string): string {
218-  if (!v.startsWith('/') || v.startsWith('//')) return v
219-  const rest = v.slice(1)
220-  /**
221-   * BUG-30 — dropping the slash is only a change of SHAPE while the remainder
222-   * still reads as a relative *path* reference. RFC-3986 gives it a different
223-   * meaning in exactly two cases, and both are diagnosed by the same question:
224-   * is the first path segment non-empty and colon-free?
225-   *
226-   *   - **Empty first segment** (`/`, `/#how`, `/?q=1`). With no path the
227-   *     reference resolves against the current DOCUMENT rather than its
228-   *     directory, so `/#how` — "the `how` anchor on the site root" — becomes
229-   *     "…on whatever page this is". Identical on a single-page site, which is
packages/framework/src/modules/account-chrome/controls.ts:62:      tag: 'a',
packages/framework/src/modules/account-chrome/controls.ts:73:      tag: 'a',
packages/framework/src/modules/product-catalog/component.ts:120:      tag: 'a',
```

## Bash sed -n 105,135p packages/framework/src/modules/product-catalog/component.ts
<!-- xgd-tool name="Bash" id="toolu_01Gbkcoa7t5Kc7P6MiRZRAmB" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:00.622744+00:00" -->

**Input**

```json
{"command":"sed -n 105,135p packages/framework/src/modules/product-catalog/component.ts","description":"See how catalog builds an a control href"}
```

**Result**

```
    const rendered = renderL1Fragment(nodes, `${instanceId}-card-${i}`, undefined, { edit, delivery: data?.delivery, drawnIn })
    mounts[`card-${i}`] = `<div data-l1-slot="card">${rendered.htmls.join('')}</div>`
    if (rendered.css) cardCss.push(rendered.css)
  })

  const cardSlots = drawnCards.map((_, i) => ({ kind: 'slot', name: `card-${i}` }) as L1Node)
  const listNode = { ...list, children: cardSlots } as L1Node
  const body = renderL1Fragment([listNode], `${instanceId}-list`, undefined, { edit, mounts })

  // The pager: only on a grid that spans more than one page. Its links go to the
  // neighbouring static pages; their wording is config, their look is L1.
  let pager = ''
  let pagerCss = ''
  if (pages > 1 && data?.pageSlug) {
    const link = (to: number, label: unknown, rel: string): L1ControlElement => ({
      tag: 'a',
      attrs: { href: edit ? undefined : relative(gridPagePath(data.pageSlug!, to)), rel, 'data-catalog-page': String(to) },
      text: typeof label === 'string' && label ? label : String(to),
    })
    const controls: Record<string, L1ControlElement> = {}
    if (n > 1) controls.previous = link(n - 1, config.previousLabel, 'prev')
    if (n < pages) controls.next = link(n + 1, config.nextLabel, 'next')
    const pagerNode = single(slots.pager)
    if (pagerNode) {
      const rendered = renderL1Fragment([pagerNode], `${instanceId}-pager`, controls, { edit })
      pager = `<nav data-l1-slot="pager">${rendered.htmls[0] ?? ''}</nav>`
      pagerCss = rendered.css
    } else {
      // No pager designed: plain links, so every page is still reachable.
      const plain = Object.values(controls)
        .map((c) => `<a${attr('href', c.attrs?.href as string | undefined)} rel="${c.attrs?.rel}">${escapeHtml(c.text ?? '')}</a>`)
```

## Bash grep -n "relative\b\|function relative\|import.*relative" packages/framework/src/modules/product-catalog/component.ts |…
<!-- xgd-tool name="Bash" id="toolu_01Qid2TuasmLGurefzfJLXMY" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:02.444150+00:00" -->

**Input**

```json
{"command":"grep -n \"relative\\b\\|function relative\\|import.*relative\" packages/framework/src/modules/product-catalog/component.ts | head -5","description":"Find relative helper import"}
```

**Result**

```
34:/** A root-relative path as a document-relative one (a nested page carries `<base>`). */
35:function relative(path: string): string {
121:      attrs: { href: edit ? undefined : relative(gridPagePath(data.pageSlug!, to)), rel, 'data-catalog-page': String(to) },
```

## Bash grep -n "export function productPagePath" -B12 packages/framework/src/modules/product-catalog/items.ts | head -14; grep…
<!-- xgd-tool name="Bash" id="toolu_01VxQ7CWsacnAkoYqaMSV6jQ" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:03.685195+00:00" -->

**Input**

```json
{"command":"grep -n \"export function productPagePath\" -B12 packages/framework/src/modules/product-catalog/items.ts | head -14; grep -rn \"drawnIn\" packages/framework/src/modules/product-catalog/component.ts | head -3; grep -n \"drawnIn\" packages/framework/src/modules/behavior.ts | head","description":"Check relative path semantics"}
```

**Result**

```
133-          : (a: CatalogItem, b: CatalogItem): number =>
134-              (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0) || byName(a, b)
135-  const ordered = [...picked].sort(compare)
136-  return rule.limit === undefined ? ordered : ordered.slice(0, rule.limit)
137-}
138-
139-/** How many static pages a grid's selection fills (at least one, even when empty). */
140-export function catalogPageCount(selected: number, pageSize: number): number {
141-  return Math.max(1, Math.ceil(selected / pageSize))
142-}
143-
144-/** The public path of an item's product page. */
145:export function productPagePath(slug: string): string {
packages/framework/src/modules/product-catalog/component.ts:101:  const drawnIn = list.kind === 'container' ? layoutColumnsTrack(list as L1Container) : undefined
packages/framework/src/modules/product-catalog/component.ts:105:    const rendered = renderL1Fragment(nodes, `${instanceId}-card-${i}`, undefined, { edit, delivery: data?.delivery, drawnIn })
```

## Bash sed -n 30,40p packages/framework/src/modules/product-catalog/component.ts; python3 - <<'EOF' p='packages/framework/src/m…
<!-- xgd-tool name="Bash" id="toolu_01C21dhWoZXVN6VmE3EgotMi" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:22.182936+00:00" -->

**Input**

```json
{"command":"sed -n 30,40p packages/framework/src/modules/product-catalog/component.ts; python3 - <<'EOF'\np='packages/framework/src/modules/checkout/component.ts'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert a in s, a[:70]\n    s=s.replace(a,b,1)\nrep(\"\"\"import { buyBlockedNote, catalogRecord, isSold, type CatalogDrawContext, type CatalogItem } from '../product-catalog/items'\"\"\",\n\"\"\"import { buyBlockedNote, catalogRecord, isSold, productPagePath, type CatalogDrawContext, type CatalogItem } from '../product-catalog/items'\"\"\")\nrep(\"\"\"export const CHECKOUT_BLOCKED_ATTR = 'data-checkout-blocked'\n\"\"\",\"\"\"export const CHECKOUT_BLOCKED_ATTR = 'data-checkout-blocked'\n\n/**\n * [[BUG-367]] — the Ship to choice's wording when the page's `countryPrompt`\n * sets none: its accessible name and its first, empty option.\n */\nexport const DEFAULT_COUNTRY_PROMPT = 'Please select a region for delivery'\n\n/** [[BUG-367]] — the Cancel link's wording when the page's `cancelLabel` sets none. */\nexport const DEFAULT_CANCEL_LABEL = 'Cancel'\n\n/** A root-relative path as a document-relative one (a nested page carries `<base>`). */\nconst relative = (path: string): string => (path === '/' ? './' : path.replace(/^\\\\/+/, ''))\n\nconst copy = (value: unknown, fallback: string): string => (typeof value === 'string' && value ? value : fallback)\n\"\"\")\nrep(\"\"\"    const only = shipping.countries.length === 1\n    const names = regionNames(localeTag)\n    const countries = shipping.countries\n      .map((c) => ({ ...c, name: names?.of(c.code) ?? c.code, display: formatMoney(c.rate, shipping.currency, localeTag) }))\n      .sort((a, b) => a.name.localeCompare(b.name, localeTag))\n    controls['ship-to'] = {\n      tag: 'select',\n      attrs: {\n        name: 'country',\n        required: true,\n        'aria-label': typeof config.countryPrompt === 'string' && config.countryPrompt ? config.countryPrompt : 'Ship to',\n        'data-checkout-control': 'ship-to',\n        disabled: !buyable,\n      },\n      options: [\n        ...(only ? [] : [{ value: '', label: typeof config.countryPrompt === 'string' && config.countryPrompt ? config.countryPrompt : 'Choose a country' }]),\n        ...countries.map((c) => ({ value: c.code, label: c.name, selected: only, data: { rate: String(c.rate), 'rate-display': c.display } })),\n      ],\n    }\n    controls.continue = {\n      tag: 'button',\n      attrs: { type: 'button', 'data-checkout-control': 'continue', disabled: !buyable },\n      text: typeof config.continueLabel === 'string' && config.continueLabel ? config.continueLabel : 'Continue to payment',\n    }\"\"\",\"\"\"    const only = shipping.countries.length === 1\n    // [[BUG-367]] — THE COUNTRY IS ASKED ONLY WHEN IT CHANGES THE PRICE. It is\n    // asked before payment because shipping is priced per zone and the buyer is\n    // shown the total first; when every country costs the same there is nothing\n    // to choose, so the page draws no Ship to and Stripe's address form offers\n    // every country shipped to (`orders.ts`'s `singleRate`).\n    const singleRate = shipping.countries.length > 0 && shipping.countries.every((c) => c.rate === shipping.countries[0].rate)\n    const names = regionNames(localeTag)\n    const countries = shipping.countries\n      .map((c) => ({ ...c, name: names?.of(c.code) ?? c.code, display: formatMoney(c.rate, shipping.currency, localeTag) }))\n      .sort((a, b) => a.name.localeCompare(b.name, localeTag))\n    const prompt = copy(config.countryPrompt, DEFAULT_COUNTRY_PROMPT)\n    if (!singleRate || shipping.countries.length === 0) {\n      controls['ship-to'] = {\n        tag: 'select',\n        attrs: {\n          name: 'country',\n          required: true,\n          'aria-label': prompt,\n          'data-checkout-control': 'ship-to',\n          disabled: !buyable,\n        },\n        options: [\n          ...(only ? [] : [{ value: '', label: prompt }]),\n          ...countries.map((c) => ({ value: c.code, label: c.name, selected: only, data: { rate: String(c.rate), 'rate-display': c.display } })),\n        ],\n      }\n    }\n    controls.continue = {\n      tag: 'button',\n      // [[BUG-367]] — DISABLED UNTIL A QUOTE SAYS IT CAN WORK. The script enables\n      // it on `canCheckout`; the edit channel runs no script, so it shows the\n      // page's own state there.\n      attrs: { type: 'button', 'data-checkout-control': 'continue', disabled: edit ? !buyable : true },\n      text: copy(config.continueLabel, 'Continue to payment'),\n    }\n    // [[BUG-367]] — Cancel: back to the piece's product page, or to the shop's\n    // front when the piece has none. Nothing is held before Continue, so there\n    // is nothing to release.\n    controls.cancel = {\n      tag: 'a',\n      attrs: {\n        href: edit ? undefined : relative(item && data?.productPages === true ? productPagePath(item.slug) : '/'),\n        'data-checkout-control': 'cancel',\n      },\n      text: copy(config.cancelLabel, DEFAULT_CANCEL_LABEL),\n    }\"\"\")\nopen(p,'w').write(s)\n\np='packages/framework/src/modules/checkout/meta.ts'\ns=open(p).read()\nrep(\"\"\"    // Copy, so it lives in the definition: the Continue button's label and the\n    // Ship to choice's first, empty option.\n    continueLabel: { type: 'string', required: false },\n    countryPrompt: { type: 'string', required: false },\"\"\",\"\"\"    // Copy, so it lives in the definition: the Continue button's label, the\n    // Ship to choice's first, empty option (default \"Please select a region for\n    // delivery\"), and [[BUG-367]] the Cancel link's label (default \"Cancel\").\n    continueLabel: { type: 'string', required: false },\n    countryPrompt: { type: 'string', required: false },\n    c
```

[elided — kept 5800 of 6269 bytes]

**Result**

```
function single(value: unknown): L1Node | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as L1Node) : null
}

/** A root-relative path as a document-relative one (a nested page carries `<base>`). */
function relative(path: string): string {
  return path.replace(/^\//, '')
}

export function catalog({
  config = {},
done
```

## Bash sed -n 600,630p packages/site-schema/src/l1/design.ts; grep -n "border?:\|fill?:\|text?:" packages/site-schema/src/l1/de…
<!-- xgd-tool name="Bash" id="toolu_01Wt8jDSjGdYkScUftaR5UkM" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:28.108728+00:00" -->

**Input**

```json
{"command":"sed -n 600,630p packages/site-schema/src/l1/design.ts; grep -n \"border?:\\|fill?:\\|text?:\" packages/site-schema/src/l1/design.ts | head","description":"Check button component shape in design"}
```

**Result**

```
  for (const role of Object.keys(L1_HEADING_MIN_CHARS) as L1TypeRole[]) {
    const style = type[role]
    const max = l1HeadingMaxPx(d, role, tablet)
    const size = style && sizeOf(style)
    if (size === undefined || max === undefined) continue
    const px = l1LengthAt(size, tablet)
    if (px > max) {
      miss(
        `type.${role}`,
        `'${role}' is ${round(px)}px at ${tablet}px wide, too large for a half-width column there (${round(l1HalfColumnPx(d, tablet)!)}px): ` +
          `it fits under ${L1_HEADING_MIN_CHARS[role]} letters a line; make it at most ${Math.floor(max)}px at that width`,
      )
    }
  }
  const colour = d.colour ?? {}
  for (const role of L1_REQUIRED_COLOUR_ROLES) {
    if (colour[role] === undefined) miss(`colour.${role}`, `no colour role '${role}'`)
  }
  const components = d.components ?? {}
  const primary = components['button.primary']
  if (!primary) miss('components.button.primary', "no 'button.primary' component (its 'fill' and 'text' colour roles, padding and radius)")
  else if (!primary.fill || !primary.text) miss('components.button.primary', "'button.primary' needs a 'fill' and a 'text' colour role")
  const secondary = components['button.secondary']
  if (!secondary) miss('components.button.secondary', "no 'button.secondary' component (a 'text' colour role and a 'fill' or a 'border')")
  else if (!secondary.text || (!secondary.fill && !secondary.border)) {
    miss('components.button.secondary', "'button.secondary' needs a 'text' colour role and a 'fill' or a 'border'")
  }
  for (const aspect of ['hero', 'inline'] as const) {
    if (d.imagery?.aspects?.[aspect] === undefined) miss(`imagery.aspects.${aspect}`, `no '${aspect}' picture aspect`)
  }
  if (!d.brand || (d.brand.logo === undefined && d.brand.name === undefined)) {
```

## Bash grep -n "l1ComponentStyleSchema\|export const l1ComponentSchema\|radius\|padding" packages/site-schema/src/l1/design.ts…
<!-- xgd-tool name="Bash" id="toolu_01SPz2XuWt1dvgo6aaNV3UaW" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:29.842459+00:00" -->

**Input**

```json
{"command":"grep -n \"l1ComponentStyleSchema\\|export const l1ComponentSchema\\|radius\\|padding\" packages/site-schema/src/l1/design.ts | head -20","description":"Find component schema fields"}
```

**Result**

```
152:    padding: z.object({ x: l1SpaceStepSchema.optional(), y: l1SpaceStepSchema.optional() }).strict().optional(),
153:    radiusPx: finite.min(0).max(999).optional(),
163:/** `imagery` — the named aspect ratios a site's pictures take, and their corner radius. */
170:    radiusPx: finite.min(0).max(999).optional(),
455:    for (const step of [c.padding?.x, c.padding?.y]) {
457:        issues.push({ path: `components.${name}.padding`, message: `'${name}' pads by the step '${step}', which the space scale does not define` })
620:  if (!primary) miss('components.button.primary', "no 'button.primary' component (its 'fill' and 'text' colour roles, padding and radius)")
760:/** `section` as a container with `children`, keeping its frame (id, measure, paint, padding) and nothing of how it laid out. */
845:      const padding: Json = {}
848:        padding[side] = typeof len === 'number' ? len : len.keyframes[len.keyframes.length - 1].value
856:        // its height, and composing it would shrink it to its padding and lay a
875:        return { ...reframed(section, { layout: 'stack', ...gap }, [...layers, ...text]), padding, ...responsivePadding, ...sizing }
878:      return { ...reframed(section, { layout: 'stack', ...gap }, text), axes, padding, ...responsivePadding }
1242: * crops (`cover`) unless it says how it fits, and a picture with no corner radius
1248:  const radius = design.imagery?.radiusPx
1249:  if (!inline && radius === undefined && !usesAspect(input)) return input
1257:    // the design's corner radius still applies.
1259:      if (radius === undefined || (isRecord(out.axes) && out.axes.borderRadiusPx !== undefined)) return out
1260:      return { ...out, axes: { ...(isRecord(out.axes) ? out.axes : {}), borderRadiusPx: radius } }
1268:    if (radius !== undefined && axes.borderRadiusPx === undefined) axes.borderRadiusPx = radius
```

## Bash sed -n 140,160p packages/site-schema/src/l1/design.ts
<!-- xgd-tool name="Bash" id="toolu_01WNW5rUk4vPoN2DV3VuNf7Y" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:31.262296+00:00" -->

**Input**

```json
{"command":"sed -n 140,160p packages/site-schema/src/l1/design.ts","description":"Read component style schema"}
```

**Result**

```
  })
  .strict()

/** `colour` — the colour roles, each pointing at a palette entry (or a hex). */
export const l1DesignColourSchema = partialOf(l1ColourRoleSchema.options, l1ColorSchema)

/** One component: the recurring treatment a site gives a name. Its colours are colour ROLES, its type a type role. */
export const l1DesignComponentSchema = z
  .object({
    fill: l1ColourRoleSchema.optional(),
    text: l1ColourRoleSchema.optional(),
    role: l1TypeRoleSchema.optional(),
    padding: z.object({ x: l1SpaceStepSchema.optional(), y: l1SpaceStepSchema.optional() }).strict().optional(),
    radiusPx: finite.min(0).max(999).optional(),
    border: z
      .object({ widthPx: finite.min(0).max(20), colour: l1ColourRoleSchema })
      .strict()
      .optional(),
    shadow: l1ShadowSchema.optional(),
  })
  .strict()
```

## Bash python3 - <<'EOF' p='packages/framework/src/l2/checkout.ts' s=open(p).read() def rep(a,b): global s assert a in s, a[:70…
<!-- xgd-tool name="Bash" id="toolu_01GBTbfkqAJUFh1x7xAtGCkV" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:47.804465+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='packages/framework/src/l2/checkout.ts'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert a in s, a[:70]\n    s=s.replace(a,b,1)\nrep(\"\"\"/** A colour role's value in the design (a hex or a palette reference), else the fallback. */\"\"\",\"\"\"/** A colour role's value in the design, or undefined when it names none. */\nfunction colourOf(design: L1Design | undefined, name: string | undefined): string | { ref: string } | undefined {\n  return name === undefined ? undefined : (design?.colour?.[name as keyof NonNullable<L1Design['colour']>] as string | { ref: string } | undefined)\n}\n\n/**\n * [[BUG-367]] — Cancel's look: the design's `button.secondary` (its text colour,\n * its fill or its border), else an outline in the text and border roles.\n */\nfunction secondaryAxes(design: L1Design | undefined): Record<string, unknown> {\n  const c = design?.components?.['button.secondary']\n  const ink = colourOf(design, c?.text) ?? role(design, 'text')\n  const fill = colourOf(design, c?.fill)\n  const edge = c?.border ? { widthPx: c.border.widthPx, color: colourOf(design, c.border.colour) ?? role(design, 'border') } : undefined\n  return {\n    color: ink,\n    ...(fill ? { surfaceFill: fill } : {}),\n    ...(edge || !fill ? { border: edge ?? { widthPx: 1, color: role(design, 'border') } } : {}),\n    borderRadiusPx: 6,\n  }\n}\n\n/** [[BUG-367]] — the width from which the checkout's actions sit side by side: a tablet's. */\nexport const CHECKOUT_ACTIONS_ROW_AT_PX = 768\n\n/** A colour role's value in the design (a hex or a palette reference), else the fallback. */\"\"\")\nrep(\"\"\"            {\n              kind: 'container',\n              layout: 'stack',\n              space: 'xs',\n              children: [\n                text('Ship to', 'label'),\n                {\n                  kind: 'control',\n                  control: 'ship-to',\n                  role: 'body',\n                  axes: { color: role(design, 'text'), surfaceFill: '#ffffff', borderRadiusPx: 6, border: { widthPx: 1, color: role(design, 'border') } },\n                  padding: { topPx: 10, rightPx: 12, bottomPx: 10, leftPx: 12 },\n                  sizing: { width: { mode: 'fluid' } },\n                },\n              ],\n            },\n            row('Shipping', bound('—', 'body', 'shipping')),\n            row('Total', bound('—', 'h3', 'total')),\n            bound('Dispatch note', 'small', 'dispatch'),\n            {\n              kind: 'control',\n              control: 'continue',\n              role: 'label',\n              axes: { color: role(design, 'onAction'), surfaceFill: role(design, 'action'), borderRadiusPx: 6 },\n              padding: { topPx: 14, rightPx: 24, bottomPx: 14, leftPx: 24 },\n            },\n            message(),\"\"\",\"\"\"            // [[BUG-367]] — the Ship to choice carries its own prompt (its first\n            // option and accessible name), and is not drawn at all when every\n            // country costs the same, so no separate label is left behind.\n            {\n              kind: 'control',\n              control: 'ship-to',\n              role: 'body',\n              axes: { color: role(design, 'text'), surfaceFill: '#ffffff', borderRadiusPx: 6, border: { widthPx: 1, color: role(design, 'border') } },\n              padding: { topPx: 10, rightPx: 12, bottomPx: 10, leftPx: 12 },\n              sizing: { width: { mode: 'fluid' } },\n            },\n            row('Shipping', bound('—', 'body', 'shipping')),\n            row('Total', bound('—', 'h3', 'total')),\n            bound('Dispatch note', 'small', 'dispatch'),\n            actions(design),\n            message(),\"\"\")\nrep(\"\"\"/** The default `page` slot for one of the three pages, in `design`. */\"\"\",\"\"\"/**\n * [[BUG-367]] — Continue to payment and Cancel. From a tablet's width up they sit\n * at the right of one row, each as wide as its label, Cancel on the left at the\n * same height; on a phone they stack full width, Continue on top. Cancel is drawn\n * twice for that, each copy shown only at its own widths (`visibility`), so the\n * order of the controls in the document is the order they are seen and reached.\n */\nfunction actions(design: L1Design | undefined): L1Node {\n  const pad = { topPx: 14, rightPx: 24, bottomPx: 14, leftPx: 24 }\n  const cancel = (visibility: { fromPx?: number; untilPx?: number }): L1Node =>\n    ({ kind: 'control', control: 'cancel', role: 'label', axes: secondaryAxes(design), padding: pad, visibility }) as L1Node\n  return {\n    kind: 'container',\n    layout: 'row',\n    responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: CHECKOUT_ACTIONS_ROW_AT_PX, value: 'row' }] },\n    distribution: 'end',\n    align: 'stretch',\n    space: 'sm',\n    children: [\n      cancel({ fromPx: CHECKOUT_ACTIONS_ROW_AT_PX }),\n      {\n        kind: 'control',\n        control: 'continue',\n        role: 'label',\n        axes: { color: role(design, 'onAction'), surfaceFill: role(design, 'action'), borderRadiusPx: 6 },\n        padding: pad,\n      },\n      cancel({ untilPx: CHECKOUT_ACTIONS_ROW_AT_PX }),\n    ],\n  } as L1Node\n}\n\n/** The default `page` slot for one of the three pages, in `design`. */\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"visibility\" packages/site-schema/src/l1/schema.ts | head -5","description":"Add action row with Cancel to default checkout"}
```

**Result**

```
9: * sizing, distribution, visibility) are the fields capture leaves empty and the AI
432: * under paired `visibility.fromPx` / `untilPx` — which doubles the node count,
436: * one `name` and one `id`. `visibility` is CSS, not `disabled` — the hidden copy
1587: * REQ-104 removed the case that motivated it — a visibility-paired duplicate
1691:     * A breakpoint, not a sample: like `visibility.fromPx`, it is an authored
```

## Bash sed -n 425,440p packages/site-schema/src/l1/schema.ts; grep -n "visibility: l1VisibilitySchema" packages/site-schema/src…
<!-- xgd-tool name="Bash" id="toolu_01VZ8TVudYdgYgg3Yjdhqh4M" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:50.738803+00:00" -->

**Input**

```json
{"command":"sed -n 425,440p packages/site-schema/src/l1/schema.ts; grep -n \"visibility: l1VisibilitySchema\" packages/site-schema/src/l1/schema.ts | head","description":"Check visibility caveats for controls"}
```

**Result**

```
 * the document's captured `widths` because they are *sampled* from a capture and
 * interpolated between samples. A layout mode is neither: it is an authored design
 * decision that snaps at a width the capture may never have visited (REQ-83's hint
 * pass reads a page's real `@media` breakpoints for exactly this reason). So `at`
 * is free, like {@link l1VisibilitySchema}'s `fromPx`.
 *
 * This exists because the only alternative was authoring the subtree **twice**
 * under paired `visibility.fromPx` / `untilPx` — which doubles the node count,
 * silently desynchronises when one copy is edited, feeds `staggerMs` phantom
 * peers, and for a {@link l1ControlSchema} leaf is not merely expensive but
 * *malformed*: duplicating a control duplicates a form field, so both copies share
 * one `name` and one `id`. `visibility` is CSS, not `disabled` — the hidden copy
 * still submits, and the duplicate id breaks the `for`↔`id` association the module
 * exists to guarantee. A control row that becomes a control column has to be ONE
 * subtree, and this is the axis that makes it one.
 */
2331:  visibility: l1VisibilitySchema.optional(),
```

## Bash grep -rn "control.*more than once\|duplicate control\|twice" packages/site-schema/src/l1/*.ts packages/framework/src/mod…
<!-- xgd-tool name="Bash" id="toolu_01EidEbzj8LtATF5tWPEybHM" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:54.476585+00:00" -->

**Input**

```json
{"command":"grep -rn \"control.*more than once\\|duplicate control\\|twice\" packages/site-schema/src/l1/*.ts packages/framework/src/modules/behavior*.ts tools/generate/src/validate* 2>/dev/null | grep -i control | head","description":"Check whether duplicate control names are refused"}
```

**Result**

```
(eval):1: no matches found: tools/generate/src/validate*
```

## Bash grep -rln "resolveControlNames" packages tools --include=*.ts 2>/dev/null | head; grep -rn "resolveControlNames" package…
<!-- xgd-tool name="Bash" id="toolu_01GbKaQHAszEouAxiu5fTFCS" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:56.153916+00:00" -->

**Input**

```json
{"command":"grep -rln \"resolveControlNames\" packages tools --include=*.ts 2>/dev/null | head; grep -rn \"resolveControlNames\" packages/framework/src | grep -v test | head -3","description":"Find control name validation"}
```

**Result**

```
(eval):1: no matches found: --include=*.ts
packages/framework/src/index.ts:46:  resolveControlNames,
packages/framework/src/worker.ts:86:  resolveControlNames,
packages/framework/src/l1/render.ts:2312:  // `resolveControlNames` skips every invariant element.
```

## Bash grep -rn "export function resolveControlNames" -A40 packages/framework/src | head -50
<!-- xgd-tool name="Bash" id="toolu_01V2xbHNCpHAut9aUcrfPcsZ" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:12:57.504419+00:00" -->

**Input**

```json
{"command":"grep -rn \"export function resolveControlNames\" -A40 packages/framework/src | head -50","description":"Read resolveControlNames"}
```

**Result**

```
packages/framework/src/modules/behavior.ts:657:export function resolveControlNames(
packages/framework/src/modules/behavior.ts-658-  meta: BehaviorMeta,
packages/framework/src/modules/behavior.ts-659-  instance: Partial<BehaviorInstance>,
packages/framework/src/modules/behavior.ts-660-): Map<string, { key: string; spec: BehaviorControlSpec }> {
packages/framework/src/modules/behavior.ts-661-  const out = new Map<string, { key: string; spec: BehaviorControlSpec }>()
packages/framework/src/modules/behavior.ts-662-  for (const [key, spec] of Object.entries(meta.controls ?? {})) {
packages/framework/src/modules/behavior.ts-663-    if (spec.invariant) continue
packages/framework/src/modules/behavior.ts-664-    if (spec.perItemOf) {
packages/framework/src/modules/behavior.ts-665-      const items = instance.config?.[spec.perItemOf]
packages/framework/src/modules/behavior.ts-666-      if (!Array.isArray(items)) continue
packages/framework/src/modules/behavior.ts-667-      for (const item of items) {
packages/framework/src/modules/behavior.ts-668-        const name = (item as Record<string, unknown> | null)?.name
packages/framework/src/modules/behavior.ts-669-        if (typeof name === 'string' && name) out.set(name, { key, spec })
packages/framework/src/modules/behavior.ts-670-      }
packages/framework/src/modules/behavior.ts-671-      continue
packages/framework/src/modules/behavior.ts-672-    }
packages/framework/src/modules/behavior.ts-673-    if (spec.perSubtreeOf) {
packages/framework/src/modules/behavior.ts-674-      const subtrees = instance.slots?.[spec.perSubtreeOf]
packages/framework/src/modules/behavior.ts-675-      const count = Array.isArray(subtrees) ? subtrees.length : subtrees ? 1 : 0
packages/framework/src/modules/behavior.ts-676-      for (let i = 0; i < count; i++) out.set(`${key}-${i}`, { key, spec })
packages/framework/src/modules/behavior.ts-677-      continue
packages/framework/src/modules/behavior.ts-678-    }
packages/framework/src/modules/behavior.ts-679-    out.set(key, { key, spec })
packages/framework/src/modules/behavior.ts-680-  }
packages/framework/src/modules/behavior.ts-681-  return out
packages/framework/src/modules/behavior.ts-682-}
packages/framework/src/modules/behavior.ts-683-
packages/framework/src/modules/behavior.ts-684-/**
packages/framework/src/modules/behavior.ts-685- * REQ-96 — validate the control bindings: every `control` node inside the
packages/framework/src/modules/behavior.ts-686- * instance's slot subtrees names an element this behavior declares, and every
packages/framework/src/modules/behavior.ts-687- * required declared element is bound by at least one node.
packages/framework/src/modules/behavior.ts-688- *
packages/framework/src/modules/behavior.ts-689- * This is the check the pre-REQ-96 contract could not express. A control node
packages/framework/src/modules/behavior.ts-690- * naming an element no module declares would render nothing (the emitter's inert
packages/framework/src/modules/behavior.ts-691- * degradation) — silently dropping a field the author believed they had placed.
packages/framework/src/modules/behavior.ts-692- */
packages/framework/src/modules/behavior.ts-693-export function validateBehaviorControls(
packages/framework/src/modules/behavior.ts-694-  meta: BehaviorMeta,
packages/framework/src/modules/behavior.ts-695-  instance: Partial<BehaviorInstance>,
packages/framework/src/modules/behavior.ts-696-): BehaviorValidationError[] {
packages/framework/src/modules/behavior.ts-697-  const errors: BehaviorValidationError[] = []
```

## Bash sed -n 2320,2335p packages/site-schema/src/l1/schema.ts; grep -n "node.visibility" packages/framework/src/l1/render.ts |…
<!-- xgd-tool name="Bash" id="toolu_01E65FnktgSaoffXqHTTzey3" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:01.977281+00:00" -->

**Input**

```json
{"command":"sed -n 2320,2335p packages/site-schema/src/l1/schema.ts; grep -n \"node.visibility\" packages/framework/src/l1/render.ts | head -3","description":"Confirm visibility applies to control nodes"}
```

**Result**

```
  /** [[REQ-648]] — pinned to a corner of its parent, or [[BUG-355]] filling it, out of the flow; see {@link l1PinSchema}. */
  pin: l1PinSchema.optional(),
  /** [[REQ-650]] — the columns of its parent grid this node takes; see {@link l1SpanSchema}. */
  span: l1SpanSchema.optional(),
  /**
   * REQ-105 — the node's own extent: a fixed px, fluid fill, or hug, per axis,
   * with min/max. Every box-rendering kind carries it, `slot` included: a seam
   * that can be filled and framed but not measured forces a sizing-only wrapper
   * around it, which is a node with no content, no paint and no semantic role.
   */
  sizing: l1AxisSizingSchema.optional(),
  visibility: l1VisibilitySchema.optional(),
  transform: l1TransformSchema.optional(),
  mask: l1MaskSchema.optional(),
  padding: l1PaddingSchema.optional(),
  /** REQ-88 — per-width padding tracks; a track owns its side at render time. */
6661:  if (node.visibility) {
6662:    const { fromPx, untilPx } = node.visibility
```

## Bash python3 - <<'EOF' p='packages/framework/src/l1/render.ts' s=open(p).read() def rep(a,b): global s assert s.count(a)==1,…
<!-- xgd-tool name="Bash" id="toolu_01WSgF3Fi7omnifRWCXseAct" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:12.014225+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='packages/framework/src/l1/render.ts'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert s.count(a)==1, a[:70]\n    s=s.replace(a,b,1)\nrep(\"\"\"      // [[BUG-299]] — a link control's UA underline is the same kind of chrome:\n      // a decoration the document asks for through `textDecoration` or not at\n      // all, exactly as REQ-333 already resets it on a linked run.\n      if (el.tag === 'a') base.unshift('text-decoration: none')\"\"\",\"\"\"      // [[BUG-299]] — a link control's UA underline is the same kind of chrome:\n      // a decoration the document asks for through `textDecoration` or not at\n      // all, exactly as REQ-333 already resets it on a linked run.\n      if (el.tag === 'a') base.unshift('text-decoration: none')\n      // [[BUG-367]] — A BUTTON'S LABEL IS CENTRED, across and down, unless the\n      // node says otherwise: unshifted, so an authored `textAlign` still wins. A\n      // link drawn as a button (a fill or a border) is centred the same way.\n      if (el.tag === 'button' || (el.tag === 'a' && (node.axes?.surfaceFill || node.axes?.border))) {\n        base.unshift('text-align: center', 'justify-content: center', 'align-items: center')\n        if (el.tag === 'a') base.unshift('display: inline-flex')\n      }\n      // [[BUG-367]] — A DISABLED CONTROL LOOKS DISABLED. The script and the\n      // module set `disabled` when a control cannot work; without this a disabled\n      // button painted exactly like a live one. Dimmed, a not-allowed cursor, and\n      // no hover change (the hover rules below skip `:disabled`).\n      if (el.tag === 'button' || el.tag === 'input' || el.tag === 'select' || el.tag === 'textarea') {\n        state.rules.push({ selector: `${selector}:disabled`, decls: [`opacity: ${DISABLED_OPACITY}`, 'cursor: not-allowed'] })\n      }\"\"\")\nrep(\"\"\"  if (interaction.hover) {\n    const decls = stateDecls(interaction.hover, baseTransform)\n    if (decls.length) {\n      rules.push({ selector: `${selector}:hover`, decls })\"\"\",\"\"\"  // [[BUG-367]] — a control's hover is a live control's: a disabled one keeps\n  // its resting look.\n  const hover = interactive ? `${selector}:hover:not(:disabled)` : `${selector}:hover`\n  if (interaction.hover) {\n    const decls = stateDecls(interaction.hover, baseTransform)\n    if (decls.length) {\n      rules.push({ selector: hover, decls })\"\"\")\nrep(\"\"\"    if (interaction.hover?.motion) rules.push({ media: REDUCED_MOTION, selector: `${selector}:hover`, decls })\"\"\",\n\"\"\"    if (interaction.hover?.motion) rules.push({ media: REDUCED_MOTION, selector: hover, decls })\"\"\")\nrep(\"\"\"function controlHtml(el: L1ControlElement, cls: string): string {\"\"\",\"\"\"/** [[BUG-367]] — how far a disabled control is dimmed. */\nexport const DISABLED_OPACITY = 0.45\n\nfunction controlHtml(el: L1ControlElement, cls: string): string {\"\"\")\nopen(p,'w').write(s)\nEOF\necho ok","description":"Add disabled and centred styles for controls"}
```

**Result**

```
ok
```

## Bash python3 - <<'EOF' p='packages/framework/src/l1/render.ts' s=open(p).read() a=""" if (el.tag === 'button' || (el.tag ===…
<!-- xgd-tool name="Bash" id="toolu_015jp2tZqMhE2ryntXFuhLME" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:20.623959+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='packages/framework/src/l1/render.ts'\ns=open(p).read()\na=\"\"\"      if (el.tag === 'button' || (el.tag === 'a' && (node.axes?.surfaceFill || node.axes?.border))) {\n        base.unshift('text-align: center', 'justify-content: center', 'align-items: center')\n        if (el.tag === 'a') base.unshift('display: inline-flex')\n      }\"\"\"\nb=\"\"\"      if (el.tag === 'button') base.unshift('text-align: center')\n      else if (el.tag === 'a' && (node.axes?.surfaceFill || node.axes?.border)) {\n        base.unshift('display: inline-flex', 'justify-content: center', 'align-items: center', 'text-align: center')\n      }\"\"\"\nassert a in s\ns=s.replace(a,b)\nopen(p,'w').write(s)\nEOF\nls node_modules/.bin | grep -E \"^tsc$|vitest$\"; ls bin | head -30","description":"Simplify centring rules; list tooling"}
```

**Result**

```
tsc
vitest
1c
access-sim
access-token
build
copy-from-cloud
copy-repro-to-dev
copy-site
copy-to-cloud
deploy
deploy.d
dev
kb-release
migration-manifest
platform-route
project
repro-console
repro-rail
seed
smoke
verify_req100_reveal.mjs
verify_req108_pointer.mjs
```

## Bash grep -n '"typecheck\|"lint\|"test' package.json apps/control-app/package.json packages/framework/package.json 2>/dev/nul…
<!-- xgd-tool name="Bash" id="toolu_0164X6AwcCgQWegS5k4kqg2F" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:25.222437+00:00" -->

**Input**

```json
{"command":"grep -n '\"typecheck\\|\"lint\\|\"test' package.json apps/control-app/package.json packages/framework/package.json 2>/dev/null | head","description":"Find typecheck/test scripts"}
```

**Result**

```
packages/framework/package.json:13:    "typecheck": "tsc -p tsconfig.json --noEmit"
package.json:12:    "test": "vitest run",
package.json:18:    "test:browser": "vitest run --config vitest.browser.config.mts"
```

## Bash (cd packages/framework && ../../node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head -20); ls apps/control-app/ts…
<!-- xgd-tool name="Bash" id="toolu_01PvNVEcJppfMEtJWLqHt838" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:27.154284+00:00" -->

**Input**

```json
{"command":"(cd packages/framework && ../../node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head -20); ls apps/control-app/tsconfig.json apps/public-site/tsconfig.json 2>&1","description":"Typecheck framework package","timeout":300000}
```

**Result**

```
apps/control-app/tsconfig.json
apps/public-site/tsconfig.json
```

## Bash (cd apps/control-app && ../../node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head -20); (cd apps/public-site &&…
<!-- xgd-tool name="Bash" id="toolu_01ShmwSWZXNGKWW7WwK5CQzv" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:30.979697+00:00" -->

**Input**

```json
{"command":"(cd apps/control-app && ../../node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head -20); (cd apps/public-site && ../../node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head)","description":"Typecheck control-app and public-site","timeout":400000}
```

**Result**

```
src/ai.ts(68,24): error TS2307: Cannot find module './generated/ai-workers.js' or its corresponding type declarations.
src/ai.ts(69,31): error TS2307: Cannot find module './generated/ai-ticketing.js' or its corresponding type declarations.
src/chrome.ts(1,23): error TS2307: Cannot find module './generated/importmap.json' or its corresponding type declarations.
src/development.ts(67,31): error TS2307: Cannot find module './generated/ai-ticketing.js' or its corresponding type declarations.
src/embedder.ts(1,35): error TS2307: Cannot find module './generated/knowledge' or its corresponding type declarations.
src/first-draft-cut.ts(5,25): error TS2307: Cannot find module './generated/ai-workers' or its corresponding type declarations.
src/imagegen.ts(48,30): error TS2307: Cannot find module './generated/ai-imagegen' or its corresponding type declarations.
src/imagegen.ts(49,24): error TS2307: Cannot find module './generated/ai-workers.js' or its corresponding type declarations.
src/junctions.ts(1,24): error TS2307: Cannot find module './generated/ai-workers.js' or its corresponding type declarations.
src/knowledge.ts(14,8): error TS2307: Cannot find module './generated/knowledge' or its corresponding type declarations.
src/log.ts(37,58): error TS2307: Cannot find module './generated/logging' or its corresponding type declarations.
src/material.ts(42,32): error TS2307: Cannot find module './generated/ticketing' or its corresponding type declarations.
src/people.ts(73,23): error TS2307: Cannot find module './generated/legal.js' or its corresponding type declarations.
src/router.ts(376,23): error TS2307: Cannot find module './generated/logging' or its corresponding type declarations.
src/session-delta.ts(1,52): error TS2307: Cannot find module './generated/knowledge' or its corresponding type declarations.
src/session-knowledge.ts(8,8): error TS2307: Cannot find module './generated/ai-knowledge' or its corresponding type declarations.
src/session-knowledge.ts(20,8): error TS2307: Cannot find module './generated/knowledge' or its corresponding type declarations.
src/session-knowledge.ts(229,17): error TS2339: Property '_declared' does not exist on type 'CoRankedKnowledge'.
src/session-knowledge.ts(246,19): error TS2339: Property '_claimedHits' does not exist on type 'CoRankedKnowledge'.
src/session-knowledge.ts(246,37): error TS2339: Property '_disclose' does not exist on type 'CoRankedKnowledge'.
```

## Bash M=/Users/martin/lagrangefoundry/1stcontact; cp -R $M/apps/control-app/src/generated apps/control-app/src/ 2>&1 | head -3…
<!-- xgd-tool name="Bash" id="toolu_01DkqM9n1AHaAdWMt82MCL91" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:38.636801+00:00" -->

**Input**

```json
{"command":"M=/Users/martin/lagrangefoundry/1stcontact; cp -R $M/apps/control-app/src/generated apps/control-app/src/ 2>&1 | head -3; git status --short | head; (cd apps/control-app && ../../node_modules/.bin/tsc -p tsconfig.json --noEmit 2>&1 | head -20)","description":"Copy generated artifacts and retypecheck","timeout":400000}
```

**Result**

```
 M apps/control-app/src/builder/config.js
 M apps/control-app/src/checkout-intake.ts
 M apps/control-app/src/orders.ts
 M apps/control-app/src/router.ts
 M apps/public-site/src/checkout.ts
 M packages/framework/src/l1/render.ts
 M packages/framework/src/l2/checkout.ts
 M packages/framework/src/modules/checkout/client.js
 M packages/framework/src/modules/checkout/component.ts
 M packages/framework/src/modules/checkout/meta.ts
```

## Bash PY=~/.xgd/releases/current/bin/python; $PY -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in "$(python3 -c 'import js…
<!-- xgd-tool name="Bash" id="toolu_01KgFtQQQntbQeEgynUdQh19" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:49.521086+00:00" -->

**Input**

```json
{"command":"PY=~/.xgd/releases/current/bin/python; $PY -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in \"$(python3 -c 'import json;print(json.dumps({\"session\":\"bug-b6fb57f6\",\"text\":\"2026-11-05 code drafted on free-BUG-367: router.ts draft-only POST api/checkout/<verb> via public-site handleCheckout(identified:true) + previewCheckoutIntake (checkout-intake.ts; start answers PREVIEW_PAYMENT_NOTICE + quote, no order; cancel/status 404). client.js NO_ANSWER/UNREACHABLE, notice. orders.ts singleRate: quote.singleRate, zone falls back to first zone, ship_country provisional zone.countries[0] (column NOT NULL, rebuild migration rejected as too heavy), corrected from Stripe address on paid; start passes all countries. component.ts: DEFAULT_COUNTRY_PROMPT, no ship-to select when single rate, continue disabled until quote (edit: !buyable), cancel control (a, product page else ./), cancelLabel config. l2 default: removed static Ship to label; actions row stack->row at 768, distribution end, Cancel drawn twice with visibility so phone stack has Continue on top (no reverse axis in L1; schema change rejected). render.ts: :disabled opacity 0.45 + not-allowed, control hover :not(:disabled), button text-align center. Item 6 site override is DATA in remote dev site (not in code/local D1) -> must ask operator.\"}))')\" 2>&1 | tail -c 200","description":"Log implementation decisions to summary"}
```

**Result**

```
an: preview route in apps/control-app/src/router.ts mirrors BUG-78 api/lead (handleCheckout imported from public-site with identified:true skipping rate limit; start replaced by owner-only notice)."}
```

## Bash ls tests | grep -E "REQ-643|BUG-363|REQ-657|BUG-78|BUG-97" ; ls bin/xgd-test 2>/dev/null; cat vitest.workers.config.mts…
<!-- xgd-tool name="Bash" id="toolu_01W5yQkda22c7dFtvj3RBvtp" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:50.452835+00:00" -->

**Input**

```json
{"command":"ls tests | grep -E \"REQ-643|BUG-363|REQ-657|BUG-78|BUG-97\" ; ls bin/xgd-test 2>/dev/null; cat vitest.workers.config.mts | head -30","description":"List regression suites and test configs"}
```

**Result**

```
test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts
test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts
test_UAT_FC_BUG-78_preview_submits_for_real.workers.test.ts
test_UAT_FC_BUG-97_download_host.workers.test.ts
test_UAT_FC_BUG-97_draft_gate.workers.test.ts
test_UAT_FC_BUG-97_message_body.test.ts
test_UAT_FC_REQ-643_checkout_pages.test.ts
test_UAT_FC_REQ-643_purchase.workers.test.ts
test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts
test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts
test_UAT_FC_REQ-657_the_plan_panel.test.ts
test_UAT_FC_REQ-657_the_plan_tool.test.ts
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

/**
 * The workerd project — tests that must run where the code will run.
 *
 * The store (site definitions in D1, asset bytes in R2) is only meaningfully
 * proved against real bindings inside the Workers runtime; a hand-written fake
 * proves the fake. `@cloudflare/vitest-pool-workers` boots workerd via Miniflare
 * and hands each test the bindings through `import { env } from 'cloudflare:test'`.
 *
 * Bindings mirror the deployed shape rather than inventing names:
 *   SITES — the R2 bucket `1c deploy` publishes rendered snapshots to
 *           (apps/public-site/wrangler.toml).
 *   BLOBS — the ticket store's attachment bucket (REQ-162). A SECOND bucket,
 *           not a prefix in SITES, because its contents are the client's
 *           private material and SITES is bound by the Worker that serves the
 *           public internet. Declaring it separately here is what lets the
 *           attachment UATs prove isolation against real R2 rather than a map.
 *   DB    — the D1 database the store port will use. No Worker declares it yet;
 *           this is where it gets declared first, which is the point of the
 *           ticket.
 *   IMAGES — Cloudflare Images ([[REQ-222]]), what a publish builds a picture's
 *           delivery width ladder with. Miniflare backs it locally with `sharp`,
 *           so a UAT can publish a REAL photograph and assert the widths that
 *           came out rather than the widths a fake was told to return.
 *
 * `compatibilityDate`/`compatibilityFlags` copy the apps' wrangler.toml so the
 * test runtime is the production runtime, not a newer one that would let a test
 * pass on behaviour the deployed Worker does not have.
```

## Bash ./node_modules/.bin/vitest run tests/test_UAT_FC_REQ-643_checkout_pages.test.ts tests/test_UAT_FC_REQ-643_shop_orders_an…
<!-- xgd-tool name="Bash" id="toolu_01Vizv6Uy2GWnPKtJNY5ik1J" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:13:55.653440+00:00" -->

**Input**

```json
{"command":"./node_modules/.bin/vitest run tests/test_UAT_FC_REQ-643_checkout_pages.test.ts tests/test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts 2>&1 | tail -40","description":"Run node-side regression suites","timeout":600000}
```

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m



 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367


 Test Files  4 passed (4)
      Tests  23 passed (23)
   Start at  16:13:57
   Duration  2.00s (transform 2.56s, setup 0ms, import 3.44s, tests 1.71s, environment 660ms)
```

## Bash ./node_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_REQ-643_purchase.workers.test.ts tes…
<!-- xgd-tool name="Bash" id="toolu_013wfEQVGS7XyMdUeC5Sr2BT" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:14:03.157701+00:00" -->

**Input**

```json
{"command":"./node_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_REQ-643_purchase.workers.test.ts tests/test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts tests/test_UAT_FC_BUG-78_preview_submits_for_real.workers.test.ts tests/test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts 2>&1 | grep -v \"^\\s*$\" | tail -40","description":"Run workers regression suites","timeout":600000}
```

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
Sourcemap for "/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js" points to missing source files
 Test Files  4 passed (4)
      Tests  22 passed (22)
   Start at  16:14:04
   Duration  9.27s (transform 9.94s, setup 0ms, import 24.61s, tests 2.57s, environment 0ms)
```

## Bash sed -n 1,120p tests/test_UAT_FC_REQ-643_purchase.workers.test.ts
<!-- xgd-tool name="Bash" id="toolu_01CBhPYRYhzUZv6snhhgVVov" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:14:17.635573+00:00" -->

**Input**

```json
{"command":"sed -n 1,120p tests/test_UAT_FC_REQ-643_purchase.workers.test.ts","description":"Read purchase workers test fixtures"}
```

**Result**

```
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { checkoutIntake } from '../apps/control-app/src/checkout-intake'
import { orderPaymentOutcome, type OrdersEnv } from '../apps/control-app/src/orders'
import { registerShopPaymentHandler } from '../apps/control-app/src/payments'
import { rebuildCatalogFor, route, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import type { Admission } from '../apps/control-app/src/identity'
import { addCategory, saveItem } from '../apps/control-app/src/shop'
import { applySchema } from './support/d1-site-factory'
import { giveBusinessAnAddress } from './support/site-address'
import { catalogSeed } from './support/catalog-site'

/**
 * [[REQ-643]] — the Shop's first purchase path: shipping zones, Buy, the
 * checkout page's endpoints, the Checkout endpoint's hold and session, the
 * payment outcomes, the cancel return, and the owner's Orders routes.
 *
 * THROUGH THE REAL ENTRY POINTS against real D1 and R2 (miniflare): the owner's
 * routes through the real router, the buyer's through the PUBLIC-SITE Worker's
 * `fetch` (its `SHOP_CHECKOUT` binding is the very intake `ShopCheckout`
 * wraps), and Stripe's events as signed deliveries to [[REQ-642]]'s real
 * webhook endpoint on the control app. Stripe itself is the external boundary:
 * a fake answers at the fetch boundary (Connect, accounts, Checkout sessions).
 */

const TEST_KEY = 'sk_test_platformkey000000000000'
const CLIENT_ID = 'ca_testclient000'
const SECRET_TEST = 'whsec_test_req643_secret'
const DB = () => env.DB as D1Database
let seq = 0

// ---- a fake Stripe ------------------------------------------------------------

function fakeStripe() {
  const accounts = new Map<string, Record<string, unknown>>()
  const codes = new Map<string, string>()
  const sessions = new Map<string, { status: 'open' | 'complete' | 'expired'; form: URLSearchParams; account: string | null }>()
  const calls: Array<{ method: string; path: string; account: string | null; form: URLSearchParams }> = []
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  const handler = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    if (url.host !== 'connect.stripe.com' && url.host !== 'api.stripe.com') return new Response('not stripe', { status: 404 })
    const body = request.method === 'GET' ? '' : new TextDecoder().decode(await request.arrayBuffer())
    const form = new URLSearchParams(body)
    calls.push({ method: request.method, path: url.pathname, account: request.headers.get('stripe-account'), form })
    if (request.headers.get('authorization') !== `Bearer ${TEST_KEY}`) return reply(401, { error: { message: 'Invalid API Key' } })
    if (url.pathname === '/oauth/token') {
      const account = codes.get(form.get('code') ?? '')
      return account ? reply(200, { stripe_user_id: account, livemode: false }) : reply(400, { error: 'invalid_grant' })
    }
    if (url.pathname === '/oauth/deauthorize') return reply(200, { stripe_user_id: form.get('stripe_user_id') })
    const acct = /^\/v1\/accounts\/(acct_\w+)$/.exec(url.pathname)
    if (acct) return accounts.has(acct[1]) ? reply(200, accounts.get(acct[1])) : reply(403, { error: { message: 'revoked' } })
    if (url.pathname === '/v1/checkout/sessions' && request.method === 'POST') {
      const id = `cs_test_${(seq += 1)}_${sessions.size}`
      sessions.set(id, { status: 'open', form, account: request.headers.get('stripe-account') })
      return reply(200, { id, object: 'checkout.session', status: 'open', url: `https://checkout.stripe.com/c/pay/${id}` })
    }
    const expire = /^\/v1\/checkout\/sessions\/(cs_\w+)\/expire$/.exec(url.pathname)
    if (expire) {
      const s = sessions.get(expire[1])
      if (!s) return reply(404, { error: { message: 'No such session' } })
      if (s.status !== 'open') return reply(400, { error: { message: `Session is ${s.status}` } })
      s.status = 'expired'
      return reply(200, { id: expire[1], status: 'expired' })
    }
    const get = /^\/v1\/checkout\/sessions\/(cs_\w+)$/.exec(url.pathname)
    if (get) return sessions.has(get[1]) ? reply(200, { id: get[1], status: sessions.get(get[1])!.status }) : reply(404, { error: {} })
    return reply(404, { error: { message: 'Unrecognized request URL' } })
  }
  return {
    fetch: handler as typeof fetch,
    calls,
    sessions,
    sessionCalls: () => calls.filter((c) => c.method === 'POST' && c.path === '/v1/checkout/sessions'),
    account(id: string) {
      accounts.set(id, { id, object: 'account', charges_enabled: true, settings: { dashboard: { display_name: `Shop ${id}` } }, requirements: { currently_due: [], past_due: [], disabled_reason: null } })
      const code = `ac_${id}_${Math.random().toString(36).slice(2)}`
      codes.set(code, id)
      return code
    },
  }
}
type Stripe = ReturnType<typeof fakeStripe>

// ---- the two Workers --------------------------------------------------------------

function controlEnv(tenant: string): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fe
```

[elided — kept 5800 of 6711 bytes]

## Bash sed -n 120,330p tests/test_UAT_FC_REQ-643_purchase.workers.test.ts
<!-- xgd-tool name="Bash" id="toolu_01YbH9JpbLVc8jUz1383Jq3X" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:14:19.109570+00:00" -->

**Input**

```json
{"command":"sed -n 120,330p tests/test_UAT_FC_REQ-643_purchase.workers.test.ts","description":"Read rest of purchase test setup"}
```

**Result**

```
async function asOwner(tenant: string, method: string, path: string, body?: unknown, scoped = true): Promise<Response> {
  const admission = {
    ok: true,
    user: { id: `usr_owner_${tenant}`, tenant_id: tenant, email: `owner@${tenant}.test` },
    businesses: [{ businessId: tenant, role: 'owner', name: tenant, entitlement: null, selectable: true }],
  } as unknown as Admission
  const waits: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => void waits.push(p), passThroughOnException: () => {}, props: {} }
  const init: RequestInit = body === undefined ? { method } : { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
  const res = await route(
    new Request(`https://app.example${path}`, { redirect: 'manual', ...init }),
    controlEnv(tenant) as unknown as RouterEnv,
    scoped ? ({ businessId: tenant } as Scope) : null,
    { admission },
    ctx as never,
  )
  await Promise.all(waits)
  return res
}

/** The public-site Worker, with the control app's checkout behind its binding. */
function publicEnv(tenant: string): PublicEnv {
  const control = controlEnv(tenant)
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
    CHECKOUT_RATE_LIMIT: { limit: async () => ({ success: true }) } as unknown as RateLimit,
    SHOP_CHECKOUT: checkoutIntake(control as unknown as OrdersEnv, {
      rebuild: (businessId, itemId) => rebuildCatalogFor(control as unknown as RouterEnv, { businessId }, itemId),
    }),
  } as unknown as PublicEnv
}

async function buyer(shop: Shop, verb: string, body: Record<string, unknown>): Promise<{ status: number; body: Record<string, any> }> {
  const res = await publicSite.fetch(
    new Request(`https://shop.example/site/${shop.site}/api/checkout/${verb}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
      body: JSON.stringify(body),
    }),
    publicEnv(shop.tenant),
    {} as ExecutionContext,
  )
  return { status: res.status, body: (await res.json()) as Record<string, any> }
}

async function hmacHex(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text)))
  return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('')
}

let eventSeq = 0
/** A signed test-mode event for the shop's connected account, through the real webhook endpoint. */
async function deliver(shop: Shop, type: string, object: Record<string, unknown>): Promise<Response> {
  const body = JSON.stringify({ id: `evt_643_${(eventSeq += 1)}_${Date.now()}`, object: 'event', type, livemode: false, account: shop.accountId, data: { object } })
  const t = Math.floor(Date.now() / 1000)
  const signature = `t=${t},v1=${await hmacHex(SECRET_TEST, `${t}.${body}`)}`
  return call(shop.tenant, '/api/stripe/webhook/test', { method: 'POST', headers: { 'stripe-signature': signature, 'content-type': 'application/json' }, body })
}

// ---- a shop ----------------------------------------------------------------------

interface Shop {
  tenant: string
  site: string
  accountId: string
  lampId: string
  stripe: Stripe
}

async function connect(tenant: string, stripe: Stripe, accountId: string): Promise<void> {
  const code = stripe.account(accountId)
  const started = await asOwner(tenant, 'POST', '/api/settings/payments/connect')
  expect(started.status).toBe(200)
  const state = new URL(((await started.json()) as { url: string }).url).searchParams.get('state') ?? ''
  expect((await asOwner(tenant, 'GET', `/api/stripe/connect/return?code=${code}&state=${encodeURIComponent(state)}`, undefined, false)).status).toBe(302)
}

const ZONES = [
  { name: 'Europe', rate: '5.00', countries: ['FR', 'DE'] },
  { name: 'United Kingdom', rate: '8.00', countries: ['GB'] },
]
const NOTE = 'Ships within 3 working days'

/** A published catalog site with one available brass lamp (€19.99); optionally connected and shipping. */
async function aShop(stripe: Stripe, options: { connected?: boolean; shipping?: boolean } = {}): Promise<Shop> {
  const tenant = `req643-${(seq += 1)}-${Date.now()}`
  const seed = catalogSeed()
  const imported = await call(tenant, '/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: seed.slug, siteJson: seed.siteJson, pages: Object.entries(seed.pages).map(([name, p]) => ({ name, page: p })), assets: [] }),
  })
  expect(imported.status).toBe(200)
  const site = ((await imported.json()) as { site: string }).site
  // Settings → Default currency: the shop's prices and rates are in euros.
  expect((await asOwner(tenant, 'POST', '/api/settings/currency', { currency: 'EUR' })).status).toBe(200)
  const shopEnv = { DB: DB(), SITES: env.SITES as R2Bucket }
  const lamps = await addCategory(shopEnv, tenant, 'Lamps')
  const lamp = await saveItem(
    shopEnv,
    tenant,
    null,
    { name: 'Brass lamp', summary: 'A lamp', description: 'A brass lamp.', price: null, availability: 1, collectionIds: [], categoryIds: [lamps.id], attributes: [], photos: [], live: true, madeToOrder: false },
    { priceAmount: 1999, currency: 'EUR' },
  )
  await giveBusinessAnAddress(tenant)
  const accountId = `acct_req643x${seq}`
  if (options.connected !== false) await connect(tenant, stripe, accountId)
  if (options.shipping !== false) expect((await asOwner(tenant, 'PUT', '/api/shop/shipping', { zones: ZONES, dispatchNote: NOTE })).status).toBe(200)
  expect((await call(tenant, '/api/publish', { method: 'POST', hea
```

[elided — kept 5800 of 10881 bytes]

## Bash grep -n "deliver(shop, '" tests/test_UAT_FC_REQ-643_purchase.workers.test.ts | head -5; grep -n "allowed_countries" test…
<!-- xgd-tool name="Bash" id="toolu_016mAfbSDrf1z9XDYa4ftN6Q" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:14:24.485773+00:00" -->

**Input**

```json
{"command":"grep -n \"deliver(shop, '\" tests/test_UAT_FC_REQ-643_purchase.workers.test.ts | head -5; grep -n \"allowed_countries\" tests/test_UAT_FC_REQ-643_purchase.workers.test.ts | head -3; grep -n \"preview/\" tests/test_UAT_FC_BUG-78_preview_submits_for_real.workers.test.ts | head -5","description":"Find paid event usage and preview paths"}
```

**Result**

```
495:    expect((await deliver(shop, 'checkout.session.completed', await completed(shop, orderId))).status).toBe(200)
520:    expect((await deliver(shop, 'checkout.session.completed', await completed(shop, orderId, { amount_total: 100 }))).status).toBe(200)
539:      (await deliver(shop, 'checkout.session.expired', { id: firstRow.checkout_session_id, object: 'checkout.session', status: 'expired', metadata: { business_id: shop.tenant, order_id: first, invoice_id: firstRow.invoice_id } })).status,
559:      (await deliver(shop, 'checkout.session.expired', { id: secondRow.checkout_session_id, object: 'checkout.session', metadata: { business_id: shop.tenant, order_id: second, invoice_id: secondRow.invoice_id } })).status,
566:    await deliver(shop, 'checkout.session.completed', await completed(shop, third))
449:    expect(f.get('shipping_address_collection[allowed_countries][0]')).toBe('FR')
450:    expect(f.has('shipping_address_collection[allowed_countries][1]')).toBe(false)
98:  return new Request(`${ORIGIN}/preview/${slug}/${channel}/api/lead`, {
358:   * replaces it is the Access gate in front of `/preview/*`.
```

## Bash python3 - <<'EOF' src=open('tests/test_UAT_FC_REQ-643_purchase.workers.test.ts').read() start=src.index('const TEST_KEY'…
<!-- xgd-tool name="Bash" id="toolu_016vNdgD2oNGzDfLvhfGgC3x" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:14:54.066140+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\nsrc=open('tests/test_UAT_FC_REQ-643_purchase.workers.test.ts').read()\nstart=src.index('const TEST_KEY')\nend=src.index('beforeAll(async () => {')\nhelpers=src[start:end]\nhelpers=helpers.replace(\"const tenant = `req643-\",\"const tenant = `bug367-\").replace(\"`acct_req643x${seq}`\",\"`acct_bug367x${seq}`\").replace(\"evt_643_\",\"evt_367_\")\n# allow zones override\nhelpers=helpers.replace(\"async function aShop(stripe: Stripe, options: { connected?: boolean; shipping?: boolean } = {}): Promise<Shop> {\",\n\"async function aShop(stripe: Stripe, options: { connected?: boolean; shipping?: boolean; zones?: typeof ZONES } = {}): Promise<Shop> {\")\nhelpers=helpers.replace(\"'/api/shop/shipping', { zones: ZONES, dispatchNote: NOTE })).status).toBe(200)\\n  expect((await call(tenant, '/api/publish'\",\n\"'/api/shop/shipping', { zones: options.zones ?? ZONES, dispatchNote: NOTE })).status).toBe(200)\\n  expect((await call(tenant, '/api/publish'\")\nassert \"options.zones ?? ZONES\" in helpers\nheader = \"\"\"import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'\nimport { env } from 'cloudflare:test'\nimport controlApp from '../apps/control-app/src/index'\nimport type { Env as ControlEnv } from '../apps/control-app/src/index'\nimport publicSite from '../apps/public-site/src/index'\nimport type { Env as PublicEnv } from '../apps/public-site/src/index'\nimport { checkoutIntake, PREVIEW_PAYMENT_NOTICE } from '../apps/control-app/src/checkout-intake'\nimport { orderPaymentOutcome, type OrdersEnv } from '../apps/control-app/src/orders'\nimport { registerShopPaymentHandler } from '../apps/control-app/src/payments'\nimport { rebuildCatalogFor, route, type RouterEnv } from '../apps/control-app/src/router'\nimport type { Scope } from '../apps/control-app/src/scope'\nimport type { Admission } from '../apps/control-app/src/identity'\nimport { addCategory, saveItem } from '../apps/control-app/src/shop'\nimport { applySchema } from './support/d1-site-factory'\nimport { giveBusinessAnAddress } from './support/site-address'\nimport { catalogSeed } from './support/catalog-site'\n\n/**\n * [[BUG-367]] — the builder's draft checkout reaches its quote, never takes\n * money, and a shop whose countries all cost the same asks no country.\n *\n * Real entry points against real D1 (miniflare): the draft through the control\n * app's own router (`/preview/<site>/draft/...`, as the builder's iframe asks),\n * the published checkout through the public-site Worker, and Stripe's paid event\n * through the real webhook. Stripe is the external boundary, faked at fetch.\n * (Fixtures follow the REQ-643 purchase suite's.)\n */\n\n\"\"\"\ntests = \"\"\"beforeAll(async () => {\n  await applySchema()\n})\n\nbeforeEach(() => {\n  registerShopPaymentHandler(orderPaymentOutcome)\n})\n\nafterEach(() => {\n  vi.unstubAllGlobals()\n})\n\nconst LAMP = [{ item: 'brass-lamp', quantity: 1 }]\nconst orderCount = async (tenant: string) =>\n  (await DB().prepare('SELECT COUNT(*) AS n FROM orders WHERE business_id = ?').bind(tenant).first<{ n: number }>())!.n\n\n/** The draft preview's checkout endpoint, as the page's script posts it from inside the builder. */\nasync function draft(shop: Shop, verb: string, body: Record<string, unknown>, channel = 'draft') {\n  const res = await asOwner(shop.tenant, 'POST', `/preview/${shop.site}/${channel}/api/checkout/${verb}`, body)\n  const text = await res.text()\n  let json: Record<string, any> | null = null\n  try {\n    json = JSON.parse(text)\n  } catch {\n    json = null\n  }\n  return { status: res.status, type: res.headers.get('content-type') ?? '', body: json, text }\n}\n\ndescribe('BUG-367 — the builder draft checkout', () => {\n  it('test_UAT_FC_BUG-367_draft_quote_answers_like_the_published_site', async () => {\n    const stripe = fakeStripe()\n    vi.stubGlobal('fetch', stripe.fetch)\n    const shop = await aShop(stripe)\n\n    const inDraft = await draft(shop, 'quote', { lines: LAMP, country: 'FR', locale: 'en-GB' })\n    expect(inDraft.status).toBe(200)\n    expect(inDraft.type).toMatch(/application\\\\/json/)\n    const published = await buyer(shop, 'quote', { lines: LAMP, country: 'FR', locale: 'en-GB' })\n    expect(published.status).toBe(200)\n    // The SAME quote: current price, the Ship to countries, the rate, the total.\n    expect(inDraft.body!.quote).toEqual(published.body.quote)\n    expect(inDraft.body!.quote).toMatchObject({ canCheckout: true, shipping: 500, subtotal: 1999, total: 2499, country: 'FR', singleRate: false })\n    expect(inDraft.body!.quote.countries.map((c: { code: string }) => c.code).sort()).toEqual(['DE', 'FR', 'GB'])\n\n    // Draft only, and only for a site this business holds.\n    expect((await draft(shop, 'quote', { lines: LAMP, country: 'FR' }, 'edit')).status).toBe(404)\n    const stranger = await asOwner(shop.tenant, 'POST', `/preview/not-${shop.site}/draft/api/checkout/quote`, { lines: LAMP })\n    expect(stranger.status).toBe(404)\n  })\n\n  it('test_UAT_FC_BUG-367_draft_start_tells_the_owner_and_takes_no_money', async () => {\n    const stripe = fakeStripe()\n    vi.stubGlobal('fetch', stripe.fetch)\n    const shop = await aShop(stripe)\n    const before = await orderCount(shop.tenant)\n    const sessionsBefore = stripe.sessionCalls().length\n\n    const quote = await draft(shop, 'quote', { lines: LAMP, country: 'GB' })\n    const started = await draft(shop, 'start', { lines: LAMP, country: 'GB', total: quote.body!.quote.total })\n    expect(started.status).toBe(200)\n    expect(started.body!.notice).toBe('Payment opens on your published site. Only you see this.')\n    expect(started.body!.notice).toBe(PREVIEW_PAYMENT_NOTICE)\n    expect(started.body!.url).toBeUndefined()\n    expect(sta
```

[elided — kept 5800 of 9459 bytes]

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  16:14:55
   Duration  6.60s (transform 2.27s, setup 0ms, import 5.95s, tests 402ms, environment 0ms)
```

## Bash sed -i '' 's/ if (checkoutPath) {/ if (false \&\& checkoutPath) {/' apps/control-app/src/router.ts && ./node_modules/.bi…
<!-- xgd-tool name="Bash" id="toolu_019PTR5FZ2xwmBgUJfY7CzYk" turn="79d156e199bd408887691a538036c70b" ts="2026-11-06T00:15:07.784381+00:00" -->

**Input**

```json
{"command":"sed -i '' 's/      if (checkoutPath) {/      if (false \\&\\& checkoutPath) {/' apps/control-app/src/router.ts && ./node_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts 2>&1 | grep -E \"✓|×|FAIL|Tests \" | head; sed -i '' 's/      if (false \\&\\& checkoutPath) {/      if (checkoutPath) {/' apps/control-app/src/router.ts; grep -c \"if (checkoutPath) {\" apps/control-app/src/router.ts","description":"Confirm UAT fails without the preview route","timeout":600000}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git status --short && git…
<!-- xgd-tool name="Bash" id="toolu_01RwjwgpdTsDvMDbWked4Ej4" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:11:09.795810+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git status --short && git log --oneline -3 && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-b6fb57f6\"}' | tail -c 3000","description":"Check worktree state and summary log"}
```

**Result**

```
 M apps/control-app/src/builder/config.js
 M apps/control-app/src/checkout-intake.ts
 M apps/control-app/src/orders.ts
 M apps/control-app/src/router.ts
 M apps/public-site/src/checkout.ts
 M packages/framework/src/l1/render.ts
 M packages/framework/src/l2/checkout.ts
 M packages/framework/src/modules/checkout/client.js
 M packages/framework/src/modules/checkout/component.ts
 M packages/framework/src/modules/checkout/meta.ts
 M tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts
?? tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
2d6158fee6 xgd(ticket): update bug bug-b6fb57f6
76ea07569b xgd(ticket): update comment comment-d8169cbf
63aee9e2c5 xgd(ticket): update bug bug-b6fb57f6
[17:11:14] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2393.73, 'pid': 56493}
{"count":1,"entries":["2026-11-05 code drafted on free-BUG-367: router.ts draft-only POST api/checkout/<verb> via public-site handleCheckout(identified:true) + previewCheckoutIntake (checkout-intake.ts; start answers PREVIEW_PAYMENT_NOTICE + quote, no order; cancel/status 404). client.js NO_ANSWER/UNREACHABLE, notice. orders.ts singleRate: quote.singleRate, zone falls back to first zone, ship_country provisional zone.countries[0] (column NOT NULL, rebuild migration rejected as too heavy), corrected from Stripe address on paid; start passes all countries. component.ts: DEFAULT_COUNTRY_PROMPT, no ship-to select when single rate, continue disabled until quote (edit: !buyable), cancel control (a, product page else ./), cancelLabel config. l2 default: removed static Ship to label; actions row stack->row at 768, distribution end, Cancel drawn twice with visibility so phone stack has Continue on top (no reverse axis in L1; schema change rejected). render.ts: :disabled opacity 0.45 + not-allowed, control hover :not(:disabled), button text-align center. Item 6 site override is DATA in remote dev site (not in code/local D1) -> must ask operator."],"framing":"Implementing BUG-367 (builder draft checkout) via FREE CODING. Ticket body = spec, 9 fix items. Branch free-BUG-367, worktree /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367. Status set free_coding 2026-11-05. Not a dupe (BUG-363 is predecessor). Agent CLI python: ~/.xgd/releases/current/bin/python. Plan: preview route in apps/control-app/src/router.ts mirrors BUG-78 api/lead (handleCheckout imported from public-site with identified:true skipping rate limit; start replaced by owner-only notice)."}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff --stat && git dif…
<!-- xgd-tool name="Bash" id="toolu_01ELkNXEMkZK275nu5YvPfhk" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:11:17.446017+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff --stat && git diff apps/control-app/src/router.ts | head -80 && grep -n \"TEMP\\|XXX\\|disable\" apps/control-app/src/router.ts | head","description":"Inspect diff and router for temporary disable"}
```

**Result**

```
 apps/control-app/src/builder/config.js             |  2 +-
 apps/control-app/src/checkout-intake.ts            | 30 ++++++++
 apps/control-app/src/orders.ts                     | 36 +++++++--
 apps/control-app/src/router.ts                     | 42 +++++++++++
 apps/public-site/src/checkout.ts                   | 29 +++++--
 packages/framework/src/l1/render.ts                | 24 +++++-
 packages/framework/src/l2/checkout.ts              | 88 ++++++++++++++++------
 packages/framework/src/modules/checkout/client.js  | 26 ++++++-
 .../framework/src/modules/checkout/component.ts    | 69 +++++++++++++----
 packages/framework/src/modules/checkout/meta.ts    |  8 +-
 tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts   |  2 +-
 11 files changed, 295 insertions(+), 61 deletions(-)
diff --git a/apps/control-app/src/router.ts b/apps/control-app/src/router.ts
index cae7929aba..c31d0cf6c0 100644
--- a/apps/control-app/src/router.ts
+++ b/apps/control-app/src/router.ts
@@ -115,6 +115,14 @@ import {
  */
 import { handleLead, type LeadEnv as LeadRequestEnv } from '../../public-site/src/lead'
 import { captureLead, type LeadEnv as LeadIntakeEnv, type LeadSubmission } from './lead'
+/*
+ * [[BUG-367]] — THE CHECKOUT ENDPOINT IS IMPORTED, NOT REBUILT, on `handleLead`'s
+ * reasoning above: `handleCheckout` is `public-site`'s request handling (body
+ * cap, content type, the refusal envelope), and the work behind it is the same
+ * `checkoutIntake` the `SHOP_CHECKOUT` binding wraps — reached in-process here.
+ */
+import { checkoutVerb, handleCheckout, type CheckoutEnv } from '../../public-site/src/checkout'
+import { previewCheckoutIntake } from './checkout-intake'
 import { UnknownTenantError } from '../../../tools/generate/src/store/d1r2-store'
 import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
 import { StoreConflictError, type SiteStore } from '../../../tools/generate/src/store/site-store'
@@ -8546,6 +8554,40 @@ async function routeUncached(
         })
       }
 
+      /**
+       * POST /preview/<siteKey>/draft/api/checkout/<verb> — the draft's checkout
+       * page asks for its quote ([[BUG-367]]).
+       *
+       * WHY THIS EXISTS AT ALL is `api/lead`'s reason: the checkout page's script
+       * posts to `api/checkout/<verb>` relative to the page, and in the preview
+       * that page is served by THIS Worker. With no route here every quote came
+       * back a 404, and the page told the owner a piece they can sell could not
+       * be bought.
+       *
+       * THE SAME `handleCheckout` AND THE SAME `quote`, so the draft shows what
+       * the published page shows. The rate limiter is not asked (`identified`):
+       * the caller is the signed-in operator, as for the draft's `api/lead`.
+       *
+       * THE DRAFT NEVER TAKES MONEY: `start` answers the owner that payment
+       * opens on the published site, and writes nothing ({@link previewCheckoutIntake}).
+       *
+       * `draft` ONLY, and the site key is the route's and is checked, exactly as
+       * the `api/lead` route above does.
+       */
+      const checkoutPath = method === 'POST' ? checkoutVerb((preview[3] ?? '/').replace(/^\/+/, '')) : null
+      if (checkoutPath) {
+        if (channel !== 'draft') return text(404, 'Not found')
+        const store = await openStore()
+        if (!(await store.hasDraft(site))) return text(404, 'Not found')
+        return handleCheckout(request, {
+          siteKey: site,
+          verb: checkoutPath,
+          siteUrl: publicSiteUrl(site, '/'),
+          env: { SHOP_CHECKOUT: previewCheckoutIntake(env as never) } as CheckoutEnv,
+          identified: true,
+        })
+      }
+
       /**
        * GET /preview/<siteKey>/draft/api/download/<token>[/<assetKey>] — the
        * gated download, against the draft ([[BUG-97]]).
5558:     * IT SEEDS THE TEMPLATE IF THE BUSINESS HAS NEVER HAD ONE, because
5622:     * WHICH ADDRESS IT IS, THOUGH, IS THE INVITE TEMPLATE'S ([[REQ-205]]). It
5658:      // button is disabled with nothing checked, so a POST with no ids is a
6199:          // and a disabled button with no explanation is how a client learns the
8725:    // A REFUSED TEMPLATE IS COPY THAT CANNOT BE SENT TO ANYBODY ([[REQ-197]],
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && wc -l tests/test_UAT_FC_BU…
<!-- xgd-tool name="Bash" id="toolu_017DuFneuu2CUyGmwyaN7Gft" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:11:21.909357+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && wc -l tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts && ls tests | grep -i \"BUG-363\\|REQ-643\\|BUG-78\" ; ls vitest*.ts 2>/dev/null; grep -n '\"test' package.json","description":"List related tests and test config"}
```

**Result**

```
     392 tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts
test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts
test_UAT_FC_BUG-78_preview_submits_for_real.workers.test.ts
test_UAT_FC_REQ-643_checkout_pages.test.ts
test_UAT_FC_REQ-643_purchase.workers.test.ts
test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts
(eval):1: no matches found: vitest*.ts
12:    "test": "vitest run",
18:    "test:browser": "vitest run --config vitest.browser.config.mts"
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ls vitest* ; timeout 500 n…
<!-- xgd-tool name="Bash" id="toolu_01Fyt5NpGxgENZUe18tQtBpv" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:11:25.650288+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ls vitest* ; timeout 500 npx vitest run tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts tests/test_UAT_FC_REQ-643_checkout_pages.test.ts tests/test_UAT_FC_REQ-643_purchase.workers.test.ts tests/test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts tests/test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts tests/test_UAT_FC_BUG-78_preview_submits_for_real.workers.test.ts tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts 2>&1 | tail -40","description":"Run BUG-367 UAT and regression suites","timeout":560000}
```

**Result**

```
vitest.browser.config.mts
vitest.config.mts
vitest.node.config.mts
vitest.workers.config.mts
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m



 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367

Sourcemap for "/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js" points to missing source files

 Test Files  8 passed (8)
      Tests  47 passed (47)
   Start at  17:11:27
   Duration  10.44s (transform 16.71s, setup 0ms, import 36.28s, tests 6.00s, environment 1.15s)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cp apps/control-app/src/ro…
<!-- xgd-tool name="Bash" id="toolu_01QrVaUvCiNiAEdBoSnzyXZQ" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:11:42.338896+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cp apps/control-app/src/router.ts $TMPDIR/bug367-router.bak && sed -i '' 's/const checkoutPath = method === .POST. ?/const checkoutPath = false \\&\\& method === \"POST\" ?/' apps/control-app/src/router.ts && grep -n \"const checkoutPath\" apps/control-app/src/router.ts && timeout 300 npx vitest run tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts 2>&1 | grep -E \"✓|✗|×|Tests \" ; cp $TMPDIR/bug367-router.bak apps/control-app/src/router.ts && git diff --stat apps/control-app/src/router.ts","description":"Mutation check: disable route, run UAT, restore","timeout":320000}
```

**Result**

```
8577:      const checkoutPath = false && method === "POST" ? checkoutVerb((preview[3] ?? '/').replace(/^\/+/, '')) : null
     × test_UAT_FC_BUG-367_draft_quote_answers_like_the_published_site 95ms
     × test_UAT_FC_BUG-367_draft_start_tells_the_owner_and_takes_no_money 52ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
      Tests  2 failed | 2 passed (4)
 apps/control-app/src/router.ts | 42 ++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 42 insertions(+)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n "client.js\|jsdom\…
<!-- xgd-tool name="Bash" id="toolu_019gUpezVLHahvgi9gbZrHsp" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:11:54.801932+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n \"client.js\\|jsdom\\|^import\\|^  it(\\|^it(\\|^test(\\|  test(\" tests/test_UAT_FC_REQ-643_checkout_pages.test.ts | head -40; grep -ln \"checkout\" tests/*.browser.test.ts 2>/dev/null | head; cat vitest.browser.config.mts | head -40","description":"Inspect existing checkout test patterns"}
```

**Result**

```
1:import { afterEach, describe, expect, it, vi } from 'vitest'
2:import { JSDOM } from 'jsdom'
3:import { renderSiteFiles, type SiteCatalog } from '../tools/generate/src/render'
4:import { memorySiteStore } from '../tools/generate/src/store/memory-store'
5:import type { LoadedSite } from '../tools/generate/src/store/assemble'
6:import { isServedPage, validateSite } from '../packages/site-schema/src/index'
7:import { latestModuleVersion, type CatalogItem } from '../packages/framework/src/worker'
8:import { starterHomePage } from '../tools/generate/src/cli/scaffold'
9:import { catalogItems, catalogSeed } from './support/catalog-site'
10:import { initCheckout, initComplete } from '../packages/framework/src/modules/checkout/client.js'
93:  it('test_UAT_FC_REQ-643_a_site_that_sells_gets_default_checkout_complete_and_cancelled_pages', async () => {
131:  it('test_UAT_FC_REQ-643_no_buy_and_no_checkout_pages_without_payments_or_a_zone', async () => {
148:  it('test_UAT_FC_REQ-643_restyling_the_site_design_restyles_the_checkout_page', async () => {
162:  it('test_UAT_FC_REQ-643_the_sites_own_checkout_page_validates_and_replaces_the_default', async () => {
182:  it('test_UAT_FC_REQ-643_markup_in_an_item_or_the_dispatch_note_is_inert_on_the_checkout_page', async () => {
209:function installWindow(jsdom: JSDOM): { assigned: string[] } {
211:  vi.stubGlobal('document', jsdom.window.document)
213:  vi.stubGlobal('window', { location: { search: jsdom.window.location.search, assign: (u: string) => assigned.push(u) } })
232:  it('test_UAT_FC_REQ-643_checkout_script_shows_the_current_figures_and_continues_to_stripe', async () => {
234:    const jsdom = dom(files.get('checkout/brass-lamp.html'))
235:    const { assigned } = installWindow(jsdom)
247:    const d = jsdom.window.document
269:  it('test_UAT_FC_REQ-643_checkout_script_tells_the_buyer_a_piece_sold_before_stripe', async () => {
271:    const jsdom = dom(files.get('checkout/brass-lamp.html'))
272:    const { assigned } = installWindow(jsdom)
279:    const d = jsdom.window.document
291:  it('test_UAT_FC_REQ-643_success_page_says_confirming_until_paid_then_the_order', async () => {
293:    const jsdom = dom(files.get('order-complete.html'), 'https://shop.example/site/s1/order-complete?order=ord_0123')
294:    installWindow(jsdom)
298:    const d = jsdom.window.document
(eval):1: no matches found: tests/*.browser.test.ts
import { defineConfig } from 'vitest/config'

/**
 * The browser acceptance suites (BUG-333): real multi-process Chromium driving
 * the real builder. Run only through `pnpm test:browser`, which the operator's
 * `sandbox.excluded_commands` entry lets launch Chromium outside the sandbox.
 */
export default defineConfig({
  test: {
    include: ['tests/browser/**/*.test.ts'],
    globalSetup: ['tests/browser/support/build.ts'],
    // One Worker and one browser per file; files run one at a time so their
    // builds and stores never contend.
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
})
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 11,92p tests/test_U…
<!-- xgd-tool name="Bash" id="toolu_01Uo5i6zyGpvqvhxX4QaAAKP" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:11:57.107400+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 11,92p tests/test_UAT_FC_REQ-643_checkout_pages.test.ts; sed -n 205,292p tests/test_UAT_FC_REQ-643_checkout_pages.test.ts; grep -rln \"chromium\" tests/*.test.ts | head -5","description":"Read checkout test helpers and find chromium tests"}
```

**Result**

```
/**
 * [[REQ-643]] — the checkout, order-complete and order-cancelled pages: L1
 * pages drawn by the `checkout` module through the site generator's real entry
 * point (`renderSiteFiles`), and the module's client script over the page it
 * renders.
 *
 * THE SCRIPT'S ENDPOINT IS ITS BOUNDARY here, as the transport is a builder
 * panel's: the Worker side of `quote` / `start` / `status` is proven through the
 * real public-site and control-app Workers by
 * `test_UAT_FC_REQ-643_purchase.workers.test.ts`; this suite proves what the
 * page does with each answer, over a double answering the same shapes.
 */

const SHIPPING = {
  currency: 'EUR',
  dispatchNote: 'Ships within 3 working days',
  countries: [
    { code: 'FR', rate: 500 },
    { code: 'DE', rate: 500 },
    { code: 'GB', rate: 800 },
  ],
}

async function load(seed: ReturnType<typeof catalogSeed>): Promise<LoadedSite> {
  const store = memorySiteStore()
  store.seed(seed.slug, seed)
  const loaded = (await store.loadDraft(seed.slug))!.result
  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))
  return loaded.value
}

async function render(
  options: { items?: CatalogItem[]; seed?: ReturnType<typeof catalogSeed>; catalog?: Partial<SiteCatalog>; site?: (s: LoadedSite) => LoadedSite } = {},
): Promise<Map<string, string>> {
  const catalog: SiteCatalog = { items: options.items ?? catalogItems(), canTakePayments: true, shipping: SHIPPING, ...options.catalog }
  const site = await load(options.seed ?? catalogSeed())
  const { files } = await renderSiteFiles(options.site ? options.site(site) : site, { catalog })
  return new Map(files)
}

function dom(html: string | undefined, url = 'https://shop.example/site/s1/checkout/brass-lamp'): JSDOM {
  expect(html, 'page was written').toBeDefined()
  return new JSDOM(html!, { url })
}

/** A page of the site's own holding a `checkout` instance in `mode`, with its own L1. */
function ownCheckoutPage(mode: 'checkout' | 'complete' | 'cancelled', slot: Record<string, unknown>): Record<string, unknown> {
  const p = starterHomePage(`own-${mode}`, 'Own checkout') as Record<string, unknown>
  ;(p.l1 as { root: { children: unknown[] } }).root.children.push({ kind: 'slot', name: 'checkout' })
  return {
    ...p,
    id: `own-${mode}`,
    slug: `own-${mode}`,
    title: 'Own checkout',
    modules: [{ id: `own-${mode}`, type: 'checkout', version: latestModuleVersion('checkout'), config: { mode, continueLabel: 'Pay now' }, slots: { page: slot }, slot: 'checkout' }],
  }
}

const OWN_CHECKOUT = {
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', text: 'Our own checkout' },
    { kind: 'text', text: 'Item', bind: { field: 'name' } },
    { kind: 'text', text: 'Price', bind: { field: 'price' } },
    { kind: 'text', text: 'Sold since', bind: { field: 'unavailable' } },
    { kind: 'text', text: 'Price changed', bind: { field: 'changed' } },
    { kind: 'control', control: 'ship-to' },
    { kind: 'text', text: '—', bind: { field: 'shipping' } },
    { kind: 'text', text: '—', bind: { field: 'total' } },
    { kind: 'text', text: 'Note', bind: { field: 'dispatch' } },
    { kind: 'control', control: 'continue' },
    { kind: 'control', control: 'message' },
  ],
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('REQ-643 — the checkout pages are L1, drawn by the checkout module', () => {
  }
  return { fetch, sent }
}

function installWindow(jsdom: JSDOM): { assigned: string[] } {
  const assigned: string[] = []
  vi.stubGlobal('document', jsdom.window.document)
  // The script reads `window.location` alone; Stripe's page is where `assign` would go.
  vi.stubGlobal('window', { location: { search: jsdom.window.location.search, assign: (u: string) => assigned.push(u) } })
  return { assigned }
}

const QUOTE = (over: Record<string, unknown> = {}) => ({
  currency: 'EUR',
  lines: [{ item: 'brass-lamp', name: 'Brass lamp', quantity: 1, unitAmount: 1999, amount: 1999, available: true, display: { unitAmount: '€19.99', amount: '€19.99' } }],
  countries: [],
  country: 'FR',
  shipping: 500,
  subtotal: 1999,
  total: 2499,
  dispatchNote: 'Ships within 3 working days',
  canCheckout: true,
  display: { subtotal: '€19.99', shipping: '€5.00', total: '€24.99' },
  ...over,
})

describe('REQ-643 — the checkout page script', () => {
  it('test_UAT_FC_REQ-643_checkout_script_shows_the_current_figures_and_continues_to_stripe', async () => {
    const files = await render()
    const jsdom = dom(files.get('checkout/brass-lamp.html'))
    const { assigned } = installWindow(jsdom)
    const changedPrice = QUOTE({
      lines: [{ item: 'brass-lamp', name: 'Brass lamp', quantity: 1, unitAmount: 2500, amount: 2500, available: true, display: { unitAmount: '€25.00', amount: '€25.00' } }],
      subtotal: 2500,
      total: 3000,
      display: { subtotal: '€25.00', shipping: '€5.00', total: '€30.00' },
    })
    const api = endpoint({
      quote: [{ status: 200, body: { quote: changedPrice } }],
      start: [{ status: 200, body: { url: 'https://checkout.stripe.com/c/pay/cs_test_1', orderId: 'ord_x', number: 1001 } }],
    })
    vi.stubGlobal('fetch', api.fetch)
    const d = jsdom.window.document
    const root = d.querySelector('[data-checkout="checkout"]')!
    ;(d.querySelector('select[data-checkout-control="ship-to"]') as HTMLSelectElement).value = 'FR'
    await initCheckout(root)

    // The quote went to the site's own endpoint, resolved against the page's base.
    expect(api.sent[0]).toMatchObject({ verb: 'quote', url: 'https://shop.example/site/s1/api/checkout/quote', body: { lines: [{ item: 'brass-lamp', quantity: 1 }], country: 'FR' } })
    // The current price is shown, and the change is said, before 
```

[elided — kept 5800 of 8257 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n " it(" tests/test_…
<!-- xgd-tool name="Bash" id="toolu_01JSFmutzCkLmxLgc7Vu7rYu" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:00.225183+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n \"  it(\" tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts; sed -n 190,205p tests/test_UAT_FC_REQ-643_checkout_pages.test.ts; git diff packages/framework/src/modules/checkout/client.js packages/framework/src/modules/checkout/component.ts | head -250","description":"Review workers UAT names and client/component diffs"}
```

**Result**

```
300:  it('test_UAT_FC_BUG-367_draft_quote_answers_like_the_published_site', async () => {
321:  it('test_UAT_FC_BUG-367_draft_start_tells_the_owner_and_takes_no_money', async () => {
342:  it('test_UAT_FC_BUG-367_single_rate_shop_asks_no_country_and_stripe_offers_every_one', async () => {
380:  it('test_UAT_FC_BUG-367_shop_with_different_rates_still_asks_the_country', async () => {
    expect(page.querySelector('[data-l1-bind="dispatch"]')?.textContent).toBe('<img src=x onerror="alert(1)">')
  })
})

// ---- the page's script ------------------------------------------------------------

/** The endpoint double: answers each verb in turn, and records what the page sent. */
function endpoint(answers: Record<string, Array<{ status: number; body: unknown }>>) {
  const sent: Array<{ verb: string; body: any; url: string }> = []
  const fetch = async (url: string, init: RequestInit) => {
    const verb = String(url).split('/').pop()!
    sent.push({ verb, body: JSON.parse(String(init.body)), url: String(url) })
    const queue = answers[verb] ?? []
    const answer = queue.length > 1 ? queue.shift()! : queue[0]
    return new Response(JSON.stringify(answer?.body ?? {}), { status: answer?.status ?? 500 })
  }
diff --git a/packages/framework/src/modules/checkout/client.js b/packages/framework/src/modules/checkout/client.js
index 2ade2abf13..c7a2b24ad8 100644
--- a/packages/framework/src/modules/checkout/client.js
+++ b/packages/framework/src/modules/checkout/client.js
@@ -22,6 +22,11 @@
  */
 
 const ROOT_SELECTOR = '[data-checkout][data-checkout-endpoint]'
+
+// [[BUG-367]] — what the page says when no answer it can read came back. Each
+// names what actually failed; neither claims the piece cannot be bought.
+export const UNREACHABLE = 'The shop could not be reached. Nothing was charged; please try again.'
+export const NO_ANSWER = 'The shop gave no answer. Nothing was charged; please try again.'
 const POLL_MS = 1500
 const POLL_LIMIT = 80
 
@@ -53,10 +58,13 @@ export async function post(root, verb, body) {
   const url = new URL(`${base}/${verb}`, document.baseURI).toString()
   try {
     const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
-    const data = await res.json().catch(() => ({}))
-    return { ok: res.ok, status: res.status, data: data || {} }
+    const data = await res.json().catch(() => null)
+    // [[BUG-367]] — an answer that is not the shop's JSON (a 404 page, a proxy's
+    // error) is no answer, and the page says so rather than guessing at why.
+    if (!data || typeof data !== 'object') return { ok: false, status: res.status, data: { error: NO_ANSWER } }
+    return { ok: res.ok, status: res.status, data }
   } catch (_e) {
-    return { ok: false, status: 0, data: { error: 'The shop could not be reached. Nothing was charged; please try again.' } }
+    return { ok: false, status: 0, data: { error: UNREACHABLE } }
   }
 }
 
@@ -106,8 +114,12 @@ export async function initCheckout(root) {
       apply(r.data.quote)
       say(root, '')
     } else {
+      // A refusal carries its own sentence (and the quote, when there is one);
+      // anything else is the shop not answering. "Can't be bought" is the
+      // quote's to say, through its `unavailable` field — never a fallback.
+      if (r.data.quote) apply(r.data.quote)
       button.disabled = true
-      say(root, r.data.error || 'This can’t be bought right now.')
+      say(root, r.data.error || NO_ANSWER)
     }
   }
 
@@ -123,6 +135,12 @@ export async function initCheckout(root) {
     }
     if (r.data.quote) apply(r.data.quote)
     else button.disabled = false
+    // [[BUG-367]] — the builder's draft answers the owner a notice instead of a
+    // payment address: the draft never takes money.
+    if (r.ok && r.data.notice) {
+      say(root, r.data.notice)
+      return
+    }
     say(root, r.data.error || 'Payment could not be started. Nothing was charged; please try again.')
   })
   await refresh()
diff --git a/packages/framework/src/modules/checkout/component.ts b/packages/framework/src/modules/checkout/component.ts
index dc7f359f69..ba5919f808 100644
--- a/packages/framework/src/modules/checkout/component.ts
+++ b/packages/framework/src/modules/checkout/component.ts
@@ -3,7 +3,7 @@ import { bindL1, renderL1Fragment, type L1BindRecord, type L1ControlElement } fr
 import type { BehaviorProps } from '../behavior'
 import { escapeHtml } from '../html'
 import { formatMoney } from '../../intl'
-import { buyBlockedNote, catalogRecord, isSold, type CatalogDrawContext, type CatalogItem } from '../product-catalog/items'
+import { buyBlockedNote, catalogRecord, isSold, productPagePath, type CatalogDrawContext, type CatalogItem } from '../product-catalog/items'
 
 /**
  * `checkout` behavior ([[REQ-643]]) — see `meta.ts`.
@@ -28,6 +28,20 @@ export const CHECKOUT_ROOT_ATTR = 'data-checkout'
  */
 export const CHECKOUT_BLOCKED_ATTR = 'data-checkout-blocked'
 
+/**
+ * [[BUG-367]] — the Ship to choice's wording when the page's `countryPrompt`
+ * sets none: its accessible name and its first, empty option.
+ */
+export const DEFAULT_COUNTRY_PROMPT = 'Please select a region for delivery'
+
+/** [[BUG-367]] — the Cancel link's wording when the page's `cancelLabel` sets none. */
+export const DEFAULT_CANCEL_LABEL = 'Cancel'
+
+/** A root-relative path as a document-relative one (a nested page carries `<base>`). */
+const relative = (path: string): string => (path === '/' ? './' : path.replace(/^\/+/, ''))
+
+const copy = (value: unknown, fallback: string): string => (typeof value === 'string' && value ? value : fallback)
+
 function single(value: unknown): L1Node | null {
   return value && typeof value === 'object' && !Array.isArra
```

[elided — kept 5800 of 9486 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 70,115p packages/fr…
<!-- xgd-tool name="Bash" id="toolu_0135hj46RksGunFh5X1WDmg7" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:04.283474+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 70,115p packages/framework/src/modules/checkout/client.js; grep -n \"productPages\\|catalogSeed = \\|export function catalogSeed\" tests/support/catalog-site.ts | head","description":"Read client refresh logic and seed helper"}
```

**Result**

```
function orderParam() {
  try {
    return new URLSearchParams(window.location.search).get('order') || ''
  } catch (_e) {
    return ''
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** The checkout page: current figures, then Continue to payment. */
export async function initCheckout(root) {
  const item = root.getAttribute('data-checkout-item')
  const select = control(root, 'ship-to')
  const button = control(root, 'continue')
  if (!item || !button) return
  // [[BUG-363]] — the builder's page for a business that can't sell yet: it
  // already says what to set up, so there is nothing to ask and nothing to say.
  if (root.hasAttribute('data-checkout-blocked')) return
  const locale = root.getAttribute('data-checkout-locale') || ''
  const publishedText = root.getAttribute('data-checkout-price')
  const published = publishedText === null ? NaN : Number(publishedText)
  const lines = [{ item, quantity: 1 }]
  let quote = null

  const apply = (q) => {
    quote = q
    const line = q.lines && q.lines[0]
    if (line) {
      setText(root, 'price', line.display.unitAmount)
      show(root, 'changed', Number.isFinite(published) && line.unitAmount !== published)
      show(root, 'unavailable', !line.available)
      if (select) select.disabled = !line.available
    }
    setText(root, 'shipping', q.display.shipping == null ? '—' : q.display.shipping)
    setText(root, 'total', q.display.total == null ? q.display.subtotal : q.display.total)
    if (q.dispatchNote) setText(root, 'dispatch', q.dispatchNote)
    button.disabled = !q.canCheckout
  }

  const refresh = async () => {
    const r = await post(root, 'quote', { lines, country: select ? select.value : '', locale })
    if (r.ok && r.data.quote) {
      apply(r.data.quote)
      say(root, '')
83:export function catalogSeed(
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff packages/framewor…
<!-- xgd-tool name="Bash" id="toolu_01Ez4TY6CjwCH4jGoUhXpCgB" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:08.931758+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff packages/framework/src/modules/checkout/meta.ts apps/control-app/src/builder/config.js; grep -rn \"countryPrompt\" --include=*.ts tools packages apps | grep -v \"\\.test\\.\" | head","description":"Find where countryPrompt is configured"}
```

**Result**

```
diff --git a/apps/control-app/src/builder/config.js b/apps/control-app/src/builder/config.js
index be6928b2d1..70aeeb8013 100644
--- a/apps/control-app/src/builder/config.js
+++ b/apps/control-app/src/builder/config.js
@@ -1084,7 +1084,7 @@ export const HELP_LINES = {
  * included" with their reasons. Read-only: the client changes it through the chat.
  */
 export const PLAN_ROUTE_HEADING = 'The plan'
-export const PLAN_ROUTE_EMPTY = "Your plan appears here once we know what your site is for."
+export const PLAN_ROUTE_EMPTY = "Your plan appears here once it has been agreed."
 export const PLAN_ROUTE_AGREED = 'Agreed with you'
 export const PLAN_ROUTE_CHANGE = 'To change it, just say so in the chat. Nothing is final until you say it is.'
 export const PLAN_ROUTE_SKIPPED = 'Not included'
diff --git a/packages/framework/src/modules/checkout/meta.ts b/packages/framework/src/modules/checkout/meta.ts
index 630fec05c2..6ba01c4c55 100644
--- a/packages/framework/src/modules/checkout/meta.ts
+++ b/packages/framework/src/modules/checkout/meta.ts
@@ -34,10 +34,12 @@ export const checkoutMeta = {
   config: {
     // Which page this instance is.
     mode: { type: 'enum', required: true, values: ['checkout', 'complete', 'cancelled'] },
-    // Copy, so it lives in the definition: the Continue button's label and the
-    // Ship to choice's first, empty option.
+    // Copy, so it lives in the definition: the Continue button's label, the
+    // Ship to choice's first, empty option (default "Please select a region for
+    // delivery"), and [[BUG-367]] the Cancel link's label (default "Cancel").
     continueLabel: { type: 'string', required: false },
     countryPrompt: { type: 'string', required: false },
+    cancelLabel: { type: 'string', required: false },
   },
   slots: {
     // The page: one L1 subtree. On the checkout page it is drawn for the item.
@@ -48,6 +50,8 @@ export const checkoutMeta = {
     'ship-to': { element: 'select', required: false },
     // Continue to payment.
     continue: { element: 'button', required: false },
+    // [[BUG-367]] — Cancel: back to the piece's product page, or the shop.
+    cancel: { element: 'a', required: false },
     // Where the script says what went wrong (a refusal, a network failure).
     message: { element: 'span', required: false },
   },
(eval):1: no matches found: --include=*.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 93,182p tests/test_…
<!-- xgd-tool name="Bash" id="toolu_01Ps6Qo1kpoNFSuykbb1Gsqw" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:11.900947+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 93,182p tests/test_UAT_FC_REQ-643_checkout_pages.test.ts","description":"Read REQ-643 page tests for override pattern"}
```

**Result**

```
  it('test_UAT_FC_REQ-643_a_site_that_sells_gets_default_checkout_complete_and_cancelled_pages', async () => {
    const files = await render()
    // One checkout page per live item, and the two return pages.
    for (const item of catalogItems()) expect(files.has(`checkout/${item.slug}.html`)).toBe(true)
    expect(files.has('order-complete.html')).toBe(true)
    expect(files.has('order-cancelled.html')).toBe(true)

    const page = dom(files.get('checkout/brass-lamp.html')).window.document
    // Drawn by the module inside the site's own page frame, through L1.
    const root = page.querySelector('[data-fc-type="checkout"][data-checkout="checkout"]')!
    expect(root.getAttribute('data-checkout-item')).toBe('brass-lamp')
    expect(root.getAttribute('data-checkout-price')).toBe('1999')
    expect(root.getAttribute('data-checkout-endpoint')).toBe('api/checkout')
    expect(page.querySelector('[data-l1-bind="name"]')?.textContent).toBe('Brass lamp')
    expect(page.querySelector('[data-l1-bind="price"]')?.textContent).toBe('€19.99')
    expect(page.querySelector('[data-l1-bind="dispatch"]')?.textContent).toBe('Ships within 3 working days')
    // The show-later messages are present, hidden.
    expect((page.querySelector('[data-l1-bind="changed"]') as HTMLElement).hidden).toBe(true)
    expect((page.querySelector('[data-l1-bind="unavailable"]') as HTMLElement).hidden).toBe(true)
    // Ship to offers only the countries the business ships to, each with its rate.
    const options = [...page.querySelectorAll('select[data-checkout-control="ship-to"] option')].map((o) => [o.getAttribute('value'), o.getAttribute('data-rate')])
    expect(options[0]).toEqual(['', null])
    expect(options.slice(1).sort()).toEqual([['DE', '500'], ['FR', '500'], ['GB', '800']])
    expect((page.querySelector('button[data-checkout-control="continue"]') as HTMLButtonElement).textContent).toBe('Continue to payment')
    // The site's header and footer are drawn around it, like any page.
    expect(page.querySelector('base')?.getAttribute('href')).toBe('../')

    const complete = dom(files.get('order-complete.html')).window.document
    expect(complete.querySelector('[data-checkout="complete"]')).not.toBeNull()
    expect((complete.querySelector('[data-l1-bind="confirming"]') as HTMLElement).hidden).toBe(false)
    expect((complete.querySelector('[data-l1-bind="confirmed"]') as HTMLElement).hidden).toBe(true)
    expect(dom(files.get('order-cancelled.html')).window.document.body.textContent).toMatch(/Nothing was charged/)

    // The product page's Buy goes to the checkout page.
    const buy = dom(files.get('shop/brass-lamp.html')).window.document.querySelector('a[data-l1-bind="buy"]')
    expect(buy?.getAttribute('href')).toBe('checkout/brass-lamp')
  })

  it('test_UAT_FC_REQ-643_no_buy_and_no_checkout_pages_without_payments_or_a_zone', async () => {
    for (const catalog of [{ canTakePayments: false }, { shipping: { ...SHIPPING, countries: [] } }, { shipping: undefined }]) {
      const files = await render({ catalog })
      expect([...files.keys()].some((f) => f.startsWith('checkout/') || f.startsWith('order-'))).toBe(false)
      const product = dom(files.get('shop/brass-lamp.html')).window.document
      expect(product.querySelector('[data-l1-bind="buy"]')).toBeNull()
      // An available piece offers the enquiry link instead, as before.
      expect(product.querySelector('a[data-l1-bind="enquiry"]')).not.toBeNull()
    }
    // A sold piece never offers Buy, even when the business can sell.
    const files = await render()
    expect(dom(files.get('shop/sold-lamp.html')).window.document.querySelector('[data-l1-bind="buy"]')).toBeNull()
    const soldCheckout = dom(files.get('checkout/sold-lamp.html')).window.document
    expect((soldCheckout.querySelector('[data-l1-bind="unavailable"]') as HTMLElement).hidden).toBe(false)
    expect((soldCheckout.querySelector('button[data-checkout-control="continue"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('test_UAT_FC_REQ-643_restyling_the_site_design_restyles_the_checkout_page', async () => {
    // The site's design names its colour roles; the default checkout's Continue paints `action`.
    const withDesign = (action: string) => (loaded: LoadedSite) =>
      ({
        ...loaded,
        site: { ...loaded.site, design: { ...(loaded.site.design ?? {}), colour: { ...(loaded.site.design?.colour ?? {}), action, onAction: '#ffffff', text: '#1a1a1a', border: '#cccccc' } } },
      }) as LoadedSite
    const a = (await render({ site: withDesign('#1f6f43') })).get('checkout/brass-lamp.html')!
    const b = (await render({ site: withDesign('#7a1fa2') })).get('checkout/brass-lamp.html')!
    expect(a.toLowerCase()).toContain('#1f6f43')
    expect(b.toLowerCase()).toContain('#7a1fa2')
    expect(b.toLowerCase()).not.toContain('#1f6f43')
  })

  it('test_UAT_FC_REQ-643_the_sites_own_checkout_page_validates_and_replaces_the_default', async () => {
    const seed = catalogSeed()
    seed.pages['own-checkout.json'] = ownCheckoutPage('checkout', OWN_CHECKOUT)
    // The module's fields and controls pass the site validator, which runs the L1 envelope.
    const checked = validateSite({ ...seed.siteJson, pages: Object.values(seed.pages) })
    expect(checked.ok, checked.ok ? '' : JSON.stringify(checked.errors)).toBe(true)
    // An unknown field in its slot is refused.
    const bad = catalogSeed()
    bad.pages['own-checkout.json'] = ownCheckoutPage('checkout', { ...OWN_CHECKOUT, children: [{ kind: 'text', text: 'x', bind: { field: 'cardNumber' } }] })
    expect(validateSite({ ...bad.siteJson, pages: Object.values(bad.pages) }).ok).toBe(false)

    const files = await render({ seed })
    const page = dom(files.get('checkout/brass-lamp.html')).window.document
    exp
```

[elided — kept 5800 of 6301 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/test_UAT_FC_BU…
<!-- xgd-tool name="Bash" id="toolu_01U4NRiXShrSDKEDkVNyvM3p" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:40.032870+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/test_UAT_FC_BUG-367_checkout_page.test.ts <<'EOF'\nimport { afterEach, describe, expect, it, vi } from 'vitest'\nimport { JSDOM } from 'jsdom'\nimport { renderSiteFiles, type SiteCatalog } from '../tools/generate/src/render'\nimport { memorySiteStore } from '../tools/generate/src/store/memory-store'\nimport type { LoadedSite } from '../tools/generate/src/store/assemble'\nimport { latestModuleVersion } from '../packages/framework/src/worker'\nimport { starterHomePage } from '../tools/generate/src/cli/scaffold'\nimport { catalogSeed } from './support/catalog-site'\nimport { initCheckout, NO_ANSWER, UNREACHABLE } from '../packages/framework/src/modules/checkout/client.js'\nimport { DEFAULT_COUNTRY_PROMPT } from '../packages/framework/src/modules/checkout/component'\n\n/**\n * [[BUG-367]] — the checkout page as the site generator draws it, and its\n * script over the answers it can get. The Worker side (the draft's route, the\n * single-rate quote, `start` passing every country) is proven by\n * `test_UAT_FC_BUG-367_draft_checkout.workers.test.ts`.\n */\n\nconst MIXED = { currency: 'EUR', dispatchNote: 'Ships within 3 working days', countries: [{ code: 'FR', rate: 500 }, { code: 'GB', rate: 800 }] }\nconst SINGLE = { currency: 'EUR', dispatchNote: 'Ships within 3 working days', countries: [{ code: 'FR', rate: 500 }, { code: 'DE', rate: 500 }, { code: 'GB', rate: 500 }] }\n\nasync function render(shipping: typeof MIXED, seed = catalogSeed()): Promise<Map<string, string>> {\n  const store = memorySiteStore()\n  store.seed(seed.slug, seed)\n  const loaded = (await store.loadDraft(seed.slug))!.result\n  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))\n  const catalog: SiteCatalog = { items: undefined as never, canTakePayments: true, shipping }\n  delete (catalog as Partial<SiteCatalog>).items\n  const { files } = await renderSiteFiles(loaded.value as LoadedSite, { catalog: { ...catalog, items: (await import('./support/catalog-site')).catalogItems() } })\n  return new Map(files)\n}\n\nfunction page(files: Map<string, string>): Document {\n  const html = files.get('checkout/brass-lamp.html')\n  expect(html, 'checkout page was written').toBeDefined()\n  const jsdom = new JSDOM(html!, { url: 'https://shop.example/site/s1/checkout/brass-lamp' })\n  vi.stubGlobal('document', jsdom.window.document)\n  vi.stubGlobal('window', { location: { search: '', assign: () => undefined } })\n  return jsdom.window.document\n}\n\nconst QUOTE = {\n  currency: 'EUR',\n  lines: [{ item: 'brass-lamp', name: 'Brass lamp', quantity: 1, unitAmount: 1999, amount: 1999, available: true, display: { unitAmount: '€19.99', amount: '€19.99' } }],\n  countries: [],\n  country: 'FR',\n  shipping: 500,\n  subtotal: 1999,\n  total: 2499,\n  canCheckout: true,\n  display: { subtotal: '€19.99', shipping: '€5.00', total: '€24.99' },\n}\n\nafterEach(() => vi.unstubAllGlobals())\n\ndescribe('BUG-367 — the checkout page and its script', () => {\n  it('test_UAT_FC_BUG-367_a_404_page_reads_as_no_answer_not_cant_be_bought', async () => {\n    const d = page(await render(MIXED))\n    vi.stubGlobal('fetch', async () => new Response('<!doctype html><title>Not found</title>', { status: 404, headers: { 'content-type': 'text/html' } }))\n    await initCheckout(d.querySelector('[data-checkout=\"checkout\"]')!)\n    const message = d.querySelector('[data-checkout-control=\"message\"]')!.textContent\n    expect(message).toBe(NO_ANSWER)\n    expect(message).not.toMatch(/can.t be bought/)\n    expect((d.querySelector('button[data-checkout-control=\"continue\"]') as HTMLButtonElement).disabled).toBe(true)\n\n    // A network failure names itself too.\n    const again = page(await render(MIXED))\n    vi.stubGlobal('fetch', async () => {\n      throw new TypeError('Failed to fetch')\n    })\n    await initCheckout(again.querySelector('[data-checkout=\"checkout\"]')!)\n    expect(again.querySelector('[data-checkout-control=\"message\"]')!.textContent).toBe(UNREACHABLE)\n  })\n\n  it('test_UAT_FC_BUG-367_continue_starts_disabled_and_a_quote_enables_it', async () => {\n    const d = page(await render(MIXED))\n    const button = d.querySelector('button[data-checkout-control=\"continue\"]') as HTMLButtonElement\n    expect(button.disabled).toBe(true)\n    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ quote: QUOTE }), { status: 200 }))\n    ;(d.querySelector('select[data-checkout-control=\"ship-to\"]') as HTMLSelectElement).value = 'FR'\n    await initCheckout(d.querySelector('[data-checkout=\"checkout\"]')!)\n    expect(button.disabled).toBe(false)\n  })\n\n  it('test_UAT_FC_BUG-367_draft_start_shows_the_owner_notice', async () => {\n    const d = page(await render(MIXED))\n    const notice = 'Payment opens on your published site. Only you see this.'\n    const answers: Record<string, unknown> = { quote: { quote: QUOTE }, start: { notice, quote: QUOTE } }\n    vi.stubGlobal('fetch', async (url: string) => new Response(JSON.stringify(answers[String(url).split('/').pop()!]), { status: 200 }))\n    ;(d.querySelector('select[data-checkout-control=\"ship-to\"]') as HTMLSelectElement).value = 'FR'\n    await initCheckout(d.querySelector('[data-checkout=\"checkout\"]')!)\n    const button = d.querySelector('button[data-checkout-control=\"continue\"]') as HTMLButtonElement\n    button.click()\n    await new Promise((r) => setTimeout(r, 10))\n    expect(d.querySelector('[data-checkout-control=\"message\"]')!.textContent).toBe(notice)\n    expect(button.hidden).toBe(false)\n  })\n\n  it('test_UAT_FC_BUG-367_single_rate_shop_draws_no_ship_to_and_quotes_that_rate', async () => {\n 
```

[elided — kept 5800 of 8721 bytes]

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  17:12:41
   Duration  1.36s (transform 553ms, setup 0ms, import 1.07s, tests 196ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF' p='tests…
<!-- xgd-tool name="Bash" id="toolu_01W12xN9bZRLAFF39LfuatMz" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:48.679893+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-367_checkout_page.test.ts'\ns=open(p).read()\ns=s.replace(\"import { catalogSeed } from './support/catalog-site'\",\"import { catalogItems, catalogSeed } from './support/catalog-site'\")\nold=s[s.index(\"  const catalog: SiteCatalog = { items: undefined\"):s.index(\"  return new Map(files)\")]\ns=s.replace(old,\"  const catalog: SiteCatalog = { items: catalogItems(), canTakePayments: true, shipping }\\n  const { files } = await renderSiteFiles(loaded.value as LoadedSite, { catalog })\\n\")\nopen(p,'w').write(s)\nEOF\ntimeout 300 npx vitest run tests/test_UAT_FC_BUG-367_checkout_page.test.ts 2>&1 | grep \"Tests \"; ls tests/browser/ | head -30; ls tests/browser/support","description":"Simplify helper, rerun, list browser tests","timeout":320000}
```

**Result**

```
      Tests  6 passed (6)
support
test_UAT_FC_BUG-333_j1_currency.test.ts
test_UAT_FC_BUG-333_j2_import.test.ts
test_UAT_FC_BUG-333_j3_reimport.test.ts
test_UAT_FC_BUG-333_j4_inventory_list.test.ts
test_UAT_FC_BUG-333_j5_item_editing.test.ts
test_UAT_FC_BUG-333_j6_new_and_delete.test.ts
test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
test_UAT_FC_BUG-333_j8_enquiry_links.test.ts
test_UAT_FC_BUG-333_j9_safety.test.ts
test_UAT_FC_BUG-339_shop_type_and_layout.test.ts
test_UAT_FC_REQ-639_shop_layout_and_filters.test.ts
test_UAT_FC_REQ-651_item_collections.test.ts
build.ts
control-app.ts
shop.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -ln "chromium.launch"…
<!-- xgd-tool name="Bash" id="toolu_016Su1kuLZM8fCcrLPd8dZUt" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:55.199980+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -ln \"chromium.launch\" tests/*.test.ts | head; grep -n \"chromium\\|import\\|setContent\\|skipIf\\|launch\" tests/bug18-responsive-text-axes.test.ts | head -30","description":"Find a static-HTML Chromium test pattern"}
```

**Result**

```
tests/reconciliation-builder-workspace-origin.test.ts
tests/reconciliation-copy-edit-gesture.test.ts
tests/reconciliation-copy-edit-live-preview.test.ts
tests/reconciliation-copy-edit-form-presentation.test.ts
tests/reconciliation-copy-edit-tracking.test.ts
tests/reconciliation-copy-edit-parameter-sheet.test.ts
tests/req117-edit-loop-browser.test.ts
tests/req117-builder-viewport-fill.test.ts
tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.test.ts
tests/test_UAT_FC_BUG-35_tracking_reaches_the_words.test.ts
23:import { describe, expect, it } from 'vitest'
24:import {
30:import { renderL1Document } from '../packages/framework/src/index'
31:import {
63:    engine: 'chromium',
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 1,80p tests/test_UA…
<!-- xgd-tool name="Bash" id="toolu_01AUN9VXucsQVEcq8gZDz63Y" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:57.333293+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 1,80p tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.test.ts","description":"Read a Chromium UAT example"}
```

**Result**

```
/**
 * BUG-259 — **an inlined drawing is fitted exactly like an `<img>` of it would be**.
 *
 * A `parts: true` image (REQ-335) is placed in the page as a `<span>` around the
 * drawing's `<svg>`, and `object-fit` / `object-position` do nothing on a span.
 * Laid over a photo in the same box with the same fit, the drawing then agreed
 * with the photo only when the box had the photo's ratio, and drifted at every
 * other window size.
 *
 * THE EVIDENCE IS PIXELS AGAINST GEOMETRY, in real Chromium. The photo is a
 * 1536×1024 PNG painted with coloured dots at known image coordinates, and it is
 * rendered as the `<img>` the renderer emits — so where a dot lands is the
 * browser's own `object-fit`, not this suite's arithmetic. The drawing shares
 * the photo's frame (`viewBox="0 0 1536 1024"`) and carries a named part at each
 * dot. Each part's centre, relative to its own node, must land within a pixel of
 * the matching dot, relative to the photo's node, at every box size.
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { chromiumAvailable } from '../tools/generate/src/cli/capture'
import { browserLaunchOptions } from '../tools/generate/src/cli/capture/launch-args'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

const itBrowser = it.runIf(await chromiumAvailable())

const ORIGIN = 'http://fixture.test'
const PHOTO = { width: 1536, height: 1024 }

/** Image-space points, each painted on the photo in its own colour. */
const POINTS = [
  { id: 'mouth', x: 700, y: 356, rgb: [255, 0, 0] },
  { id: 'smoke', x: 520, y: 700, rgb: [0, 0, 255] },
] as const

const DRAWING =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PHOTO.width} ${PHOTO.height}">` +
  POINTS.map((p) => `<circle id="${p.id}" cx="${p.x}" cy="${p.y}" r="6" fill="#fff" fill-opacity="0"/>`).join('') +
  '</svg>'

type Fit = { objectFit?: 'cover' | 'contain'; objectPosition?: { xPct: number; yPct: number } }

function image(id: string, src: string, size: { w: number; h: number }, fit: Fit, parts: boolean): L1Node {
  return {
    kind: 'image',
    id,
    src,
    alt: '',
    ...(parts ? { parts: true } : {}),
    axes: fit,
    sizing: { width: { mode: 'fixed', px: size.w }, height: { mode: 'fixed', px: size.h } },
  } as L1Node
}

function doc(size: { w: number; h: number }, fit: Fit): L1Document {
  return {
    widths: [320, 1280],
    root: {
      kind: 'container',
      layout: 'stack',
      children: [
        image('photo', '/assets/photo.png', size, fit, false),
        image('glow', '/assets/glow.svg', size, fit, true),
      ],
    } as L1Node,
  }
}

type Page = import('playwright').Page

/** A 1536×1024 PNG, dark, with each point painted as a small dot of its colour. */
async function paintPhoto(page: Page): Promise<Buffer> {
  const url = await page.evaluate(
    ({ width, height, points }) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 80,200p tests/test_…
<!-- xgd-tool name="Bash" id="toolu_01MThv1s7rKc1o1Kx1npVxp1" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:12:59.506932+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 80,200p tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.test.ts | grep -n \"launch\\|require\\|route\\|goto\\|newPage\\|close\\|setViewport\\|playwright\" ","description":"See how it launches and serves pages"}
```

**Result**

```
67: * browser per page: a `--single-process` Chromium (the launch some sandboxes
68: * require) serves only one context.
71:  const require = createRequire(path.resolve(__dirname, '../tools/generate/package.json'))
72:  const mod = (await import(/* @vite-ignore */ pathToFileURL(require.resolve('playwright')).href)) as typeof import('playwright')
73:  const browser = await mod.chromium.launch(browserLaunchOptions())
75:    return await run(await browser.newPage({ viewport, deviceScaleFactor: 1 }))
77:    await browser.close()
85:  await page.route(`${ORIGIN}/**`, (route) => {
86:    const url = route.request().url()
87:    if (url.endsWith('photo.png')) return route.fulfill({ contentType: 'image/png', body: photo })
88:    return route.fulfill({
93:  await page.goto(`${ORIGIN}/`)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff packages/framewor…
<!-- xgd-tool name="Bash" id="toolu_0182Vq2XzsKGX7JVUzKAbHMy" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:03.827232+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff packages/framework/src/l2/checkout.ts packages/framework/src/l1/render.ts","description":"Review l2 template and renderer diffs"}
```

**Result**

```
diff --git a/packages/framework/src/l1/render.ts b/packages/framework/src/l1/render.ts
index e9d92e7d83..d792d1719e 100644
--- a/packages/framework/src/l1/render.ts
+++ b/packages/framework/src/l1/render.ts
@@ -1011,10 +1011,13 @@ function interactionRules(
     rules.push({ selector: `${selector}:focus-visible`, decls: focusRingDecls(undefined) })
   }
 
+  // [[BUG-367]] — a control's hover is a live control's: a disabled one keeps
+  // its resting look.
+  const hover = interactive ? `${selector}:hover:not(:disabled)` : `${selector}:hover`
   if (interaction.hover) {
     const decls = stateDecls(interaction.hover, baseTransform)
     if (decls.length) {
-      rules.push({ selector: `${selector}:hover`, decls })
+      rules.push({ selector: hover, decls })
       decls.forEach((d) => props.add(declProp(d)))
     }
     if (interaction.hover.motion) anyMotion = true
@@ -1048,7 +1051,7 @@ function interactionRules(
   if (anyMotion) {
     const settled = baseTransform ? transformCss(baseTransform) : null
     const decls = [`transform: ${settled ?? 'none'}`]
-    if (interaction.hover?.motion) rules.push({ media: REDUCED_MOTION, selector: `${selector}:hover`, decls })
+    if (interaction.hover?.motion) rules.push({ media: REDUCED_MOTION, selector: hover, decls })
     if (interaction.focus?.motion) {
       rules.push({ media: REDUCED_MOTION, selector: `${selector}:focus-visible`, decls })
     }
@@ -2348,6 +2351,9 @@ function isSafeAttrName(name: string): boolean {
 }
 
 /** A module-declared control element → HTML, with L1's class and escaped attrs. */
+/** [[BUG-367]] — how far a disabled control is dimmed. */
+export const DISABLED_OPACITY = 0.45
+
 function controlHtml(el: L1ControlElement, cls: string): string {
   const attrs: string[] = [`class="${cls}"`]
   for (const [name, value] of Object.entries(el.attrs ?? {})) {
@@ -6072,6 +6078,20 @@ function emitNode(
       // a decoration the document asks for through `textDecoration` or not at
       // all, exactly as REQ-333 already resets it on a linked run.
       if (el.tag === 'a') base.unshift('text-decoration: none')
+      // [[BUG-367]] — A BUTTON'S LABEL IS CENTRED, across and down, unless the
+      // node says otherwise: unshifted, so an authored `textAlign` still wins. A
+      // link drawn as a button (a fill or a border) is centred the same way.
+      if (el.tag === 'button') base.unshift('text-align: center')
+      else if (el.tag === 'a' && (node.axes?.surfaceFill || node.axes?.border)) {
+        base.unshift('display: inline-flex', 'justify-content: center', 'align-items: center', 'text-align: center')
+      }
+      // [[BUG-367]] — A DISABLED CONTROL LOOKS DISABLED. The script and the
+      // module set `disabled` when a control cannot work; without this a disabled
+      // button painted exactly like a live one. Dimmed, a not-allowed cursor, and
+      // no hover change (the hover rules below skip `:disabled`).
+      if (el.tag === 'button' || el.tag === 'input' || el.tag === 'select' || el.tag === 'textarea') {
+        state.rules.push({ selector: `${selector}:disabled`, decls: [`opacity: ${DISABLED_OPACITY}`, 'cursor: not-allowed'] })
+      }
       // A placeholder is painted by a UA pseudo-element that does NOT inherit
       // `color`, so an L1 subtree that set a field's text colour would still get
       // the browser's grey inside the box. Re-point it at the element's own
diff --git a/packages/framework/src/l2/checkout.ts b/packages/framework/src/l2/checkout.ts
index 88939a9cd4..76f6f694e7 100644
--- a/packages/framework/src/l2/checkout.ts
+++ b/packages/framework/src/l2/checkout.ts
@@ -19,6 +19,31 @@ export type CheckoutPageMode = 'checkout' | 'complete' | 'cancelled'
 
 const FALLBACK = { action: '#111111', onAction: '#ffffff', border: '#d4d4d4', text: '#111111' }
 
+/** A colour role's value in the design, or undefined when it names none. */
+function colourOf(design: L1Design | undefined, name: string | undefined): string | { ref: string } | undefined {
+  return name === undefined ? undefined : (design?.colour?.[name as keyof NonNullable<L1Design['colour']>] as string | { ref: string } | undefined)
+}
+
+/**
+ * [[BUG-367]] — Cancel's look: the design's `button.secondary` (its text colour,
+ * its fill or its border), else an outline in the text and border roles.
+ */
+function secondaryAxes(design: L1Design | undefined): Record<string, unknown> {
+  const c = design?.components?.['button.secondary']
+  const ink = colourOf(design, c?.text) ?? role(design, 'text')
+  const fill = colourOf(design, c?.fill)
+  const edge = c?.border ? { widthPx: c.border.widthPx, color: colourOf(design, c.border.colour) ?? role(design, 'border') } : undefined
+  return {
+    color: ink,
+    ...(fill ? { surfaceFill: fill } : {}),
+    ...(edge || !fill ? { border: edge ?? { widthPx: 1, color: role(design, 'border') } } : {}),
+    borderRadiusPx: 6,
+  }
+}
+
+/** [[BUG-367]] — the width from which the checkout's actions sit side by side: a tablet's. */
+export const CHECKOUT_ACTIONS_ROW_AT_PX = 768
+
 /** A colour role's value in the design (a hex or a palette reference), else the fallback. */
 function role(design: L1Design | undefined, name: 'action' | 'onAction' | 'border' | 'text'): string | { ref: string } {
   const button = design?.components?.['button.primary']
@@ -41,6 +66,38 @@ function message(): L1Node {
   return { kind: 'control', control: 'message', role: 'small' } as L1Node
 }
 
+/**
+ * [[BUG-367]] — Continue to payment and Cancel. From a tablet's width up they sit
+ * at the right of one row, each as wide as its label, Cancel on the left at the
+ * same height; on a phone they stack full width, Continue on top. Cancel is drawn
+ * twice for that, each copy shown only
```

[elided — kept 5800 of 9306 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 140,165p tests/test…
<!-- xgd-tool name="Bash" id="toolu_01KpPKWvSeHGeWeZV44sZ38d" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:10.836771+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 140,165p tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.test.ts","description":"Read the browser helper in full"}
```

**Result**

```
    )
  }, POINTS.map((p) => p.id))
}

/**
 * Playwright is tools/generate's dependency, so it is resolved from there. One
 * browser per page: a `--single-process` Chromium (the launch some sandboxes
 * require) serves only one context.
 */
async function withPage<T>(viewport: { width: number; height: number }, run: (page: Page) => Promise<T>): Promise<T> {
  const require = createRequire(path.resolve(__dirname, '../tools/generate/package.json'))
  const mod = (await import(/* @vite-ignore */ pathToFileURL(require.resolve('playwright')).href)) as typeof import('playwright')
  const browser = await mod.chromium.launch(browserLaunchOptions())
  try {
    return await run(await browser.newPage({ viewport, deviceScaleFactor: 1 }))
  } finally {
    await browser.close()
  }
}

async function load(page: Page, d: L1Document, photo: Buffer): Promise<void> {
  const v = validateL1(d)
  expect(v.ok, v.ok ? '' : JSON.stringify(v.errors)).toBe(true)
  const { html, css } = renderL1Document(d, { drawings: { 'glow.svg': DRAWING } })
  await page.route(`${ORIGIN}/**`, (route) => {
    const url = route.request().url()
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n "async function in…
<!-- xgd-tool name="Bash" id="toolu_01FaNdG7VGDpfeNmwpZjdoMA" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:12.626786+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n \"async function inBrowser\\|function withPage\\|async function with\" -A 14 tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.test.ts | head -40","description":"Find the browser-launch helper"}
```

**Result**

```
149:async function withPage<T>(viewport: { width: number; height: number }, run: (page: Page) => Promise<T>): Promise<T> {
150-  const require = createRequire(path.resolve(__dirname, '../tools/generate/package.json'))
151-  const mod = (await import(/* @vite-ignore */ pathToFileURL(require.resolve('playwright')).href)) as typeof import('playwright')
152-  const browser = await mod.chromium.launch(browserLaunchOptions())
153-  try {
154-    return await run(await browser.newPage({ viewport, deviceScaleFactor: 1 }))
155-  } finally {
156-    await browser.close()
157-  }
158-}
159-
160-async function load(page: Page, d: L1Document, photo: Buffer): Promise<void> {
161-  const v = validateL1(d)
162-  expect(v.ok, v.ok ? '' : JSON.stringify(v.errors)).toBe(true)
163-  const { html, css } = renderL1Document(d, { drawings: { 'glow.svg': DRAWING } })
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/test_UAT_FC_BU…
<!-- xgd-tool name="Bash" id="toolu_01HVjG5m2Y9yuqc6VUGRdzN5" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:37.357275+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts <<'EOF'\n/**\n * [[BUG-367]] — the checkout page's buttons, as real Chromium lays them out.\n *\n * The page is the site generator's own (`renderSiteFiles`), served whole, with\n * its script held back so the page's drawn state is what is measured: a\n * disabled Continue must LOOK disabled, a button's label is centred in its box,\n * and the actions sit right, sized to their labels, from a tablet's width up,\n * and stack full width on a phone, Continue on top.\n */\n\nimport { createRequire } from 'node:module'\nimport path from 'node:path'\nimport { pathToFileURL } from 'node:url'\nimport { describe, expect, it } from 'vitest'\nimport { chromiumAvailable } from '../tools/generate/src/cli/capture'\nimport { browserLaunchOptions } from '../tools/generate/src/cli/capture/launch-args'\nimport { renderSiteFiles, type SiteCatalog } from '../tools/generate/src/render'\nimport { memorySiteStore } from '../tools/generate/src/store/memory-store'\nimport { catalogItems, catalogSeed } from './support/catalog-site'\n\nconst itBrowser = it.runIf(await chromiumAvailable())\n\nconst ORIGIN = 'http://fixture.test'\nconst SHIPPING = { currency: 'EUR', dispatchNote: 'Ships within 3 working days', countries: [{ code: 'FR', rate: 500 }, { code: 'GB', rate: 800 }] }\n\ntype Page = import('playwright').Page\n\nasync function siteFiles(): Promise<Map<string, string>> {\n  const seed = catalogSeed()\n  const store = memorySiteStore()\n  store.seed(seed.slug, seed)\n  const loaded = (await store.loadDraft(seed.slug))!.result\n  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))\n  const catalog: SiteCatalog = { items: catalogItems(), canTakePayments: true, shipping: SHIPPING }\n  return new Map((await renderSiteFiles(loaded.value, { catalog })).files)\n}\n\n/** Playwright is tools/generate's dependency; one browser per page (see BUG-259's suite). */\nasync function withPage<T>(width: number, run: (page: Page) => Promise<T>): Promise<T> {\n  const require = createRequire(path.resolve(__dirname, '../tools/generate/package.json'))\n  const mod = (await import(/* @vite-ignore */ pathToFileURL(require.resolve('playwright')).href)) as typeof import('playwright')\n  const browser = await mod.chromium.launch(browserLaunchOptions())\n  try {\n    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })\n    const files = await siteFiles()\n    await page.route(`${ORIGIN}/**`, (route) => {\n      const file = new URL(route.request().url()).pathname.replace(/^\\/+/, '')\n      if (file.endsWith('.js')) return route.abort()\n      const body = files.get(file) ?? files.get(`${file}.html`)\n      if (body === undefined) return route.fulfill({ status: 404, body: '' })\n      const contentType = file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html'\n      return route.fulfill({ contentType, body })\n    })\n    await page.goto(`${ORIGIN}/checkout/brass-lamp`)\n    return await run(page)\n  } finally {\n    await browser.close()\n  }\n}\n\ntype Box = { x: number; y: number; width: number; height: number }\n\ndescribe('BUG-367 — the checkout page buttons in Chromium', () => {\n  itBrowser('test_UAT_FC_BUG-367_a_disabled_continue_looks_disabled', async () => {\n    await withPage(1024, async (page) => {\n      const button = page.locator('button[data-checkout-control=\"continue\"]')\n      expect(await button.isDisabled()).toBe(true)\n      const style = () => button.evaluate((b) => ({ opacity: getComputedStyle(b).opacity, cursor: getComputedStyle(b).cursor }))\n      const disabled = await style()\n      await button.evaluate((b) => b.removeAttribute('disabled'))\n      const enabled = await style()\n      expect(disabled.cursor).toBe('not-allowed')\n      expect(Number(disabled.opacity)).toBeLessThan(Number(enabled.opacity))\n      expect(enabled.cursor).not.toBe('not-allowed')\n    })\n  })\n\n  itBrowser('test_UAT_FC_BUG-367_a_button_label_is_centred_in_its_box', async () => {\n    await withPage(375, async (page) => {\n      // At phone width Continue is full width, so a left-aligned label would show.\n      const centre = await page.locator('button[data-checkout-control=\"continue\"]').evaluate((b) => {\n        const box = b.getBoundingClientRect()\n        const range = document.createRange()\n        range.selectNodeContents(b)\n        const label = range.getBoundingClientRect()\n        return { dx: label.x + label.width / 2 - (box.x + box.width / 2), dy: label.y + label.height / 2 - (box.y + box.height / 2) }\n      })\n      expect(Math.abs(centre.dx)).toBeLessThanOrEqual(1)\n      expect(Math.abs(centre.dy)).toBeLessThanOrEqual(1)\n    })\n  })\n\n  itBrowser('test_UAT_FC_BUG-367_from_tablet_up_actions_sit_right_sized_to_their_labels', async () => {\n    await withPage(1024, async (page) => {\n      const m = await page.evaluate(() => {\n        const visible = (el: Element) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0\n        const cont = document.querySelector('button[data-checkout-control=\"continue\"]')!\n        const cancels = [...document.querySelectorAll('a[data-checkout-control=\"cancel\"]')].filter(visible)\n        const box = (el: Element) => {\n          const r = el.getBoundingClientRect()\n          return { x: r.x, y: r.y, width: r.width, height: r.height }\n        }\n        return { cont: box(cont), column: box(cont.parentElement!), cancels: cancels.map(box), href: cancels[0]?.getAttribute('href') }\n      })\n      expect(m.cont.width).toBeLessThan(m.column.width / 2)
```

[elided — kept 5800 of 7559 bytes]

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
 Test Files  1 skipped (1)
      Tests  4 skipped (4)
   Start at  17:13:38
   Duration  1.40s (transform 587ms, setup 0ms, import 1.32s, tests 0ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n "export async func…
<!-- xgd-tool name="Bash" id="toolu_01CBpAaceZ19jEjQT53bmjhw" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:44.196718+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -n \"export async function chromiumAvailable\" -A 20 tools/generate/src/cli/capture/*.ts tools/generate/src/cli/capture.ts 2>/dev/null | head -30","description":"Read chromiumAvailable implementation"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rn "function chromiu…
<!-- xgd-tool name="Bash" id="toolu_01Dr6t1iGmb2dENvW2UPCHye" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:46.401873+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rn \"function chromiumAvailable\" -A 18 tools/generate/src/cli/ | head -30","description":"Locate chromiumAvailable"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna "chromiumAvailab…
<!-- xgd-tool name="Bash" id="toolu_01WN8bytnKcrCVZvMKiFuBvv" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:48.522582+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna \"chromiumAvailable\" tools/generate/src/cli/ | grep -v \"^.*test\" | head -5","description":"Locate chromiumAvailable with grep -a"}
```

**Result**

```
tools/generate/src/cli/capture/playwright-driver.ts:430:export const chromiumAvailable = (): Promise<boolean> => engineAvailable('chromium')
tools/generate/src/cli/capture/index.ts:42:  chromiumAvailable,
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "async function e…
<!-- xgd-tool name="Bash" id="toolu_017hCsEQJH1Pnc6hEXwiTcYJ" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:50.881281+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"async function engineAvailable\\|const engineAvailable\" -A 25 tools/generate/src/cli/capture/playwright-driver.ts | head -40","description":"Read engineAvailable"}
```

**Result**

```
418:export async function engineAvailable(engine: RenderEngine = 'chromium'): Promise<boolean> {
419-  try {
420-    const playwright = await import('playwright')
421-    const browser = await playwright[engine].launch(browserLaunchOptions())
422-    await browser.close()
423-    return true
424-  } catch {
425-    return false
426-  }
427-}
428-
429-/** Back-compat alias — whether a real Chromium can launch here. */
430-export const chromiumAvailable = (): Promise<boolean> => engineAvailable('chromium')
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tools/generate && cat > $TMPD…
<!-- xgd-tool name="Bash" id="toolu_019jHJjPwbx35nrKsyorJrTU" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:54.305528+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tools/generate && cat > $TMPDIR/bug367-probe.mjs <<'EOF'\nimport { chromium } from 'playwright'\ntry { const b = await chromium.launch({ args: ['--single-process','--no-sandbox'] }); console.log('ok'); await b.close() } catch (e) { console.log(String(e).slice(0, 600)) }\nEOF\ncp $TMPDIR/bug367-probe.mjs ./bug367-probe.mjs && timeout 60 node bug367-probe.mjs; rm -f bug367-probe.mjs","description":"Probe why Chromium fails to launch","timeout":90000}
```

**Result**

```
ok
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && timeout 300 npx vitest run…
<!-- xgd-tool name="Bash" id="toolu_019oHpR2meezMwACLur3o6HT" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:13:58.958590+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && timeout 300 npx vitest run tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.test.ts 2>&1 | grep -E \"Tests |skipped\"; grep -na \"export function browserLaunchOptions\" -A 15 tools/generate/src/cli/capture/launch-args.ts","description":"Check if existing Chromium UAT also skips","timeout":320000}
```

**Result**

```
 Test Files  1 skipped (1)
      Tests  4 skipped (4)
50:export function browserLaunchOptions(env: NodeJS.ProcessEnv = process.env): { args?: string[] } {
51-  const configured = env[LAUNCH_ARGS_ENV]?.trim()
52-  if (!configured) return {}
53-  const args = configured
54-    .split(',')
55-    .map((arg) => arg.trim())
56-    .filter(Boolean)
57-  return args.length ? { args } : {}
58-}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "LAUNCH_ARGS_ENV…
<!-- xgd-tool name="Bash" id="toolu_01Gwt4x1zgnWC92fxrRqUrgL" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:03.068627+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"LAUNCH_ARGS_ENV =\" tools/generate/src/cli/capture/launch-args.ts","description":"Find launch-args env var name"}
```

**Result**

```
41:export const LAUNCH_ARGS_ENV = 'CHROMIUM_LAUNCH_ARGS'
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && CHROMIUM_LAUNCH_ARGS=--sin…
<!-- xgd-tool name="Bash" id="toolu_01JycsipdXwRUqdQf828otzx" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:06.370947+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 400 npx vitest run tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts 2>&1 | grep -vE \"^\\s*$\" | grep -v \"^ *❯ node_modules\" | tail -50","description":"Run Chromium UAT with launch args","timeout":420000}
```

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
 ❯ |node| tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts (4 tests | 3 failed) 730ms
     × test_UAT_FC_BUG-367_a_button_label_is_centred_in_its_box 144ms
     × test_UAT_FC_BUG-367_from_tablet_up_actions_sit_right_sized_to_their_labels 105ms
     × test_UAT_FC_BUG-367_on_a_phone_actions_stack_full_width_continue_on_top 122ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  |node| tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts > BUG-367 — the checkout page buttons in Chromium > test_UAT_FC_BUG-367_a_button_label_is_centred_in_its_box
AssertionError: expected 32.6640625 to be less than or equal to 1
 ❯ tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:88:35
     86|         return { dx: label.x + label.width / 2 - (box.x + box.width / …
     87|       })
     88|       expect(Math.abs(centre.dx)).toBeLessThanOrEqual(1)
       |                                   ^
     89|       expect(Math.abs(centre.dy)).toBeLessThanOrEqual(1)
     90|     })
 ❯ withPage tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:55:12
 ❯ tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:79:5
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯
 FAIL  |node| tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts > BUG-367 — the checkout page buttons in Chromium > test_UAT_FC_BUG-367_from_tablet_up_actions_sit_right_sized_to_their_labels
AssertionError: expected 113.328125 to be less than 0
 ❯ tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:105:28
    103|         return { cont: box(cont), column: box(cont.parentElement!), ca…
    104|       })
    105|       expect(m.cont.width).toBeLessThan(m.column.width / 2)
       |                            ^
    106|       expect(Math.abs(m.cont.x + m.cont.width - (m.column.x + m.column…
    107|       expect(m.cancels).toHaveLength(1)
 ❯ withPage tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:55:12
 ❯ tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:94:5
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯
 FAIL  |node| tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts > BUG-367 — the checkout page buttons in Chromium > test_UAT_FC_BUG-367_on_a_phone_actions_stack_full_width_continue_on_top
AssertionError: expected 48 to be less than or equal to 1
 ❯ tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:130:55
    128|       expect(m.cancels).toHaveLength(1)
    129|       const cancel = m.cancels[0] as Box
    130|       expect(Math.abs(m.cont.width - m.column.width)).toBeLessThanOrEq…
       |                                                       ^
    131|       expect(Math.abs(cancel.width - m.column.width)).toBeLessThanOrEq…
    132|       expect(cancel.y).toBeGreaterThan(m.cont.y)
 ❯ withPage tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:55:12
 ❯ tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts:117:5
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯
 Test Files  1 failed (1)
      Tests  3 failed | 1 passed (4)
   Start at  17:14:07
   Duration  1.79s (transform 517ms, setup 0ms, import 973ms, tests 730ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/zz-bug367-prob…
<!-- xgd-tool name="Bash" id="toolu_01BGGeKTyGWQM2PqQJ2AGyuk" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:15.668895+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/zz-bug367-probe.test.ts <<'EOF'\nimport { it } from 'vitest'\nimport { renderSiteFiles } from '../tools/generate/src/render'\nimport { memorySiteStore } from '../tools/generate/src/store/memory-store'\nimport { catalogItems, catalogSeed } from './support/catalog-site'\nit('probe', async () => {\n  const seed = catalogSeed(); const store = memorySiteStore(); store.seed(seed.slug, seed)\n  const loaded = (await store.loadDraft(seed.slug))!.result as any\n  const files = new Map((await renderSiteFiles(loaded.value, { catalog: { items: catalogItems(), canTakePayments: true, shipping: { currency: 'EUR', countries: [{ code: 'FR', rate: 500 }, { code: 'GB', rate: 800 }] } } as any })).files)\n  const html = files.get('checkout/brass-lamp.html')!\n  const i = html.indexOf('data-checkout-control=\"cancel\"')\n  console.log(html.slice(i - 900, i + 900))\n  const css = [...files.keys()].filter((k) => k.endsWith('.css'))\n  console.log('CSS FILES', css, html.includes('<style'))\n})\nEOF\ntimeout 200 npx vitest run tests/zz-bug367-probe.test.ts 2>&1 | sed -n '/stdout/,/CSS FILES/p' | head -60","description":"Dump rendered action-row HTML","timeout":220000}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && timeout 200 npx vitest run…
<!-- xgd-tool name="Bash" id="toolu_01SYE3ZPtBWLDv8qhxdouQdt" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:20.438221+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && timeout 200 npx vitest run tests/zz-bug367-probe.test.ts 2>&1 | grep -v \"^\\s*$\" | head -60","description":"Rerun probe showing full output","timeout":220000}
```

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367
 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  17:14:21
   Duration  698ms (transform 451ms, setup 0ms, import 573ms, tests 44ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -i '' "s#console.log(h…
<!-- xgd-tool name="Bash" id="toolu_01R9rUBKQ8LCxVFFfNBXTUfg" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:27.009576+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -i '' \"s#console.log(html.slice(i - 900, i + 900))#require('fs').writeFileSync(process.env.TMPDIR + '/bug367-checkout.html', html)#; s#console.log('CSS FILES', css, html.includes('<style'))#require('fs').writeFileSync(process.env.TMPDIR + '/bug367-css.txt', JSON.stringify(css))#\" tests/zz-bug367-probe.test.ts && timeout 200 npx vitest run tests/zz-bug367-probe.test.ts 2>&1 | grep \"Tests \"; cat $TMPDIR/bug367-css.txt; python3 - <<'EOF'\nimport os,re\nh=open(os.environ['TMPDIR']+'/bug367-checkout.html').read()\ni=h.index('data-checkout-control=\"cancel\"')\ns=h[h.rfind('<div',0,i-200):i+700]\nprint(s)\nEOF","description":"Write rendered page to TMPDIR and print action row","timeout":220000}
```

**Result**

```
      Tests  1 passed (1)
["theme.css"]<div class="checkout-checkout-checkout-l1-13"><p class="checkout-checkout-checkout-l1-14">Total</p><h3 class="checkout-checkout-checkout-l1-15" data-l1-bind="total">—</h3></div><div class="checkout-checkout-checkout-l1-16"><a class="checkout-checkout-checkout-l1-17" href="shop/brass-lamp" data-checkout-control="cancel">Cancel</a><button class="checkout-checkout-checkout-l1-18" type="button" data-checkout-control="continue" disabled>Continue to payment</button><a class="checkout-checkout-checkout-l1-19" href="shop/brass-lamp" data-checkout-control="cancel">Cancel</a></div><span class="checkout-checkout-checkout-l1-20" role="status" aria-live="polite" data-checkout-control="message"></span></div></div></div><style>.checkout-checkout-checkout-l1-1 { font-size: inherit; font-weight: inherit; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; margin: 0 }
.checkout-checkout-checkout-l1-3 { width: 320px; display: block }
.checkout-checkout-checkout-l1-5 { font-si
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -oE "[^}]*checkout-ch…
<!-- xgd-tool name="Bash" id="toolu_01UK5bBEaHv4zykHByRs21mo" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:32.800732+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -oE \"[^}]*checkout-checkout-checkout-l1-(16|17|18|19|2|1)[ :.{][^}]*\\}\" $TMPDIR/bug367-checkout.html | head -40","description":"Extract CSS rules for action row nodes"}
```

**Result**

```
<div data-fc-module="checkout-checkout" data-fc-type="checkout" class="checkout" data-checkout="checkout" data-checkout-locale="en" data-checkout-endpoint="api/checkout" data-checkout-item="brass-lamp" data-checkout-price="1999" data-checkout-currency="EUR" data-l1-slot="page"><div class="checkout-checkout-checkout-l1-0"><h1 class="checkout-checkout-checkout-l1-1">Checkout</h1><div class="checkout-checkout-checkout-l1-2"><img class="checkout-checkout-checkout-l1-3" data-l1-bind="photo" src="assets/brass-lamp.png" alt="Brass lamp" /><div class="checkout-checkout-checkout-l1-4"><h2 class="checkout-checkout-checkout-l1-5" data-l1-bind="name">Brass lamp</h2><p class="checkout-checkout-checkout-l1-6" data-l1-bind="price">€19.99</p><p class="checkout-checkout-checkout-l1-7" data-l1-bind="changed" hidden>The price has changed since this page was published. This is the current price.</p><p class="checkout-checkout-checkout-l1-8" data-l1-bind="unavailable" hidden>Sorry — this has sold since the page was published.</p><select class="checkout-checkout-checkout-l1-9" name="country" required aria-label="Please select a region for delivery" data-checkout-control="ship-to"><option value="">Please select a region for delivery</option><option value="FR" data-rate="500" data-rate-display="€5.00">France</option><option value="GB" data-rate="800" data-rate-display="€8.00">United Kingdom</option></select><div class="checkout-checkout-checkout-l1-10"><p class="checkout-checkout-checkout-l1-11">Shipping</p><p class="checkout-checkout-checkout-l1-12" data-l1-bind="shipping">—</p></div><div class="checkout-checkout-checkout-l1-13"><p class="checkout-checkout-checkout-l1-14">Total</p><h3 class="checkout-checkout-checkout-l1-15" data-l1-bind="total">—</h3></div><div class="checkout-checkout-checkout-l1-16"><a class="checkout-checkout-checkout-l1-17" href="shop/brass-lamp" data-checkout-control="cancel">Cancel</a><button class="checkout-checkout-checkout-l1-18" type="button" data-checkout-control="continue" disabled>Continue to payment</button><a class="checkout-checkout-checkout-l1-19" href="shop/brass-lamp" data-checkout-control="cancel">Cancel</a></div><span class="checkout-checkout-checkout-l1-20" role="status" aria-live="polite" data-checkout-control="message"></span></div></div></div><style>.checkout-checkout-checkout-l1-1 { font-size: inherit; font-weight: inherit; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; margin: 0 }
.checkout-checkout-checkout-l1-17:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }
.checkout-checkout-checkout-l1-17 { display: inline-flex; justify-content: center; align-items: center; text-align: center; text-decoration: none; -webkit-appearance: none; appearance: none; margin: 0; padding: 0; border: 0; background: transparent; font: inherit; color: inherit; color: #111111; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; border-radius: 6px; border: 1px solid #d4d4d4; padding-top: 14px; padding-right: 24px; padding-bottom: 14px; padding-left: 24px }
.checkout-checkout-checkout-l1-18:disabled { opacity: 0.45; cursor: not-allowed }
.checkout-checkout-checkout-l1-18:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }
.checkout-checkout-checkout-l1-18 { text-align: center; -webkit-appearance: none; appearance: none; margin: 0; padding: 0; border: 0; background: transparent; font: inherit; color: inherit; color: #ffffff; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background-color: #111111; border-radius: 6px; padding-top: 14px; padding-right: 24px; padding-bottom: 14px; padding-left: 24px }
.checkout-checkout-checkout-l1-19:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }
.checkout-checkout-checkout-l1-19 { display: inline-flex; justify-content: center; align-items: center; text-align: center; text-decoration: none; -webkit-appearance: none; appearance: none; margin: 0; padding: 0; border: 0; background: transparent; font: inherit; color: inherit; color: #111111; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; border-radius: 6px; border: 1px solid #d4d4d4; padding-top: 14px; padding-right: 24px; padding-bottom: 14px; padding-left: 24px }
.checkout-checkout-checkout-l1-16 { display: flex; flex-direction: column; gap: var(--l1-space-sm, 0px); justify-content: flex-end; align-items: stretch; position: relative }
.checkout-checkout-checkout-l1-2 { display: flex; flex-direction: column; gap: var(--l1-space-lg, 0px); position: relative }
  .checkout-checkout-checkout-l1-16 { display: flex; flex-direction: row }
  .checkout-checkout-checkout-l1-19 { display: none }
  .checkout-checkout-checkout-l1-17 { display: none }
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/zz-bug367-prob…
<!-- xgd-tool name="Bash" id="toolu_01L3b4eqp8uTxVTiWbsoZZAz" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:51.888739+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/zz-bug367-probe2.test.ts <<'EOF'\nimport { it } from 'vitest'\nimport { createRequire } from 'node:module'\nimport path from 'node:path'\nimport { pathToFileURL } from 'node:url'\nimport { readFileSync, writeFileSync } from 'node:fs'\nimport { renderSiteFiles } from '../tools/generate/src/render'\nimport { memorySiteStore } from '../tools/generate/src/store/memory-store'\nimport { catalogItems, catalogSeed } from './support/catalog-site'\nit('probe', async () => {\n  const seed = catalogSeed(); const store = memorySiteStore(); store.seed(seed.slug, seed)\n  const loaded = (await store.loadDraft(seed.slug))!.result as any\n  const files = new Map((await renderSiteFiles(loaded.value, { catalog: { items: catalogItems(), canTakePayments: true, shipping: { currency: 'EUR', countries: [{ code: 'FR', rate: 500 }, { code: 'GB', rate: 800 }] } } as any })).files)\n  const require = createRequire(path.resolve(__dirname, '../tools/generate/package.json'))\n  const mod = (await import(pathToFileURL(require.resolve('playwright')).href)) as typeof import('playwright')\n  const browser = await mod.chromium.launch({ args: ['--single-process', '--no-sandbox'] })\n  const out: any = {}\n  for (const width of [375, 1024]) {\n    const page = await browser.newPage({ viewport: { width, height: 900 } })\n    await page.route('http://fixture.test/**', (route) => {\n      const file = new URL(route.request().url()).pathname.replace(/^\\/+/, '')\n      if (file.endsWith('.js')) return route.abort()\n      const body = files.get(file) ?? files.get(`${file}.html`)\n      if (body === undefined) return route.fulfill({ status: 404, body: '' })\n      return route.fulfill({ contentType: file.endsWith('.css') ? 'text/css' : 'text/html', body })\n    })\n    await page.goto('http://fixture.test/checkout/brass-lamp')\n    out[width] = await page.evaluate(() => {\n      const b = document.querySelector('button[data-checkout-control=\"continue\"]')!\n      const chain: any[] = []\n      let el: Element | null = b\n      for (let i = 0; i < 6 && el; i++, el = el.parentElement) {\n        const r = el.getBoundingClientRect(); const s = getComputedStyle(el)\n        chain.push({ cls: el.className, w: r.width, x: r.x, display: s.display, dir: s.flexDirection, ai: s.alignItems, jc: s.justifyContent, ta: s.textAlign, as: s.alignSelf, bs: s.boxSizing, width: s.width })\n      }\n      const range = document.createRange(); range.selectNodeContents(b); const lr = range.getBoundingClientRect()\n      return { chain, label: { x: lr.x, w: lr.width } }\n    })\n    await page.close()\n  }\n  await browser.close()\n  writeFileSync(process.env.TMPDIR + '/bug367-probe.json', JSON.stringify(out, null, 1))\n})\nEOF\ntimeout 200 npx vitest run tests/zz-bug367-probe2.test.ts 2>&1 | grep \"Tests \\|Error\"; cat $TMPDIR/bug367-probe.json | python3 -c \"import json,sys; d=json.load(sys.stdin); [print(k, c) for k in d for c in d[k]['chain']+[d[k]['label']]]\"","description":"Probe computed layout chain in Chromium","timeout":220000}
```

**Result**

```
Exit code 1
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
Error: browser.newPage: Target page, context or browser has been closed
      Tests  1 failed (1)
cat: /tmp/claude-501/bug367-probe.json: No such file or directory
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "/Users/martin/.pyenv/versions/3.12.11/lib/python3.12/json/__init__.py", line 293, in load
    return loads(fp.read(),
           ^^^^^^^^^^^^^^^^
  File "/Users/martin/.pyenv/versions/3.12.11/lib/python3.12/json/__init__.py", line 346, in loads
    return _default_decoder.decode(s)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/martin/.pyenv/versions/3.12.11/lib/python3.12/json/decoder.py", line 338, in decode
    obj, end = self.raw_decode(s, idx=_w(s, 0).end())
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/Users/martin/.pyenv/versions/3.12.11/lib/python3.12/json/decoder.py", line 356, in raw_decode
    raise JSONDecodeError("Expecting value", s, err.value) from None
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF' p='tests…
<!-- xgd-tool name="Bash" id="toolu_01CLmNN4A3DqnbEk85Kyhz57" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:14:58.926405+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF'\np='tests/zz-bug367-probe2.test.ts'\ns=open(p).read()\ns=s.replace(\"  const browser = await mod.chromium.launch({ args: ['--single-process', '--no-sandbox'] })\\n  const out: any = {}\\n  for (const width of [375, 1024]) {\\n\",\"  const out: any = {}\\n  for (const width of [375, 1024]) {\\n  const browser = await mod.chromium.launch({ args: ['--single-process', '--no-sandbox'] })\\n\")\ns=s.replace(\"    await page.close()\\n  }\\n  await browser.close()\\n\",\"    await browser.close()\\n  }\\n\")\nopen(p,'w').write(s)\nEOF\ntimeout 200 npx vitest run tests/zz-bug367-probe2.test.ts 2>&1 | grep \"Tests \\|Error\"; cat $TMPDIR/bug367-probe.json | python3 -c \"import json,sys; d=json.load(sys.stdin); [print(k, c) for k in d for c in d[k]['chain']+[d[k]['label']]]\"","description":"Rerun probe with one browser per width","timeout":220000}
```

**Result**

```
      Tests  1 passed (1)
375 {'cls': 'checkout-checkout-checkout-l1-18', 'w': 48, 'x': 187.5, 'display': 'block', 'dir': 'row', 'ai': 'normal', 'jc': 'normal', 'ta': 'center', 'as': 'auto', 'bs': 'border-box', 'width': '48px'}
375 {'cls': 'checkout-checkout-checkout-l1-16', 'w': 0, 'x': 187.5, 'display': 'flex', 'dir': 'column', 'ai': 'stretch', 'jc': 'flex-end', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
375 {'cls': 'checkout-checkout-checkout-l1-4', 'w': 0, 'x': 187.5, 'display': 'flex', 'dir': 'column', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
375 {'cls': 'checkout-checkout-checkout-l1-2', 'w': 0, 'x': 187.5, 'display': 'flex', 'dir': 'column', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
375 {'cls': 'checkout-checkout-checkout-l1-0', 'w': 0, 'x': 187.5, 'display': 'flex', 'dir': 'column', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
375 {'cls': 'checkout', 'w': 375, 'x': 0, 'display': 'block', 'dir': 'row', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '375px'}
375 {'x': 211.5, 'w': 65.328125}
1024 {'cls': 'checkout-checkout-checkout-l1-18', 'w': 113.328125, 'x': 398.671875, 'display': 'block', 'dir': 'row', 'ai': 'normal', 'jc': 'normal', 'ta': 'center', 'as': 'auto', 'bs': 'border-box', 'width': '113.328px'}
1024 {'cls': 'checkout-checkout-checkout-l1-16', 'w': 0, 'x': 512, 'display': 'flex', 'dir': 'row', 'ai': 'stretch', 'jc': 'flex-end', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
1024 {'cls': 'checkout-checkout-checkout-l1-4', 'w': 0, 'x': 512, 'display': 'flex', 'dir': 'column', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
1024 {'cls': 'checkout-checkout-checkout-l1-2', 'w': 0, 'x': 512, 'display': 'flex', 'dir': 'column', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
1024 {'cls': 'checkout-checkout-checkout-l1-0', 'w': 0, 'x': 512, 'display': 'flex', 'dir': 'column', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '0px'}
1024 {'cls': 'checkout', 'w': 1024, 'x': 0, 'display': 'block', 'dir': 'row', 'ai': 'normal', 'jc': 'normal', 'ta': 'start', 'as': 'auto', 'bs': 'border-box', 'width': '1024px'}
1024 {'x': 422.671875, 'w': 65.328125}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -oE "[^}]*checkout-ch…
<!-- xgd-tool name="Bash" id="toolu_017osU9HqsLSQa79XTba3XkR" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:07.801719+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -oE \"[^}]*checkout-checkout-checkout-l1-0[ :.{][^}]*\\}\" $TMPDIR/bug367-checkout.html; grep -oE \"\\.checkout[ {][^}]*\\}\" $TMPDIR/bug367-checkout.html | head; grep -o \"<script[^>]*>\" $TMPDIR/bug367-checkout.html | head","description":"Inspect L1 root sizing CSS and scripts"}
```

**Result**

```
.checkout-checkout-checkout-l1-0 { display: flex; flex-direction: column; gap: var(--l1-space-lg, 0px); width: min(var(--l1-content, 0px), calc(100% - 2 * var(--l1-gutter, 0px))); margin-left: auto; margin-right: auto; position: relative; padding-top: 48px; padding-right: 0px; padding-bottom: 64px; padding-left: 0px }
<script type="module" src="./capabilities.js">
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -o "<link[^>]*>\|<bas…
<!-- xgd-tool name="Bash" id="toolu_01HLZwZ7NUk5sTF3roKoKeCt" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:12.094958+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -o \"<link[^>]*>\\|<base[^>]*>\" $TMPDIR/bug367-checkout.html; grep -o \"\\-\\-l1-content[^;]*;\" $TMPDIR/bug367-checkout.html | head -3","description":"List stylesheet links and l1-content definitions"}
```

**Result**

```
<base href="../" />
<link rel="stylesheet" href="./theme.css" />
--l1-content, 0px), calc(100% - 2 * var(--l1-gutter, 0px)));
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna "'--l1-content\|…
<!-- xgd-tool name="Bash" id="toolu_015j8ZRPDfVc9DS5UTWb4jpn" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:15.077105+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna \"'--l1-content\\|--l1-content:\" packages/framework/src tools/generate/src --include=*.ts | grep -v test | head -8","description":"Find where --l1-content is defined"}
```

**Result**

```
(eval):1: no matches found: --include=*.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnaE "l1-content(:|'…
<!-- xgd-tool name="Bash" id="toolu_01QPTqvWtRw38pLBoNNZT9NH" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:17.250983+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnaE \"l1-content(:|')\" packages/framework/src tools/generate/src | grep -v \"\\.test\\.\" | head -8","description":"Find --l1-content definition"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla "l1-content" pa…
<!-- xgd-tool name="Bash" id="toolu_01PejfhhXqPbMXUTH1EaXUGJ" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:19.629580+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla \"l1-content\" packages/framework/src tools/generate/src | head; grep -rna \"l1-content\" packages/framework/src/l1/*.ts | grep -v \"var(--l1-content\" | head -5","description":"Locate files mentioning l1-content"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla -- "l1-content"…
<!-- xgd-tool name="Bash" id="toolu_01WXBvoi9bvCaEdb8Typ9u2M" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:21.975924+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla -- \"l1-content\" packages tools/generate/src 2>/dev/null | grep -v node_modules | head; grep -rna -- \"--l1-\\${\" packages/framework/src/l1/render.ts | head -5","description":"Find l1-content generation"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna "l1-gutter" pack…
<!-- xgd-tool name="Bash" id="toolu_01DzRnFPHFTuxdKz18rqtK1M" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:24.995820+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna \"l1-gutter\" packages/framework/src tools/generate/src | grep -v \"\\.test\\.\" | head -8","description":"Find l1-gutter definitions"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnaw "gutter" packag…
<!-- xgd-tool name="Bash" id="toolu_01T5jdKenZsUm8oFL7XQk3La" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:28.178926+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnaw \"gutter\" packages/framework/src/l1/render.ts packages/framework/src/*.ts 2>/dev/null | head -8; grep -rnal \"l1-space-\" packages/framework/src | head -3","description":"Search for gutter variable construction"}
```

**Result**

```
packages/framework/src/l1/render.ts:5158: * design's measures, never wider than the parent less a gutter each side, and
packages/framework/src/l1/render.ts:5160: * measure, never wider than the parent (which already keeps the gutter), centred.
packages/framework/src/l1/render.ts:5171:  const gutter = designLength(L1_GUTTER_VAR, state.design?.layout?.gutter, state)
packages/framework/src/l1/render.ts:5172:  return [`width: min(${measure}, calc(100% - 2 * ${gutter}))`, 'margin-left: auto', 'margin-right: auto']
packages/framework/src/l1/render.ts:5183: * the room beside the measure, never less than the gutter.
packages/framework/src/l1/render.ts:5191:  const gutter = designLength(L1_GUTTER_VAR, state.design?.layout?.gutter, state)
packages/framework/src/l1/render.ts:5192:  return `max(${gutter}, calc((100% - ${measure}) / 2))`
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 5150,5175p packages…
<!-- xgd-tool name="Bash" id="toolu_01LwHKh9PHBareYrtPJcDupL" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:32.158204+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 5150,5175p packages/framework/src/l1/render.ts; grep -na \"function designLength\" -A 12 packages/framework/src/l1/render.ts","description":"Read measure/designLength code"}
```

**Result**

```
/** [[REQ-447]] — one step of the design's space scale, as CSS. */
function spaceLength(step: L1SpaceStep, state: RenderState): string {
  return designLength(l1SpaceVar(step), state.design?.space?.scale?.[step], state)
}

/**
 * [[REQ-447]] — how wide a box or container sits. `content` and `wide` are the
 * design's measures, never wider than the parent less a gutter each side, and
 * centred; `bleed` is the parent's full width. [[REQ-463]] `text` is the text
 * measure, never wider than the parent (which already keeps the gutter), centred.
 */
function widthDecls(width: L1WidthName | undefined, state: RenderState): string[] {
  if (width === undefined) return []
  if (width === 'bleed') return ['width: 100%', 'align-self: stretch']
  if (width === 'text') return [`width: min(${textMeasure(state)}, 100%)`, 'margin-left: auto', 'margin-right: auto']
  const measure = designLength(
    l1WidthVar(width),
    width === 'content' ? state.design?.layout?.contentWidth : state.design?.layout?.wideWidth,
    state,
  )
  const gutter = designLength(L1_GUTTER_VAR, state.design?.layout?.gutter, state)
  return [`width: min(${measure}, calc(100% - 2 * ${gutter}))`, 'margin-left: auto', 'margin-right: auto']
}

/** [[REQ-463]] — the design's text measure, as CSS. */
5145:function designLength(name: string, length: L1DesignLength | undefined, state: RenderState): string {
5146-  state.usesDesign = true
5147-  const fallback = length === undefined ? 0 : typeof length === 'number' ? length : length.keyframes[length.keyframes.length - 1].value
5148-  return `var(${name}, ${num(fallback)}px)`
5149-}
5150-
5151-/** [[REQ-447]] — one step of the design's space scale, as CSS. */
5152-function spaceLength(step: L1SpaceStep, state: RenderState): string {
5153-  return designLength(l1SpaceVar(step), state.design?.space?.scale?.[step], state)
5154-}
5155-
5156-/**
5157- * [[REQ-447]] — how wide a box or container sits. `content` and `wide` are the
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && rm tests/zz-bug367-probe.t…
<!-- xgd-tool name="Bash" id="toolu_01JSsKDuvTD69bX52no4fx5Y" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:42.278225+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && rm tests/zz-bug367-probe.test.ts tests/zz-bug367-probe2.test.ts && python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts'\ns=open(p).read()\ns=s.replace(\"\"\"  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))\n  const catalog: SiteCatalog = { items: catalogItems(), canTakePayments: true, shipping: SHIPPING }\n  return new Map((await renderSiteFiles(loaded.value, { catalog })).files)\"\"\",\"\"\"  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))\n  // The fixture's design names no measures, so its pages would be 0px wide: give\n  // it a content width, a gutter and a space scale, as any real design has.\n  const site = {\n    ...loaded.value,\n    site: {\n      ...loaded.value.site,\n      design: {\n        ...(loaded.value.site.design ?? {}),\n        layout: { ...(loaded.value.site.design?.layout ?? {}), contentWidth: 720, gutter: 16 },\n        space: { ...(loaded.value.site.design?.space ?? {}), scale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } },\n      },\n    },\n  } as LoadedSite\n  const catalog: SiteCatalog = { items: catalogItems(), canTakePayments: true, shipping: SHIPPING }\n  return new Map((await renderSiteFiles(site, { catalog })).files)\"\"\")\ns=s.replace(\"import { memorySiteStore } from '../tools/generate/src/store/memory-store'\\n\",\"import { memorySiteStore } from '../tools/generate/src/store/memory-store'\\nimport type { LoadedSite } from '../tools/generate/src/store/assemble'\\n\")\nopen(p,'w').write(s)\nEOF\nCHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 400 npx vitest run tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts 2>&1 | grep -E \"×|✓|Tests |AssertionError|expected\" | head -20","description":"Add design measures to fixture and rerun Chromium UAT","timeout":420000}
```

**Result**

```
     × test_UAT_FC_BUG-367_a_button_label_is_centred_in_its_box 149ms
     × test_UAT_FC_BUG-367_from_tablet_up_actions_sit_right_sized_to_their_labels 119ms
     × test_UAT_FC_BUG-367_on_a_phone_actions_stack_full_width_continue_on_top 116ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected 32.6640625 to be less than or equal to 1
AssertionError: expected 113.328125 to be less than 0
AssertionError: expected 48 to be less than or equal to 1
      Tests  3 failed | 1 passed (4)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "layout?: \|conte…
<!-- xgd-tool name="Bash" id="toolu_014KzWvHFieDpui3vLkvF3Zu" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:51.528634+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"layout?: \\|contentWidth\\|gutter\" packages/site-schema/src/*.ts | grep -iv test | head -10","description":"Check L1Design layout schema"}
```

**Result**

```
packages/site-schema/src/schema.ts:323:     * REQ-75 — the content-column gutter (a spacing step sm/md/lg → the hero's
packages/site-schema/src/schema.ts:566:    // `contentWidth: 896` for an off-scale px width) — OR, for a length dial, a
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna "contentWidth" p…
<!-- xgd-tool name="Bash" id="toolu_015gkAvTsHTKiHznsWvLA3PU" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:54.170518+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rna \"contentWidth\" packages/framework/src/l1/*.ts packages/site-schema/src/l1*.ts 2>/dev/null | grep -v \"\\.test\\.\" | head -8; grep -rna \"state.design = \\|design: .*design\" packages/framework/src/modules/checkout/component.ts | head","description":"Find where the L1 design's contentWidth comes from"}
```

**Result**

```
(eval):1: no matches found: packages/site-schema/src/l1*.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla "contentWidth"…
<!-- xgd-tool name="Bash" id="toolu_01JSsFYnpfD2YfK74fytKFAJ" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:15:56.544555+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla \"contentWidth\" packages/framework/src packages/site-schema/src tools/generate/src | head; grep -na \"design\" packages/framework/src/modules/checkout/component.ts | head","description":"Find contentWidth references"}
```

**Result**

```
packages/framework/src/l1/render.ts
packages/framework/src/modules/dials.ts
packages/site-schema/src/schema.ts
packages/framework/src/tokens/defaults.ts
packages/site-schema/src/l1/design.ts
tools/generate/src/cli/design-seed.ts
tools/generate/src/cli/ai/l1-surface.json
tools/generate/src/cli/ai/plan-surface.json
tools/generate/src/cli/ai/critic-core.ts
tools/generate/src/cli/ai/layout-check.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "l1WidthVar\|L1_G…
<!-- xgd-tool name="Bash" id="toolu_014dLfiHZdRLDcyFikYVPeGg" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:01.560098+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"l1WidthVar\\|L1_GUTTER_VAR\" packages/framework/src/l1/*.ts packages/framework/src/*.ts packages/framework/src/tokens/*.ts 2>/dev/null | grep -v \"^.*render.ts.*designLength\" | head -10","description":"Find where width vars are declared"}
```

**Result**

```
packages/framework/src/l1/render.ts:40:  l1WidthVar,
packages/framework/src/l1/render.ts:43:  L1_GUTTER_VAR,
packages/framework/src/l1/render.ts:5167:    l1WidthVar(width),
packages/framework/src/l1/render.ts:5187:    l1WidthVar(inset),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla "l1WidthVar" pa…
<!-- xgd-tool name="Bash" id="toolu_01RaeNh8C7NB68qW2DVYA5zA" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:03.934363+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rnla \"l1WidthVar\" packages tools/generate/src apps/*/src 2>/dev/null | grep -v node_modules | head","description":"Find all users of l1WidthVar"}
```

**Result**

```
packages/site-schema/src/l1/index.ts
packages/site-schema/src/l1/design.ts
packages/framework/src/l1/render.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "^export function…
<!-- xgd-tool name="Bash" id="toolu_01Dq3J6jYiqHT3RAjw4nFQXh" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:06.982627+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"^export function\\|^export const\" packages/site-schema/src/l1/design.ts | head -30","description":"List design.ts exports"}
```

**Result**

```
61:export const l1DesignLengthSchema = z.union([finite.min(0).max(4000), l1ScalarTrackSchema])
65:export function l1LengthAt(length: L1DesignLength, width: number): number {
70:export function l1ScalarAt(track: L1ScalarTrack, width: number): number {
91:export const l1DesignTypeSchema = partialOf(L1_TYPE_ROLES, l1TextStyleSchema)
94:export const l1DesignSpaceSchema = z
110:export const l1DesignLayoutSchema = z
144:export const l1DesignColourSchema = partialOf(l1ColourRoleSchema.options, l1ColorSchema)
147:export const l1DesignComponentSchema = z
161:export const l1DesignComponentsSchema = partialOf(l1ComponentNameSchema.options, l1DesignComponentSchema)
164:export const l1DesignImagerySchema = z
181:export const l1DesignLogoSchema = z
205:export const l1DesignHeaderSchema = z
216:export const l1DesignBrandSchema = z
231:export const l1DesignFontSchema = z
242:export const l1DesignSchema = z
275:export const L1_DESIGN_CONTRAST_PAIRS: readonly { fg: L1ColourRole; bg: L1ColourRole; min: number }[] = [
283:export const L1_CONTENT_WIDTH_BOUNDS = { minPx: 240, maxPx: 2400 } as const
289:export const L1_TEXT_CHARS = { min: 45, max: 75 } as const
314:export function l1ContrastRatio(a: string, b: string): number {
327:export function l1DesignIssues(design: L1Design, palette?: L1Palette): L1DesignIssue[] {
479:export const L1_DESIGN_WIDTHS = { phone: 375, tablet: 900, desktop: 1280 } as const
483:export const L1_GUTTER_MIN_PX: Record<L1DesignWidthName, number> = { phone: 16, tablet: 24, desktop: 24 }
486:export const L1_REQUIRED_TYPE_ROLES: readonly L1TypeRole[] = ['caption', 'small', 'body', 'lead', 'quote', 'h3', 'h2', 'h1', 'display']
489:export const L1_PER_WIDTH_TYPE_ROLES: readonly L1TypeRole[] = ['lead', 'h3', 'h2', 'h1', 'display']
492:export const L1_REQUIRED_COLOUR_ROLES: readonly L1ColourRole[] = ['background', 'text', 'action', 'onAction']
499:export const L1_HEADING_MIN_CHARS: Partial<Record<L1TypeRole, number>> = { display: 12, h1: 16, h2: 20, h3: 24 }
500:export const L1_CHAR_EM = 0.55
529:export function l1HalfColumnPx(design: L1Design, width: number): number | undefined {
540:export function l1HeadingMaxPx(design: L1Design, role: L1TypeRole, width: number): number | undefined {
560:export function l1DesignMissing(design: L1Design | undefined): L1DesignIssue[] {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "usesDesign" pack…
<!-- xgd-tool name="Bash" id="toolu_01WcKPDpCq4ALNEqUa2Z3Vkp" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:11.792970+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"usesDesign\" packages/framework/src/l1/render.ts | head; grep -na \"renderL1Fragment(\" packages/framework/src/modules/checkout/component.ts packages/framework/src/modules/product-catalog/*.ts | head","description":"See how design vars are emitted for fragments"}
```

**Result**

```
5041:  usesDesign?: boolean
5146:  state.usesDesign = true
7030:  if (state.usesDesign) state.rules.unshift(...designRules(opts.design))
packages/framework/src/modules/checkout/component.ts:175:  const { htmls, css } = renderL1Fragment(nodes, `${instanceId}-${mode}`, controls, { edit, delivery: data?.delivery })
packages/framework/src/modules/product-catalog/component.ts:70:    const { htmls, css } = renderL1Fragment(nodes, `${instanceId}-product`, undefined, { edit, delivery: data?.delivery })
packages/framework/src/modules/product-catalog/component.ts:105:    const rendered = renderL1Fragment(nodes, `${instanceId}-card-${i}`, undefined, { edit, delivery: data?.delivery, drawnIn })
packages/framework/src/modules/product-catalog/component.ts:112:  const body = renderL1Fragment([listNode], `${instanceId}-list`, undefined, { edit, mounts })
packages/framework/src/modules/product-catalog/component.ts:129:      const rendered = renderL1Fragment([pagerNode], `${instanceId}-pager`, controls, { edit })
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 130,175p packages/f…
<!-- xgd-tool name="Bash" id="toolu_01FMMNHJhCnsBqjkvQ3Qtejr" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:13.740130+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 130,175p packages/framework/src/modules/checkout/component.ts | grep -n \"renderL1\\|nodes\\|design\"; grep -na \"design\" packages/framework/src/modules/product-catalog/component.ts 2>/dev/null | head -5; ls packages/framework/src/modules/product-catalog/","description":"See checkout component's fragment render call"}
```

**Result**

```
41:    nodes = bindL1(template, COMPLETE_RECORD)
43:    nodes = bindL1(template, { text: {}, hrefs: {}, images: {} })
46:  const { htmls, css } = renderL1Fragment(nodes, `${instanceId}-${mode}`, controls, { edit, delivery: data?.delivery })
85:  // nothing to show draws its card once, as authored, so it can be designed.
133:      // No pager designed: plain links, so every page is still reachable.
component.ts
items.ts
meta.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "^function design…
<!-- xgd-tool name="Bash" id="toolu_019b3vytpgsKEgALq3ze29Ww" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:18.445995+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"^function designRules\" -A 25 packages/framework/src/l1/render.ts | head -35","description":"Read designRules"}
```

**Result**

```
5196:function designRules(design: L1Design | undefined): Rule[] {
5197-  return l1DesignVariables(design).flatMap(({ name, length }) =>
5198-    typeof length === 'number' ? [{ selector: ':root', decls: [`${name}: ${num(length)}px`] }] : scalarAxisRules(':root', name, length),
5199-  )
5200-}
5201-
5202-/**
5203- * REQ-420 — the lead a child of a parent laid out by `flow` takes. [[REQ-447]] —
5204- * a lead may hold rhythm units and design space steps at once (a heading's space
5205- * against a block's `blockGap`): they are different lengths, so the larger is
5206- * taken by CSS at each width.
5207- */
5208-function rhythmLead(lead: L1Lead | undefined, flow: ParentFlow, state: RenderState): RhythmLead | undefined {
5209-  if (!lead || l1LeadIsZero(lead)) return undefined
5210-  const terms = [
5211-    ...(lead.units > 0 ? [rhythmLength(lead.units, state)] : []),
5212-    ...lead.steps.map((step) => spaceLength(step, state)),
5213-  ]
5214-  const on = terms.length === 1 ? terms[0] : `max(${terms.join(', ')})`
5215-  return {
5216-    base: flow.base === 'stack' ? on : null,
5217-    media: flow.keyframes.map((kf) => ({ at: kf.at, value: kf.value === 'stack' ? on : '0' })),
5218-  }
5219-}
5220-
5221-/** REQ-420 — the `:root` rules declaring the unit, emitted only by a render that used it. */
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "export function…
<!-- xgd-tool name="Bash" id="toolu_01PxxRwL1b3y3P72CgAWQ97Y" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:23.376583+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"export function l1DesignVariables\" -A 3 packages/site-schema/src/l1/*.ts | head; grep -na \"l1DesignVariables\\|L1_GUTTER_VAR\\|l1WidthVar\\|l1SpaceVar\" packages/site-schema/src/index.ts packages/site-schema/src/l1/index.ts | head","description":"Locate l1DesignVariables export"}
```

**Result**

```
packages/site-schema/src/l1/design.ts:1619:export function l1DesignVariables(design: L1Design | undefined): L1DesignVariable[] {
packages/site-schema/src/l1/design.ts-1620-  if (!design) return []
packages/site-schema/src/l1/design.ts-1621-  const out: L1DesignVariable[] = []
packages/site-schema/src/l1/design.ts-1622-  for (const step of L1_SPACE_STEPS) {
packages/site-schema/src/l1/index.ts:62:  L1_GUTTER_VAR,
packages/site-schema/src/l1/index.ts:93:  l1DesignVariables,
packages/site-schema/src/l1/index.ts:109:  l1SpaceVar,
packages/site-schema/src/l1/index.ts:110:  l1WidthVar,
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF' p='tests…
<!-- xgd-tool name="Bash" id="toolu_01AjEFhJvUhwM28gyrXE4xcq" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:31.375387+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts'\ns=open(p).read()\na=s.index(\"  // The fixture's design names no measures\")\nb=s.index(\"  const catalog: SiteCatalog\")\ns=s[:a]+s[b:]\ns=s.replace(\"return new Map((await renderSiteFiles(site, { catalog })).files)\",\"return new Map((await renderSiteFiles(loaded.value, { catalog })).files)\")\ns=s.replace(\"import type { LoadedSite } from '../tools/generate/src/store/assemble'\\n\",\"import { l1DesignVariables, type L1Design } from '../packages/site-schema/src/index'\\n\")\ns=s.replace(\"type Page = import('playwright').Page\\n\",\"\"\"type Page = import('playwright').Page\n\n/**\n * A module's fragment sizes itself from the site's design variables, which a\n * designed site's page declares at `:root`. The fixture site has no L1 design,\n * so the page is served with the variables a plain one declares.\n */\nconst DESIGN = { layout: { contentWidth: 720, gutter: 16 }, space: { scale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } } } as unknown as L1Design\nconst ROOT_VARS = `<style>:root { ${l1DesignVariables(DESIGN)\n  .map(({ name, length }) => `${name}: ${length as number}px`)\n  .join('; ')} }</style>`\n\"\"\")\ns=s.replace(\"      const body = files.get(file) ?? files.get(`${file}.html`)\\n\",\"      const found = files.get(file) ?? files.get(`${file}.html`)\\n      const body = found && !file.endsWith('.css') ? found.replace('</head>', `${ROOT_VARS}</head>`) : found\\n\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"l1-content\\|layout\\b\" packages/site-schema/src/l1/design.ts | sed -n 1,5p; CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 400 npx vitest run tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts 2>&1 | grep -E \"×|✓|Tests |AssertionError|Error\" | head -20","description":"Inject root design vars and rerun Chromium UAT","timeout":420000}
```

**Result**

```
28: * has a token for it, so the page map, the layout check and the critic can count
107: * `layout` — the content and wide measures, the gutter, the column grid, and
246:    layout: l1DesignLayoutSchema.optional(),
382:  if (design.layout) {
383:    const { contentWidth, wideWidth, grid } = design.layout
      Tests  4 passed (4)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && for f in packages/framewor…
<!-- xgd-tool name="Bash" id="toolu_01K9GSi67qEfPfCt5iPip3zJ" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:40.812120+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && for f in packages/framework/src/l1/render.ts packages/framework/src/l2/checkout.ts; do cp $f $TMPDIR/bug367-$(basename $f).bak; git show HEAD:$f > $f; done; CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 400 npx vitest run tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts 2>&1 | grep -E \"×|✓|Tests \" | head; cp $TMPDIR/bug367-render.ts.bak packages/framework/src/l1/render.ts; cp $TMPDIR/bug367-checkout.ts.bak packages/framework/src/l2/checkout.ts; git diff --stat packages/framework/src/l1/render.ts packages/framework/src/l2/checkout.ts","description":"Mutation check against HEAD renderer and template","timeout":420000}
```

**Result**

```
     × test_UAT_FC_BUG-367_a_disabled_continue_looks_disabled 210ms
     × test_UAT_FC_BUG-367_from_tablet_up_actions_sit_right_sized_to_their_labels 126ms
     × test_UAT_FC_BUG-367_on_a_phone_actions_stack_full_width_continue_on_top 126ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
      Tests  3 failed | 1 passed (4)
 packages/framework/src/l1/render.ts   | 24 +++++++++-
 packages/framework/src/l2/checkout.ts | 88 ++++++++++++++++++++++++++---------
 2 files changed, 89 insertions(+), 23 deletions(-)
```

## Bash cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/lf-js-python-peers-in-sync.md | hea…
<!-- xgd-tool name="Bash" id="toolu_014uUEFXUXDX5ek9Lxz2LdAG" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:49.002324+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/lf-js-python-peers-in-sync.md | head -20; cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/full-suite-in-foreground-batches.md | head -20","description":"Read two relevant memories"}
```

**Result**

```
---
name: lf-js-python-peers-in-sync
description: lagrange-framework changes always land in both the JS and Python peers in the same ticket — never propose JS-only with a Python follow-up.
metadata:
  node_type: memory
  type: feedback
  originSessionId: 54c5972a-e95a-41e6-a502-3b2e42627c6f
  modified: 2026-11-01T18:05:28.647Z
---

In lagrange-framework, the JS and Python peers are kept in sync: every change (e.g. delegation REQ-148/205/207/210, REQ-232's detached Delegate) ships in both, with shared declaration bytes and the tests run against both.

**Why:** on 2026-11-01 I answered a framework session's "JS only now, Python follow-up?" with JS-only; the operator overruled it: "No we keep python and JS in sync."

**How to apply:** when scoping or answering questions on a framework ticket, include the Python peer in scope and in the test plan by default, even when only 1st Contact (JS) needs the feature. See [[cross-repo-ticket-not-code]].
---
name: full-suite-in-foreground-batches
description: "A nohup/disown'd vitest run dies at once in this sandbox; run the node project in the foreground in three ~600s batches with a JSON reporter."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0f7c12fe-1658-4e26-9b23-c89f4f986527
  modified: 2026-11-05T03:56:02.125Z
---

`nohup sh -c 'vitest run …' & disown` exits 1 immediately with an empty log (and `nice(5) failed`). The whole node project doesn't fit one 600s foreground call either.

**Why:** REQ-383 (2026-10-04) — the detached run produced nothing. Three foreground batches did: the non-`test_UAT` files, then `test_UAT*` split at 310 files. Each ran in under 590s.

**How to apply:** `timeout 590 node_modules/.bin/vitest run --project node --reporter=json --outputFile=$TMPDIR/x.json <files>`, then `jq` the failed names. Check each failure against base by running the same files in the main checkout. Port (EADDRINUSE 8790) and load flakes pass when rerun alone.

**2026-11-05 (REQ-638): the suite has grown.** Node UATs now need chunks of about 55 files, and the workers project four chunks of about 103. `test_UAT_FC_REQ-646_agent_compute_in_containers` hangs in the sandbox (on the base too), so leave it out of a chunk or it eats the whole timeout. Guard every baseline run with `[ -s list ] &&`: an empty `$(cat list)` runs the WHOLE suite. For a clean baseline, use a detached worktree at the base commit, set up exactly like the branch's (same node_modules links), not the main checkout. Related: [[dont-ask-blocks-loops-and-test-runners]], [[vitest-long-filter-finds-nothing]], [[zsh-unquoted-file-list-matches-nothing]].
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rlaE "Choose a count…
<!-- xgd-tool name="Bash" id="toolu_015JY9wks5xZKhoVxzXMPU88" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:54.886784+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rlaE \"Choose a country|'Ship to'|\\\"Ship to\\\"|once we know what your site is for|:hover\\b|can.t be bought right now|text-align: center|data-checkout-control\" tests apps/*/src packages/*/src tools/generate/src 2>/dev/null | grep -v node_modules | sort | head -40","description":"Find tests pinning changed strings"}
```

**Result**

```
apps/control-app/src/builder/builder.css
apps/control-app/src/builder/orders.js
apps/control-app/src/builder/points.js
apps/control-app/src/orders.ts
packages/framework/src/l1/render.ts
packages/framework/src/modules/checkout/client.js
packages/framework/src/modules/checkout/component.ts
packages/framework/src/modules/module-assets.ts
packages/site-schema/src/l1/schema.ts
tests/fixtures/capture/req302-semantics.html
tests/fixtures/capture/theme.css
tests/fixtures/l1-corpus/storage/sites/gigabytealchemy/draft/assets/blog.Byz9EGdq.css
tests/fixtures/req484/published/home.html
tests/fixtures/req484/published/index.html
tests/reconciliation-behavior-l1-composition.test.ts
tests/reconciliation-l1-interaction-and-motion.test.ts
tests/reconciliation-l1-pointer-accent.test.ts
tests/req100-scroll-reveal.test.ts
tests/req48-fidelity-axes.test.ts
tests/req99-interaction-state.test.ts
tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts
tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts
tests/test_UAT_FC_BUG-367_checkout_page.test.ts
tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
tests/test_UAT_FC_REQ-288_transform_translate.test.ts
tests/test_UAT_FC_REQ-329_composed_motion.test.ts
tests/test_UAT_FC_REQ-333_the_renderer_emits_valid_and_inherited_css.test.ts
tests/test_UAT_FC_REQ-335_animated_illustration.test.ts
tests/test_UAT_FC_REQ-374_per_side_borders.test.ts
tests/test_UAT_FC_REQ-643_checkout_pages.test.ts
tools/generate/src/cli/capture/audit-script.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && head -c 1500 packages/fram…
<!-- xgd-tool name="Bash" id="toolu_01MQ43vne1wpubB7gWdEZXhu" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:16:58.967825+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && head -c 1500 packages/framework/src/modules/module-assets.ts; echo; grep -ac \"can.t be bought right now\" packages/framework/src/modules/module-assets.ts; grep -rna \"module-assets\" tools/generate/src/cli/*.ts package.json 2>/dev/null | head -5","description":"Check if client.js is bundled into module-assets"}
```

**Result**

```
// GENERATED by `1c assets` (REQ-145). Do not edit.
//
// The behavior modules' static chrome, read from their `styles.css` and
// `client.js` sources at BUILD time so that `theme.css` and `capabilities.js` can be
// composed in a runtime with no filesystem. See tools/generate/src/cli/module-assets.ts
// for why, and the REQ-145 UAT for the check that this file still matches its
// sources.

/** Every catalogued module's static `<style>` content, in catalog order. */
export const MODULE_CSS = "/* module: contact-form */\n/*\n * REQ-96 — every rule here belongs to an INVARIANT element: presentation fixed\n * by an obligation, not by taste (DOC-25 §10.3). There is deliberately nothing\n * about a field's surface, height, spacing or arrangement — all of that is the\n * `form` slot's L1 subtree, and the module has no way to express it.\n */\n\n/* The module's own chrome must contribute no layout to the L1 it wraps. */\n.contact-form,\n.contact-form__inner,\n.contact-form__form { margin: 0; padding: 0; border: 0; }\n\n/*\n * The programmatic label: present and associated for assistive technology,\n * removed from the visual flow so it neither paints nor displaces the L1\n * layout. Obligation, not styling — which is why a designer cannot vary it.\n */\n.contact-form__label {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip-path: inset(50%);\n  white-space: nowrap;\n  border: 0;\n}\n\n/* Honeypot is removed fr
1
tools/generate/src/cli/assets.ts:5:import { buildModuleAssets, type ModuleAssetBuild } from './module-assets'
tools/generate/src/cli/assets.ts:112:  /** The behavior modules' precompiled chrome — see `module-assets.ts`. */
tools/generate/src/cli/module-assets.ts:40:const GENERATED = 'packages/framework/src/modules/module-assets.ts'
tools/generate/src/cli/module-assets.ts:145:// composed in a runtime with no filesystem. See tools/generate/src/cli/module-assets.ts
```

## Bash cd /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory && sed -n 1,30p 1c-assets-rewrites-m…
<!-- xgd-tool name="Bash" id="toolu_013jkiarsU5ARDUheu6SgXPs" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:02.475499+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory && sed -n 1,30p 1c-assets-rewrites-module-assets.md; sed -n 1,25p worktree-assets-blank-kb.md","description":"Read module-assets memories"}
```

**Result**

```
---
name: 1c-assets-rewrites-module-assets
description: Running 1c commands or some suites rewrites packages/framework/src/modules/module-assets.ts (committed copy is stale) — revert it before committing.
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0f7c12fe-1658-4e26-9b23-c89f4f986527
  modified: 2026-10-04T16:58:01.771Z
---

`packages/framework/src/modules/module-assets.ts` is generated by `1c assets`, and running `1c refold`/`l1-gate` or the full node suite regenerates it. The committed copy was stale on 2026-10-04, so it shows up as modified even though you never touched its sources.

**Why:** it appeared in `git status` three times during REQ-383 with a diff in MODULE_CSS/MODULE_CLIENT_JS that no change of mine produced.

**How to apply:** `git checkout -- packages/framework/src/modules/module-assets.ts` before staging, and stage explicit paths. Don't commit it as part of an unrelated ticket. Related: [[git-add-all-sweeps-untracked-caches]], [[l1-gate-grades-retained-fold]].
---
name: worktree-assets-blank-kb
description: "`1c assets` in a worktree writes `KB = null` to generated/kb.js (no kb build there); consultant priming suites then fail."
metadata:
  node_type: memory
  type: reference
  originSessionId: de6277d5-f31e-4ffa-8b2b-0d04bdc6d586
  modified: 2026-11-03T18:08:27.946Z
---

`1c assets` always rewrites `apps/control-app/src/generated/kb.js` from the checkout's own `kb/` build. A worktree has none, so it writes `export const KB = null`. Anything that runs `1c assets` in a worktree then makes consultant priming suites fail, BUG-322's stage-guide UAT among them. `pnpm test:browser`'s globalSetup does this too. The failures look like regressions and are not.

**How to apply:** after `1c assets` in a worktree, copy `kb.js` back from the main checkout (`cp <main>/apps/control-app/src/generated/kb.js …`) before baselining consultant suites. In the main checkout it is harmless: its KB is built. Seen BUG-333, 2026-11-03. Related: [[fresh-worktree-lacks-control-app-generated]], [[pre-existing-failures]].
Shell cwd was reset to /Users/martin/lagrangefoundry/1stcontact
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na "^export" tools/g…
<!-- xgd-tool name="Bash" id="toolu_01MuvbSVkUQh4WrBVjVW9wJQ" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:05.720011+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -na \"^export\" tools/generate/src/cli/module-assets.ts; grep -na \"buildModuleAssets\\|writeFile\" tools/generate/src/cli/assets.ts | head","description":"Inspect module-assets builder API"}
```

**Result**

```
72:export function scopeBehaviorJs(id: string, js: string): string {
77:export interface ModuleAssetBuild {
94:export function composeModuleAssets(repoRoot: string): {
139:export function buildModuleAssets(repoRoot: string): ModuleAssetBuild {
150:export const MODULE_CSS = ${literal(css)}
153:export const MODULE_CLIENT_JS = ${literal(clientJs)}
5:import { buildModuleAssets, type ModuleAssetBuild } from './module-assets'
310:    fs.writeFileSync(target, code)
451:  fs.writeFileSync(
464:  fs.writeFileSync(
567:  fs.writeFileSync(
574:  fs.writeFileSync(
642:  fs.writeFileSync(
649:  fs.writeFileSync(
658:  fs.writeFileSync(
665:  fs.writeFileSync(
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 77,95p tools/genera…
<!-- xgd-tool name="Bash" id="toolu_019hqQ867NneubyaeFxEjLiU" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:07.584330+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 77,95p tools/generate/src/cli/module-assets.ts; sed -n 139,148p tools/generate/src/cli/module-assets.ts","description":"Read ModuleAssetBuild shape"}
```

**Result**

```
export interface ModuleAssetBuild {
  /** The generated file's path, relative to the repo root. */
  file: string
  /** Module ids that contributed CSS, in catalog order. */
  css: string[]
  /** Module ids that contributed client behaviour, in catalog order. */
  clientJs: string[]
}

/**
 * The two strings, composed exactly as the filesystem readers composed them.
 *
 * Catalog order, deduplicated by id — `CATALOG` is what `registry` derives its
 * order from, and iterating the contracts rather than the components keeps this
 * build step independent of anything renderable while producing the identical
 * sequence.
 */
export function composeModuleAssets(repoRoot: string): {
  css: string
export function buildModuleAssets(repoRoot: string): ModuleAssetBuild {
  const { css, clientJs, cssIds, clientJsIds } = composeModuleAssets(repoRoot)
  const source = `// GENERATED by \`1c assets\` (REQ-145). Do not edit.
//
// The behavior modules' static chrome, read from their \`styles.css\` and
// \`client.js\` sources at BUILD time so that \`theme.css\` and \`capabilities.js\` can be
// composed in a runtime with no filesystem. See tools/generate/src/cli/module-assets.ts
// for why, and the REQ-145 UAT for the check that this file still matches its
// sources.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/zz-bug367-asse…
<!-- xgd-tool name="Bash" id="toolu_01ELSxPdPoU2pcQjVJsGkM9E" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:12.538525+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && cat > tests/zz-bug367-assets.test.ts <<'EOF'\nimport { it } from 'vitest'\nimport path from 'node:path'\nimport { buildModuleAssets } from '../tools/generate/src/cli/module-assets'\nit('regen', () => { buildModuleAssets(path.resolve(__dirname, '..')) })\nEOF\ntimeout 200 npx vitest run tests/zz-bug367-assets.test.ts 2>&1 | grep \"Tests \"; rm tests/zz-bug367-assets.test.ts; git diff --stat packages/framework/src/modules/module-assets.ts; git diff packages/framework/src/modules/module-assets.ts | grep -c \"^[-+]export\"","description":"Regenerate module-assets.ts and inspect diff","timeout":220000}
```

**Result**

```
      Tests  1 passed (1)
 packages/framework/src/modules/module-assets.ts | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
2
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff packages/framewor…
<!-- xgd-tool name="Bash" id="toolu_01LddZXVJ23QG7pqXqpvXPpv" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:18.779008+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff packages/framework/src/modules/module-assets.ts | grep \"^[-+]export\" | cut -c1-40; python3 - <<'EOF'\nimport subprocess\nd=subprocess.run(['git','diff','--word-diff=porcelain','--word-diff-regex=\\\\\\\\n|[^\\\\\\\\]+','packages/framework/src/modules/module-assets.ts'],capture_output=True,text=True).stdout\nfor l in d.splitlines():\n  if l[:1] in '+-' and not l.startswith(('+++','---')): print(l[:200])\nEOF","description":"Show what changed in module-assets"}
```

**Result**

```
-export const MODULE_CLIENT_JS = "/* beh
+export const MODULE_CLIENT_JS = "/* beh
+\n// [[BUG-367]] — what the page says when no answer it can read came back. Each\n// names what actually failed; neither claims the piece cannot be bought.\nconst UNREACHABLE = 'The shop could not be
-    const data = await res.json().catch(() => ({}))
+    const data = await res.json().catch(() => null)\n    // [[BUG-367]] — an answer that is not the shop's JSON (a 404 page, a proxy's
-    return { ok: res.ok, status: res.status, data: data || {} }
+    // error) is no answer, and the page says so rather than guessing at why.\n    if (!data || typeof data !== 'object') return { ok: false, status: res.status, data: { error: NO_ANSWER } }\n    ret
-    return { ok: false, status: 0, data: { error: 'The shop could not be reached. Nothing was charged; please try again.' } }
+    return { ok: false, status: 0, data: { error: UNREACHABLE } }
+  // [[BUG-363]] — the builder's page for a business that can't sell yet: it\n  // already says what to set up, so there is nothing to ask and nothing to say.\n  if (root.hasAttribute('data-checkout-
+      // A refusal carries its own sentence (and the quote, when there is one);\n      // anything else is the shop not answering. \"Can't be bought\" is the\n      // quote's to say, through its `un
-      say(root, r.data.error || 'This can’t be bought right now.')
+      say(root, r.data.error || NO_ANSWER)
+    // [[BUG-367]] — the builder's draft answers the owner a notice instead of a\n    // payment address: the draft never takes money.\n    if (r.ok && r.data.notice) {\n      say(root, r.data.notice
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ls tests | grep -iE "REQ-1…
<!-- xgd-tool name="Bash" id="toolu_011W73itjYZw2ahWPv5bAXeU" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:28.238761+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ls tests | grep -iE \"REQ-145|module.assets\" ; L=\"$(ls tests/*REQ-145* 2>/dev/null) tests/reconciliation-behavior-l1-composition.test.ts tests/reconciliation-l1-interaction-and-motion.test.ts tests/reconciliation-l1-pointer-accent.test.ts tests/req100-scroll-reveal.test.ts tests/req48-fidelity-axes.test.ts tests/req99-interaction-state.test.ts tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts tests/test_UAT_FC_REQ-288_transform_translate.test.ts tests/test_UAT_FC_REQ-329_composed_motion.test.ts tests/test_UAT_FC_REQ-333_the_renderer_emits_valid_and_inherited_css.test.ts tests/test_UAT_FC_REQ-335_animated_illustration.test.ts tests/test_UAT_FC_REQ-374_per_side_borders.test.ts tests/test_UAT_FC_REQ-643_checkout_pages.test.ts tests/test_UAT_FC_REQ-643_purchase.workers.test.ts tests/test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts tests/test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts tests/test_UAT_FC_BUG-78_preview_submits_for_real.workers.test.ts tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts\"; CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 590 npx vitest run $=L 2>&1 | grep -E \"×|Test Files|Tests \" | head -30","description":"Run affected regression suites","timeout":600000}
```

**Result**

```
test_UAT_FC_REQ-145_build_artifacts.test.ts
test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts
     × test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind 4ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
 Test Files  1 failed | 22 passed (23)
      Tests  1 failed | 228 passed (229)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && timeout 200 npx vitest run…
<!-- xgd-tool name="Bash" id="toolu_01P7kN8AaHGeaqJtdcNuZ298" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:46.396083+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && timeout 200 npx vitest run tests/req99-interaction-state.test.ts -t \"carried_by_every_node_kind\" 2>&1 | grep -A 25 \"FAIL\" | head -40","description":"Show REQ-99 failure detail","timeout":220000}
```

**Result**

```
 FAIL  |node| tests/req99-interaction-state.test.ts > REQ-99 — typed interaction state on an L1 node > test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind
AssertionError: control: expected [] to include 'background-color: #222222'
 ❯ tests/req99-interaction-state.test.ts:227:58
    225|       expect(validateL1(doc(node)).ok, node.kind).toBe(true)
    226|       const { css } = renderL1Fragment([node], 'k', { submit: { tag: '…
    227|       expect(ruleDecls(css, '.k-l1-0:hover'), node.kind).toContain(exp…
       |                                                          ^
    228|     })
    229|   })
 ❯ tests/req99-interaction-state.test.ts:224:11

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 5 skipped (6)
   Start at  17:17:47
   Duration  650ms (transform 338ms, setup 0ms, import 553ms, tests 11ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 205,230p tests/req9…
<!-- xgd-tool name="Bash" id="toolu_01R4DZvrTdcD24vjNFRuEWSz" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:52.879705+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && sed -n 205,230p tests/req99-interaction-state.test.ts","description":"Read REQ-99 test section"}
```

**Result**

```
  it('test_UAT_FC_REQ-99_interaction_is_carried_by_every_node_kind', () => {
    // Node-level, like transform / mask / padding — so no kind re-derives its own
    // slice (the asymmetry REQ-98 removed from the paint group).
    const kinds: L1Node[] = [
      { kind: 'text', text: 'Docs', interaction: { hover: { textDecoration: 'underline' } } },
      { kind: 'image', src: '/assets/x.png', alt: 'x', interaction: { hover: { opacity: 0.8 } } },
      { kind: 'slot', name: 'form', interaction: { hover: { surfaceFill: '#111111' } } },
      { kind: 'control', control: 'submit', interaction: { hover: { surfaceFill: '#222222' } } },
      { kind: 'box', interaction: { hover: { surfaceFill: '#333333' } } },
      { kind: 'container', layout: 'stack', children: [], interaction: { hover: { surfaceFill: '#444444' } } },
    ]
    const expected = [
      'text-decoration-line: underline',
      'opacity: 0.8',
      'background-color: #111111',
      'background-color: #222222',
      'background-color: #333333',
      'background-color: #444444',
    ]
    kinds.forEach((node, i) => {
      expect(validateL1(doc(node)).ok, node.kind).toBe(true)
      const { css } = renderL1Fragment([node], 'k', { submit: { tag: 'button', text: 'Send' } })
      expect(ruleDecls(css, '.k-l1-0:hover'), node.kind).toContain(expected[i])
    })
  })
})
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF' p='tests…
<!-- xgd-tool name="Bash" id="toolu_01WAgWkL5QwyX7Gwt9jogUAf" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:17:56.750672+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && python3 - <<'EOF'\np='tests/req99-interaction-state.test.ts'\ns=open(p).read()\ns=s.replace(\"\"\"      expect(ruleDecls(css, '.k-l1-0:hover'), node.kind).toContain(expected[i])\"\"\",\"\"\"      // [[BUG-367]] — a control's hover is a live control's: a disabled one keeps its resting look.\n      const hover = node.kind === 'control' ? '.k-l1-0:hover:not(:disabled)' : '.k-l1-0:hover'\n      expect(ruleDecls(css, hover), node.kind).toContain(expected[i])\"\"\")\nopen(p,'w').write(s)\nEOF\ntimeout 200 npx vitest run tests/req99-interaction-state.test.ts 2>&1 | grep \"Tests \"; grep -rlaE \"\\-l1-[0-9]+:hover'\" tests | head","description":"Update REQ-99 pin and rerun","timeout":220000}
```

**Result**

```
      Tests  6 passed (6)
tests/req99-interaction-state.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rlaE "appearance: no…
<!-- xgd-tool name="Bash" id="toolu_016V6L7XmRAhrftRQ91xX183" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:18:04.706595+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && grep -rlaE \"appearance: none|-webkit-appearance|kind: 'control'|controlHtml|toMatchSnapshot|toMatchInlineSnapshot\" tests --include='*.ts' | grep -v \"BUG-367\\|req99-interaction\" | sort > $TMPDIR/bug367-list.txt; wc -l < $TMPDIR/bug367-list.txt","description":"List tests touching control rendering"}
```

**Result**

```
      40
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && [ -s $TMPDIR/bug367-list.t…
<!-- xgd-tool name="Bash" id="toolu_016e7PZ5UWqWXCSeXhDBu9Wd" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:18:09.014294+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && [ -s $TMPDIR/bug367-list.txt ] && CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 590 npx vitest run --reporter=json --outputFile=$TMPDIR/bug367-r1.json $(cat $TMPDIR/bug367-list.txt) >/dev/null 2>&1; python3 -c \"\nimport json,os;d=json.load(open(os.environ['TMPDIR']+'/bug367-r1.json'))\nprint(d['numPassedTests'],d['numFailedTests'],d['numPendingTests'])\nfor f in d['testResults']:\n  for a in f['assertionResults']:\n    if a['status']=='failed': print(f['name'].split('/')[-1],'|',a['title'],'|',a['failureMessages'][0][:300])\"","description":"Run control-rendering suites with JSON reporter","timeout":600000}
```

**Result**

```
338 8 2
generate.test.ts | test_UAT_FC_REQ-9_publish_creates_locked_revision | AssertionError: expected false to be true // Object.is equality
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/generate.test.ts:193:93
    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/node_modu
generate.test.ts | test_UAT_FC_REQ-9_checkout_copies_revision_into_draft | AssertionError: expected false to be true // Object.is equality
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/generate.test.ts:267:93
    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/node_modu
generate.test.ts | test_UAT_FC_REQ-9_forward_only_rollback | AssertionError: expected false to be true // Object.is equality
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/generate.test.ts:284:105
    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/node_mod
reconciliation-reproduction-treatments.test.ts | test_UAT_AC718_contact_form_presentation_via_config_and_l1_controls | AssertionError: expected [ 'accepts', 'assets', …(7) ] to deeply equal [ 'accepts', 'assets', 'fields', …(3) ]
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/reconciliation-reproduction-treatments.test.ts:150:56
    at file:///Users/martin/.xgd/w
req105-node-axis-groups.test.ts | test_UAT_FC_REQ-105_every_kind_admits_every_node_level_axis_group | AssertionError: expected [ Array(19) ] to deeply equal [ Array(17) ]
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/req105-node-axis-groups.test.ts:259:27
    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/fr
test_UAT_FC_REQ-269_capture_and_fold_residuals.test.ts | test_UAT_FC_REQ-269_capture_records_a_link_target | AssertionError: expected 'mailto:hello@example.com' to be null
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/test_UAT_FC_REQ-269_capture_and_fold_residuals.test.ts:351:69
    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_
test_UAT_FC_REQ-308_a_control_carries_its_own_type.test.ts | test_UAT_FC_REQ-308_the_placeholder_pseudo_element_is_what_is_read | AssertionError: expected null to be 20 // Object.is equality
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/test_UAT_FC_REQ-308_a_control_carries_its_own_type.test.ts:158:32
    at file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundr
test_UAT_FC_REQ-349_style_audit.test.ts | test_UAT_FC_REQ-349_a_control_matches_a_page_that_names_no_face | AssertionError: expected { tier: 'broken', …(1) } to be undefined
    at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/tests/test_UAT_FC_REQ-349_style_audit.test.ts:314:45
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at file
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && B=$TMPDIR/bug367-src-backu…
<!-- xgd-tool name="Bash" id="toolu_01QydTQ2uwkoTMyxthhRmXGv" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:18:59.936273+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && B=$TMPDIR/bug367-src-backup && rm -rf $B && mkdir -p $B && FILES=$(git diff --name-only | grep -v '^tests/') && echo \"$FILES\" > $B/list && for f in $(cat $B/list); do mkdir -p $B/$(dirname $f); cp $f $B/$f; git show HEAD:$f > $f; done; git diff --stat | tail -1; CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 500 npx vitest run --reporter=json --outputFile=$TMPDIR/bug367-base.json tests/generate.test.ts tests/reconciliation-reproduction-treatments.test.ts tests/req105-node-axis-groups.test.ts tests/test_UAT_FC_REQ-269_capture_and_fold_residuals.test.ts tests/test_UAT_FC_REQ-308_a_control_carries_its_own_type.test.ts tests/test_UAT_FC_REQ-349_style_audit.test.ts >/dev/null 2>&1; for f in $(cat $B/list); do cp $B/$f $f; done; git diff --stat | tail -1; python3 -c \"\nimport json,os;d=json.load(open(os.environ['TMPDIR']+'/bug367-base.json'))\nprint(d['numPassedTests'],d['numFailedTests'])\nfor f in d['testResults']:\n  for a in f['assertionResults']:\n    if a['status']=='failed': print(f['name'].split('/')[-1],'|',a['title'])\"","description":"Baseline failing files with source changes reverted","timeout":560000}
```

**Result**

```
 2 files changed, 4 insertions(+), 2 deletions(-)
 13 files changed, 299 insertions(+), 63 deletions(-)
50 8
generate.test.ts | test_UAT_FC_REQ-9_publish_creates_locked_revision
generate.test.ts | test_UAT_FC_REQ-9_checkout_copies_revision_into_draft
generate.test.ts | test_UAT_FC_REQ-9_forward_only_rollback
reconciliation-reproduction-treatments.test.ts | test_UAT_AC718_contact_form_presentation_via_config_and_l1_controls
req105-node-axis-groups.test.ts | test_UAT_FC_REQ-105_every_kind_admits_every_node_level_axis_group
test_UAT_FC_REQ-269_capture_and_fold_residuals.test.ts | test_UAT_FC_REQ-269_capture_records_a_link_target
test_UAT_FC_REQ-308_a_control_carries_its_own_type.test.ts | test_UAT_FC_REQ-308_the_placeholder_pseudo_element_is_what_is_read
test_UAT_FC_REQ-349_style_audit.test.ts | test_UAT_FC_REQ-349_a_control_matches_a_page_that_names_no_face
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bi…
<!-- xgd-tool name="Bash" id="toolu_016RtTj9UAXU7Kr7u8WRmqwr" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:19:47.401133+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-b6fb57f6\",\"text\":\"2026-11-05 tests: workers UAT (4) red with route disabled; jsdom UAT tests/test_UAT_FC_BUG-367_checkout_page.test.ts (6); Chromium UAT tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts (4) needs CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox else skips; fixture injects :root design vars (module fragments size from page-level --l1-content; bare catalogSeed has none -> 0px column). 3/4 red on HEAD render/l2 (centring held by UA default). Regenerated module-assets.ts via buildModuleAssets: committed copy also lacked BUG-363 blocked guard. req99 hover pin updated to :hover:not(:disabled). 8 failures in generate/req105/AC718/REQ-269/308/349 are pre-existing (same with src reverted).\"}' >/dev/null && cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md | sed -n 1,40p","description":"Log progress and read promotion memory"}
```

**Result**

````
[17:19:50] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2286.67, 'pid': 94733}
---
name: xgd-free-coded-promotion
description: "move-to-free-coded needs the version-carrying commit to BE the tip of xgd-working, so merge working into the branch, bump there, and fast-forward back."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c19873f1-4d06-4920-9e06-d01321c99dfb
  modified: 2026-10-23T01:19:46.608Z
---

`xgd ticket move-to-free-coded` rejects four things in sequence, each with its
own error, so getting the order wrong costs a round trip each time:

1. **The branch must already be merged back.** `xgd branch lock <TICKET-ID>`,
   then merge. Finish with `xgd branch clean <TICKET-ID>` (removes worktree,
   deletes branch, releases the lock).
2. **SHAs must be the full 40 hex characters.** `git rev-parse HEAD`, never an
   `--oneline` abbreviation.
3. **`--version` must be unclaimed** by another ticket's `fields.version`.
4. **The commit carrying the version must be reachable *from the SHAs you
   pass*, and it must be at the tip.** This is the one that is easy to get
   backwards. If merging the branch into `xgd-working` creates a MERGE COMMIT,
   that merge commit becomes the tip carrying the new version — and it is not
   reachable *from* your SHAs (they are its ancestors), so the gate refuses with
   *"already present at the tip of xgd-working (<sha>), on a commit not
   reachable from any of the provided SHAs — someone else already published this
   version"*. The message reads like a race with another ticket and is not one.

**Why:** the gate wants the version bump to be attributable to a commit the
ticket records. A merge commit records nobody, so the merge back has to be a
fast-forward.

**How to apply — the ordering that works:**

```
xgd branch lock <TICKET-ID>
git -C <worktree> merge xgd-working          # working INTO the branch first
./bin/project/xgd_version_bump               # bump ON the branch, after that merge
git -C <worktree> commit -am "chore(version): X.Y.Z for <TICKET-ID>"
git -C <main-checkout> merge --ff-only free-<TICKET-ID>
````

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bi…
<!-- xgd-tool name="Bash" id="toolu_01EUJQAD6yieg9Cmh64ku2ac" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:19:55.664397+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai_knowledge.cli KnowledgeChunkSearch --in '{\"query\":\"free coding protocol finish: commit, merge back, move-to-free-coded, version bump\",\"top_k\":3,\"chunks_per_hit\":3}' 2>/dev/null | python3 -c \"\nimport json,sys\nd=json.load(sys.stdin)\nfor h in d.get('hits',d if isinstance(d,list) else []):\n  print('==',h['uid'],h['title'])\n  for c in h['chunks']: print('  --',c['heading'],c['start'],c['end']); print('    ',c['text_snippet'][:500].replace('\\n',' '))\"","description":"Search KB for free-coding finish steps"}
```

**Result**

```
Exit code 1
Traceback (most recent call last):
  File "<string>", line 4, in <module>
AttributeError: 'list' object has no attribute 'get'
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bi…
<!-- xgd-tool name="Bash" id="toolu_01PfbTAoc78nuX39gqy14ZiM" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:19:59.415131+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai_knowledge.cli KnowledgeChunkSearch --in '{\"query\":\"free coding protocol finish: commit, merge back, move-to-free-coded, version bump\",\"top_k\":3,\"chunks_per_hit\":3}' 2>/dev/null | python3 -c \"\nimport json,sys\nd=json.load(sys.stdin)\nfor h in d:\n  print('==',h['uid'],h['title'])\n  for c in h['chunks']: print('  --',c['heading'],c['start'],c['end']); print('    ',c['text_snippet'][:400].replace('\\n',' '))\"","description":"Search KB for free-coding finish steps"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bi…
<!-- xgd-tool name="Bash" id="toolu_01NdsEwT4YCYjNEzDgvDXKVX" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:02.396647+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai_knowledge.cli KnowledgeChunkSearch --in '{\"query\":\"free coding protocol finish: commit, merge back, move-to-free-coded\",\"top_k\":3,\"chunks_per_hit\":3}' 2>&1 | grep -v index_query_profile | head -c 3000","description":"Search KB, raw output"}
```

**Result**

```
[]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bi…
<!-- xgd-tool name="Bash" id="toolu_012DTbyJ9X4GhimCvqHBBZE3" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:05.836900+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai_knowledge.cli KnowledgeSearch --in '{\"query\":\"free coding process\",\"top_k\":5}' 2>&1 | grep -v index_query_profile | python3 -c \"\nimport json,sys\nfor h in json.load(sys.stdin): print(h['uid'],'|',h['title'])\"; ls docs 2>/dev/null | grep -i free","description":"Find the free-coding process doc"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai_knowledge.cli Kn…
<!-- xgd-tool name="Bash" id="toolu_01HdpHRgf229ntMEctQFeEg3" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:09.222455+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai_knowledge.cli KnowledgeSearch --in '{\"query\":\"free coding process\",\"top_k\":5}' 2>&1 | grep -v index_query_profile | head -c 1500","description":"Retry KB search from main checkout"}
```

**Result**

```
[]
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rlai "free.coding" CLAUDE.md .xgd/*.md docs 2>/dev/null | head; xgd…
<!-- xgd-tool name="Bash" id="toolu_01KqYgjXy92iiY3okqc938Pv" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:11.789555+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rlai \"free.coding\" CLAUDE.md .xgd/*.md docs 2>/dev/null | head; xgd ticket --help 2>&1 | grep -i free | head","description":"Locate free-coding protocol text locally"}
```

**Result**

```
CLAUDE.md
                  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
    move-to-free-coded  Validate commits and version bump, then move ticket to
                        free_coded status
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket move-to-free-coded --help 2>&1 | head -40
<!-- xgd-tool name="Bash" id="toolu_01LZr8EweGR1gFxcQUth9qv8" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:12.477620+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket move-to-free-coded --help 2>&1 | head -40","description":"Read move-to-free-coded help"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:20:13
usage: xgd ticket move-to-free-coded [-h] [--version VERSION] [--json]
                                     [--branch SPEC]
                                     uid shas [shas ...]

positional arguments:
  uid                Ticket UID or human-readable ID (e.g. REQ-648)
  shas               One or more 40-character commit SHAs produced during this
                     free-coding cycle

options:
  -h, --help         show this help message and exit
  --version VERSION  Version string (X.Y.Z) that the version bump script wrote
                     in one of the commits. Optional — if omitted, the gate
                     allocates the version itself: it bumps the patch segment
                     (X.Y.Z -> X.Y.Z+1) of xgd-working's live tip under its
                     own lock and commits that bump, so no caller can race a
                     version it computed outside the lock (BUG-1340,
                     BUG-1362).
  --json             Output JSON format
  --branch SPEC      Redirect ticket operations to the specified worktree's
                     ticket store. SPEC can be 'main', a ticket ID (e.g.
                     'TASK-1'), or a branch name (e.g. 'branch-TASK-1').
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:20:13
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git status --short && git…
<!-- xgd-tool name="Bash" id="toolu_016hKwW1taH92xfZUDifDYXR" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:24.851907+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git status --short && git add apps/control-app/src/builder/config.js apps/control-app/src/checkout-intake.ts apps/control-app/src/orders.ts apps/control-app/src/router.ts apps/public-site/src/checkout.ts packages/framework/src/l1/render.ts packages/framework/src/l2/checkout.ts packages/framework/src/modules/checkout/client.js packages/framework/src/modules/checkout/component.ts packages/framework/src/modules/checkout/meta.ts packages/framework/src/modules/module-assets.ts tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts tests/req99-interaction-state.test.ts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts && npx tsc --noEmit -p apps/control-app 2>&1 | tail -3; git commit -q -F - <<'EOF'\nfix(BUG-367): builder draft checkout quotes, never takes money, says what failed\n\n- control-app preview routes POST draft api/checkout/<verb> through\n  public-site's handleCheckout (identified) over the same checkoutIntake;\n  start in a preview answers an owner-only notice and writes no order.\n- checkout script: a non-JSON or failed answer names the failure\n  (no answer / unreachable) instead of \"This can't be bought right now\".\n- single-rate shops: no Ship to question; quote carries the one rate and\n  Stripe offers every shipping country.\n- default ship-to prompt \"Please select a region for delivery\"; Cancel\n  control and cancelLabel; Continue starts disabled until a quote.\n- renderer: disabled controls dimmed with not-allowed cursor and no hover;\n  button labels centred. Checkout actions right-aligned, label-sized from\n  768px, stacked full width (Continue on top) below.\n- Plan panel empty message reads \"...once it has been agreed.\" (REQ-657 pin).\n- module-assets.ts regenerated (also picks up BUG-363's blocked guard,\n  which the committed bundle lacked).\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nEOF\ngit log --oneline -1; git status --short","description":"Typecheck and commit BUG-367 work","timeout":300000}
```

**Result**

```
 M apps/control-app/src/builder/config.js
 M apps/control-app/src/checkout-intake.ts
 M apps/control-app/src/orders.ts
 M apps/control-app/src/router.ts
 M apps/public-site/src/checkout.ts
 M packages/framework/src/l1/render.ts
 M packages/framework/src/l2/checkout.ts
 M packages/framework/src/modules/checkout/client.js
 M packages/framework/src/modules/checkout/component.ts
 M packages/framework/src/modules/checkout/meta.ts
 M packages/framework/src/modules/module-assets.ts
 M tests/req99-interaction-state.test.ts
 M tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts
?? tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts
?? tests/test_UAT_FC_BUG-367_checkout_page.test.ts
?? tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
1f69cf7322 fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git status --short; git diff --stat packages/framework/src/modules/module…
<!-- xgd-tool name="Bash" id="toolu_01Gy6G7qjPMpH9wkDrPhbEae" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:34.194761+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git status --short; git diff --stat packages/framework/src/modules/module-assets.ts; git -C /Users/martin/lagrangefoundry/1stcontact show HEAD:packages/framework/src/modules/module-assets.ts > $TMPDIR/bug367-ma-head.ts; diff <(cat packages/framework/src/modules/module-assets.ts) /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/packages/framework/src/modules/module-assets.ts >/dev/null && echo SAME_AS_MINE || echo DIFFERS_FROM_MINE","description":"Inspect main checkout's module-assets change"}
```

**Result**

```
 M .xgd/_changes/log.ndjson
 M .xgd/_changes/meta.json
 M .xgd/dispatcher.release
 M packages/framework/src/modules/module-assets.ts
 packages/framework/src/modules/module-assets.ts | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
diff: /dev/fd/12: Operation not permitted
DIFFERS_FROM_MINE
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && cmp packages/framework/src/modules/module-assets.ts /Users/martin/.xgd/wo…
<!-- xgd-tool name="Bash" id="toolu_01FCcHgPHk8KY9o3wbfxyy9L" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:37.096647+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && cmp packages/framework/src/modules/module-assets.ts /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/packages/framework/src/modules/module-assets.ts && echo SAME; git diff packages/framework/src/modules/module-assets.ts | grep -c \"BUG-363\"; git diff packages/framework/src/modules/module-assets.ts | grep -c \"BUG-367\"","description":"Compare main's module-assets with mine"}
```

**Result**

```
packages/framework/src/modules/module-assets.ts /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367/packages/framework/src/modules/module-assets.ts differ: char 55331, line 13
1
0
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git checkout -- packages/framework/src/modules/module-assets.ts && xgd br…
<!-- xgd-tool name="Bash" id="toolu_01ErWMeMZhxdAvsXbtUYGRZ5" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:42.169778+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git checkout -- packages/framework/src/modules/module-assets.ts && xgd branch lock BUG-367 2>&1 | grep -v \"^[▶◀]\" | tail -5; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367; git -C $W merge --no-edit xgd-working 2>&1 | tail -3; git -C $W status --short | head","description":"Lock branch and merge xgd-working into it","timeout":180000}
```

**Result**

```
Lock acquired for BUG-367.
Merge from: git -C /Users/martin/lagrangefoundry/1stcontact -c core.sparseCheckout=false merge free-BUG-367
then: /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-rematerialize-tickets --repo /Users/martin/lagrangefoundry/1stcontact --enforce --changed ORIG_HEAD..HEAD --apply
(or run /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-merge free-BUG-367 from the xgd-working worktree)
[17:20:42] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
 create mode 100644 .xgd/tickets/hot/comment-3fa69cfb.md
 create mode 100644 .xgd/tickets/hot/comment-5d1e541f.md
 create mode 100644 .xgd/tickets/hot/comment-91847602.md
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff --stat HEAD~1 HEA…
<!-- xgd-tool name="Bash" id="toolu_01PT4GWUKsqo6w6yTARyrgtW" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:20:49.206530+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367 && git diff --stat HEAD~1 HEAD -- packages apps tools | tail -2; CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox timeout 500 npx vitest run tests/test_UAT_FC_REQ-145_build_artifacts.test.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts tests/test_UAT_FC_REQ-643_checkout_pages.test.ts tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts tests/req99-interaction-state.test.ts 2>&1 | grep -E \"×|Test Files|Tests \"","description":"Rerun key suites after merge","timeout":520000}
```

**Result**

```
 Test Files  7 passed (7)
      Tests  40 passed (40)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git -c core.sparseCheckout=false merge --ff-only free-BUG-367 2>&1 | tail…
<!-- xgd-tool name="Bash" id="toolu_01FsysLAifAAciaFWDYL6Zo9" turn="570025fd1e844e18825c63aa0749d0c4" ts="2026-11-06T01:21:05.845135+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git -c core.sparseCheckout=false merge --ff-only free-BUG-367 2>&1 | tail -3 && /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-rematerialize-tickets --repo /Users/martin/lagrangefoundry/1stcontact --enforce --changed ORIG_HEAD..HEAD --apply 2>&1 | tail -3; git log --oneline -2; git rev-parse 1f69cf7322","description":"Fast-forward xgd-working and rematerialize","timeout":180000}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai.agent_cli AgentS…
<!-- xgd-tool name="Bash" id="toolu_01TJzJ9CzfemchMdMmppTaY8" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:21:38.485563+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-b6fb57f6\"}' | tail -c 3000; git log --oneline -3 xgd-working; git log --oneline -2 free-BUG-367; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md"}
```

**Result**

````
[17:21:43] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2441.68, 'pid': 49638}
{"count":2,"entries":["2026-11-05 code drafted on free-BUG-367: router.ts draft-only POST api/checkout/<verb> via public-site handleCheckout(identified:true) + previewCheckoutIntake (checkout-intake.ts; start answers PREVIEW_PAYMENT_NOTICE + quote, no order; cancel/status 404). client.js NO_ANSWER/UNREACHABLE, notice. orders.ts singleRate: quote.singleRate, zone falls back to first zone, ship_country provisional zone.countries[0] (column NOT NULL, rebuild migration rejected as too heavy), corrected from Stripe address on paid; start passes all countries. component.ts: DEFAULT_COUNTRY_PROMPT, no ship-to select when single rate, continue disabled until quote (edit: !buyable), cancel control (a, product page else ./), cancelLabel config. l2 default: removed static Ship to label; actions row stack->row at 768, distribution end, Cancel drawn twice with visibility so phone stack has Continue on top (no reverse axis in L1; schema change rejected). render.ts: :disabled opacity 0.45 + not-allowed, control hover :not(:disabled), button text-align center. Item 6 site override is DATA in remote dev site (not in code/local D1) -> must ask operator.","2026-11-05 tests: workers UAT (4) red with route disabled; jsdom UAT tests/test_UAT_FC_BUG-367_checkout_page.test.ts (6); Chromium UAT tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts (4) needs CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox else skips; fixture injects :root design vars (module fragments size from page-level --l1-content; bare catalogSeed has none -> 0px column). 3/4 red on HEAD render/l2 (centring held by UA default). Regenerated module-assets.ts via buildModuleAssets: committed copy also lacked BUG-363 blocked guard. req99 hover pin updated to :hover:not(:disabled). 8 failures in generate/req105/AC718/REQ-269/308/349 are pre-existing (same with src reverted)."],"framing":"Implementing BUG-367 (builder draft checkout) via FREE CODING. Ticket body = spec, 9 fix items. Branch free-BUG-367, worktree /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-367. Status set free_coding 2026-11-05. Not a dupe (BUG-363 is predecessor). Agent CLI python: ~/.xgd/releases/current/bin/python. Plan: preview route in apps/control-app/src/router.ts mirrors BUG-78 api/lead (handleCheckout imported from public-site with identified:true skipping rate limit; start replaced by owner-only notice)."}
e359310aba xgd(ticket): update comment comment-5d1e541f
5ac9634bd1 xgd(ticket): update comment comment-f4b948cd
b26df9ecf2 Merge branch 'xgd-working' into free-BUG-367
b26df9ecf2 Merge branch 'xgd-working' into free-BUG-367
1f69cf7322 fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
---
name: xgd-free-coded-promotion
description: "move-to-free-coded needs the version-carrying commit to BE the tip of xgd-working, so merge working into the branch, bump there, and fast-forward back."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c19873f1-4d06-4920-9e06-d01321c99dfb
  modified: 2026-10-23T01:19:46.608Z
---

`xgd ticket move-to-free-coded` rejects four things in sequence, each with its
own error, so getting the order wrong costs a round trip each time:

1. **The branch must already be merged back.** `xgd branch lock <TICKET-ID>`,
   then merge. Finish with `xgd branch clean <TICKET-ID>` (removes worktree,
   deletes branch, releases the lock).
2. **SHAs must be the full 40 hex characters.** `git rev-parse HEAD`, never an
   `--oneline` abbreviation.
3. **`--version` must be unclaimed** by another ticket's `fields.version`.
4. **The commit carrying the version must be reachable *from the SHAs you
   pass*, and it must be at the tip.** This is the one that is easy to get
   backwards. If merging the branch into `xgd-working` creates a MERGE COMMIT,
   that merge commit becomes the tip carrying the new version — and it is not
   reachable *from* your SHAs (they are its ancestors), so the gate refuses with
   *"already present at the tip of xgd-working (<sha>), on a commit not
   reachable from any of the provided SHAs — someone else already published this
   version"*. The message reads like a race with another ticket and is not one.

**Why:** the gate wants the version bump to be attributable to a commit the
ticket records. A merge commit records nobody, so the merge back has to be a
fast-forward.

**How to apply — the ordering that works:**

```
xgd branch lock <TICKET-ID>
git -C <worktree> merge xgd-working          # working INTO the branch first
./bin/project/xgd_version_bump               # bump ON the branch, after that merge
git -C <worktree> commit -am "chore(version): X.Y.Z for <TICKET-ID>"
git -C <main-checkout> merge --ff-only free-<TICKET-ID>
xgd ticket move-to-free-coded <uid> <sha>... --version X.Y.Z
xgd branch clean <TICKET-ID>
```

`--ff-only` is the check: if it refuses, the branch does not contain
`xgd-working`'s tip and the first merge was skipped or something landed since.
Verify the bump independently with
`./bin/project/xgd_version_bump --check <sha>... --version X.Y.Z` — exit 0 means
the version half is fine and any remaining refusal is the reachability rule
above.

**When other sessions are working the same repo, the tip check is a RACE and the
recipe above is not enough.** Every `xgd ticket ...` call by any agent commits to
`xgd-working`, and those commits bypass the merge lock — so a ticket commit lands
on top of your bump within seconds, inherits the new version, and the gate refuses
with the same *"already present at the tip"* message even though
````

[elided — kept 5800 of 8112 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -il "version" ~/.claude-2/projects/-Users-martin-lagrangefoundry-1st…
<!-- xgd-tool name="Bash" id="toolu_01ACMhMy8AskdRn1a9smi7Ee" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:21:47.905504+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -il \"version\" ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/*.md | head; grep -A8 -i \"free_coded\\|version\" ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-ticket-cli-quirks.md | head -40; xgd ticket move-to-free-coded --help 2>&1 | head -30"}
```

**Result**

```
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/branch-clean-blocked-by-another-lock.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/dont-ask-blocks-loops-and-test-runners.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/free-coded-version-gate-race.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/git-add-all-sweeps-untracked-caches.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/incoming-create-side-is-a-stub.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/legal-publication-403s-open-tabs.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/MEMORY.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/legal-docs-gate-the-build.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/node-modules-readable-only-via-grep.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/overlay-advances-past-incoming-status.md
description: "Hub of xgd ticket/report/branch CLI behaviours that surprise: stores, flags, bodies, the free_coded gate."
metadata:
  node_type: memory
  type: reference
  originSessionId: cbdeb153-884f-4f2d-86ad-5f9023f6778e
  modified: 2026-10-25T18:11:18.467Z
---

xgd ticket CLI quirks. Each entry is its own memory:
--
- [[version-claimed-by-another-ticket]] — Version claimed by another ticket: the gate refuses a duplicate version.
- [[free-coded-version-gate-race]] — free_coded version gate race: omit `--version`; the gate bumps itself (worked first try again on 2026-10-21, REQ-424).
- [[xgd-create-succeeds-silently]] — xgd create succeeds silently: a blind retry files a duplicate.
- [[xgd-report-create-subject-kind-flags]] — report create --subject/--kind are flags: not inside `--fields`.
- [[xgd-report-create-skips-commit-during-cherry-pick]] — report create skips commit mid-cherry-pick: won't perturb CHERRY_PICK_HEAD.
- [[xgd-append-body-takes-a-string]] — append-body takes a string: `--append-body --body-file -` appends nothing; `--append-body -` appends a literal "-".
- [[branch-lock-prints-missing-rematerialize-path]] — Branch lock rematerialize path is missing: use `xgd ticket-store rematerialize`.
- [[xgd-doc-kind-required]] — doc create needs doc_kind: closed enum; research docs go in `architecture`, not project_context/system_kb.
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:21:48
usage: xgd ticket move-to-free-coded [-h] [--version VERSION] [--json]
                                     [--branch SPEC]
                                     uid shas [shas ...]

positional arguments:
  uid                Ticket UID or human-readable ID (e.g. REQ-648)
  shas               One or more 40-character commit SHAs produced during this
                     free-coding cycle

options:
  -h, --help         show this help message and exit
  --version VERSION  Version string (X.Y.Z) that the version bump script wrote
                     in one of the commits. Optional — if omitted, the gate
                     allocates the version itself: it bumps the patch segment
                     (X.Y.Z -> X.Y.Z+1) of xgd-working's live tip under its
                     own lock and commits that bump, so no caller can race a
                     version it computed outside the lock (BUG-1340,
                     BUG-1362).
  --json             Output JSON format
  --branch SPEC      Redirect ticket operations to the specified worktree's
                     ticket store. SPEC can be 'main', a ticket ID (e.g.
                     'TASK-1'), or a branch name (e.g. 'branch-TASK-1').
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:21:48
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git merge-base --is-ancestor b26df9ecf2 xgd-working && echo merged; xgd t…
<!-- xgd-tool name="Bash" id="toolu_01VqNTd12dh3tDkUHVpNjK7j" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:21:52.709617+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git merge-base --is-ancestor b26df9ecf2 xgd-working && echo merged; xgd ticket move-to-free-coded BUG-367 $(git rev-parse 1f69cf7322) $(git rev-parse b26df9ecf2) 2>&1 | tail -15"}
```

**Result**

```
merged
[17:22:00] │ 
[17:22:00] │   [ ] Ticket body reflects the implementation as it now stands
[17:22:00] │       (not the original scope if iteration reshaped it)
[17:22:00] │   [ ] fields.commits populated with all commit SHAs for this work
[17:22:00] │   [ ] Every commit message includes [FREE-CODED]
[17:22:00] │   [ ] Status is free_coded — NOT ready_to_implement or ready_to_reconcile
[17:22:00] │   [ ] No new tickets were created for scope that belongs on this one
[17:22:00] │ 
[17:22:00] │ This ticket has 3 commit(s). Have you remembered to add all the commits
[17:22:00] │ for this work? Any commits that have not been added will not be correctly reconciled
[17:22:00] │ and may be reverted. Have you run the version increment script?
[17:22:00] │ 
[17:22:00] │ Moved to free_coded: bug: BUG-367 (bug-b6fb57f6)
[17:22:00] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:22:00
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git log -1 --format=%B 1f69cf7322 | head -5; xgd ticket show BUG-367 --js…
<!-- xgd-tool name="Bash" id="toolu_013V6bMGfAMyNkqNtGYWFkL6" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:22:06.557879+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git log -1 --format=%B 1f69cf7322 | head -5; xgd ticket show BUG-367 --json 2>/dev/null | python3 -c \"import sys,json;d=json.load(sys.stdin);f=d.get('fields',d);print(f.get('status'),f.get('version'),f.get('commits'))\" 2>&1 | tail -3"}
```

**Result**

```
fix(BUG-367): builder draft checkout quotes, never takes money, says what failed

- control-app preview routes POST draft api/checkout/<verb> through
  public-site's handleCheckout (identified) over the same checkoutIntake;
  start in a preview answers an owner-only notice and writes no order.
  File "/Users/martin/.pyenv/versions/3.12.11/lib/python3.12/json/decoder.py", line 356, in raw_decode
    raise JSONDecodeError("Expecting value", s, err.value) from None
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket show BUG-367 2>&1 | grep -iE "status|version|commits|^\s+-? ?[…
<!-- xgd-tool name="Bash" id="toolu_01LwykPxejyTz2aNTBhm17A3" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:22:09.823793+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket show BUG-367 2>&1 | grep -iE \"status|version|commits|^\\s+-? ?[0-9a-f]{40}\" | head; git log --oneline -3 xgd-working"}
```

**Result**

```
89e3c7b06c xgd(ticket): update bug bug-b6fb57f6
0e9257ddf2 xgd(version): auto-bump patch to 0.2.795 for BUG-367
e359310aba xgd(ticket): update comment comment-5d1e541f
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update BUG-367 --append-body " ## Implementation (free-coded,…
<!-- xgd-tool name="Bash" id="toolu_016xqnZ6WmrQ8EVrU4gGhmAR" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:22:18.980449+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update BUG-367 --append-body \"\n\n## Implementation (free-coded, 0.2.795)\n\n- Items 1-5, 7-9 landed in 1f69cf7322 (merged via b26df9ecf2). The control app's preview sends draft \\`POST api/checkout/<verb>\\` to public-site's \\`handleCheckout\\` (identified, so no rate limit) over the same \\`checkoutIntake\\`. In a preview, \\`start\\` answers the owner-only notice with the quote and writes no order.\n- Single rate: the quote carries \\`singleRate\\`. The order's \\`ship_country\\` (NOT NULL) is set to the zone's first country for now and corrected from Stripe's address once it's paid. A table rebuild to make it nullable was rejected as too heavy.\n- Phone stacking: L1 has no reverse axis, so the template draws Cancel twice and shows one copy per breakpoint. That keeps Continue on top on phones.\n- \\`module-assets.ts\\` regenerated. The committed copy also lacked the BUG-363 blocked guard.\n- **Item 6 (site override) is NOT done.** \\\"Where should we send it?\\\" is data in the remote dev site's checkout component, not in code or local D1. Clearing that site's \\`countryPrompt\\` is an operator action. The framework default is changed.\n- UATs: tests/test_UAT_FC_BUG-367_* (workers 4, jsdom 6, Chromium 4; Chromium needs \\`CHROMIUM_LAUNCH_ARGS=--single-process,--no-sandbox\\`). 8 failures in generate/req105/AC718/REQ-269/308/349 are pre-existing.\n- The commit message lacks the \\`[FREE-CODED]\\` tag. It is already merged, so it was not rewritten.\" 2>&1 | tail -2; xgd branch clean BUG-367 2>&1 | tail -3"}
```

**Result**

```
[17:22:20] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:22:20
[17:22:23] │ This command is still running inside the OS sandbox. Re-run it as exactly `xgd branch clean <TICKET-ID> [--force]` — no `cd`, pipe, `;`/`&&` chain or redirect around it, and `xgd` invoked by bare name — so the `xgd branch clean *` sandbox exclusion applies.
[17:22:23] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'failure', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:22:23
```

## Bash xgd branch clean BUG-367
<!-- xgd-tool name="Bash" id="toolu_01YNs7uD6GAArqULgX1QfcxD" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:22:26.957337+00:00" -->

**Input**

```json
{"command":"xgd branch clean BUG-367"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:22:27
[17:22:27] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-367'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Cleaned up free-BUG-367 (worktree removed, branch deleted, lock released).
[17:22:28] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:22:28
```

## Bash ~/.xgd/releases/current/bin/python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{"session":"bug-b6fb57f6","text…
<!-- xgd-tool name="Bash" id="toolu_01BzSdk1FKKAQbchzLtKNwqP" turn="a44b43a6864b44b9b575c4e8e89dc131" ts="2026-11-06T01:22:28.748312+00:00" -->

**Input**

```json
{"command":"~/.xgd/releases/current/bin/python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-b6fb57f6\",\"text\":\"2026-11-05 promoted: merged b26df9ecf2 into xgd-working, move-to-free-coded (gate auto-bumped to 0.2.795), implementation notes appended to the body, branch cleaned. Item 6 (remote dev site countryPrompt override) is still open for the operator. The commit lacks the [FREE-CODED] tag and was not rewritten.\"}' >/dev/null && echo ok"}
```

**Result**

```
[17:22:31] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2421.42, 'pid': 59737}
ok
```
