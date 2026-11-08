---
uid: comment-603db313
id: COMMENT-7900
type: comment
title: Comment on bug BUG-368
created_by: xgd
created_at: '2026-11-06T01:57:30.245582+00:00'
updated_at: '2026-11-06T02:20:13.852898+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5b30954f
  kind: tool_transcript
---

## Bash cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug…
<!-- xgd-tool name="Bash" id="toolu_019hrYt7QeWSfFcmsWYFSwUH" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:47:27.927672+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-5b30954f\"}'; python -m lagrangefoundry.ai.agent_cli AgentHistory --in '{\"session\":\"bug-5b30954f\",\"last\":6}' | head -c 6000","description":"Read summary and recent history"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv* 2>/dev/null | head; which xgd; cat CLAUDE.md 2>/dev/null |…
<!-- xgd-tool name="Bash" id="toolu_014D2DXFavMNz3qtM5ftwS95" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:47:36.721029+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv* 2>/dev/null | head; which xgd; cat CLAUDE.md 2>/dev/null | head -80","description":"Find python env and project instructions"}
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

## Bash cd /Users/martin/lagrangefoundry/1stcontact && head -3 /Users/martin/.xgd/bin/xgd; ls /Users/martin/.xgd/bin
<!-- xgd-tool name="Bash" id="toolu_01W8SD4zvKWqnb3Wr79tEiNM" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:47:40.459857+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && head -3 /Users/martin/.xgd/bin/xgd; ls /Users/martin/.xgd/bin","description":"Locate xgd python interpreter"}
```

**Result**

```
#!/bin/sh
# xgd release shim (REQ-934). A pinned run stays on its release; everything
# else follows the newest deployed release.
xgd
```

## Bash cat /Users/martin/.xgd/bin/xgd | head -30; ls ~/.xgd
<!-- xgd-tool name="Bash" id="toolu_01QBmDfs5rz2QDDWQoZVoBFr" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:47:42.864315+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.xgd/bin/xgd | head -30; ls ~/.xgd","description":"Read xgd shim"}
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
exec "$target" "$@"
bin
claude_pid_tracking.txt
dev-env
dispatcher-claims
projects.yaml
releases
sessions
tmp
worktrees
```

## Bash P=~/.xgd/releases/current/bin/python; ls ~/.xgd/releases/current/bin | head; $P -m lagrangefoundry.ai.agent_cli AgentSum…
<!-- xgd-tool name="Bash" id="toolu_011rRvFvwt4LDf434rKDkcc7" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:47:45.563456+00:00" -->

**Input**

```json
{"command":"P=~/.xgd/releases/current/bin/python; ls ~/.xgd/releases/current/bin | head; $P -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-5b30954f\"}' 2>&1 | head -c 5000","description":"Read summary with xgd python"}
```

**Result**

```
activate
activate.csh
activate.fish
Activate.ps1
black
blackd
cffi-gen-src
coverage
coverage-3.12
coverage3
[17:47:48] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2367.28, 'pid': 44954}
{"count":0,"entries":[],"framing":""}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli…
<!-- xgd-tool name="Bash" id="toolu_01E92jVyPZrNnfofbst1ojEE" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:47:52.399032+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentHistory --in '{\"session\":\"bug-5b30954f\",\"last\":4}' 2>/dev/null | head -c 3000; echo; xgd ticket list --help 2>&1 | head -30","description":"Read recent history and ticket CLI help"}
```

**Result**

```
{"count":0,"elided":0,"total":0,"turns":[]}

▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:47:53
usage: xgd ticket list [-h] [--store STORE] [--type TYPE] [--status STATUS]
                       [--filter FILTER] [--archived] [--all] [--limit LIMIT]
                       [--no-limit] [--cursor CURSOR] [--json] [--view]
                       [--flags FLAGS] [--branch-exclusive] [--base BASE]
                       [--project PROJECT] [--require-fresh] [--branch SPEC]

options:
  -h, --help          show this help message and exit
  --store STORE       Foreign store reference (ticket://org/repo/ or the
                      org/repo/ alias) to list from instead of this project's
                      own store. Not yet supported by the target's access
                      kind; naming one surfaces that error.
  --type TYPE         Filter by ticket type (can be specified multiple times)
  --status STATUS     Filter by status (can be specified multiple times)
  --filter FILTER     Filter by field value (e.g., --filter
                      fields.capability_uid=capability-abc123). Can be
                      specified multiple times.
  --archived          Include archived tickets
  --all               Include all ticket TYPES (by default, comments and
                      system tickets are excluded) — this does not lift the
                      --limit on result COUNT; use --no-limit for that
  --limit LIMIT       Maximum results to return (default: 50)
  --no-limit          Return every matching ticket, looping pagination
                      internally instead of stopping at --limit
  --cursor CURSOR     Pagination cursor from previous response
  --json              Output JSON format (default: human-readable)
  --view              Return full ticket data instead of refs (uses view() for
                      each ticket)
  --flags FLAGS       When --view is set, comma-separated flags for view (fron
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket list --type bug --limit 15 2>&1 | tail -20; grep -rln "Payment…
<!-- xgd-tool name="Bash" id="toolu_01NW4jBNAzoeV72b3VARGnuE" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:47:58.195224+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket list --type bug --limit 15 2>&1 | tail -20; grep -rln \"Payment opens on your published site\" --include=*.ts packages apps | grep -v node_modules | head","description":"List recent bugs and locate preview notice"}
```

**Result**

```
           │ 
[17:48:01] │   BUG-368  UPDATE:2026-11-06  (bug)  Checkout: BUG-367's button layout misses a site's own checkout page, and the draft's checkout doesn't work like the published site's
[17:48:01] │   BUG-367  UPDATE:2026-11-06  (bug)  Builder preview: checkout can't reach its quote, so every piece reads "This can't be bought right now"
[17:48:01] │   BUG-356  UPDATE:2026-11-06  (bug)  Signature effect: the consultant no longer raises hero motion before the first draft, and its first clip is too subtle to notice
[17:48:01] │   BUG-365  UPDATE:2026-11-06  (bug)  Overlay hero with a clip: halved in height and darker since BUG-355's fill layers
[17:48:01] │   BUG-364  UPDATE:2026-11-05  (bug)  Overlay-composition hero: video with fixed 720px height renders ~270px tall at 1280, overlaid text box spills below it
[17:48:01] │   BUG-366  UPDATE:2026-11-05  (bug)  Shop import: one-of-a-kind pieces with untracked stock arrive not live
[17:48:01] │   BUG-361  UPDATE:2026-11-05  (bug)  Consultant session: stuck after a model timeout, not robust to page reloads, product page lost its gap
[17:48:01] │   BUG-363  UPDATE:2026-11-05  (bug)  catalog product page: text bound to `buy` (link) renders nothing; checkout page says "This can't be bought right now"
[17:48:01] │   BUG-362  UPDATE:2026-11-05  (bug)  Draft preview does not refresh after a builder change to a component slot (catalog product-page) until a manual reload
[17:48:01] │   BUG-360  UPDATE:2026-11-05  (bug)  Consultant time estimates: re-survey step times since containers, and say only measured numbers
[17:48:01] │   BUG-359  UPDATE:2026-11-05  (bug)  Job containers: stop backstop, image pruning, true memory peak and dev limit
[17:48:01] │   BUG-357  UPDATE:2026-11-05  (bug)  Builder chat: the upload outline sticks after a drag, and refused hand-offs show as stopped builds
[17:48:01] │   BUG-358  UPDATE:2026-11-05  (bug)  import_from_site stores Next.js /_next/image pictures as octet-stream documents, which then can't be viewed or placed
[17:48:01] │   BUG-355  UPDATE:2026-11-05  (bug)  Builder grid column changes are reported as applied but don't render; video in an overlay composition won't layer under its text
[17:48:01] │   BUG-354  UPDATE:2026-11-05  (bug)  Builder: a site with a draft opens on Input instead of View
[17:48:01] │ 
           │ More results available (cursor: bug-43726c51)
[17:48:01] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:48:01
(eval):1: no matches found: --include=*.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai_knowledge.…
<!-- xgd-tool name="Bash" id="toolu_01Ktk21BtoBuK6fNb87urEDu" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:04.876269+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai_knowledge.cli KnowledgeChunkSearch --in '{\"query\":\"free coding protocol steps commit branch promote\",\"kb\":[\"system_docs\"],\"top_k\":2,\"chunks_per_hit\":4}' 2>/dev/null | head -c 6000","description":"Search free-coding protocol docs"}
```

**Result**

```
[]
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai_knowledge.…
<!-- xgd-tool name="Bash" id="toolu_016g66WK9m1778CmFC467G5H" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:08.697971+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai_knowledge.cli KnowledgeSearch --in '{\"query\":\"free coding process\"}' 2>&1 | tail -c 3000; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-develop-is-legacy.md","description":"Search free-coding doc and read memories"}
```

**Result**

````
[]
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
with the same *"already present at the tip"* message even though the fast-forward
was done correctly. Holding `xgd branch lock` does not prevent it. Run the whole
tail as a retry loop and let it burn version numbers:

```
for attempt in 1 2 3 4 5 6; do
  xgd branch lock <TICKET-ID> >/dev/null 2>&1
  git -C <worktree> merge xgd-working >/dev/null 2>&1
  (cd <worktree> && ./bin/project/xgd_version_bump)
  VER=$(grep '"version"' <worktree>/package.json | sed 's/.*"\([0-9.]*\)".*/\1/')
  git -C <worktree> commit -qam "chore(version): $VER for <TICKET-ID>"
  BUMP=$(git -C <worktree> log --format=%H -1)
  git -C <main> merge --ff-only free-<TICKET-ID> >/dev/null 2>&1
  xgd ticket move-to-free-coded <uid> <work-sha> "$BUMP" --version "$VER" && break
done
```

Versions are cheap; a burnt one costs nothing. Acquiring the lock can itself take
minutes — loop on `xgd branch lock` too (it was held by four different tickets in
one 25-minute window).

**The shell is zsh, which does NOT word-split an unquoted variable.**
`SHAS="a b"; xgd ticket move-to-free-coded $uid $SHAS` passes both SHAs as ONE
argument and fails *"invalid SHA — expected 40 lowercase hex characters"*, which
reads like a typo rather than a quoting bug. Write each SHA as its own literal
argument, or use an array.

**Before merging back, the main checkout may hold uncommitted or untracked files
the branch supersedes** — the merge aborts naming them. Back them up, diff them
against the branch's versions to confirm they are the older copy, then discard.

Never start a `git stash`-based baseline test run while another suite is running
in the same worktree; it removes the files mid-run and corrupts both results.

**2026-10-22 update (BUG-254):** the merge back is no longer a plain `git merge --ff-only`. The xgd-working checkout is sparse, so run `/Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-<TICKET-ID>` from `/Users/martin/lagrangefoundry/1stcontact`; it merges with sparse-checkout off and rematerializes tickets. The path `xgd branch lock` prints (`.venv-working/lib/python3.12/site-packages/bin/xgd-merge`) does not exist. The rest of the order is unchanged: lock → merge xgd-working into the branch → bump → commit → xgd-merge → move-to-free-coded → `xgd branch clean` as its own Bash call.

Related: [[xgd-ticket-json-shape]], [[never-edit-ticket-files-directly]].
---
name: xgd-develop-is-legacy
description: "Never route work to `xgd develop` in this project — it is legacy; everything, including design-sized changes, is free-coded."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 54c5972a-e95a-41e6-a502-3b2e42627c6f
  modified: 2026-11-03T01:27:20.064Z
---

`xgd develop` is legacy here. Every change, even a design-sized one (e.g. moving long turns onto a durable background runner), is filed as an ordinary ticket and free-coded.

**Why:** the operator corrected me on 2026-10-31 when I proposed sending a large architectural change through `xgd devel
````

[elided — kept 5800 of 6137 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git log --oneline --all -i --grep="BUG-367" | head; git log --oneline -i…
<!-- xgd-tool name="Bash" id="toolu_01Tp1XDXDpYQ93h2TPKR7uvh" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:13.037988+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git log --oneline --all -i --grep=\"BUG-367\" | head; git log --oneline -i --grep=\"bug-367\\|BUG-367\" xgd-working | grep -v \"xgd(ticket)\" | head","description":"Find BUG-367 commits"}
```

**Result**

```
0e9257ddf2 xgd(version): auto-bump patch to 0.2.795 for BUG-367
b26df9ecf2 Merge branch 'xgd-working' into free-BUG-367
1f69cf7322 fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
0e9257ddf2 xgd(version): auto-bump patch to 0.2.795 for BUG-367
b26df9ecf2 Merge branch 'xgd-working' into free-BUG-367
1f69cf7322 fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git show --stat 1f69cf7322 | head -60
<!-- xgd-tool name="Bash" id="toolu_019hSLbHDQnxBDyA9vZtR26u" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:19.056029+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git show --stat 1f69cf7322 | head -60","description":"Show BUG-367 commit stats"}
```

**Result**

```
commit 1f69cf7322c4baa96ab1d5b92aeee1428aa66617
Author: Martin Westhead <martin-github@westhead.me>
Date:   Thu Nov 5 17:20:29 2026 -0800

    fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
    
    - control-app preview routes POST draft api/checkout/<verb> through
      public-site's handleCheckout (identified) over the same checkoutIntake;
      start in a preview answers an owner-only notice and writes no order.
    - checkout script: a non-JSON or failed answer names the failure
      (no answer / unreachable) instead of "This can't be bought right now".
    - single-rate shops: no Ship to question; quote carries the one rate and
      Stripe offers every shipping country.
    - default ship-to prompt "Please select a region for delivery"; Cancel
      control and cancelLabel; Continue starts disabled until a quote.
    - renderer: disabled controls dimmed with not-allowed cursor and no hover;
      button labels centred. Checkout actions right-aligned, label-sized from
      768px, stacked full width (Continue on top) below.
    - Plan panel empty message reads "...once it has been agreed." (REQ-657 pin).
    - module-assets.ts regenerated (also picks up BUG-363's blocked guard,
      which the committed bundle lacked).
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

 apps/control-app/src/builder/config.js             |   2 +-
 apps/control-app/src/checkout-intake.ts            |  30 ++
 apps/control-app/src/orders.ts                     |  36 +-
 apps/control-app/src/router.ts                     |  42 +++
 apps/public-site/src/checkout.ts                   |  29 +-
 packages/framework/src/l1/render.ts                |  24 +-
 packages/framework/src/l2/checkout.ts              |  88 +++--
 packages/framework/src/modules/checkout/client.js  |  26 +-
 .../framework/src/modules/checkout/component.ts    |  69 +++-
 packages/framework/src/modules/checkout/meta.ts    |   8 +-
 packages/framework/src/modules/module-assets.ts    |   2 +-
 tests/req99-interaction-state.test.ts              |   4 +-
 ...FC_BUG-367_checkout_buttons_in_chromium.test.ts | 147 ++++++++
 tests/test_UAT_FC_BUG-367_checkout_page.test.ts    | 152 ++++++++
 ...t_UAT_FC_BUG-367_draft_checkout.workers.test.ts | 392 +++++++++++++++++++++
 tests/test_UAT_FC_REQ-657_the_plan_panel.test.ts   |   2 +-
 16 files changed, 990 insertions(+), 63 deletions(-)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git show 1f69cf7322 -- packages/framework/src/l1/render.ts packages/frame…
<!-- xgd-tool name="Bash" id="toolu_013ne5zCbLGiFYnuVVWdZwxv" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:26.004884+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git show 1f69cf7322 -- packages/framework/src/l1/render.ts packages/framework/src/l2/checkout.ts packages/framework/src/modules/checkout/component.ts packages/framework/src/modules/checkout/meta.ts","description":"Show BUG-367 framework diff"}
```

**Result**

```
commit 1f69cf7322c4baa96ab1d5b92aeee1428aa66617
Author: Martin Westhead <martin-github@westhead.me>
Date:   Thu Nov 5 17:20:29 2026 -0800

    fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
    
    - control-app preview routes POST draft api/checkout/<verb> through
      public-site's handleCheckout (identified) over the same checkoutIntake;
      start in a preview answers an owner-only notice and writes no order.
    - checkout script: a non-JSON or failed answer names the failure
      (no answer / unreachable) instead of "This can't be bought right now".
    - single-rate shops: no Ship to question; quote carries the one rate and
      Stripe offers every shipping country.
    - default ship-to prompt "Please select a region for delivery"; Cancel
      control and cancelLabel; Continue starts disabled until a quote.
    - renderer: disabled controls dimmed with not-allowed cursor and no hover;
      button labels centred. Checkout actions right-aligned, label-sized from
      768px, stacked full width (Continue on top) below.
    - Plan panel empty message reads "...once it has been agreed." (REQ-657 pin).
    - module-assets.ts regenerated (also picks up BUG-363's blocked guard,
      which the committed bundle lacked).
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

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
+  co
```

[elided — kept 5800 of 17630 bytes]

## Bash cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/dev-store-forensics.md; cat ~/.claude-2/project…
<!-- xgd-tool name="Bash" id="toolu_01YPekv9U1v5SLYgtmmyV84K" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:31.353148+00:00" -->

**Input**

```json
{"command":"cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/dev-store-forensics.md; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/no-customer-specifics-in-tickets.md | head -20","description":"Read dev store forensics memory"}
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
---
name: no-customer-specifics-in-tickets
description: "A customer's names, URLs, categories, counts or quirks never go in code, UATs or REQ/EPIC tickets — they are runtime data; specs stay generic."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 054a00ab-b2be-4d47-a7c7-6ed2d1a7b206
  modified: 2026-11-02T20:47:34.660Z
---

Nothing specific to a customer's site (her name, domain, category names like "Preloved", product counts, plugin names, workaround products) may appear in code, UATs, fixtures, or REQ/EPIC ticket bodies. We build a product; the first customer's specifics are runtime config/data entered through the product (e.g. an import mapping step), never hardcoded rules or examples the code will literally implement.

**Why:** operator, 2026-11-02 (EPIC-31/REQ-631): "I am alarmed to see lots of direct references to the names and specifics of Lauren's site... her specifics need to be runtime config." Specific examples in a ticket get implemented literally (see the literalism rule in the XGD philosophy).

**How to apply:** write requirements as general rules with neutral examples ("a top-level category", "a product priced 0"); turn every customer quirk into a generic owner-facing choice (mapping, review list, report). Fixtures are synthetic shops. If a customer-scoped goal ticket needs her facts, ask the operator where they belong rather than spreading them. Related: [[minimise-ticket-count]], [[epic-session-does-not-code]].
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && for f i…
<!-- xgd-tool name="Bash" id="toolu_01S99UgYQk1tbfpYXbaf4Ut2" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:35.180354+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && for f in *.sqlite; do n=$(sqlite3 \"$f\" \"select count(*) from site_pages where name like '%checkout%'\" 2>/dev/null); [ -n \"$n\" ] && [ \"$n\" != 0 ] && echo \"$f $n\"; done","description":"Find D1 holding checkout pages"}
```

**Result**

```
Exit code 1
24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite 3
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && F=24f6d…
<!-- xgd-tool name="Bash" id="toolu_018Fc4YpNLNZbCjnmGNJB2L8" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:38.645385+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && F=24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite; sqlite3 $F \".schema site_pages\"; sqlite3 $F \"select site_id,name,length(page_json) from site_pages where name like '%checkout%'\" 2>&1","description":"Inspect checkout page rows"}
```

**Result**

```
Exit code 1
CREATE TABLE site_pages (
  site_id   TEXT NOT NULL,
  
  
  name      TEXT NOT NULL,
  page      TEXT NOT NULL,
  PRIMARY KEY (site_id, name),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);
Error: in prepare, no such column: page_json
  select site_id,name,length(page_json) from site_pages where name like '%checko
               error here ---^
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && F=24f6d…
<!-- xgd-tool name="Bash" id="toolu_01WUVhoTwwunzwYiRf282M54" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:43.189580+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && F=24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite; sqlite3 $F \"select site_id,name,length(page) from site_pages where name like '%checkout%'\"; sqlite3 $F \"select page from site_pages where name='checkout'\" | python3 -m json.tool | head -200","description":"Dump checkout page JSON"}
```

**Result**

```
site_770dd23388c1e80d23fa8bc4c3d8c2dd|checkout.json|2327
site_770dd23388c1e80d23fa8bc4c3d8c2dd|checkout-complete.json|1725
site_770dd23388c1e80d23fa8bc4c3d8c2dd|checkout-cancelled.json|1735
Expecting value: line 1 column 1 (char 0)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && F=24f6d…
<!-- xgd-tool name="Bash" id="toolu_01Xs2UHuFZ7GPzYy2PpvmFNZ" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:47.305797+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject && F=24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite; sqlite3 $F \"select page from site_pages where name='checkout.json'\" | python3 -m json.tool; sqlite3 $F \"select section_id, unit from site_page_sections where page_name='checkout.json'\" | head -c 6000","description":"Dump checkout page and sections"}
```

**Result**

```
{
    "id": "checkout",
    "slug": "checkout",
    "title": "Checkout",
    "modules": [
        {
            "id": "checkout",
            "type": "checkout",
            "version": 1,
            "slot": "checkout",
            "config": {
                "mode": "checkout",
                "continueLabel": "Continue to payment",
                "countryPrompt": "Where should we send it?"
            },
            "slots": {
                "page": {
                    "id": "checkout-controls",
                    "kind": "container",
                    "layout": "stack",
                    "space": "md",
                    "width": "content",
                    "children": [
                        {
                            "id": "checkout-ship-to",
                            "kind": "control",
                            "control": "ship-to",
                            "role": "body",
                            "axes": {
                                "color": {
                                    "ref": "text"
                                },
                                "surfaceFill": {
                                    "ref": "background"
                                },
                                "border": {
                                    "widthPx": 1,
                                    "color": {
                                        "ref": "text"
                                    }
                                }
                            }
                        },
                        {
                            "id": "checkout-message",
                            "kind": "control",
                            "control": "message",
                            "role": "small"
                        },
                        {
                            "id": "checkout-continue-box",
                            "kind": "box",
                            "component": "button.primary",
                            "spaceBelow": 16,
                            "children": [
                                {
                                    "id": "checkout-continue",
                                    "kind": "control",
                                    "control": "continue",
                                    "role": "caption",
                                    "axes": {
                                        "color": {
                                            "ref": "on-action"
                                        },
                                        "surfaceFill": {
                                            "ref": "action"
                                        },
                                        "fontFamily": "Jost, sans-serif",
                                        "fontSizePx": 12,
                                        "fontWeight": 500,
                                        "letterSpacingPx": 2.2,
                                        "textTransform": "uppercase",
                                        "textAlign": "center"
                                    },
                                    "padding": {
                                        "topPx": 12,
                                        "rightPx": 28,
                                        "bottomPx": 12,
                                        "leftPx": 28
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        }
    ],
    "l1": {
        "widths": [
            320,
            375,
            768,
            1024,
            1280,
            1440
        ],
        "background": {
            "ref": "background"
        },
        "textColor": {
            "ref": "text"
        },
        "root": {
            "id": "checkout-page",
            "kind": "container",
            "layout": "stack",
            "width": "content",
            "spaceAbove": 12,
            "padding": {
                "bottomPx": 48
            },
            "children": [
                {
                    "id": "checkout-heading",
                    "kind": "text",
                    "role": "h1",
                    "text": "Checkout"
                },
                {
                    "id": "checkout-lead",
                    "kind": "text",
                    "role": "lead",
                    "text": "Choose where your piece is going, then continue to payment."
                },
                {
                    "id": "checkout-form",
                    "kind": "slot",
                    "name": "checkout",
                    "spaceAbove": 8
                }
            ]
        },
        "resources": {
            "fonts": [
                {
                    "family": "Cormorant Garamond",
                    "src": "/_fonts/cormorantgaramond/CormorantGaramond%5Bwght%5D.woff2",
                    "weight": 400,
                    "style": "normal"
                },
                {
                    "family": "Cormorant Garamond",
                    "src": "/_fonts/cormorantgaramond/CormorantGaramond%5Bwght%5D.woff2",
                    "weight": 700,
                    "style": "normal"
                },
                {
                    "family": "Cormorant Garamond",
                    "src": "/_fonts/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.woff2",
                    "weight": 400,
                    "style": "italic"
                },
                {
                    "family": "Cormorant Garamond",
                    "src": "/_fonts/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.woff2",
                    "weight": 700,
```

[elided — kept 5800 of 6312 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli…
<!-- xgd-tool name="Bash" id="toolu_016Nh3F9XwBJSsiMjBsx4juf" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:48:59.919317+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummaryFrame --in \"$(python3 -c 'import json;print(json.dumps({\"session\":\"bug-5b30954f\",\"text\":\"\"\"BUG-368 (bug-5b30954f), free-coded. Objective: (1) renderer draws the BUG-367 action row (label-sized right-aligned from 768, secondary Cancel at left, stacked full width on phones, Continue on top) wherever a checkout template places `continue`; a template already placing `cancel` keeps its placement. (2) button labels centred unless the control node itself has textAlign. (3) draft/preview checkout start = published start: real Stripe session, return URLs on preview complete/cancelled pages; delete BUG-367 owner-only notice and preview branch in startCheckout. (4) confirm update_component reaches countryPrompt; playbook notes new default.\\nSettled: not a dupe (checked bug list). Cause confirmed from dev D1 site_pages checkout.json: authored slot `page` = stack[ship-to, message, box(component button.primary)[continue control w/ own textAlign:center]]; no cancel.\\nRejected: none yet.\"\"\"}))')\" 2>/dev/null | head -c 200; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/worktree-and-store-setup.md | head -60","description":"Write summary frame; read worktree setup memory"}
```

**Result**

```
{"count":0,"entries":[],"framing":"BUG-368 (bug-5b30954f), free-coded. Objective: (1) renderer draws the BUG-367 action row (label-sized right-aligned from 768, secondary Cancel at left, stacked full ---
name: worktree-and-store-setup
description: "Hub for making a fresh xgd worktree runnable: generated artifacts, the shared @lagrangefoundry store, installs and baselines."
metadata:
  node_type: memory
  type: reference
  originSessionId: cbdeb153-884f-4f2d-86ad-5f9023f6778e
  modified: 2026-10-21T22:36:24.899Z
---

Worktree and shared-store setup. Each entry is its own memory:

- [[pnpm-install-blocked-by-idea-dir]] — pnpm install blocked by .idea dir: sandbox denies `.idea`; iconv-lite ships one.
- [[worktree-breaks-webui-resolution]] — Worktree breaks webui resolution: builder/webui 404s and workerd import death are location artifacts.
- [[shared-node-modules-outside-sandbox]] — Shared node_modules outside sandbox: `bin/install` can't write the shared store.
- [[pnpm-store-closure-from-main-checkout]] — pnpm store closure from main checkout: a missing declared package needs no network.
- [[unpinned-shared-store-drifts]] — Unpinned shared store drifts: `@lagrangefoundry/*` isn't in the lockfile.
- [[reference-bundles-are-gitignored]] — Reference bundles are gitignored: real-bundle UATs skip in every worktree.
- [[shadow-shared-store-to-verify-upstream]] — Shadow the shared store: stage into 1stcontact/node_modules, then delete.
- [[repair-stale-worktree-install-by-hand]] — Repair a stale worktree install by hand: worktree sits at the branch's lockfile.
- [[baseline-real-bundle-tests-in-place]] — Baseline real-bundle tests in place: revert your files in the main checkout instead.
- [[fresh-worktree-lacks-control-app-generated]] — Fresh worktree lacks control-app generated: "0 test" is a missing artifact.
- [[patch-swap-baseline-needs-exclude]] — Patch-swap baseline needs --exclude: git apply is atomic; module-assets/tests hunks make it silently refuse.
```

## Bash cd ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/ && cat branch-cut-blocked-by-hookspath.md fresh…
<!-- xgd-tool name="Bash" id="toolu_01Xrs2jMAbkXktMzJyPknBFi" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:10.164710+00:00" -->

**Input**

```json
{"command":"cd ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/ && cat branch-cut-blocked-by-hookspath.md fresh-worktree-lacks-control-app-generated.md | grep -v \"^  \\|^---\\|^metadata\\|^name\\|^desc\"","description":"Read branch-cut memories"}
```

**Result**

```
`xgd branch cut <ID>` in a sandboxed session dies with *"cannot set core.hooksPath … could not lock config file .git/config: Operation not permitted"* — but only AFTER it created `free-<ID>` at xgd-working's tip. Seen 2026-11-02 (BUG-329).

**How to apply:** `git worktree add ~/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-<ID> free-<ID>` works (no `-b`; the branch exists). Then make it runnable: `node_modules` as a real dir of per-entry symlinks to the main checkout's (`ls -A $M/node_modules | xargs -I{} ln -s …`) plus `@lagrangefoundry` → `/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry`; symlink each package's `node_modules` (`apps/control-app`, `tools/generate`, `tools/repro-console`, `packages/site-schema`, `packages/framework`, `apps/public-site`) individually (xargs with `sh -c` overflowed); copy `apps/control-app/src/generated`. Without the package links, plan-panel suites die at collection on `@1stcontact/site-schema`.

**Never run `pnpm <script>` in a worktree built this way (BUG-333, 2026-11-03).** pnpm 11 checks dependencies before a run and rewrites every package's `node_modules` links and `.bin` shims. Through the symlinked package dirs, that rewrites the MAIN checkout's links to point into the worktree. After `xgd branch clean` they dangle, and main's `1c` dies with "Cannot find package 'vite'", which breaks `bin/deploy`.
- **Repair:** re-point each link (`find … -lname '*free-<ID>*'`) to the same repo-relative path in the main checkout, then `sed` the worktree path out of the `.bin` shims' `NODE_PATH`.
- **Safer:** run `node_modules/.bin/vitest …` directly, or give a worktree that must run `pnpm` its own real `node_modules`.
- **For `pnpm test:browser` (has to be `pnpm`, for the sandbox exclusion to apply):** append `verifyDepsBeforeRun: false` to the worktree's `pnpm-workspace.yaml` for the run, then `git checkout pnpm-workspace.yaml`. Main's links stayed intact (REQ-639, 2026-11-03).

**Don't symlink a package's whole `node_modules` (REQ-643, 2026-11-04).** `tools/generate/node_modules/@1stcontact/framework` is a RELATIVE link (`../../../../packages/framework`), resolved from where it really lives. Through a symlinked dir, that is the MAIN checkout's `packages/`, so typecheck and tests run main's framework, not the branch's. Make each package's `node_modules` a real dir: symlink every entry except `@1stcontact`, and recreate `@1stcontact/*` as the same relative links inside the worktree.

`xgd-merge` releases the lock on exit, so another ticket can grab it before `xgd branch clean` runs → [[branch-clean-blocked-by-another-lock]]. Related: [[worktree-and-store-setup]], [[xgd-free-coded-promotion]].

`apps/control-app/src/generated/` (ai-workers.js, knowledge, ticketing, logging, importmap.json, …) is a **build artifact**, present in `/Users/martin/lagrangefoundry/1stcontact` and absent in a freshly cut `xgd branch cut` worktree.

Any test that transitively imports control-app therefore dies at collection with `Cannot find module './generated/knowledge'` and reports **"0 test"** — including `reconciliation-l1-authoring-envelope`, `reconciliation-l1-fold-full-language`, `bug15-values-diff-l1-flat-dom`, `reconciliation-builder-request-time-render`, `test_UAT_FC_REQ-130_beyond_l1`, `req118-image-selection`. A CLI-subprocess test in the same set (`reconciliation-1c-astro-free-render`, asserting `res.status === 0`) fails for the same reason but presents as a real assertion failure, not an import error.

**Why:** reads as "my change broke six suites" when it is purely a location artifact — same class as [[worktree-breaks-webui-resolution]] and [[repair-stale-worktree-install-by-hand]].

**How to apply:** before diagnosing, `ls apps/control-app/src/generated/`. Empty → `cp -R /Users/martin/lagrangefoundry/1stcontact/apps/control-app/src/generated apps/control-app/src/`. It is gitignored, so nothing gets committed. That made the `.workers` delegation suites run in a worktree on 2026-10-18 (BUG-225). Do not report the import failures as regressions.

**And it does not stay right (REQ-624, 2026-11-01):** a suite that runs `1c assets` rewrites the worktree's `generated/kb.js` to `export const KB = null`, so `stageGuidesDoc()` is null and stage-guide UATs (BUG-322 `next_stage_starts_when_one_ticks_done`) fail looking like a regression. Re-copy `kb.js` from the main checkout before each suite run.
Shell cwd was reset to /Users/martin/lagrangefoundry/1stcontact
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "component" packages/framework/src/l1/render.ts | head -40; wc -l…
<!-- xgd-tool name="Bash" id="toolu_01TtsdBE3nBM9SBQDUJosDc4" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:16.765088+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"component\" packages/framework/src/l1/render.ts | head -40; wc -l packages/framework/src/l1/render.ts packages/framework/src/modules/checkout/component.ts","description":"Find box component handling in renderer"}
```

**Result**

```
542: * A `calc()` when both components are given. It is arithmetic over two numbers
2296: * reference surface lying about the component it describes, which is the whole
2297: * shape that ticket is about; the tag is the component's and the declaration
2458: * or a border: a button component, resolved) sizes to its label and padding in
6920:   * [[REQ-447]] — the site's design. Its substitutions (type roles, components,
    7187 packages/framework/src/l1/render.ts
     177 packages/framework/src/modules/checkout/component.ts
    7364 total
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rn "components\[\|\.component\b\|component:" packages/framework/src…
<!-- xgd-tool name="Bash" id="toolu_01PgjDFqqCHaNSmhhi5JvoPd" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:19.660320+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rn \"components\\[\\|\\.component\\b\\|component:\" packages/framework/src/l1/*.ts | grep -v \"^.*//\" | head -30; ls packages/framework/src/l1/","description":"Find where node.component resolves"}
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
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rln "button.primary" packages/framework/src packages/site-schema/sr…
<!-- xgd-tool name="Bash" id="toolu_01LUzBjX48zmx25PNusdG1Ch" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:22.686238+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rln \"button.primary\" packages/framework/src packages/site-schema/src | head; grep -rn \"'component'\\|\\.component \" packages/site-schema/src/l1/*.ts | head -20","description":"Locate component substitution code"}
```

**Result**

```
packages/framework/src/l2/checkout.ts
packages/site-schema/src/l1/design-names.ts
packages/site-schema/src/l1/design.ts
packages/site-schema/src/l1/design.ts:678:      check('component', v.component, 'the component')
packages/site-schema/src/l1/design.ts:771:    if (!isRecord(n) || n.component !== undefined) return n
packages/site-schema/src/l1/design.ts:1014:    n.component === undefined &&
packages/site-schema/src/l1/design.ts:1351:      const c = typeof node.component === 'string' ? design.components?.[node.component as L1ComponentName] : undefined
packages/site-schema/src/l1/design.ts:1585:      for (const field of ['role', 'space', 'width', 'component', 'aspect']) {
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1320,1420p packages/site-schema/src/l1/design.ts
<!-- xgd-tool name="Bash" id="toolu_01TbZrFssf6pyfQGwnTTniBu" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:25.802525+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1320,1420p packages/site-schema/src/l1/design.ts","description":"Read component resolution code"}
```

**Result**

```
      if (len === undefined || own[key] !== undefined || ownTracks[key] !== undefined) return
      if (typeof len === 'number') padding[key] = len
      else {
        padding[key] = len.keyframes[len.keyframes.length - 1].value
        tracks[key] = len
      }
    }
    side('leftPx', x)
    side('rightPx', x)
    side('topPx', y)
    side('bottomPx', y)
    if (Object.keys(padding).length) out.padding = padding
    if (Object.keys(tracks).length) out.responsivePadding = tracks
  }
  if (c.role !== undefined && node.kind === 'text' && node.role === undefined) out.role = c.role
  if (c.role !== undefined && isGroup(node)) {
    const type = isRecord(node.type) ? node.type : {}
    if (type.role === undefined) out.type = { ...type, role: c.role }
  }
  delete out.component
  return out
}

/** Every `component` under `input` expanded; a group's text colour handed down to the runs inside that set none. */
function applyComponents(input: unknown, design: L1Design): unknown {
  const walk = (v: unknown, ink: L1Color | undefined): unknown => {
    if (Array.isArray(v)) return v.map((item) => walk(item, ink))
    if (!isRecord(v)) return v
    let node: Json = v
    let inner = ink
    if (typeof node.kind === 'string') {
      const c = typeof node.component === 'string' ? design.components?.[node.component as L1ComponentName] : undefined
      if (c) {
        node = applyComponent(node, c, design)
        if (isGroup(node) && c.text !== undefined) inner = design.colour?.[c.text] ?? inner
      }
      if ((node.kind === 'text' || node.kind === 'control') && inner !== undefined) {
        const axes = isRecord(node.axes) ? node.axes : {}
        if (axes.color === undefined) node = { ...node, axes: { ...axes, color: inner } }
      }
    }
    const out: Json = {}
    for (const [k, item] of Object.entries(node)) out[k] = k === 'axes' ? item : walk(item, inner)
    return out
  }
  return walk(input, undefined)
}

/** [[BUG-305]] — the space step a filled or bordered box is padded by when it says nothing: 16px on a phone, 24px on a computer in the seeded scale. */
export const L1_INNER_PADDING_STEP: L1SpaceStep = 'md'

/** [[BUG-305]] — a group that paints a visible box: a fill, a gradient or a border that shows. */
export function l1PaintsABox(node: { axes?: unknown }): boolean {
  const a = isRecord(node.axes) ? node.axes : {}
  const fill = a.surfaceFill
  const shows = (c: unknown): boolean => c !== undefined && !(isRecord(c) && c.alpha === 0)
  const border = isRecord(a.border) && a.border.widthPx !== 0
  return shows(fill) || a.surfaceGradient !== undefined || border
}

/**
 * [[BUG-305]] — A FILLED OR BORDERED BOX IS PADDED. A box or container below the
 * document's root that paints a visible box (a fill, a gradient, a border) and
 * gives no padding of its own takes the design's {@link L1_INNER_PADDING_STEP} on
 * every side — a per-width track where the step has one — so its text never
 * sits against the box's edge. A padding the node states, zero included (a
 * full-bleed photo), is kept, and so is a box pinned to captured geometry,
 * which is a reproduction. Runs after components, so a component's own padding
 * comes first. Nothing happens where the scale has no such step.
 */
function applyInnerPadding(input: unknown, design: L1Design): unknown {
  const len = stepLength(design, L1_INNER_PADDING_STEP)
  if (len === undefined) return input
  const padding: Json = {}
  const tracks: Json = {}
  for (const side of ['topPx', 'rightPx', 'bottomPx', 'leftPx']) {
    padding[side] = typeof len === 'number' ? len : len.keyframes[len.keyframes.length - 1].value
    if (typeof len !== 'number') tracks[side] = len
  }
  const walk = (v: unknown, top: boolean): unknown => {
    if (Array.isArray(v)) return v.map((item) => walk(item, false))
    if (!isRecord(v)) return v
    let node: Json = v
    if (
      !top &&
      isGroup(node) &&
      node.padding === undefined &&
      node.responsivePadding === undefined &&
      node.geometry === undefined &&
      l1PaintsABox(node)
    ) {
      node = { ...node, padding: { ...padding }, ...(Object.keys(tracks).length ? { responsivePadding: { ...tracks } } : {}) }
    }
    const out: Json = {}
    for (const [k, item] of Object.entries(node)) out[k] = k === 'axes' || k === 'padding' || k === 'responsivePadding' ? item : walk(item, k === 'root')
    return out
  }
  return walk(input, !(isRecord(input) && isRecord(input.root)))
}

/**
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 6040,6110p packages/framework/src/l1/render.ts; grep -n "textAlign…
<!-- xgd-tool name="Bash" id="toolu_01MxZpgiNAg3ufthbgEhGQbR" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:45.838867+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 6040,6110p packages/framework/src/l1/render.ts; grep -n \"textAlign\" packages/framework/src/l1/render.ts | head -30","description":"Read control emit code and textAlign uses"}
```

**Result**

```
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
      // [[BUG-367]] — A BUTTON'S LABEL IS CENTRED, across and down, unless the
      // node says otherwise: unshifted, so an authored `textAlign` still wins. A
      // link drawn as a button (a fill or a border) is centred the same way.
      if (el.tag === 'button') base.unshift('text-align: center')
      else if (el.tag === 'a' && (node.axes?.surfaceFill || node.axes?.border)) {
        base.unshift('display: inline-flex', 'justify-content: center', 'align-items: center', 'text-align: center')
      }
      // [[BUG-367]] — A DISABLED CONTROL LOOKS DISABLED. The script and the
      // module set `disabled` when a control cannot work; without this a disabled
      // button painted exactly like a live one. Dimmed, a not-allowed cursor, and
      // no hover change (the hover rules below skip `:disabled`).
      if (el.tag === 'button' || el.tag === 'input' || el.tag === 'select' || el.tag === 'textarea') {
        state.rules.push({ selector: `${selector}:disabled`, decls: [`opacity: ${DISABLED_OPACITY}`, 'cursor: not-allowed'] })
      }
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
2476:  const own = a.textAlign === 'center' ? 'center' : a.textAlign === 'right' ? 'end' : 'start'
3476:   * REQ-372 — the run's `textAlign`. A relaxed run (below) grows past its captured
3479:  textAlign?: string,
3568:  const pivot = textAlign === 'center' ? 0.5 : textAlign === 'right' ? 1 : 0
5891:    const textAlign = node.kind === 'text' || node.kind === 'control' ? node.axes?.textAlign : undefined
5899:        textAlign,
5928:      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
6032:        if (node.axes?.textAlign === 'center') base.push('margin-left: auto', 'margin-right: auto')
6082:      // node says otherwise: unshifted, so an authored `textAlign` still wins. A
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 2450,2500p packages/framework/src/l1/render.ts; sed -n 5905,5935p…
<!-- xgd-tool name="Bash" id="toolu_01PnRKYhKXzjZ1PDeUehnVKq" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:49.803994+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 2450,2500p packages/framework/src/l1/render.ts; sed -n 5905,5935p packages/framework/src/l1/render.ts","description":"Read textAlign-related renderer code"}
```

**Result**

```
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
   * leaf. A control is a styled, surface-painting text leaf (a placeholder, a
   * button label), so it takes exactly the same axes — factoring this is what
   * makes "L1 paints the control" literally the same code path as "L1 paints a
   * run", rather than a parallel half-implementation.
   */
  const emitTextAxes = (
    a: NonNullable<Extract<L1Node, { kind: 'text' }>['axes']>,
    r: Extract<L1Node, { kind: 'text' }>['responsive'],
  ): void => {
      const c = cssColor(a.color)
      if (c) base.push(`color: ${c}`)
      const ff = cssFontFamily(a.fontFamily)
      if (ff) base.push(`font-family: ${ff}`)
      const fontSize = px(a.fontSizePx)
      if (!r?.fontSizePx && fontSize) base.push(`font-size: ${fontSize}`)
      if (a.fontWeight !== undefined) base.push(`font-weight: ${Math.round(a.fontWeight)}`)
      const lineHeight = px(a.lineHeightPx)
      if (!r?.lineHeightPx && lineHeight) base.push(`line-height: ${lineHeight}`)
      const letterSpacing = px(a.letterSpacingPx)
      if (!r?.letterSpacingPx && letterSpacing) base.push(`letter-spacing: ${letterSpacing}`)
      if (r?.fontSizePx) state.rules.push(...scalarAxisRules(selector, 'font-size', r.fontSizePx))
      if (r?.lineHeightPx) state.rules.push(...scalarAxisRules(selector, 'line-height', r.lineHeightPx))
      if (r?.letterSpacingPx) state.rules.push(...scalarAxisRules(selector, 'letter-spacing', r.letterSpacingPx))
      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
      // REQ-370 — spaces that take width (see `axes.whiteSpace`).
      if (a.whiteSpace) base.push(`white-space: ${a.whiteSpace}`)
      // REQ-88 — a run the reference kept on one line must not become breakable
      // just because the fold gave it a fixed-width box (see `axes.nowrapFromPx`).
      // At or below the ladder's floor the pin is unconditional; above it, it
      // starts at the width from which the reference stopped wrapping.
      // REQ-370 — on a run that preserves its spaces only the WRAP mode is pinned:
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && cat packages/framework/src/modules/checkout/component.ts
<!-- xgd-tool name="Bash" id="toolu_01QUVvhqe42pGNfjPNuPffvw" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:49:56.828371+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && cat packages/framework/src/modules/checkout/component.ts","description":"Read checkout component"}
```

**Result**

```
import type { L1Node } from '@1stcontact/site-schema'
import { bindL1, renderL1Fragment, type L1BindRecord, type L1ControlElement } from '../../l1/render'
import type { BehaviorProps } from '../behavior'
import { escapeHtml } from '../html'
import { formatMoney } from '../../intl'
import { buyBlockedNote, catalogRecord, isSold, productPagePath, type CatalogDrawContext, type CatalogItem } from '../product-catalog/items'

/**
 * `checkout` behavior ([[REQ-643]]) — see `meta.ts`.
 *
 * Like the catalog, the module draws its ONE template (the `page` slot) through
 * `bindL1` and writes no markup of its own beyond its wrapper, the controls'
 * attribute bundles and the data its script reads. Every value the page shows
 * meets the same sinks authored copy does; the script later writes figures into
 * the bound nodes with `textContent` only.
 */

/** The endpoint the page's script posts to, relative to the site's root. */
export const CHECKOUT_ENDPOINT = 'api/checkout'

/** The root a checkout instance renders, which its script finds. */
export const CHECKOUT_ROOT_ATTR = 'data-checkout'

/**
 * [[BUG-363]] — on the root, in the builder's renders only, when the business
 * can't sell yet: the missing setup (`payments`, `shipping`). Its script then
 * leaves the page as drawn.
 */
export const CHECKOUT_BLOCKED_ATTR = 'data-checkout-blocked'

/**
 * [[BUG-367]] — the Ship to choice's wording when the page's `countryPrompt`
 * sets none: its accessible name and its first, empty option.
 */
export const DEFAULT_COUNTRY_PROMPT = 'Please select a region for delivery'

/** [[BUG-367]] — the Cancel link's wording when the page's `cancelLabel` sets none. */
export const DEFAULT_CANCEL_LABEL = 'Cancel'

/** A root-relative path as a document-relative one (a nested page carries `<base>`). */
const relative = (path: string): string => (path === '/' ? './' : path.replace(/^\/+/, ''))

const copy = (value: unknown, fallback: string): string => (typeof value === 'string' && value ? value : fallback)

function single(value: unknown): L1Node | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as L1Node) : null
}

/** The checkout page's record: the item as a product page shows it, plus the purchase's fields. */
function checkoutRecord(item: CatalogItem, ctx: CatalogDrawContext, dispatchNote: string, canBuy: boolean, blockedNote?: string): L1BindRecord {
  const base = catalogRecord(item, ctx)
  const { enquiry: _e, commission: _c, buy: _b, ...text } = base.text
  const buyable = canBuy && !isSold(item)
  return {
    text: {
      ...text,
      shipping: true,
      total: true,
      ...(dispatchNote ? { dispatch: dispatchNote } : {}),
      // [[BUG-363]] — in the builder, the owner reads WHY instead of the neutral wording.
      unavailable: !buyable && blockedNote ? blockedNote : !buyable,
      changed: false,
    },
    hrefs: { ...(base.hrefs.item ? { item: base.hrefs.item } : {}) },
    images: base.images,
  }
}

function regionNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale, 'en'], { type: 'region' })
  } catch {
    return null
  }
}

/** The order-complete page's record: every figure is the script's, so each bound node keeps its own copy. */
const COMPLETE_RECORD: L1BindRecord = {
  text: { order: true, total: true, name: true, confirming: true, confirmed: false },
  hrefs: {},
  images: {},
}

export function checkout({ config = {}, slots = {}, instanceId = 'checkout', edit = false, locale, catalog: data }: BehaviorProps = {}): string {
  const mode = config.mode === 'complete' || config.mode === 'cancelled' ? config.mode : 'checkout'
  const template = single(slots.page)
  const localeTag = locale?.locale ?? 'en-US'
  const controls: Record<string, L1ControlElement> = {
    message: { tag: 'span', attrs: { role: 'status', 'aria-live': 'polite', 'data-checkout-control': 'message' } },
  }
  const roots: string[] = [
    `${CHECKOUT_ROOT_ATTR}="${mode}"`,
    `data-checkout-locale="${escapeHtml(localeTag)}"`,
    // The edit channel ships no script and so names no endpoint.
    ...(edit ? [] : [`data-checkout-endpoint="${CHECKOUT_ENDPOINT}"`]),
  ]
  let nodes: L1Node[] = template ? [template] : []

  if (mode === 'checkout') {
    const item = data?.item ?? data?.items[0]
    const shipping = data?.shipping ?? { currency: 'USD', countries: [], dispatchNote: '' }
    const canBuy = data?.canBuy === true && shipping.countries.length > 0
    const ctx: CatalogDrawContext = {
      locale: localeTag,
      productPages: data?.productPages === true,
      canTakePayments: data?.canTakePayments === true,
      showSoldPrice: false,
    }
    // [[BUG-363]] — the builder's renders only: what the business has to set up
    // before this page can take an order. The root then says so too, so the
    // page's script asks for no quote and does not cover the sentence with its own.
    const blockers = canBuy ? [] : (data?.buyBlockers ?? [])
    const blockedNote = blockers.length > 0 ? buyBlockedNote(blockers, 'checkout') : undefined
    if (blockedNote) roots.push(`${CHECKOUT_BLOCKED_ATTR}="${blockers.join(' ')}"`)
    if (item && template) nodes = bindL1(template, checkoutRecord(item, ctx, shipping.dispatchNote, canBuy, blockedNote))
    const buyable = canBuy && item !== undefined && !isSold(item)
    const only = shipping.countries.length === 1
    // [[BUG-367]] — THE COUNTRY IS ASKED ONLY WHEN IT CHANGES THE PRICE. It is
    // asked before payment because shipping is priced per zone and the buyer is
    // shown the total first; when every country costs the same there is nothing
    // to choose, so the page draws no Ship to and Stripe's address form offers
    // every country shipped to (`orders.ts`'s `si
```

[elided — kept 5800 of 8419 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "design" packages/framework/src/modules/behavior.ts | head; grep…
<!-- xgd-tool name="Bash" id="toolu_01Gq29sVN9EVrLwLeJQG9d4N" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:02.040112+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"design\" packages/framework/src/modules/behavior.ts | head; grep -n \"export function renderL1Fragment\" -A40 packages/framework/src/l1/render.ts | head -60","description":"Check design availability to modules"}
```

**Result**

```
7098:export function renderL1Fragment(
7099-  nodes: L1Node[],
7100-  prefix = 'fc',
7101-  controls?: Readonly<Record<string, L1ControlElement>>,
7102-  opts: {
7103-    palette?: L1Palette
7104-    /** [[REQ-447]] — the site's design, as {@link L1RenderOptions.design}. */
7105-    design?: L1Design
7106-    edit?: boolean
7107-    /** REQ-420 — the unit a fragment's rhythm falls back to where the page declares none. */
7108-    rhythm?: L1RhythmUnit
7109-    /**
7110-     * REQ-633 — finished HTML for the fragment's own `slot` nodes, as
7111-     * {@link L1RenderOptions.mounts}: how a module places separately-rendered
7112-     * subtrees (one card per item) inside an L1 arrangement (the grid).
7113-     */
7114-    mounts?: Readonly<Record<string, string>>
7115-    /** [[REQ-647]] — a publish's delivery ladders, as {@link L1RenderOptions.delivery}. */
7116-    delivery?: ImageDeliveryManifest
7117-    /** [[REQ-648]] — the grid columns this fragment is drawn one of, as {@link RenderState.drawnIn}. */
7118-    drawnIn?: readonly { at: number; columns: number | null }[]
7119-  } = {},
7120-): L1FragmentResult {
7121-  const state: RenderState = {
7122-    n: 0,
7123-    rules: [],
7124-    prefix,
7125-    controls,
7126-    edit: opts.edit,
7127-    rhythm: opts.rhythm,
7128-    design: opts.design,
7129-    mounts: opts.mounts,
7130-    delivery: opts.delivery,
7131-    drawnIn: opts.drawnIn,
7132-  }
7133-  // REQ-116 — a fragment's addresses are rooted at the SUBTREE ARRAY, so they are
7134-  // relative to the mounted instance rather than to the document. The client
7135-  // reads which instance and which seam off the enclosing `data-fc-module` /
7136-  // `data-l1-slot`, so copy inside a behavior module's slot is addressable
7137-  // without the module having to know anything about the page it sits on.
7138-  const htmls = resolveL1Palette(resolveL1Design(nodes, opts.design), opts.palette).map(
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "slots" packages/site-schema/src/l1/design.ts | head; grep -rn "c…
<!-- xgd-tool name="Bash" id="toolu_01RFGPwPmod6ufL2qCPmBZzJ" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:10.909665+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"slots\" packages/site-schema/src/l1/design.ts | head; grep -rn \"checkoutPagePreset\" --include=*.ts packages apps | grep -v test | head","description":"Check slot design resolution and preset use"}
```

**Result**

```
1422: * sections take the design's defaults) or any subtree (a component's slots, a
(eval):1: no matches found: --include=*.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rn "checkoutPagePreset\|resolveL1Design(" packages apps tools --inc…
<!-- xgd-tool name="Bash" id="toolu_01Wyws3Qmubq5ffefrwhWj5t" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:13.864788+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rn \"checkoutPagePreset\\|resolveL1Design(\" packages apps tools --include='*.ts' | grep -v \"test\\|node_modules\" | head -20","description":"Find preset and design resolution callers"}
```

**Result**

```
packages/site-schema/src/l1/validate.ts:2138:  const doc = resolveL1Design(parsed.data, options.design)
packages/framework/src/l2/checkout.ts:102:export function checkoutPagePreset(mode: CheckoutPageMode, design?: L1Design): L1Node {
packages/framework/src/worker.ts:202:export { checkoutPagePreset } from './l2/checkout'
packages/framework/src/l1/email-render.ts:366:  const doc = resolveL1Palette(resolveL1Design(input, opts.design), opts.palette)
packages/framework/src/l1/render.ts:7001:  const doc = resolveL1Palette(resolveL1Design(input, opts.design, place), opts.palette)
packages/framework/src/l1/render.ts:7138:  const htmls = resolveL1Palette(resolveL1Design(nodes, opts.design), opts.palette).map(
tools/generate/src/render/render.ts:28:  checkoutPagePreset,
tools/generate/src/render/render.ts:622:        slots: { page: resolveL1Design(checkoutPagePreset(mode, site.design), site.design) },
tools/generate/src/cli/eval-builder.ts:399:    const audit = auditPage(page.l1 ? { ...page, l1: resolveL1Design(page.l1 as Untyped, siteJson.design, l1PlaceOf(page)) } : page, siteJson.palette)
tools/generate/src/cli/edit.ts:477:  return { ...p, l1: resolveL1Design(p.l1, base.design as L1Design | undefined, l1PlaceOf(p as { kind?: unknown })) }
tools/generate/src/cli/ai/toolbox-core.ts:573:      const audit = auditPage(page.l1 ? { ...page, l1: resolveL1Design(page.l1, config.design, l1PlaceOf(page)) } : page, config.palette)
tools/generate/src/store/assemble.ts:158:      ...(page.l1 ? { l1: resolveL1Design(page.l1, design, l1PlaceOf(page)) } : {}),
tools/generate/src/store/assemble.ts:159:      modules: page.modules.map((m) => (m.slots ? { ...m, slots: resolveL1Design(m.slots, design) } : m)),
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "interface BehaviorProps" -A40 packages/framework/src/modules/beh…
<!-- xgd-tool name="Bash" id="toolu_01R4uYj8sQwFngABURdSXZMp" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:21.475384+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"interface BehaviorProps\" -A40 packages/framework/src/modules/behavior.ts; grep -rn \"catalog: \\|catalog,\" packages/framework/src/l1/render.ts packages/framework/src/render*.ts 2>/dev/null | head","description":"Read BehaviorProps definition"}
```

**Result**

```
320:export interface BehaviorProps {
321-  /** Behavioural, data-only config (never aesthetics — DOC-25 §2). */
322-  config?: Record<string, unknown>
323-  /** Named L1 presentation slots, keyed as declared in {@link BehaviorMeta.slots}. */
324-  slots?: Record<string, BehaviorSlotValue | undefined>
325-  /** Namespaces this instance's slot classes so two on a page never collide. */
326-  instanceId?: string
327-  /**
328-   * WHICH PAGE THIS INSTANCE SITS ON ([[BUG-93]]).
329-   *
330-   * An instance id is unique on ONE page — the edit path refuses a collision
331-   * within a page and permits the same name on the next one, which is the right
332-   * rule. So an id alone does not name a module instance in a SITE, and a
333-   * module that puts a handle on the wire for a server to resolve needs both
334-   * halves or the server has to guess. `contact-form` is the one that does; the
335-   * prop is here rather than in its config because the renderer is the only
336-   * thing that knows the answer, and it knows it for every module alike.
337-   *
338-   * Optional, so a module that never addresses itself can ignore it and a test
339-   * may omit it. A module that DOES emit a handle must treat its absence as a
340-   * handle that will not resolve rather than inventing a page.
341-   */
342-  pageId?: string
343-  /** REQ-116 — render the edit channel: the module's own behaviour switched off. */
344-  edit?: boolean
345-  /**
346-   * REQ-151 — the site's settled locale identity (country, locale, currency,
347-   * timezone, direction), handed down by the renderer.
348-   *
349-   * Optional so a module that never formats anything can ignore it and a test
350-   * can omit it. A module that DOES format money or a date must read it rather
351-   * than assume: `Intl.NumberFormat('en-IE', …EUR)` gives `€49.99` where
352-   * `('de-DE', …EUR)` gives `49,99 €`, and a module guessing its own answer is
353-   * how two modules on one page come to disagree about the same business.
354-   */
355-  locale?: ResolvedLocale
356-  /**
357-   * [[REQ-200]] — the site's own CAPABILITY DECLARATIONS, handed down by the
358-   * renderer exactly as {@link locale} is.
359-   *
360-   * Some behaviours are a feature of the *site* rather than of the page they sit
(eval):1: no matches found: packages/framework/src/render*.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rn "capabilities: \|locale: opts\|locale: state\|catalog: " package…
<!-- xgd-tool name="Bash" id="toolu_018Fp58A4FUfLX4o8qyHXfqX" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:26.936753+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rn \"capabilities: \\|locale: opts\\|locale: state\\|catalog: \" packages/framework/src --include='*.ts' | grep -v test | head","description":"Find where module props are assembled"}
```

**Result**

```
packages/framework/src/l2/presets.ts:55:  catalog: (config, context) =>
packages/framework/src/modules/catalog.ts:44:export const catalog: ReadonlyMap<string, BehaviorMeta> = new Map(
packages/framework/src/modules/catalog.ts:57:      `Module not found in catalog: '${id}'. Known modules: ${[...catalog.keys()].join(', ')}.`,
packages/framework/src/modules/catalog.ts:68:    throw new Error(`Module not found in catalog: '${id}' v${version}. Known modules: ${known}.`)
packages/framework/src/modules/registry.ts:34:  catalog: productCatalog,
packages/framework/src/modules/registry.ts:64:    throw new Error(`Module not found in catalog: '${id}' v${version}. Known modules: ${known}.`)
packages/framework/src/modules/checkout/component.ts:84:export function checkout({ config = {}, slots = {}, instanceId = 'checkout', edit = false, locale, catalog: data }: BehaviorProps = {}): string {
packages/framework/src/modules/product-catalog/component.ts:45:  catalog: data,
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rn "pageId" packages/framework/src tools/generate/src apps --includ…
<!-- xgd-tool name="Bash" id="toolu_016w8L89zdhUwDNaEZQHSwSL" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:29.730341+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rn \"pageId\" packages/framework/src tools/generate/src apps --include='*.ts' -l | grep -v \"test\\|node_modules\" | head; ","description":"Find module invocation sites via pageId"}
```

**Result**

```
packages/framework/src/modules/behavior.ts
packages/framework/src/modules/contact-form/component.ts
packages/framework/src/modules/contact-form/fields.ts
tools/generate/src/render/render.ts
tools/generate/src/cli/eval-builder.ts
tools/generate/src/cli/edit.ts
tools/generate/src/cli/index.ts
tools/generate/src/cli/ai/account-core.ts
tools/generate/src/cli/ai/show-core.ts
tools/generate/src/cli/ai/toolbox-core.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "pageId\|catalog: \|locale,\|capabilities" tools/generate/src/ren…
<!-- xgd-tool name="Bash" id="toolu_014CPStCM6AYsmu6KUZSj3eD" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:33.667137+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"pageId\\|catalog: \\|locale,\\|capabilities\" tools/generate/src/render/render.ts | head -30; sed -n 600,640p tools/generate/src/render/render.ts","description":"Read module mounting in generator render"}
```

**Result**

```
232:  capabilities: SiteCapabilities,
243:    // behavior that formats money or a date needs the locale, the currency and
264:      pageId: page.id,
266:      locale,
267:      capabilities,
427:  const capabilities = site.config.capabilities ?? {}
428:  const rendered = renderModuleInstances(page, resolveModule, edit, locale, capabilities, variant.catalog)
503:    !edit && getModuleClientJs() ? '<script type="module" src="./capabilities.js"></script>' : '',
509:  // REQ-151 — `lang`/`dir` from the site's resolved locale, never a literal.
584:function catalogPropsFor(site: Site, catalog: SiteCatalog | undefined, builder: boolean): CatalogProps {
714:  /** Relative path → its UTF-8 content (`theme.css`, `capabilities.js`, `*.html`). */
754:  // capabilities.js = every catalog behavior's vetted client behaviour (REQ-85),
761:  if (clientJs) files.set('capabilities.js', `${clientJs}\n`)
808:            catalog: { ...catalogBase, page: 1 },
825:          catalog: { ...catalogBase, page: n },
847:          catalog: { ...catalogProps, item },
871:          catalog: { ...catalogProps, item },
888:          catalog: catalogProps,
}

/**
 * [[REQ-643]] — the page a checkout mode is drawn from: the site's own page
 * holding a `checkout` instance in that mode, else the framework's default — a
 * page of one `checkout` instance whose slot is the L2 preset, resolved in the
 * site's design exactly as a stored page's slots are when the site is loaded.
 */
function checkoutTemplate(site: Site, mode: CheckoutPageMode): Page {
  const own = site.pages.find((p) => isServedOrTemplate(p) && checkoutModeOf(p) === mode)
  if (own) return own
  const id = mode === 'checkout' ? 'checkout' : mode === 'complete' ? ORDER_COMPLETE_SLUG : ORDER_CANCELLED_SLUG
  return {
    id,
    slug: id,
    title: mode === 'checkout' ? 'Checkout' : mode === 'complete' ? 'Thank you' : 'Checkout cancelled',
    modules: [
      {
        id: `checkout-${mode}`,
        type: 'checkout',
        version: 1,
        config: { mode },
        slots: { page: resolveL1Design(checkoutPagePreset(mode, site.design), site.design) },
      },
    ],
  } as unknown as Page
}

function isServedOrTemplate(page: Page): boolean {
  return (page.kind === undefined || page.kind === 'web') && !page.alternative
}

/**
 * REQ-633 — how many static pages a page's grids fill: the most any one of its
 * `catalog` grids needs. A page with no grid is one page.
 */
function gridPageCount(page: Page, props: CatalogProps, locale: string): number {
  let count = 1
  for (const m of page.modules) {
    if (m.type !== 'catalog' || m.config?.mode === 'product') continue
    const config = (m.config ?? {}) as Record<string, unknown>
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 222,290p tools/generate/src/render/render.ts; grep -rn "renderModu…
<!-- xgd-tool name="Bash" id="toolu_01QX6EyvbhEH7YjbvVvJaR9Z" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:50:42.088076+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 222,290p tools/generate/src/render/render.ts; grep -rn \"renderModuleInstances(\" --include='*.ts' tools apps packages | grep -v node_modules | head","description":"Read renderModuleInstances and its callers"}
```

**Result**

```
 * the framework pivot (REQ-79/REQ-84) layout is owned by the L1 substrate, so a
 * page here is a plain vertical stack of **behavior-module** bands — the old
 * background/layer/motion/row/overlay-header composition is gone (its helpers
 * were deleted with the semantic layout modules).
 */
function renderModuleInstances(
  page: Page,
  resolveModule: ModuleResolver,
  edit: boolean,
  locale: ResolvedLocale,
  capabilities: SiteCapabilities,
  catalog?: CatalogProps,
): string[] {
  const parts: string[] = []
  for (const m of page.modules) {
    const { Component } = resolveModule(m.type, m.version)
    // REQ-116 — `edit` reaches the module as a prop rather than being patched out
    // of its markup afterwards. Only the module knows which of its attributes
    // carry behaviour (an endpoint, a submit verb) and which are presentation, so
    // only the module can say what it looks like with that behaviour switched off.
    // REQ-151 — the site's resolved locale reaches the module as a prop. A
    // behavior that formats money or a date needs the locale, the currency and
    // the zone, and the alternative to handing it over is every such module
    // re-deriving its own — which is how two modules on one page end up
    // disagreeing about what country the business is in.
    // [[REQ-200]] — the site's own capability declarations reach the module the
    // same way. A behaviour that is a feature of the SITE rather than of the page
    // (`account-chrome` on a site with accounts) is gated by what the site
    // declares, and the gate belongs to the module: only it knows what it should
    // do when its capability is absent, and the renderer must not grow a branch
    // naming one.
    // [[BUG-93]] — WHICH PAGE THIS INSTANCE SITS ON, handed down beside its id.
    // A component name is unique on one page and the same name is legal on the
    // next, so an id alone does not name a form in a SITE. A module that puts a
    // handle on the wire has to say both halves or the receiver resolves the
    // first match anywhere — which is precisely what silenced the whitepapers
    // form. The renderer is the only thing that knows the page, so it is the
    // only thing that can supply it.
    const rendered = Component({
      config: m.config,
      slots: m.slots,
      instanceId: m.id,
      pageId: page.id,
      edit,
      locale,
      capabilities,
      // REQ-633 — the inventory: the catalog draws it, and the contact form
      // prefills from a link naming one of its items.
      // [[REQ-643]] — and the checkout draws its item and the business's shipping from it.
      ...((m.type === 'catalog' || m.type === 'contact-form' || m.type === 'checkout') && catalog ? { catalog } : {}),
    })
    // Stamp the builder edit hook onto the module root so the web editor's preview can
    // target this instance.
    parts.push(stampEditHook(rendered, m.id, m.type))
  }
  return parts
}

/**
 * [[REQ-335]] — read the drawings this page asked to have placed in it.
 *
 * Returns `undefined` where there is nothing to hand the renderer, which is the
 * difference between "this render has no drawings" and "this render has an empty
 * map": both behave identically, and the first is the one that costs nothing.
 *
 * ONE UNREADABLE DRAWING IS NOT A BROKEN PAGE. A missing asset, a store that throws,
 * bytes that are not valid UTF-8: each leaves that one entry out of the map, and the
 * node it belonged to renders as the `<img>` it always was. The alternative — failing
 * the page — would mean a deleted asset takes a site off the air, which is a worse
tools/generate/src/render/render.ts:227:function renderModuleInstances(
tools/generate/src/render/render.ts:428:  const rendered = renderModuleInstances(page, resolveModule, edit, locale, capabilities, variant.catalog)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls tests | grep -i "BUG-367"; sed -n 1,147p "tests/$(ls tests | grep -i '…
<!-- xgd-tool name="Bash" id="toolu_01T6RZ9wSBdC3FM24wzGqPLP" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:05.523933+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls tests | grep -i \"BUG-367\"; sed -n 1,147p \"tests/$(ls tests | grep -i 'BUG-367_checkout_buttons')\"","description":"Read BUG-367 chromium UAT"}
```

**Result**

```
test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts
test_UAT_FC_BUG-367_checkout_page.test.ts
test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
/**
 * [[BUG-367]] — the checkout page's buttons, as real Chromium lays them out.
 *
 * The page is the site generator's own (`renderSiteFiles`), served whole, with
 * its script held back so the page's drawn state is what is measured: a
 * disabled Continue must LOOK disabled, a button's label is centred in its box,
 * and the actions sit right, sized to their labels, from a tablet's width up,
 * and stack full width on a phone, Continue on top.
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { chromiumAvailable } from '../tools/generate/src/cli/capture'
import { browserLaunchOptions } from '../tools/generate/src/cli/capture/launch-args'
import { renderSiteFiles, type SiteCatalog } from '../tools/generate/src/render'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { l1DesignVariables, type L1Design } from '../packages/site-schema/src/index'
import { catalogItems, catalogSeed } from './support/catalog-site'

const itBrowser = it.runIf(await chromiumAvailable())

const ORIGIN = 'http://fixture.test'
const SHIPPING = { currency: 'EUR', dispatchNote: 'Ships within 3 working days', countries: [{ code: 'FR', rate: 500 }, { code: 'GB', rate: 800 }] }

type Page = import('playwright').Page

/**
 * A module's fragment sizes itself from the site's design variables, which a
 * designed site's page declares at `:root`. The fixture site has no L1 design,
 * so the page is served with the variables a plain one declares.
 */
const DESIGN = { layout: { contentWidth: 720, gutter: 16 }, space: { scale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } } } as unknown as L1Design
const ROOT_VARS = `<style>:root { ${l1DesignVariables(DESIGN)
  .map(({ name, length }) => `${name}: ${length as number}px`)
  .join('; ')} }</style>`

async function siteFiles(): Promise<Map<string, string>> {
  const seed = catalogSeed()
  const store = memorySiteStore()
  store.seed(seed.slug, seed)
  const loaded = (await store.loadDraft(seed.slug))!.result
  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))
  const catalog: SiteCatalog = { items: catalogItems(), canTakePayments: true, shipping: SHIPPING }
  return new Map((await renderSiteFiles(loaded.value, { catalog })).files)
}

/** Playwright is tools/generate's dependency; one browser per page (see BUG-259's suite). */
async function withPage<T>(width: number, run: (page: Page) => Promise<T>): Promise<T> {
  const require = createRequire(path.resolve(__dirname, '../tools/generate/package.json'))
  const mod = (await import(/* @vite-ignore */ pathToFileURL(require.resolve('playwright')).href)) as typeof import('playwright')
  const browser = await mod.chromium.launch(browserLaunchOptions())
  try {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
    const files = await siteFiles()
    await page.route(`${ORIGIN}/**`, (route) => {
      const file = new URL(route.request().url()).pathname.replace(/^\/+/, '')
      if (file.endsWith('.js')) return route.abort()
      const found = files.get(file) ?? files.get(`${file}.html`)
      const body = found && !file.endsWith('.css') ? found.replace('</head>', `${ROOT_VARS}</head>`) : found
      if (body === undefined) return route.fulfill({ status: 404, body: '' })
      const contentType = file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html'
      return route.fulfill({ contentType, body })
    })
    await page.goto(`${ORIGIN}/checkout/brass-lamp`)
    return await run(page)
  } finally {
    await browser.close()
  }
}

type Box = { x: number; y: number; width: number; height: number }

describe('BUG-367 — the checkout page buttons in Chromium', () => {
  itBrowser('test_UAT_FC_BUG-367_a_disabled_continue_looks_disabled', async () => {
    await withPage(1024, async (page) => {
      const button = page.locator('button[data-checkout-control="continue"]')
      expect(await button.isDisabled()).toBe(true)
      const style = () => button.evaluate((b) => ({ opacity: getComputedStyle(b).opacity, cursor: getComputedStyle(b).cursor }))
      const disabled = await style()
      await button.evaluate((b) => b.removeAttribute('disabled'))
      const enabled = await style()
      expect(disabled.cursor).toBe('not-allowed')
      expect(Number(disabled.opacity)).toBeLessThan(Number(enabled.opacity))
      expect(enabled.cursor).not.toBe('not-allowed')
    })
  })

  itBrowser('test_UAT_FC_BUG-367_a_button_label_is_centred_in_its_box', async () => {
    await withPage(375, async (page) => {
      // At phone width Continue is full width, so a left-aligned label would show.
      const centre = await page.locator('button[data-checkout-control="continue"]').evaluate((b) => {
        const box = b.getBoundingClientRect()
        const range = document.createRange()
        range.selectNodeContents(b)
        const label = range.getBoundingClientRect()
        return { dx: label.x + label.width / 2 - (box.x + box.width / 2), dy: label.y + label.height / 2 - (box.y + box.height / 2) }
      })
      expect(Math.abs(centre.dx)).toBeLessThanOrEqual(1)
      expect(Math.abs(centre.dy)).toBeLessThanOrEqual(1)
    })
  })

  itBrowser('test_UAT_FC_BUG-367_from_tablet_up_actions_sit_right_sized_to_their_labels', async () => {
    await withPage(1024, async (page) => {
      const m = await page.evaluate(() => {
        const visible = (el: Element) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().w
```

[elided — kept 5800 of 7905 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git show 1f69cf7322 -- apps/control-app/src/checkout-intake.ts apps/contr…
<!-- xgd-tool name="Bash" id="toolu_01L3URrdBKC7HviFBc7dRuZ4" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:12.865244+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git show 1f69cf7322 -- apps/control-app/src/checkout-intake.ts apps/control-app/src/orders.ts apps/control-app/src/router.ts apps/public-site/src/checkout.ts packages/framework/src/modules/checkout/client.js | sed -n 1,400p","description":"Show BUG-367 server-side diff"}
```

**Result**

```
commit 1f69cf7322c4baa96ab1d5b92aeee1428aa66617
Author: Martin Westhead <martin-github@westhead.me>
Date:   Thu Nov 5 17:20:29 2026 -0800

    fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
    
    - control-app preview routes POST draft api/checkout/<verb> through
      public-site's handleCheckout (identified) over the same checkoutIntake;
      start in a preview answers an owner-only notice and writes no order.
    - checkout script: a non-JSON or failed answer names the failure
      (no answer / unreachable) instead of "This can't be bought right now".
    - single-rate shops: no Ship to question; quote carries the one rate and
      Stripe offers every shipping country.
    - default ship-to prompt "Please select a region for delivery"; Cancel
      control and cancelLabel; Continue starts disabled until a quote.
    - renderer: disabled controls dimmed with not-allowed cursor and no hover;
      button labels centred. Checkout actions right-aligned, label-sized from
      768px, stacked full width (Continue on top) below.
    - Plan panel empty message reads "...once it has been agreed." (REQ-657 pin).
    - module-assets.ts regenerated (also picks up BUG-363's blocked guard,
      which the committed bundle lacked).
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

diff --git a/apps/control-app/src/checkout-intake.ts b/apps/control-app/src/checkout-intake.ts
index 6745a9a1c1..5ec439c8b7 100644
--- a/apps/control-app/src/checkout-intake.ts
+++ b/apps/control-app/src/checkout-intake.ts
@@ -63,3 +63,33 @@ export function checkoutIntake(env: OrdersEnv, options: CheckoutIntakeOptions =
       answer(async () => ({ order: await checkoutStatus(env, { siteKey, orderId: field(body, 'order'), locale: field(body, 'locale') }) })),
   }
 }
+
+/**
+ * [[BUG-367]] — what Continue to payment answers in the builder's draft preview.
+ * Only the owner sees the draft, so this speaks to them.
+ */
+export const PREVIEW_PAYMENT_NOTICE = 'Payment opens on your published site. Only you see this.'
+
+/**
+ * [[BUG-367]] — the checkout as the builder's draft preview reaches it: the same
+ * `quote` the published site's binding calls, so the draft shows the current
+ * price, the Ship to countries, the rate and the total exactly as published.
+ *
+ * THE DRAFT NEVER TAKES MONEY. `start` re-reads the quote and answers the owner
+ * the notice above with it; it holds no stock, writes no order and opens no
+ * Stripe session. `cancel` and `status` are an order's, and the draft has none.
+ */
+export function previewCheckoutIntake(env: OrdersEnv, options: CheckoutIntakeOptions = {}) {
+  const live = checkoutIntake(env, options)
+  const noOrder = (): Promise<CheckoutAnswer> => Promise.resolve({ status: 404, body: { error: 'Orders open on your published site.' } })
+  return {
+    quote: live.quote,
+    start: async (siteKey: string, _siteUrl: string, body: unknown): Promise<CheckoutAnswer> => {
+      const quoted = await live.quote(siteKey, body)
+      if (quoted.status !== 200) return quoted
+      return { status: 200, body: { notice: PREVIEW_PAYMENT_NOTICE, ...quoted.body } }
+    },
+    cancel: noOrder,
+    status: noOrder,
+  }
+}
diff --git a/apps/control-app/src/orders.ts b/apps/control-app/src/orders.ts
index 6cd9414c02..b037c4fcb8 100644
--- a/apps/control-app/src/orders.ts
+++ b/apps/control-app/src/orders.ts
@@ -250,6 +250,12 @@ export interface CheckoutQuote {
   countries: Array<{ code: string; name: string; rate: number; display: string }>
   /** The chosen country, when it is one the business ships to. */
   country: string | null
+  /**
+   * [[BUG-367]] — every country the business ships to costs the same, so the
+   * page asks no country: the one rate is the shipping, and Stripe's address
+   * form offers every one of `countries`.
+   */
+  singleRate: boolean
   shipping: number | null
   subtotal: number
   total: number | null
@@ -354,7 +360,12 @@ async function quoteFor(
     .flatMap((z) => z.countries.map((code) => ({ code, name: countryName(code, locale), rate: z.rate, display: money(z.rate) })))
     .sort((a, b) => a.name.localeCompare(b.name, locale))
   const wanted = String(input.country ?? '').trim().toUpperCase()
-  const zone = shipping.zones.find((z) => z.countries.includes(wanted)) ?? null
+  const shipsTo = shipping.zones.filter((z) => z.countries.length > 0)
+  const singleRate = shipsTo.length > 0 && shipsTo.every((z) => z.rate === shipsTo[0].rate)
+  const chosen = shipping.zones.find((z) => z.countries.includes(wanted)) ?? null
+  // [[BUG-367]] — with one rate there is nothing to choose: the first zone stands
+  // for them all until Stripe's address names the country.
+  const zone = chosen ?? (singleRate ? shipsTo[0] : null)
   const subtotal = priced.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0)
   const shippingAmount = zone?.rate ?? null
   const total = shippingAmount === null ? null : subtotal + shippingAmount
@@ -370,7 +381,8 @@ async function quoteFor(
       display: { unitAmount: money(l.unitAmount), amount: money(l.unitAmount * l.quantity) },
     })),
     countries,
-    country: zone ? wanted : null,
+    country: chosen ? wanted : null,
+    singleRate,
     shipping: shippingAmount,
     subtotal,
     total,
@@ -444,7 +456,7 @@ export async function startCheckout(
       env.DB.prepare(
         'INSERT INTO orders (id, business_id, number, mode, status, currency, subtotal, shipping_amount, total, ship_country, shipping_zone, created_at, updated_at) ' +
           `SELECT ?1, ?2, COALESCE(MAX(number), ${FIRST_ORDER_NUMBER - 1}) + 1, ?3, 'pending', ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10 FROM orders WHERE business_id = ?2`,
-      ).bind(orderId, businessId, mode, currency, quote.subto
```

[elided — kept 5800 of 17118 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "preview\|returnBase\|success_url\|cancel_url\|PREVIEW" apps/cont…
<!-- xgd-tool name="Bash" id="toolu_019y8PXYUoE9j1ugwntL1cN7" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:14.276596+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"preview\\|returnBase\\|success_url\\|cancel_url\\|PREVIEW\" apps/control-app/src/orders.ts | head -40; grep -n \"startCheckout\" -r apps packages --include='*.ts' | grep -v node_modules | head","description":"Find startCheckout preview branch and return URLs"}
```

**Result**

```
apps/control-app/src/checkout-intake.ts:17:import { cancelCheckout, CheckoutBlockedError, checkoutStatus, quoteCheckout, startCheckout, type OrdersEnv } from './orders'
apps/control-app/src/checkout-intake.ts:54:        ...(await startCheckout(
apps/control-app/src/orders.ts:13: * countries and rate, and {@link startCheckout} re-reads every one of them from
apps/control-app/src/orders.ts:428:export async function startCheckout(
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,66p apps/control-app/src/checkout-intake.ts; grep -n "preview\[\…
<!-- xgd-tool name="Bash" id="toolu_017spoiDV7NCipjuQEciTHH3" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:21.972385+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,66p apps/control-app/src/checkout-intake.ts; grep -n \"preview\\[\\|const preview =\\|channel ===\\|publicSiteUrl(site\" apps/control-app/src/router.ts | sed -n 1,40p","description":"Read checkout intake and preview route vars"}
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

6511:        url: publicSiteUrl(site),
8483:    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
8491:      const site = decodeURIComponent(preview[1])
8492:      const channel = decodeURIComponent(preview[2])
8525:      if (method === 'POST' && (preview[3] ?? '/') === '/api/lead') {
8577:      const checkoutPath = method === 'POST' ? checkoutVerb((preview[3] ?? '/').replace(/^\/+/, '')) : null
8585:          siteUrl: publicSiteUrl(site, '/'),
8636:        method === 'GET' && channel === 'draft'
8637:          ? parseDownloadPath((preview[3] ?? '/').replace(/^\/+/, ''))
8660:      if (channel === 'published') {
8667:        return Response.redirect(publicSiteUrl(site, preview[3] ?? '/'), 302)
8682:        await servePreview(store, site, channel as PreviewChannel, preview[3] ?? '/', platformFonts),
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "checkoutIntake" -B3 -A12 apps/control-app/src/worker.ts | head -…
<!-- xgd-tool name="Bash" id="toolu_01UJbZ2kuLktjkGGtsJRtQ3s" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:26.174699+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"checkoutIntake\" -B3 -A12 apps/control-app/src/worker.ts | head -50; sed -n 8483,8500p apps/control-app/src/router.ts","description":"Read published checkout binding wrapper"}
```

**Result**

```
14-import { compCapture, runCompCaptureJob, type CompCaptureParams, type CompCaptureSteps } from './comps'
15-import { captureLead, type LeadOutcome, type LeadSubmission } from './lead'
16-import { openGate, takeAsset, type GatedArtifact, type GatePage } from './gate'
17:import { checkoutIntake, type CheckoutAnswer } from './checkout-intake'
18-
19-/**
20- * THE MODULE WRANGLER LOADS — every entrypoint this Worker exposes, in one place.
21- *
22- * WHY IT IS NOT `index.ts` ([[REQ-223]]). `cloudflare:workers` is a workerd
23- * BUILT-IN: there is no package to install and nothing for Node to resolve, so
24- * any module importing it can only be loaded inside the runtime. `index.ts` is
25- * imported by roughly sixty suites in the node project — the ones that check the
26- * Access gate's ordering, the router's shape, the deployment's configuration —
27- * and putting the import there would have made every one of them fail to load,
28- * for a class none of them exercises.
29- *
--
132- */
133-export class ShopCheckout extends WorkerEntrypoint<Env> {
134-  private intake() {
135:    return checkoutIntake(this.env as never, {
136-      rebuild: (businessId, itemId) => {
137-        this.ctx.waitUntil(rebuildCatalogFor(this.env as never, { businessId }, itemId))
138-        return Promise.resolve()
139-      },
140-    })
141-  }
142-
143-  async quote(siteKey: string, body: Record<string, unknown>): Promise<CheckoutAnswer> {
144-    return this.intake().quote(siteKey, body)
145-  }
146-
147-  async start(siteKey: string, siteUrl: string, body: Record<string, unknown>): Promise<CheckoutAnswer> {
    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
    if (preview) {
      // THE FIRST SEGMENT IS THE SITE'S KEY ([[REQ-236]]). It was the slug, and
      // readability bought nothing: this URL is an iframe `src` and an
      // open-in-new-tab the operator looks at rather than shares, it is already
      // business-scoped by `setBusinessScope`, and every store verb behind it
      // now takes the key. What it cost was a lookup on every preview byte and a
      // name that moved when the business was renamed.
      const site = decodeURIComponent(preview[1])
      const channel = decodeURIComponent(preview[2])

      /**
       * POST /preview/<siteKey>/draft/api/lead — the preview submits for real
       * ([[BUG-78]]).
       *
       * WHY THIS EXISTS AT ALL. A rendered form's `action` is root-relative, so
       * it resolves against whichever host served the document. Published, that
       * host is `public-site` and the endpoint is there. In the preview it is
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "rebuildCatalogFor\|waitUntil" apps/control-app/src/router.ts | h…
<!-- xgd-tool name="Bash" id="toolu_01DJqxfBrbgXbc6AGf7EPUhE" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:31.875572+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"rebuildCatalogFor\\|waitUntil\" apps/control-app/src/router.ts | head; grep -n \"^async function routeUncached\" -A12 apps/control-app/src/router.ts","description":"Check router access to rebuild and waitUntil"}
```

**Result**

```
1444:   * cut off with the ~30 s `ctx.waitUntil` keeps an isolate after its response.
3177:export async function rebuildCatalogFor(env: RouterEnv, scope: Scope, itemId: string, fetchImpl?: typeof fetch): Promise<void> {
3290:  waitUntil(promise: Promise<unknown>): void
4040:        await rebuildCatalogFor(env, scoped, 'handoff')
4170:      ...(ctx ? { waitUntil: (pending: Promise<unknown>) => ctx.waitUntil(pending) } : {}),
6844:          ctx?.waitUntil(compCapturesSettled())
6965:          catalogChanged: () => rebuildCatalogFor(env, requireScope(), 'import'),
6967:        itemChanged: (itemId) => rebuildCatalogFor(env, requireScope(), itemId, deps.fetch),
6970:        ...(ctx ? { waitUntil: (pending: Promise<unknown>) => ctx.waitUntil(pending) } : {}),
7012:          const rebuild = rebuildCatalogFor(env, { businessId }, 'payments', deps.fetch)
3335:async function routeUncached(
3336-  request: Request,
3337-  env: RouterEnv,
3338-  scope: Scope | null,
3339-  deps: RouterDeps = {},
3340-  ctx?: RouteContext,
3341-): Promise<Response> {
3342-  const url = new URL(request.url)
3343-  // THE BUSINESS PREFIX IS STRIPPED ONCE, HERE, and the route table below is
3344-  // untouched by it. Every route matches on `p`, so one rewrite at the top scopes
3345-  // all of them — including `/preview/<siteKey>/<channel>/…`, whose relative
3346-  // sub-resources inherit the prefix from the document that referenced them,
3347-  // which is the property `scope.ts` chose a path over a query string for.
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 3348,3375p apps/control-app/src/router.ts; grep -n "deps.fetch\|fe…
<!-- xgd-tool name="Bash" id="toolu_01JxCAbeAMXFWsMFAKsb65sD" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:35.655040+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 3348,3375p apps/control-app/src/router.ts; grep -n \"deps.fetch\\|fetch?:\" apps/control-app/src/router.ts | sed -n 1,8p","description":"Read business prefix stripping"}
```

**Result**

```
  //
  // The id is DISCARDED here rather than re-read: `index.ts` already resolved and
  // authorised it. Reading it a second time would be a second answer to "which
  // business", and the whole point of the resolver is that there is one.
  const p = splitBusinessPrefix(url.pathname).path
  const method = request.method

  // ONE SCRUBBER FOR THE WHOLE TABLE (REQ-146 AC4). It was built per catch block,
  // which is three declarations of the same thing and, more to the point, three
  // places for the next route to forget one. Hoisting it makes "every `error:`
  // value out of this table is `scrub(...)`" a rule with a single subject —
  // which is the rule the boundary UAT actually checks for.
  const scrub = redactor(secretsOf(env))

  /**
   * The platform font mirror this deployment previews against ([[REQ-312]],
   * `COMMENT-3711`). Resolved once, beside the other injected seams, so the two
   * snapshot roots below ask the same reader — `??` and not `||`, because `null`
   * from a deps entry is the deliberate *"this deployment has no mirror"* and a
   * falsy test would hand it the binding instead.
   */
  const platformFonts = platformFontsFor(env, deps)

  /**
   * The corpus the editor's font control browses and a chosen family is
   * resolved against ([[REQ-314]]).
   *
   * INJECTED BESIDE {@link platformFonts} AND FOR THE SAME REASON, which is the
1162:              send: deps.sendEmail ?? mailerFor(env, { fetch: deps.fetch }),
1685:  fetch?: typeof fetch
3147:  return deps.inventory ? deps.inventory(env) : shopInventory(env, deps.fetch)
5678:          send: deps.sendEmail ?? mailerFor(env, { fetch: deps.fetch }),
5743:            send: deps.sendEmail ?? mailerFor(env, { fetch: deps.fetch }),
6964:          fetch: deps.fetch,
6967:        itemChanged: (itemId) => rebuildCatalogFor(env, requireScope(), itemId, deps.fetch),
6968:        fetch: deps.fetch,
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "it(\|describe(\|NOTICE\|notice\|stripe\|fetch" tests/test_UAT_FC…
<!-- xgd-tool name="Bash" id="toolu_01SXp5PJdV9PZc83stgZAj2D" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:41.704324+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"it(\\|describe(\\|NOTICE\\|notice\\|stripe\\|fetch\" tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts | head -60","description":"Outline BUG-367 workers UAT"}
```

**Result**

```
7:import { checkoutIntake, PREVIEW_PAYMENT_NOTICE } from '../apps/control-app/src/checkout-intake'
25: * through the real webhook. Stripe is the external boundary, faked at fetch.
46:    if (url.host !== 'connect.stripe.com' && url.host !== 'api.stripe.com') return new Response('not stripe', { status: 404 })
49:    calls.push({ method: request.method, path: url.pathname, account: request.headers.get('stripe-account'), form })
53:      return account ? reply(200, { stripe_user_id: account, livemode: false }) : reply(400, { error: 'invalid_grant' })
55:    if (url.pathname === '/oauth/deauthorize') return reply(200, { stripe_user_id: form.get('stripe_user_id') })
60:      sessions.set(id, { status: 'open', form, account: request.headers.get('stripe-account') })
61:      return reply(200, { id, object: 'checkout.session', status: 'open', url: `https://checkout.stripe.com/c/pay/${id}` })
76:    fetch: handler as typeof fetch,
100:    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
104:    STRIPE_CONNECT_REDIRECT_URI: 'https://app.example/api/stripe/connect/return',
112:  const res = await controlApp.fetch(new Request(`https://app.example${path}`, { redirect: 'manual', ...init }), controlEnv(tenant), ctx as unknown as ExecutionContext)
154:  const res = await publicSite.fetch(
178:  return call(shop.tenant, '/api/stripe/webhook/test', { method: 'POST', headers: { 'stripe-signature': signature, 'content-type': 'application/json' }, body })
188:  stripe: Stripe
191:async function connect(tenant: string, stripe: Stripe, accountId: string): Promise<void> {
192:  const code = stripe.account(accountId)
196:  expect((await asOwner(tenant, 'GET', `/api/stripe/connect/return?code=${code}&state=${encodeURIComponent(state)}`, undefined, false)).status).toBe(302)
206:async function aShop(stripe: Stripe, options: { connected?: boolean; shipping?: boolean; zones?: typeof ZONES } = {}): Promise<Shop> {
229:  if (options.connected !== false) await connect(tenant, stripe, accountId)
232:  return { tenant, site, accountId, lampId: lamp.id, stripe }
299:describe('BUG-367 — the builder draft checkout', () => {
300:  it('test_UAT_FC_BUG-367_draft_quote_answers_like_the_published_site', async () => {
301:    const stripe = fakeStripe()
302:    vi.stubGlobal('fetch', stripe.fetch)
303:    const shop = await aShop(stripe)
321:  it('test_UAT_FC_BUG-367_draft_start_tells_the_owner_and_takes_no_money', async () => {
322:    const stripe = fakeStripe()
323:    vi.stubGlobal('fetch', stripe.fetch)
324:    const shop = await aShop(stripe)
326:    const sessionsBefore = stripe.sessionCalls().length
331:    expect(started.body!.notice).toBe('Payment opens on your published site. Only you see this.')
332:    expect(started.body!.notice).toBe(PREVIEW_PAYMENT_NOTICE)
338:    expect(stripe.sessionCalls().length).toBe(sessionsBefore)
342:  it('test_UAT_FC_BUG-367_single_rate_shop_asks_no_country_and_stripe_offers_every_one', async () => {
343:    const stripe = fakeStripe()
344:    vi.stubGlobal('fetch', stripe.fetch)
349:    const shop = await aShop(stripe, { zones: sameRate })
366:    const form = stripe.sessionCalls().at(-1)!.form
380:  it('test_UAT_FC_BUG-367_shop_with_different_rates_still_asks_the_country', async () => {
381:    const stripe = fakeStripe()
382:    vi.stubGlobal('fetch', stripe.fetch)
383:    const shop = await aShop(stripe)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd branch cut BUG-368 2>&1 | tail -8; git branch --list 'free-BUG-368'
<!-- xgd-tool name="Bash" id="toolu_01MUJDwcHALHJdoNdAoq3ngm" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:51:47.585118+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd branch cut BUG-368 2>&1 | tail -8; git branch --list 'free-BUG-368'","description":"Cut free-coding branch for BUG-368","timeout":300000}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:51:48
[17:51:48] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'cut', 'BUG-368'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Created worktree for free-BUG-368 at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368
[17:51:55] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:51:55
+ free-BUG-368
```

## Bash M=/Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git…
<!-- xgd-tool name="Bash" id="toolu_01Y2bsZwk9T5rowCpBYHGcLC" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:01.988572+00:00" -->

**Input**

```json
{"command":"M=/Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; cd $W && ls node_modules 2>/dev/null | head -2; \nmkdir -p node_modules && for e in $(ls -A $M/node_modules); do [ -e node_modules/$e ] || ln -s $M/node_modules/$e node_modules/$e; done\nfor pkg in apps/control-app tools/generate tools/repro-console packages/site-schema packages/framework apps/public-site; do\n  [ -d $M/$pkg/node_modules ] || continue\n  mkdir -p $pkg/node_modules\n  for e in $(ls -A $M/$pkg/node_modules); do\n    [ \"$e\" = \"@1stcontact\" ] && continue\n    [ -e $pkg/node_modules/$e ] || ln -s $M/$pkg/node_modules/$e $pkg/node_modules/$e\n  done\n  if [ -d $M/$pkg/node_modules/@1stcontact ]; then\n    mkdir -p $pkg/node_modules/@1stcontact\n    for l in $(ls -A $M/$pkg/node_modules/@1stcontact); do t=$(readlink $M/$pkg/node_modules/@1stcontact/$l); [ -e $pkg/node_modules/@1stcontact/$l ] || ln -s \"$t\" $pkg/node_modules/@1stcontact/$l; done\n  fi\ndone\ncp -R $M/apps/control-app/src/generated apps/control-app/src/ 2>/dev/null; ls -la node_modules/@lagrangefoundry 2>&1 | head -2; readlink packages/framework/node_modules/@1stcontact/site-schema; git status --short | head","description":"Make worktree runnable with linked node_modules"}
```

**Result**

```
@cloudflare
@vitest
ls: node_modules/@lagrangefoundry: No such file or directory
../../../site-schema
```

## Bash ls -la /Users/martin/lagrangefoundry/1stcontact/node_modules/@lagrangefoundry 2>&1 | head -2; ls /Users/martin/lagrangef…
<!-- xgd-tool name="Bash" id="toolu_01TmoNsNwJ82dPWTmNeRkW3k" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:06.618100+00:00" -->

**Input**

```json
{"command":"ls -la /Users/martin/lagrangefoundry/1stcontact/node_modules/@lagrangefoundry 2>&1 | head -2; ls /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry 2>&1 | head; ls -la node_modules | head -5; ls node_modules | wc -l; ls /Users/martin/lagrangefoundry/1stcontact/node_modules | wc -l","description":"Check @lagrangefoundry location and node_modules"}
```

**Result**

```
ls: /Users/martin/lagrangefoundry/1stcontact/node_modules/@lagrangefoundry: No such file or directory
ai
ai-imagegen
ai-knowledge
ai-ticketing
ai-videogen
ai-vision
auth-passwordless
imagegen
knowledge
logging
total 296
drwxrwxr-x   20 martin  staff     640 Nov  5 17:52 .
drwxrwxr-x   30 martin  staff     960 Nov  5 17:51 ..
drwxrwxr-x   12 martin  staff     384 Nov  5 17:51 .bin
lrwxrwxr-x    1 martin  staff      60 Nov  5 17:52 .cache -> /Users/martin/lagrangefoundry/1stcontact/node_modules/.cache
       9
       9
```

## Bash ln -s /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry node_modules/@lagrangefoundry && git status --short |…
<!-- xgd-tool name="Bash" id="toolu_0151K8C8qZLB9RqgGFEpM19m" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:09.736716+00:00" -->

**Input**

```json
{"command":"ln -s /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry node_modules/@lagrangefoundry && git status --short | head; git log --oneline -1","description":"Link @lagrangefoundry into worktree"}
```

**Result**

```
0e3a2ee8af xgd(ticket): update comment comment-f2d5499d
```

## Bash grep -n "^function axisSizingCss" -A45 packages/framework/src/l1/render.ts | head -70
<!-- xgd-tool name="Bash" id="toolu_019zKnq4y4RPPhcomEMeyZrc" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:18.735405+00:00" -->

**Input**

```json
{"command":"grep -n \"^function axisSizingCss\" -A45 packages/framework/src/l1/render.ts | head -70","description":"Read axisSizingCss"}
```

**Result**

```
2559:function axisSizingCss(sizing: L1AxisSizing | undefined, parent?: ParentFlow): string[] {
2560-  if (!sizing) return []
2561-  // BUG-133 — a width is the same everywhere: a block's containing width is
2562-  // definite, so `width: 100%` resolves under every parent. Only the height
2563-  // asks the parent what axis it landed on.
2564-  const flips = parent?.keyframes.some(
2565-    (kf) => heightIsCrossAxis(kf.value) !== heightIsCrossAxis(parent.base),
2566-  )
2567-  const fluidHeight = fluidHeightDecls(heightIsCrossAxis(parent?.base), Boolean(flips))
2568-  return [...sizingCss('width', sizing.width), ...sizingCss('height', sizing.height, fluidHeight)]
2569-}
2570-
2571-/**
2572- * BUG-133 — the `@media` overrides a fluid height needs when its PARENT's layout
2573- * mode changes across the ladder, one per breakpoint that flips which axis the
2574- * height is. A parent with no track, or one that never crosses the row/grid ↔
2575- * stack boundary, produces none — so the overwhelming majority of documents
2576- * carry not one extra byte for this.
2577- */
2578-function fluidHeightRules(
2579-  sizing: L1AxisSizing | undefined,
2580-  parent: ParentFlow | undefined,
2581-  selector: string,
2582-): Rule[] {
2583-  if (!parent || sizing?.height?.mode !== 'fluid') return []
2584-  const rules: Rule[] = []
2585-  let cross = heightIsCrossAxis(parent.base)
2586-  const flips = parent.keyframes.some((kf) => heightIsCrossAxis(kf.value) !== cross)
2587-  if (!flips) return []
2588-  for (const kf of parent.keyframes) {
2589-    const next = heightIsCrossAxis(kf.value)
2590-    if (next === cross) continue
2591-    cross = next
2592-    rules.push({ media: `(min-width: ${kf.at}px)`, selector, decls: fluidHeightDecls(next, true) })
2593-  }
2594-  return rules
2595-}
2596-
2597-/** One CSS block for a selector. */
2598-interface Rule {
2599-  media?: string
2600-  /**
2601-   * REQ-325 — a feature query this rule is gated on: it is emitted inside
2602-   * `@supports (…)`, nested outside its `media` when it carries one.
2603-   *
2604-   * A rule that needs a capability the browser may not have is the only thing
```

## Bash grep -n "editAttrs =" -A8 packages/framework/src/l1/render.ts | head -30; grep -n "data-l1-id\|data-l1-addr\|data-l1-pat…
<!-- xgd-tool name="Bash" id="toolu_01GaRjbwtZBCytfpzNtabdUp" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:30.202806+00:00" -->

**Input**

```json
{"command":"grep -n \"editAttrs =\" -A8 packages/framework/src/l1/render.ts | head -30; grep -n \"data-l1-id\\|data-l1-addr\\|data-l1-path\" packages/framework/src/l1/render.ts | head","description":"Check edit address scheme"}
```

**Result**

```
5783:  const editAttrs = segment
5784-    ? ` ${L1_EDIT_PATH_ATTR}="${path.join('.')}" ${L1_EDIT_SEGMENT_ATTR}="${segment}"`
5785-    : ''
5786-
5787-  // REQ-106 — the navigation role. The renderer RETAGS the node's own element as
5788-  // an `<a>` rather than wrapping it, so the class, every paint axis and the
5789-  // REQ-99 focus ring all stay on the element the author actually styled.
5790-  // Wrapping would move focus to an outer element and silently cost a linked node
5791-  // its focus indicator. `image` is the one exception — a void element cannot be
```

## Bash sed -n 5755,5786p packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_016VJicWcHp8eHfR2JSnavrL" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:33.072615+00:00" -->

**Input**

```json
{"command":"sed -n 5755,5786p packages/framework/src/l1/render.ts","description":"Read edit segment condition"}
```

**Result**

```
  // picks them up without any of them re-litigating how a class attribute is built.
  //
  // REQ-116 — the edit render emits neither. The reveal handle exists only for
  // the observer to find, and the edit channel ships no observer; leaving it on
  // would advertise a motion the page cannot perform.
  const marks = [name]
  // REQ-335 — an `in-view` timed track borrows REQ-100's observer rather than
  // bringing a second one, so it needs the same handle. Asked of the node, not of
  // the reveal axis: a node may be driven by the observer without having an
  // entrance at all, which is the case a hero illustration that only drifts is.
  const wantsObserver =
    node.reveal !== undefined ||
    (node.animate !== undefined &&
      l1AnimateTracks(node.animate).some((t) => t.trigger === 'in-view'))
  if (wantsObserver && !state.edit) marks.push(REVEAL_CLASS)
  if (accentRules.length) marks.push(POINTER_CLASS)
  const cls = marks.join(' ')

  // REQ-106 — a node's own `id` becomes a real DOM id, so `href="#how"` has
  // something to land on. Uniqueness is the envelope validator's job (a duplicate
  // breaks both anchor navigation and the `for`<->`id` association the `control`
  // contract depends on), which is why this can be emitted unconditionally here.
  const idAttr = (node.id ? ` id="${escapeHtml(node.id)}"` : '') + bindAttr

  // REQ-116 — the edit bridge: this node's segment kind and its render-scoped
  // address, stamped together and only on a node the editor offers a control
  // for. Both are absent from the published and draft-preview renders.
  const segment = state.edit ? segmentKind(node, state) : null
  const editAttrs = segment
    ? ` ${L1_EDIT_PATH_ATTR}="${path.join('.')}" ${L1_EDIT_SEGMENT_ATTR}="${segment}"`
    : ''
```

## Bash grep -n "^function segmentKind" -A30 packages/framework/src/l1/render.ts
<!-- xgd-tool name="Bash" id="toolu_01Wq7PzE9jLZb3sTN93GRBk9" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:43.228802+00:00" -->

**Input**

```json
{"command":"grep -n \"^function segmentKind\" -A30 packages/framework/src/l1/render.ts","description":"Read segmentKind"}
```

**Result**

```
5278:function segmentKind(node: L1Node, state: RenderState): L1SegmentKind | null {
5279-  switch (node.kind) {
5280-    case 'text':
5281-      return 'copy'
5282-    case 'image':
5283-      return 'image'
5284-    case 'slot':
5285-      // A seam with a behavior mounted in it is the module segment; the instance
5286-      // itself stays addressed by the `data-fc-module` hook already stamped on
5287-      // its root (CHAT-9 M1). An UNMOUNTED slot is the inert placeholder — it
5288-      // renders nothing and has nothing to edit.
5289-      return state.mounts?.[node.name] ? 'module' : null
5290-    case 'box':
5291-    case 'container':
5292-      // "Carries paint" is answered by asking the paint emitter, not by keeping a
5293-      // second list of axis names in step with it by hand. A box is a container
5294-      // segment exactly when it would emit a surface declaration — so every axis
5295-      // added to `surfaceDecls` in future is covered without touching this.
5296-      return l1PaintsSurface(node) ? 'container' : null
5297-    default:
5298-      // `control` — a leaf whose element, attributes and behaviour belong to the
5299-      // mounted module (REQ-96). It holds no copy to edit and no asset to swap,
5300-      // so phase 1 offers no control for it and it is not outlined.
5301-      return null
5302-  }
5303-}
5304-
5305-/**
5306- * REQ-211 — the inner markup of a text leaf: its words, or a span per run.
5307- *
5308- * ONE SPAN PER VARYING RUN, and none for a run that varies in nothing. A run
```

## Bash sed -n 1,20p packages/framework/src/l2/checkout.ts; sed -n 40,66p packages/framework/src/l2/checkout.ts
<!-- xgd-tool name="Bash" id="toolu_01MKbDrxKezemNMHku4GGRxf" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:52:58.442198+00:00" -->

**Input**

```json
{"command":"sed -n 1,20p packages/framework/src/l2/checkout.ts; sed -n 40,66p packages/framework/src/l2/checkout.ts","description":"Read top of l2/checkout.ts"}
```

**Result**

```
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
    borderRadiusPx: 6,
  }
}

/** [[BUG-367]] — the width from which the checkout's actions sit side by side: a tablet's. */
export const CHECKOUT_ACTIONS_ROW_AT_PX = 768

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
```

## Bash python3 - <<'EOF' p='packages/framework/src/l2/checkout.ts' s=open(p).read() start=s.index('/**\n * [[BUG-367]] — Contin…
<!-- xgd-tool name="Bash" id="toolu_01JXmhBYnaDXLi9zgUE8wdYe" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:53:19.346810+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='packages/framework/src/l2/checkout.ts'\ns=open(p).read()\nstart=s.index('/**\\n * [[BUG-367]] — Continue to payment and Cancel.')\nend=s.index('/** The default `page` slot for one of the three pages')\nnew='''const ACTION_PAD = { topPx: 14, rightPx: 24, bottomPx: 14, leftPx: 24 }\n\n/** A Continue control's lettering, which its Cancel repeats so the two read as a pair. */\nconst LETTERING = ['fontFamily', 'fontSizePx', 'fontWeight', 'letterSpacingPx', 'textTransform'] as const\n\n/**\n * [[BUG-367]] — Continue to payment and Cancel. From a tablet's width up they sit\n * at the right of one row, each as wide as its label, Cancel on the left at the\n * same height; on a phone they stack full width, Continue on top. Cancel is drawn\n * twice for that, each copy shown only at its own widths (`visibility`), so the\n * order of the controls in the document is the order they are seen and reached.\n *\n * [[BUG-368]] — `unit` is whatever draws Continue: the bare control (the default\n * page), or a site's own template's control inside the boxes that hold only it.\n * Cancel takes the design's secondary look in Continue's own lettering, role and\n * padding.\n */\nfunction actionsRow(unit: L1Node, control: Record<string, unknown>, design: L1Design | undefined): L1Node {\n  const axes = (control.axes ?? {}) as Record<string, unknown>\n  const lettering = Object.fromEntries(LETTERING.filter((k) => axes[k] !== undefined).map((k) => [k, axes[k]]))\n  const cancel = (visibility: { fromPx?: number; untilPx?: number }): L1Node =>\n    ({\n      kind: 'control',\n      control: 'cancel',\n      role: control.role ?? 'label',\n      axes: { ...lettering, ...secondaryAxes(design) },\n      padding: control.padding ?? ACTION_PAD,\n      visibility,\n    }) as L1Node\n  const { spaceAbove, spaceBelow, ...rest } = unit as L1Node & { spaceAbove?: unknown; spaceBelow?: unknown }\n  return {\n    kind: 'container',\n    layout: 'row',\n    responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: CHECKOUT_ACTIONS_ROW_AT_PX, value: 'row' }] },\n    distribution: 'end',\n    align: 'stretch',\n    space: 'sm',\n    ...(spaceAbove !== undefined ? { spaceAbove } : {}),\n    ...(spaceBelow !== undefined ? { spaceBelow } : {}),\n    children: [cancel({ fromPx: CHECKOUT_ACTIONS_ROW_AT_PX }), rest as L1Node, cancel({ untilPx: CHECKOUT_ACTIONS_ROW_AT_PX })],\n  } as L1Node\n}\n\nfunction actions(design: L1Design | undefined): L1Node {\n  const control = {\n    kind: 'control',\n    control: 'continue',\n    role: 'label',\n    axes: { color: role(design, 'onAction'), surfaceFill: role(design, 'action'), borderRadiusPx: 6 },\n    padding: ACTION_PAD,\n  }\n  return actionsRow(control as L1Node, control, design)\n}\n\ntype Tree = Record<string, unknown> & { children?: unknown[] }\n\nconst isControl = (v: unknown, name: string): boolean =>\n  typeof v === 'object' && v !== null && (v as Tree).kind === 'control' && (v as Tree).control === name\n\n/** The child indices from `node` down to the first node `hit` accepts, else null. */\nfunction pathTo(node: unknown, hit: (v: unknown) => boolean): number[] | null {\n  if (hit(node)) return []\n  const children = typeof node === 'object' && node !== null ? (node as Tree).children : undefined\n  if (!Array.isArray(children)) return null\n  for (let i = 0; i < children.length; i++) {\n    const rest = pathTo(children[i], hit)\n    if (rest) return [i, ...rest]\n  }\n  return null\n}\n\n/**\n * [[BUG-368]] — THE CHECKOUT'S ACTIONS ARE THE SAME ON EVERY CHECKOUT PAGE, not\n * only the default. Wherever a template places `continue`, it is drawn in\n * {@link actionsRow}: Continue and the boxes that hold only it (a site's\n * `button.primary` box is the button the buyer sees) become the row's Continue,\n * each box inside the outermost one filling it, so the label sits in the middle\n * of the button at every width. A template that already places `cancel` has\n * chosen its own arrangement and is returned as it is, as is one with no\n * `continue`.\n */\nexport function checkoutActions(template: L1Node, design?: L1Design): L1Node {\n  if (pathTo(template, (v) => isControl(v, 'cancel'))) return template\n  const path = pathTo(template, (v) => isControl(v, 'continue'))\n  if (!path) return template\n  // The chain from the template down to Continue, and how far up it the boxes\n  // hold nothing but the next one down.\n  const chain: Tree[] = [template as unknown as Tree]\n  for (const i of path) chain.push(chain[chain.length - 1].children![i] as Tree)\n  let top = chain.length - 1\n  while (top > 0 && chain[top - 1].children!.length === 1) top--\n  const fill = (node: Tree): Tree => {\n    const sizing = (node.sizing ?? {}) as Record<string, unknown>\n    return sizing.width ? node : { ...node, sizing: { ...sizing, width: { mode: 'fluid' } } }\n  }\n  let unit: Tree = chain[chain.length - 1]\n  for (let d = chain.length - 2; d >= top; d--) unit = { ...chain[d], children: [d === chain.length - 2 ? fill(unit) : fill(unit)] }\n  if (top === chain.length - 1) unit = chain[top]\n  const drawn = actionsRow(unit as unknown as L1Node, chain[chain.length - 1], design)\n  if (top === 0) return drawn\n  // Put the row where the outermost box was.\n  const rebuild = (d: number): Tree => {\n    const node = chain[d]\n    const children = [...node.children!]\n    children[path[d]] = d + 1 === top ? (drawn as unknown as Tree) : rebuild(d + 1)\n    return { ...node, children }\n  }\n  return rebuild(0) as unknown as L1Node\n}\n\n'''\ns=s[:start]+new+s[end:]\ns=s.replace(\"const pad = { topPx: 14, rightPx: 24, bottomPx: 14, leftPx: 24 }\\n\",\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"pad\\b\\|ACTION_PAD\" packages/framework/src/l2/checkout.ts","description":"
```

[elided — kept 5800 of 5846 bytes]

**Result**

```
69:const ACTION_PAD = { topPx: 14, rightPx: 24, bottomPx: 14, leftPx: 24 }
95:      padding: control.padding ?? ACTION_PAD,
118:    padding: ACTION_PAD,
```

## Bash python3 - <<'EOF' p='packages/framework/src/l2/checkout.ts' s=open(p).read() old=''' for (let d = chain.length - 2; d >=…
<!-- xgd-tool name="Bash" id="toolu_01QCofmM8TRZyUuTorYa7fJe" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:53:26.415602+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='packages/framework/src/l2/checkout.ts'\ns=open(p).read()\nold='''  for (let d = chain.length - 2; d >= top; d--) unit = { ...chain[d], children: [d === chain.length - 2 ? fill(unit) : fill(unit)] }\n  if (top === chain.length - 1) unit = chain[top]\n'''\nnew='''  for (let d = chain.length - 2; d >= top; d--) unit = { ...chain[d], children: [fill(unit)] }\n'''\nassert old in s\ns=s.replace(old,new)\nopen(p,'w').write(s)\nEOF\ngrep -n \"export function checkoutPagePreset\" packages/framework/src/l2/checkout.ts","description":"Simplify unit-building loop"}
```

**Result**

```
179:export function checkoutPagePreset(mode: CheckoutPageMode, design?: L1Design): L1Node {
```

## Bash python3 - <<'EOF' import re p='packages/framework/src/modules/checkout/component.ts' s=open(p).read() s=s.replace("impor…
<!-- xgd-tool name="Bash" id="toolu_01BQXpFHJmgvyCgyXUdy66r2" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:53:36.177226+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\nimport re\np='packages/framework/src/modules/checkout/component.ts'\ns=open(p).read()\ns=s.replace(\"import type { L1Node } from '@1stcontact/site-schema'\",\"import type { L1Node } from '@1stcontact/site-schema'\\nimport { checkoutActions } from '../../l2/checkout'\")\ns=s.replace(\"export function checkout({ config = {}, slots = {}, instanceId = 'checkout', edit = false, locale, catalog: data }: BehaviorProps = {}): string {\\n  const mode = config.mode === 'complete' || config.mode === 'cancelled' ? config.mode : 'checkout'\\n  const template = single(slots.page)\",\n\"\"\"export function checkout({ config = {}, slots = {}, instanceId = 'checkout', edit = false, locale, catalog: data, design }: BehaviorProps = {}): string {\n  const mode = config.mode === 'complete' || config.mode === 'cancelled' ? config.mode : 'checkout'\n  const authored = single(slots.page)\n  // [[BUG-368]] — wherever the page places Continue, it is drawn with its Cancel\n  // in the checkout's action row. Not in the edit channel: its addresses are the\n  // stored template's paths, and the row would move every one below it.\n  const template = authored && mode === 'checkout' && !edit ? checkoutActions(authored, design) : authored\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"^import\\|L1Design\" packages/framework/src/modules/behavior.ts | head; grep -n \"  locale?: ResolvedLocale\" packages/framework/src/modules/behavior.ts","description":"Apply checkoutActions in module; inspect behavior imports"}
```

**Result**

```
1:import {
8:import type { L1ControlTag } from '../l1/render'
9:import type { BuyBlocker, CatalogItem } from './product-catalog/items'
10:import type { ImageDeliveryManifest } from '../l1/delivery'
355:  locale?: ResolvedLocale
```

## Bash sed -n 1,8p packages/framework/src/modules/behavior.ts; python3 - <<'EOF' p='packages/framework/src/modules/behavior.ts'…
<!-- xgd-tool name="Bash" id="toolu_01EqWGQqSgQyLxzqRGhvXMvw" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:53:42.868296+00:00" -->

**Input**

```json
{"command":"sed -n 1,8p packages/framework/src/modules/behavior.ts; python3 - <<'EOF'\np='packages/framework/src/modules/behavior.ts'\ns=open(p).read()\ns=s.replace(\"import type { L1ControlTag } from '../l1/render'\",\"import type { L1ControlTag } from '../l1/render'\\nimport type { L1Design } from '@1stcontact/site-schema'\",1)\ns=s.replace(\"  locale?: ResolvedLocale\\n\",\"\"\"  locale?: ResolvedLocale\n  /**\n   * [[BUG-368]] — the site's design, handed down by the renderer like\n   * {@link locale}. For a module that draws a vetted default look (an L2 preset)\n   * into a template the site authored — the checkout's Cancel takes the design's\n   * secondary button. Optional: a module that draws only its template ignores it.\n   */\n  design?: L1Design\n\"\"\",1)\nopen(p,'w').write(s)\nEOF\ngrep -rn \"@1stcontact/site-schema\" packages/framework/src/modules/*.ts | head -3","description":"Add design prop to BehaviorProps"}
```

**Result**

```
import {
  l1ControlNames,
  l1NodeSchema,
  type L1Node,
  type ResolvedLocale,
  type SiteCapabilities,
} from '@1stcontact/site-schema'
import type { L1ControlTag } from '../l1/render'
packages/framework/src/modules/behavior.ts:7:} from '@1stcontact/site-schema'
packages/framework/src/modules/behavior.ts:9:import type { L1Design } from '@1stcontact/site-schema'
packages/framework/src/modules/text-style.ts:19:import type { Position } from '@1stcontact/site-schema'
```

## Bash python3 - <<'EOF' p='packages/framework/src/modules/behavior.ts' s=open(p).read() s=s.replace("import type { L1Design }…
<!-- xgd-tool name="Bash" id="toolu_01UkqFtjLA8YBE9E6y1rfjN7" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:53:50.726060+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='packages/framework/src/modules/behavior.ts'\ns=open(p).read()\ns=s.replace(\"import type { L1Design } from '@1stcontact/site-schema'\\n\",\"\",1)\ns=s.replace(\"  type L1Node,\\n  type ResolvedLocale,\",\"  type L1Design,\\n  type L1Node,\\n  type ResolvedLocale,\",1)\nopen(p,'w').write(s)\np='tools/generate/src/render/render.ts'\ns=open(p).read()\ns=s.replace(\"\"\"  capabilities: SiteCapabilities,\n  catalog?: CatalogProps,\n): string[] {\"\"\",\"\"\"  capabilities: SiteCapabilities,\n  catalog?: CatalogProps,\n  design?: L1Design,\n): string[] {\"\"\",1)\ns=s.replace(\"\"\"      locale,\n      capabilities,\n      // REQ-633\"\"\",\"\"\"      locale,\n      capabilities,\n      // [[BUG-368]] — the site's design, for a module that draws a default look\n      // into the site's own template (the checkout's Cancel).\n      design,\n      // REQ-633\"\"\",1)\ns=s.replace(\"renderModuleInstances(page, resolveModule, edit, locale, capabilities, variant.catalog)\",\"renderModuleInstances(page, resolveModule, edit, locale, capabilities, variant.catalog, site.design)\",1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"L1Design\" tools/generate/src/render/render.ts | head -3; sed -n 415,430p tools/generate/src/render/render.ts","description":"Pass site design to module components"}
```

**Result**

```
47:  resolveL1Design,
234:  design?: L1Design,
626:        slots: { page: resolveL1Design(checkoutPagePreset(mode, site.design), site.design) },
  drawings?: Readonly<Record<string, string>>,
  partDrawings: PartDrawings = {},
  ownTheme?: string,
  variant: PageVariant = {},
): string {
  const title = variant.title ?? page.seoMeta?.title ?? `${page.title} — ${site.config.businessName}`
  const description = variant.description ?? page.seoMeta?.description ?? site.config.tagline ?? ''
  // The page body is either an L1 document (a folded reproduction — REQ-88) or a
  // behavior-module stack. The L1 render is self-contained (concrete values from
  // the fold); its css rides in a page-level <style> alongside the theme tokens.
  //
  // REQ-93 — when the page carries both, the L1 document is still the single
  // body and each module mounts into the `slot` it is bound to. Modules render
  // first and are handed to the pure L1 emitter as finished fragments; the page
  // schema has already proved every binding resolves to exactly one existing slot.
  const locale = resolveSiteLocale(site.config)
```

## Bash sed -n 30,60p tools/generate/src/render/render.ts | grep -n "import\|from" ; grep -n "type L1Design\|L1Design," tools/ge…
<!-- xgd-tool name="Bash" id="toolu_01Rh9jC7stfrs2t34u7afSHV" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:53:54.853813+00:00" -->

**Input**

```json
{"command":"sed -n 30,60p tools/generate/src/render/render.ts | grep -n \"import\\|from\" ; grep -n \"type L1Design\\|L1Design,\" tools/generate/src/render/render.ts | head","description":"Check render.ts imports for L1Design"}
```

**Result**

```
8:} from '@1stcontact/framework/worker'
9:import type { BehaviorDefinition, CatalogItem, CatalogProps, CheckoutPageMode, CheckoutShipping, ImageDeliveryManifest, ShareHead } from '@1stcontact/framework/worker'
10:import {
22:} from '@1stcontact/site-schema'
23:import type { L1Document, L1FontFace, Page, PagePart, ResolvedLocale, Site, SiteCapabilities } from '@1stcontact/site-schema'
24:// From `assemble`, which DEFINES `LoadedSite`, not from `loadSite`, which merely
25:// re-exports it while importing `node:path` and the filesystem helpers. A
26:// type-only import is erased before a bundler sees it, so the Worker's BUNDLE
30:// Import a type from where it is declared (REQ-149).
31:import type { LoadedSite } from '../store/assemble'
47:  resolveL1Design,
234:  design?: L1Design,
```

## Bash sed -i '' "s/^import type { L1Document, L1FontFace, Page, PagePart, ResolvedLocale, Site, SiteCapabilities } from '@1stc…
<!-- xgd-tool name="Bash" id="toolu_016yLdN9zGyqsqS1qC6hphzB" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:53:58.260760+00:00" -->

**Input**

```json
{"command":"sed -i '' \"s/^import type { L1Document, L1FontFace, Page, PagePart, ResolvedLocale, Site, SiteCapabilities } from '@1stcontact\\/site-schema'/import type { L1Design, L1Document, L1FontFace, Page, PagePart, ResolvedLocale, Site, SiteCapabilities } from '@1stcontact\\/site-schema'/\" tools/generate/src/render/render.ts && grep -n \"^import type { L1Design\" tools/generate/src/render/render.ts; grep -n \"site.design\" tools/generate/src/render/render.ts | head","description":"Import L1Design type in render.ts"}
```

**Result**

```
52:import type { L1Design, L1Document, L1FontFace, Page, PagePart, ResolvedLocale, Site, SiteCapabilities } from '@1stcontact/site-schema'
395:    design: site.design,
432:  const rendered = renderModuleInstances(page, resolveModule, edit, locale, capabilities, variant.catalog, site.design)
449:    ? renderL1Document(page.l1, { mounts, edit, delivery, drawings, rhythm: l1RhythmUnit(site), design: site.design, navigation, fonts })
626:        slots: { page: resolveL1Design(checkoutPagePreset(mode, site.design), site.design) },
677:    design: site.design,
755:    `${generateThemeCss(site.theme, site.design)}\n\n${getModuleCss()}\n\n${CALLOUT_CSS}${extraCss}\n`,
```

## Bash sed -n 8555,8595p apps/control-app/src/router.ts; grep -n "ctx" apps/control-app/src/router.ts | sed -n 1,5p; grep -n "i…
<!-- xgd-tool name="Bash" id="toolu_01TT7YrjGqK8mvyrMvbs9QHd" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:54:09.085837+00:00" -->

**Input**

```json
{"command":"sed -n 8555,8595p apps/control-app/src/router.ts; grep -n \"ctx\" apps/control-app/src/router.ts | sed -n 1,5p; grep -n \"interface RouteContext\" -A5 apps/control-app/src/router.ts","description":"Read preview checkout route"}
```

**Result**

```
      }

      /**
       * POST /preview/<siteKey>/draft/api/checkout/<verb> — the draft's checkout
       * page asks for its quote ([[BUG-367]]).
       *
       * WHY THIS EXISTS AT ALL is `api/lead`'s reason: the checkout page's script
       * posts to `api/checkout/<verb>` relative to the page, and in the preview
       * that page is served by THIS Worker. With no route here every quote came
       * back a 404, and the page told the owner a piece they can sell could not
       * be bought.
       *
       * THE SAME `handleCheckout` AND THE SAME `quote`, so the draft shows what
       * the published page shows. The rate limiter is not asked (`identified`):
       * the caller is the signed-in operator, as for the draft's `api/lead`.
       *
       * THE DRAFT NEVER TAKES MONEY: `start` answers the owner that payment
       * opens on the published site, and writes nothing ({@link previewCheckoutIntake}).
       *
       * `draft` ONLY, and the site key is the route's and is checked, exactly as
       * the `api/lead` route above does.
       */
      const checkoutPath = method === 'POST' ? checkoutVerb((preview[3] ?? '/').replace(/^\/+/, '')) : null
      if (checkoutPath) {
        if (channel !== 'draft') return text(404, 'Not found')
        const store = await openStore()
        if (!(await store.hasDraft(site))) return text(404, 'Not found')
        return handleCheckout(request, {
          siteKey: site,
          verb: checkoutPath,
          siteUrl: publicSiteUrl(site, '/'),
          env: { SHOP_CHECKOUT: previewCheckoutIntake(env as never) } as CheckoutEnv,
          identified: true,
        })
      }

      /**
       * GET /preview/<siteKey>/draft/api/download/<token>[/<assetKey>] — the
       * gated download, against the draft ([[BUG-97]]).
       *
       * WHY THIS EXISTS AT ALL, which is `api/lead`'s reason one step further on.
1387:   * platform with a synchronous API underneath it (`ctx.storage.sql`). D1, R2
1444:   * cut off with the ~30 s `ctx.waitUntil` keeps an isolate after its response.
1780:   * THREADED RATHER THAN REACHED FOR, on `ctx`'s precedent and for the same
3324:  ctx?: RouteContext,
3331:    await asWriter({ holder: CLIENT_HOLDER, scope: null }, () => routeUncached(request, env, scope, deps, ctx)),
3289:export interface RouteContext {
3290-  waitUntil(promise: Promise<unknown>): void
3291-}
3292-
3293-/**
3294- * THE SCOPE IS AN ARGUMENT, NOT SOMETHING THIS FILE DERIVES ([[REQ-168]]).
```

## Bash python3 - <<'EOF' p='apps/control-app/src/router.ts' s=open(p).read() old_doc=''' * THE DRAFT NEVER TAKES MONEY: `start`…
<!-- xgd-tool name="Bash" id="toolu_01WdxdxTifoYsbuvjkPcmBw4" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:54:22.404403+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/router.ts'\ns=open(p).read()\nold_doc='''       * THE DRAFT NEVER TAKES MONEY: `start` answers the owner that payment\n       * opens on the published site, and writes nothing ({@link previewCheckoutIntake}).\n       *'''\nnew_doc='''       * [[BUG-368]] — THE DRAFT'S CHECKOUT IS THE PUBLISHED SITE'S, all four\n       * verbs over the same `checkoutIntake` (supersedes BUG-367's \"the draft\n       * never takes money\"). Only the signed-in owner sees the draft, so no\n       * visitor buys from it; price, stock and shipping are the same live\n       * records; an order is a real order through the same webhook. Whether\n       * money moves is the Stripe connection's mode, as it is published. The one\n       * difference is where Stripe sends the buyer back: the preview's own\n       * order-complete and order-cancelled pages, under this request's own\n       * address (its business prefix included).\n       *'''\nassert old_doc in s; s=s.replace(old_doc,new_doc)\nold='''        return handleCheckout(request, {\n          siteKey: site,\n          verb: checkoutPath,\n          siteUrl: publicSiteUrl(site, '/'),\n          env: { SHOP_CHECKOUT: previewCheckoutIntake(env as never) } as CheckoutEnv,\n          identified: true,\n        })'''\nnew='''        const draftUrl = `${url.origin}${url.pathname.slice(0, url.pathname.length - (preview[3] ?? '').length)}/`\n        const intake = checkoutIntake(env as never, {\n          ...(deps.fetch ? { fetch: deps.fetch } : {}),\n          rebuild: (businessId, itemId) => {\n            const rebuilt = rebuildCatalogFor(env, { businessId }, itemId, deps.fetch)\n            if (ctx) ctx.waitUntil(rebuilt)\n            return ctx ? Promise.resolve() : rebuilt\n          },\n        })\n        return handleCheckout(request, {\n          siteKey: site,\n          verb: checkoutPath,\n          siteUrl: draftUrl,\n          env: { SHOP_CHECKOUT: intake } as CheckoutEnv,\n          identified: true,\n        })'''\nassert old in s; s=s.replace(old,new)\ns=s.replace(\"import { previewCheckoutIntake } from './checkout-intake'\",\"import { checkoutIntake } from './checkout-intake'\")\ns=s.replace(\"       * page asks for its quote ([[BUG-367]]).\",\"       * page asks for its quote and starts its payment ([[BUG-367]], [[BUG-368]]).\")\nopen(p,'w').write(s)\n\np='apps/control-app/src/checkout-intake.ts'\ns=open(p).read()\ni=s.index('\\n/**\\n * [[BUG-367]] — what Continue to payment answers in the builder')\ns=s[:i]+'\\n'\nopen(p,'w').write(s)\n\np='packages/framework/src/modules/checkout/client.js'\ns=open(p).read()\nold='''    // [[BUG-367]] — the builder's draft answers the owner a notice instead of a\n    // payment address: the draft never takes money.\n    if (r.ok && r.data.notice) {\n      say(root, r.data.notice)\n      return\n    }\n'''\nassert old in s; s=s.replace(old,'')\nopen(p,'w').write(s)\nEOF\ngrep -rn \"PREVIEW_PAYMENT_NOTICE\\|previewCheckoutIntake\\|notice\" apps packages tools tests --include='*.ts' --include='*.js' -l 2>/dev/null | grep -v node_modules | xargs grep -ln \"PREVIEW_PAYMENT_NOTICE\\|previewCheckoutIntake\\|Payment opens on your published\" 2>/dev/null","description":"Route draft checkout through real intake; drop notice"}
```

**Result**

```
tests/test_UAT_FC_BUG-367_checkout_page.test.ts
tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
```

## Bash grep -n "PREVIEW_PAYMENT_NOTICE\|previewCheckoutIntake\|Payment opens\|notice" tests/test_UAT_FC_BUG-367_checkout_page.t…
<!-- xgd-tool name="Bash" id="toolu_01NdtzXh9AVn45ooSspBkgSA" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:54:26.616555+00:00" -->

**Input**

```json
{"command":"grep -n \"PREVIEW_PAYMENT_NOTICE\\|previewCheckoutIntake\\|Payment opens\\|notice\" tests/test_UAT_FC_BUG-367_checkout_page.test.ts; sed -n 300,345p tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts; sed -n 230,298p tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts","description":"Read tests referencing notice"}
```

**Result**

```
84:  it('test_UAT_FC_BUG-367_draft_start_shows_the_owner_notice', async () => {
86:    const notice = 'Payment opens on your published site. Only you see this.'
87:    const answers: Record<string, unknown> = { quote: { quote: QUOTE }, start: { notice, quote: QUOTE } }
94:    expect(d.querySelector('[data-checkout-control="message"]')!.textContent).toBe(notice)
  it('test_UAT_FC_BUG-367_draft_quote_answers_like_the_published_site', async () => {
    const stripe = fakeStripe()
    vi.stubGlobal('fetch', stripe.fetch)
    const shop = await aShop(stripe)

    const inDraft = await draft(shop, 'quote', { lines: LAMP, country: 'FR', locale: 'en-GB' })
    expect(inDraft.status).toBe(200)
    expect(inDraft.type).toMatch(/application\/json/)
    const published = await buyer(shop, 'quote', { lines: LAMP, country: 'FR', locale: 'en-GB' })
    expect(published.status).toBe(200)
    // The SAME quote: current price, the Ship to countries, the rate, the total.
    expect(inDraft.body!.quote).toEqual(published.body.quote)
    expect(inDraft.body!.quote).toMatchObject({ canCheckout: true, shipping: 500, subtotal: 1999, total: 2499, country: 'FR', singleRate: false })
    expect(inDraft.body!.quote.countries.map((c: { code: string }) => c.code).sort()).toEqual(['DE', 'FR', 'GB'])

    // Draft only, and only for a site this business holds.
    expect((await draft(shop, 'quote', { lines: LAMP, country: 'FR' }, 'edit')).status).toBe(404)
    const stranger = await asOwner(shop.tenant, 'POST', `/preview/not-${shop.site}/draft/api/checkout/quote`, { lines: LAMP })
    expect(stranger.status).toBe(404)
  })

  it('test_UAT_FC_BUG-367_draft_start_tells_the_owner_and_takes_no_money', async () => {
    const stripe = fakeStripe()
    vi.stubGlobal('fetch', stripe.fetch)
    const shop = await aShop(stripe)
    const before = await orderCount(shop.tenant)
    const sessionsBefore = stripe.sessionCalls().length

    const quote = await draft(shop, 'quote', { lines: LAMP, country: 'GB' })
    const started = await draft(shop, 'start', { lines: LAMP, country: 'GB', total: quote.body!.quote.total })
    expect(started.status).toBe(200)
    expect(started.body!.notice).toBe('Payment opens on your published site. Only you see this.')
    expect(started.body!.notice).toBe(PREVIEW_PAYMENT_NOTICE)
    expect(started.body!.url).toBeUndefined()
    expect(started.body!.quote).toMatchObject({ canCheckout: true, total: 2799 })

    // Nothing held, no order, no Stripe session.
    expect(await orderCount(shop.tenant)).toBe(before)
    expect(stripe.sessionCalls().length).toBe(sessionsBefore)
    expect(await availability(shop.lampId)).toBe(1)
  })

  it('test_UAT_FC_BUG-367_single_rate_shop_asks_no_country_and_stripe_offers_every_one', async () => {
    const stripe = fakeStripe()
    vi.stubGlobal('fetch', stripe.fetch)
    const sameRate = [
  if (options.shipping !== false) expect((await asOwner(tenant, 'PUT', '/api/shop/shipping', { zones: options.zones ?? ZONES, dispatchNote: NOTE })).status).toBe(200)
  expect((await call(tenant, '/api/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ site }) })).status).toBe(200)
  return { tenant, site, accountId, lampId: lamp.id, stripe }
}

/** A published page's bytes, from the bucket. */
async function published(shop: Shop, suffix: string): Promise<string | null> {
  const key = (await env.SITES.list({ prefix: `sites/${shop.site}/` })).objects.map((o) => o.key).find((k) => k.endsWith(suffix))
  return key ? ((await (await env.SITES.get(key))!.text()) as string) : null
}

const offersBuy = (html: string | null) => html !== null && html.includes('data-l1-bind="buy"')
const orderRow = (id: string) => DB().prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<Record<string, any>>()
const invoiceRow = (id: string) => DB().prepare('SELECT * FROM invoices WHERE id = ?').bind(id).first<Record<string, any>>()
const availability = async (id: string) => (await DB().prepare('SELECT availability FROM inventory_items WHERE id = ?').bind(id).first<{ availability: number }>())!.availability

/** Continue to payment for the lamp, shipping to `country`, agreeing to the quoted total. */
async function startBuying(shop: Shop, country = 'FR') {
  const quote = await buyer(shop, 'quote', { lines: [{ item: 'brass-lamp', quantity: 1 }], country })
  expect(quote.status).toBe(200)
  return buyer(shop, 'start', { lines: [{ item: 'brass-lamp', quantity: 1 }], country, total: quote.body.quote.total })
}

/** The completed session Stripe would send for `orderId`. */
async function completed(shop: Shop, orderId: string, over: Record<string, unknown> = {}) {
  const order = (await orderRow(orderId))!
  return {
    id: order.checkout_session_id,
    object: 'checkout.session',
    amount_total: order.total,
    currency: 'eur',
    payment_status: 'paid',
    payment_intent: `pi_${orderId}`,
    metadata: { business_id: shop.tenant, order_id: orderId, invoice_id: order.invoice_id },
    customer_details: { name: 'Ada Buyer', email: 'ada.buyer@example.test', phone: '+33 1 23 45 67 89' },
    collected_information: { shipping_details: { name: 'Ada Buyer', address: { line1: '1 Rue de la Paix', line2: null, city: 'Paris', state: null, postal_code: '75002', country: 'FR' } } },
    ...over,
  }
}

beforeAll(async () => {
  await applySchema()
})

beforeEach(() => {
  registerShopPaymentHandler(orderPaymentOutcome)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const LAMP = [{ item: 'brass-lamp', quantity: 1 }]
const orderCount = async (tenant: string) =>
  (await DB().prepare('SELECT COUNT(*) AS n FROM orders WHERE business_id = ?').bind(tenant).first<{ n: number }>())!.n

/** The draft preview's checkout endpoint, as the page's script posts it from inside
```

[elided — kept 5800 of 6270 bytes]

## Bash grep -ln "fakeStripe" tests/*.ts tests/support/* 2>/dev/null | head; sed -n 1,120p tests/test_UAT_FC_BUG-367_draft_check…
<!-- xgd-tool name="Bash" id="toolu_01KUCpqxDnaF2iEyAypgXwkA" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:54:32.841614+00:00" -->

**Input**

```json
{"command":"grep -ln \"fakeStripe\" tests/*.ts tests/support/* 2>/dev/null | head; sed -n 1,120p tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts","description":"Find shared fake Stripe and read harness head"}
```

**Result**

```
tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
tests/test_UAT_FC_REQ-641_stripe_connect.workers.test.ts
tests/test_UAT_FC_REQ-642_payments.workers.test.ts
tests/test_UAT_FC_REQ-641_stripe_secret_hooks.test.ts
tests/test_UAT_FC_REQ-643_purchase.workers.test.ts
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { checkoutIntake, PREVIEW_PAYMENT_NOTICE } from '../apps/control-app/src/checkout-intake'
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
 * [[BUG-367]] — the builder's draft checkout reaches its quote, never takes
 * money, and a shop whose countries all cost the same asks no country.
 *
 * Real entry points against real D1 (miniflare): the draft through the control
 * app's own router (`/preview/<site>/draft/...`, as the builder's iframe asks),
 * the published checkout through the public-site Worker, and Stripe's paid event
 * through the real webhook. Stripe is the external boundary, faked at fetch.
 * (Fixtures follow the REQ-643 purchase suite's.)
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
    ACCESS_TE
```

[elided — kept 5800 of 6872 bytes]

## Bash sed -n 120,160p tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts; grep -n "ORDER_COMPLETE_SLUG =\|ORDER_CANCELLE…
<!-- xgd-tool name="Bash" id="toolu_015uC8CNoQtKKnc6DiexxcJX" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:54:37.964413+00:00" -->

**Input**

```json
{"command":"sed -n 120,160p tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts; grep -n \"ORDER_COMPLETE_SLUG =\\|ORDER_CANCELLED_SLUG =\" -r apps packages --include='*.ts' | grep -v node_modules","description":"Read asOwner helper and slug constants"}
```

**Result**

```
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
packages/framework/src/modules/product-catalog/items.ts:154:export const ORDER_COMPLETE_SLUG = 'order-complete'
packages/framework/src/modules/product-catalog/items.ts:155:export const ORDER_CANCELLED_SLUG = 'order-cancelled'
```

## Bash grep -rn "export function splitBusinessPrefix" -A15 apps/control-app/src/*.ts | head -25
<!-- xgd-tool name="Bash" id="toolu_01XmuTV1v8AcJaZ29PRWGX1Q" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:54:40.471478+00:00" -->

**Input**

```json
{"command":"grep -rn \"export function splitBusinessPrefix\" -A15 apps/control-app/src/*.ts | head -25","description":"Read splitBusinessPrefix"}
```

**Result**

```
apps/control-app/src/scope.ts:291:export function splitBusinessPrefix(pathname: string): {
apps/control-app/src/scope.ts-292-  businessId: string | null
apps/control-app/src/scope.ts-293-  path: string
apps/control-app/src/scope.ts-294-} {
apps/control-app/src/scope.ts-295-  if (!pathname.startsWith(BUSINESS_PREFIX)) return { businessId: null, path: pathname }
apps/control-app/src/scope.ts-296-  const rest = pathname.slice(BUSINESS_PREFIX.length)
apps/control-app/src/scope.ts-297-  const slash = rest.indexOf('/')
apps/control-app/src/scope.ts-298-  // `/b/<id>` with no trailing slash names a business and no path; the route
apps/control-app/src/scope.ts-299-  // table expects a leading slash on everything, so it gets `/`.
apps/control-app/src/scope.ts-300-  const raw = slash === -1 ? rest : rest.slice(0, slash)
apps/control-app/src/scope.ts-301-  const path = slash === -1 ? '/' : rest.slice(slash)
apps/control-app/src/scope.ts-302-  if (raw === '') return { businessId: null, path: pathname }
apps/control-app/src/scope.ts-303-  return { businessId: decodeURIComponent(raw), path }
apps/control-app/src/scope.ts-304-}
apps/control-app/src/scope.ts-305-
apps/control-app/src/scope.ts-306-/**
```

## Bash python3 - <<'EOF' p='tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts' s=open(p).read() start=s.index(" it('test…
<!-- xgd-tool name="Bash" id="toolu_015qHjguaoAzYMHQBA22Z7wL" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:54:54.230537+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts'\ns=open(p).read()\nstart=s.index(\"  it('test_UAT_FC_BUG-367_draft_start_tells_the_owner_and_takes_no_money'\")\nend=s.index(\"  it('test_UAT_FC_BUG-367_single_rate_shop_asks_no_country\")\nnew='''  // [[BUG-368]] — supersedes BUG-367's \"the draft never takes money\": the draft's\n  // checkout is the published site's, returning to the preview's own pages.\n  it('test_UAT_FC_BUG-368_draft_start_opens_payment_like_the_published_site', async () => {\n    const stripe = fakeStripe()\n    vi.stubGlobal('fetch', stripe.fetch)\n    const shop = await aShop(stripe)\n    const before = await orderCount(shop.tenant)\n\n    const quote = await draft(shop, 'quote', { lines: LAMP, country: 'GB' })\n    const started = await draft(shop, 'start', { lines: LAMP, country: 'GB', total: quote.body!.quote.total })\n    expect(started.status).toBe(200)\n    expect(started.body!.notice).toBeUndefined()\n    expect(started.text).not.toContain('Payment opens on your published site')\n    expect(started.body!.url).toMatch(/^https:\\\\/\\\\/checkout\\\\.stripe\\\\.com\\\\//)\n    const orderId = started.body!.order as string\n    expect(orderId).toBeTruthy()\n\n    // A real pending order and a real Checkout session, on the shop's account.\n    expect(await orderCount(shop.tenant)).toBe(before + 1)\n    expect(await orderRow(orderId)).toMatchObject({ status: 'pending', total: 2799, ship_country: 'GB' })\n    const session = stripe.sessionCalls().at(-1)!\n    expect(session.account).toBe(shop.accountId)\n    const base = `https://app.example/preview/${shop.site}/draft/`\n    expect(session.form.get('success_url')).toBe(`${base}order-complete?order=${orderId}`)\n    expect(session.form.get('cancel_url')).toBe(`${base}order-cancelled?order=${orderId}`)\n    expect(await availability(shop.lampId)).toBe(0)\n\n    // The preview's complete and cancelled pages reach the same order.\n    const status = await draft(shop, 'status', { order: orderId })\n    expect(status.status).toBe(200)\n    expect(status.body!.order).toMatchObject({ status: 'pending' })\n    const cancelled = await draft(shop, 'cancel', { order: orderId })\n    expect(cancelled.status).toBe(200)\n    expect(await availability(shop.lampId)).toBe(1)\n  })\n\n  it('test_UAT_FC_BUG-368_draft_return_urls_keep_the_business_prefix', async () => {\n    const stripe = fakeStripe()\n    vi.stubGlobal('fetch', stripe.fetch)\n    const shop = await aShop(stripe)\n    const path = `/b/${encodeURIComponent(shop.tenant)}/preview/${shop.site}/draft/api/checkout`\n    const quote = await asOwner(shop.tenant, 'POST', `${path}/quote`, { lines: LAMP, country: 'FR' })\n    const total = ((await quote.json()) as Record<string, any>).quote.total\n    const started = await asOwner(shop.tenant, 'POST', `${path}/start`, { lines: LAMP, country: 'FR', total })\n    expect(started.status).toBe(200)\n    const orderId = ((await started.json()) as Record<string, any>).order\n    expect(stripe.sessionCalls().at(-1)!.form.get('success_url')).toBe(\n      `https://app.example/b/${encodeURIComponent(shop.tenant)}/preview/${shop.site}/draft/order-complete?order=${orderId}`,\n    )\n  })\n\n'''\ns=s[:start]+new+s[end:]\ns=s.replace(\"import { checkoutIntake, PREVIEW_PAYMENT_NOTICE } from '../apps/control-app/src/checkout-intake'\",\"import { checkoutIntake } from '../apps/control-app/src/checkout-intake'\")\ns=s.replace(\" * [[BUG-367]] — the builder's draft checkout reaches its quote, never takes\\n * money, and a shop whose countries all cost the same asks no country.\",\n \" * [[BUG-367]] — the builder's draft checkout reaches its quote, and a shop whose\\n * countries all cost the same asks no country. [[BUG-368]] — and starts payment\\n * exactly as the published site does.\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"order:\\|order\\b\" apps/control-app/src/orders.ts | grep -n \"return {\" | head -3; grep -n \"^export async function startCheckout\" -A5 apps/control-app/src/orders.ts; grep -n \"return { url\\|return {$\" apps/control-app/src/orders.ts | head","description":"Replace superseded notice UAT with BUG-368 UATs"}
```

**Result**

```
14:583:  if (order.status !== 'pending') return { status: order.status }
428:export async function startCheckout(
429-  env: OrdersEnv,
430-  input: StartCheckoutInput,
431-  options: { fetch?: Fetch; now?: number } = {},
432-): Promise<{ url: string; orderId: string; number: number }> {
433-  const businessId = await businessOfSiteKey(env, input.siteKey)
126:  return {
324:      return {
511:    return { url: session.url, orderId, number }
608:  return {
835:  return {
```

## Bash sed -i '' -e "s/const orderId = started.body!.order as string/const orderId = started.body!.orderId as string/" -e "s/co…
<!-- xgd-tool name="Bash" id="toolu_01LPreJnHJHeSvjEffiMwDdU" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:00.012912+00:00" -->

**Input**

```json
{"command":"sed -i '' -e \"s/const orderId = started.body!.order as string/const orderId = started.body!.orderId as string/\" -e \"s/const orderId = ((await started.json()) as Record<string, any>).order\\$/const orderId = ((await started.json()) as Record<string, any>).orderId/\" -e \"/expect(status.body!.order).toMatchObject({ status: 'pending' })/d\" tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts; grep -n \"orderId =\" tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts; sed -n 75,100p tests/test_UAT_FC_BUG-367_checkout_page.test.ts","description":"Fix orderId field; read client notice test"}
```

**Result**

```
336:    const orderId = started.body!.orderId as string
366:    const orderId = ((await started.json()) as Record<string, any>).orderId
401:    const orderId = started.body.orderId as string
    const d = page(await render(MIXED))
    const button = d.querySelector('button[data-checkout-control="continue"]') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ quote: QUOTE }), { status: 200 }))
    ;(d.querySelector('select[data-checkout-control="ship-to"]') as HTMLSelectElement).value = 'FR'
    await initCheckout(d.querySelector('[data-checkout="checkout"]')!)
    expect(button.disabled).toBe(false)
  })

  it('test_UAT_FC_BUG-367_draft_start_shows_the_owner_notice', async () => {
    const d = page(await render(MIXED))
    const notice = 'Payment opens on your published site. Only you see this.'
    const answers: Record<string, unknown> = { quote: { quote: QUOTE }, start: { notice, quote: QUOTE } }
    vi.stubGlobal('fetch', async (url: string) => new Response(JSON.stringify(answers[String(url).split('/').pop()!]), { status: 200 }))
    ;(d.querySelector('select[data-checkout-control="ship-to"]') as HTMLSelectElement).value = 'FR'
    await initCheckout(d.querySelector('[data-checkout="checkout"]')!)
    const button = d.querySelector('button[data-checkout-control="continue"]') as HTMLButtonElement
    button.click()
    await new Promise((r) => setTimeout(r, 10))
    expect(d.querySelector('[data-checkout-control="message"]')!.textContent).toBe(notice)
    expect(button.hidden).toBe(false)
  })

  it('test_UAT_FC_BUG-367_single_rate_shop_draws_no_ship_to_and_quotes_that_rate', async () => {
    const d = page(await render(SINGLE))
    expect(d.querySelector('select[data-checkout-control="ship-to"]')).toBeNull()
```

## Bash python3 - <<'EOF' p='tests/test_UAT_FC_BUG-367_checkout_page.test.ts' s=open(p).read() a=s.index(" it('test_UAT_FC_BUG-3…
<!-- xgd-tool name="Bash" id="toolu_01RzyDGZNjLqcQquK2NreMVJ" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:04.702793+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-367_checkout_page.test.ts'\ns=open(p).read()\na=s.index(\"  it('test_UAT_FC_BUG-367_draft_start_shows_the_owner_notice'\")\nb=s.index(\"  it('test_UAT_FC_BUG-367_single_rate_shop_draws_no_ship_to\")\ns=s[:a]+s[b:]\nopen(p,'w').write(s)\nEOF\ncd packages/framework && ../../node_modules/.bin/tsc --noEmit -p . 2>&1 | head -20","description":"Remove notice client test; typecheck framework","timeout":300000}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368 && cat package.json | grep -n…
<!-- xgd-tool name="Bash" id="toolu_01M7KyQDzJwWWRVmsrW5LTBP" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:09.935918+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368 && cat package.json | grep -n \"typecheck\\|\\\"test\" | head; for d in tools/generate apps/control-app; do echo \"== $d\"; (cd $d && ../../node_modules/.bin/tsc --noEmit -p . 2>&1 | head -10); done","description":"Typecheck generate and control-app","timeout":600000}
```

**Result**

```
12:    "test": "vitest run",
18:    "test:browser": "vitest run --config vitest.browser.config.mts"
== tools/generate
../../apps/control-app/src/material-import.ts(309,71): error TS2345: Argument of type 'Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'BufferSource'.
  Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'ArrayBufferView<ArrayBuffer>'.
    Types of property 'buffer' are incompatible.
      Type 'ArrayBufferLike' is not assignable to type 'ArrayBuffer'.
        Type 'SharedArrayBuffer' is not assignable to type 'ArrayBuffer'.
          Types of property '[Symbol.toStringTag]' are incompatible.
            Type '"SharedArrayBuffer"' is not assignable to type '"ArrayBuffer"'.
../../apps/control-app/src/zip-reader.ts(156,28): error TS2322: Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'BlobPart'.
  Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'ArrayBufferView<ArrayBuffer>'.
    Types of property 'buffer' are incompatible.
== apps/control-app
```

## Bash cd tools/generate && ../../node_modules/.bin/tsc --noEmit -p . 2>&1 | grep -E "^[^ ]" | grep -v "material-import\|zip-re…
<!-- xgd-tool name="Bash" id="toolu_01Th2UE17XRRnu59etmzFeJn" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:20.318193+00:00" -->

**Input**

```json
{"command":"cd tools/generate && ../../node_modules/.bin/tsc --noEmit -p . 2>&1 | grep -E \"^[^ ]\" | grep -v \"material-import\\|zip-reader\" | head","description":"Filter generate typecheck to other errors","timeout":600000}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368 && grep -n "export function c…
<!-- xgd-tool name="Bash" id="toolu_01Qt5i8cp7Z1q3hmKMQiEuUo" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:28.381664+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368 && grep -n \"export function catalogSeed\" -A40 tests/support/catalog-site.ts | head -60","description":"Read catalogSeed fixture shape"}
```

**Result**

```
83:export function catalogSeed(
84-  opts: { slug?: string; grid?: Record<string, unknown>; shopGrid?: Record<string, unknown>; withTemplate?: boolean } = {},
85-): SiteSeed {
86-  const slug = opts.slug ?? nextSlug('catalog')
87-  const pages: Record<string, Record<string, unknown>> = {
88-    'home.json': page('home', 'home', 'Home', 'grid', gridModule(opts.grid ?? LAMP_GRID_RULE)),
89-    'shop.json': page('shop', 'shop', 'Shop', 'grid', gridModule(opts.shopGrid ?? { pageSize: 2, order: 'name' })),
90-    'contact.json': page('contact', 'contact', 'Contact', 'contact', {
91-      id: 'contact',
92-      type: 'contact-form',
93-      version: latestModuleVersion('contact-form'),
94-      config: {
95-        ...CONTACT_FORM_CONFIG,
96-        // REQ-633 — the opening lines an item's links prefill (copy, not code).
97-        prefillField: 'message',
98-        enquiryLine: 'I would like to ask about:',
99-        commissionLine: 'I would like to commission something like:',
100-      },
101-      slots: CONTACT_FORM_SLOTS,
102-    }),
103-  }
104-  if (opts.withTemplate !== false) {
105-    pages['product.json'] = page('product', 'product', 'Product', 'product', {
106-      id: 'product',
107-      type: 'catalog',
108-      version: latestModuleVersion('catalog'),
109-      config: { mode: 'product' },
110-      slots: { 'product-page': PRODUCT_PAGE },
111-    })
112-  }
113-  return siteSeed({ slug, pages })
114-}
115-
116-function item(over: Partial<CatalogItem> & Pick<CatalogItem, 'id' | 'slug' | 'name'>): CatalogItem {
117-  return {
118-    summary: '',
119-    description: `${over.name}, described.`,
120-    collections: [],
121-    categories: ['Lamps'],
122-    attributes: [],
123-    photos: [{ src: `/assets/${over.slug}.png`, alt: over.name }],
```

## Bash grep -n "^function page\|^const page\|function page(" -A20 tests/support/catalog-site.ts | head -30; grep -n "export fun…
<!-- xgd-tool name="Bash" id="toolu_01NyMVhpos6skvzzumHTi9Vs" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:30.075868+00:00" -->

**Input**

```json
{"command":"grep -n \"^function page\\|^const page\\|function page(\" -A20 tests/support/catalog-site.ts | head -30; grep -n \"export function siteSeed\" -A15 tests/support/*.ts | head -25","description":"Read page() and siteSeed helpers"}
```

**Result**

```
65:function page(id: string, slug: string, title: string, slot: string, module: Record<string, unknown>): Record<string, unknown> {
66-  const p = starterHomePage(id, title) as Record<string, unknown>
67-  const l1 = p.l1 as { root: { children: unknown[] } }
68-  l1.root.children.push({ kind: 'slot', name: slot })
69-  return { ...p, id, slug, title, seoMeta: { title, description: `${title} page.` }, modules: [{ ...module, slot }] }
70-}
71-
72-export function gridModule(config: Record<string, unknown>, id = 'grid'): Record<string, unknown> {
73-  return {
74-    id,
75-    type: 'catalog',
76-    version: latestModuleVersion('catalog'),
77-    config: { mode: 'grid', ...config },
78-    slots: { card: CARD, list: LIST, pager: PAGER },
79-  }
80-}
81-
82-/** A site: home (a grid), shop (a second grid), product (the template), contact (the form). */
83-export function catalogSeed(
84-  opts: { slug?: string; grid?: Record<string, unknown>; shopGrid?: Record<string, unknown>; withTemplate?: boolean } = {},
85-): SiteSeed {
tests/support/site-seed.ts:86:export function siteSeed(opts: SiteSeedOptions = {}): SiteSeed {
tests/support/site-seed.ts-87-  const slug = opts.slug ?? nextSlug()
tests/support/site-seed.ts-88-  const siteJson = { ...(opts.siteJson ?? starterSiteJson(slug)), ...(opts.patchSiteJson ?? {}) }
tests/support/site-seed.ts-89-  return {
tests/support/site-seed.ts-90-    slug,
tests/support/site-seed.ts-91-    siteJson,
tests/support/site-seed.ts-92-    pages: opts.pages ?? { 'home.json': starterHomePage(slug) },
tests/support/site-seed.ts-93-    assets: opts.assets ?? {},
tests/support/site-seed.ts-94-  }
tests/support/site-seed.ts-95-}
```

## Bash grep -n "textAlign" packages/site-schema/src/l1/schema.ts | head
<!-- xgd-tool name="Bash" id="toolu_01VwUWiRqXu3cEfs2uCJQo2a" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:36.413699+00:00" -->

**Input**

```json
{"command":"grep -n \"textAlign\" packages/site-schema/src/l1/schema.ts | head","description":"Check which L1 nodes accept textAlign"}
```

**Result**

```
2136:    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
```

## Bash grep -n "textAlignSchema\|const boxAxes\|containerAxes\|const textAxes\|surfaceAxes" packages/site-schema/src/l1/schema.…
<!-- xgd-tool name="Bash" id="toolu_01HdnvahHzWn9gMF5YbLu8Q1" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:37.586262+00:00" -->

**Input**

```json
{"command":"grep -n \"textAlignSchema\\|const boxAxes\\|containerAxes\\|const textAxes\\|surfaceAxes\" packages/site-schema/src/l1/schema.ts | head -20","description":"Find which axes groups include textAlign"}
```

**Result**

```
991:const surfaceAxesShape = {
1061:export const l1SurfaceAxesSchema = z.object(surfaceAxesShape).strict()
1155:  ...surfaceAxesShape,
2221:    ...surfaceAxesShape,
2238:    ...surfaceAxesShape,
```

## Bash sed -n 2120,2135p packages/site-schema/src/l1/schema.ts; sed -n 2215,2245p packages/site-schema/src/l1/schema.ts
<!-- xgd-tool name="Bash" id="toolu_013rx2qSVe5FopAeKtsbEZkZ" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:39.183587+00:00" -->

**Input**

```json
{"command":"sed -n 2120,2135p packages/site-schema/src/l1/schema.ts; sed -n 2215,2245p packages/site-schema/src/l1/schema.ts","description":"Read text and group axes schemas"}
```

**Result**

```
    role: l1TypeRoleSchema.optional(),
    ...l1TypeAxesShape,
  })
  .strict()

// ── Leaf axis bags (typed subset of the ~48 captured ValueElement axes) ───────

/** Text-run axes — literal values transcribed straight from a capture. */
export const l1TextAxesSchema = z
  .object({
    color: l1Color.optional(),
    fontFamily: z.string().min(1).optional(),
    fontSizePx: finite.optional(),
    fontWeight: finite.optional(),
    lineHeightPx: finite.optional(),
    letterSpacingPx: finite.optional(),
    // fuses "a styled run" and "a painted surface" into one element, but L1 once
    // forced them into disjoint `text` / `box` leaves — so a badge folded to a
    // text leaf lost its pill entirely (radius 0, no shadow). Since REQ-98 the
    // surface a run paints is the SAME group every other kind carries, read as
    // the capture reads it (own computed style, never an ancestor walk — that is
    // the enclosing card's treatment, which stays on the card box).
    ...surfaceAxesShape,
  })
  .strict()

/** Image axes — how the media fills its box, plus the shared painted surface. */
export const l1ImageAxesSchema = z
  .object({
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    /**
     * REQ-136 — which part of the picture the box shows. Image-only, and
     * deliberately not hoisted into the shared surface group: the property family
     * differs (`object-position` frames replaced content, `background-position`
     * frames a paint layer), and a surface's background is still pinned to
     * `center` by BUG-13's `cover / center / no-repeat`. Unpinning that is the
     * same axis on a different family, and it is phase 2.
     */
    objectPosition: l1ObjectPositionSchema.optional(),
    ...surfaceAxesShape,
  })
  .strict()

// ── The shared node-level axis groups (REQ-105) ───────────────────────────────
//
// REQ-98 hoisted *paint* into one shape spread into every kind. The node-level
// groups below — the ones that answer "where is this box, how big is it, is it
```

## Bash grep -n "l1TypeAxesShape = " -A25 packages/site-schema/src/l1/schema.ts | grep -n "textAlign\|shape\|}"; grep -n "type\.…
<!-- xgd-tool name="Bash" id="toolu_011WESGMQbYGea2iAoEk2UVb" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:42.612881+00:00" -->

**Input**

```json
{"command":"grep -n \"l1TypeAxesShape = \" -A25 packages/site-schema/src/l1/schema.ts | grep -n \"textAlign\\|shape\\|}\"; grep -n \"type\\.textAlign\\|\\.type?\\.\\|inheritType\\|typeAxes\" packages/framework/src/l1/render.ts packages/site-schema/src/l1/design.ts | head -20","description":"Check group type axes inheritance"}
```

**Result**

```
8:2073-}
packages/site-schema/src/l1/design.ts:655:    role: (r: string) => design?.type?.[r as L1TypeRole] !== undefined,
packages/site-schema/src/l1/design.ts:1169:      ? [{ kind: 'text', id: 'header-location', text: location, ...(design.type?.small ? { role: 'small' } : {}) }]
packages/site-schema/src/l1/design.ts:1226:  if (place.part !== 'header' || links === undefined || design.type?.[links] === undefined) return input
```

## Bash sed -n 2060,2075p packages/site-schema/src/l1/schema.ts; grep -n "node.type\b\|\.type\.textAlign\|group.*type" packages/…
<!-- xgd-tool name="Bash" id="toolu_01Ng4VtAHMoTqWdWeqbjfmhh" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:55:44.307295+00:00" -->

**Input**

```json
{"command":"sed -n 2060,2075p packages/site-schema/src/l1/schema.ts; grep -n \"node.type\\b\\|\\.type\\.textAlign\\|group.*type\" packages/framework/src/l1/render.ts | head -15","description":"Inspect group type axes and renderer use"}
```

**Result**

```
 * that vary across the ladder. The same axes, units and ranges as a text run's
 * own (see {@link l1TextAxesSchema}), so a style is a value a run could have
 * carried literally and resolving one is a substitution, never an
 * interpretation. Bounded here as well as at the run, because a style that no
 * run uses yet is still part of the site and must still be a legal value.
 */
const l1TypeAxesShape = {
  fontFamily: z.string().min(1).optional(),
  fontSizePx: z.number().min(1).max(400).optional(),
  fontWeight: z.number().min(1).max(1000).optional(),
  lineHeightPx: z.number().min(-10_000).max(100_000).optional(),
  letterSpacingPx: z.number().min(-10_000).max(100_000).optional(),
  responsive: l1TextResponsiveSchema.optional(),
}

/**
```

## Bash python3 - <<'EOF' src=open('tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts').read() head=src[src.index("…
<!-- xgd-tool name="Bash" id="toolu_015c78Qjo6gyshaNWp4F6FDM" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:56:08.069764+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\nsrc=open('tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts').read()\nhead=src[src.index(\"import { createRequire }\"):src.index(\"type Box = \")]\nhead=head.replace(\"import { catalogItems, catalogSeed } from './support/catalog-site'\",\"import { catalogItems, catalogSeed } from './support/catalog-site'\\nimport { latestModuleVersion } from '../packages/framework/src/modules/catalog'\")\nhead=head.replace(\"\"\"  const seed = catalogSeed()\n\"\"\",\"\"\"  const seed = catalogSeed()\n  // A site's own checkout page: its template draws Continue inside a filled box\n  // that spans the column, and places no Cancel.\n  const contact = structuredClone(seed.pages['contact.json']) as Record<string, any>\n  seed.pages['checkout.json'] = {\n    ...contact,\n    id: 'checkout',\n    slug: 'checkout',\n    title: 'Checkout',\n    seoMeta: { title: 'Checkout', description: 'Checkout page.' },\n    modules: [{ id: 'checkout', type: 'checkout', version: latestModuleVersion('checkout'), slot: 'contact', config: { mode: 'checkout' }, slots: { page: TEMPLATE } }],\n  }\n\"\"\")\nhead=head.replace(\"type Page = import('playwright').Page\",\"\"\"type Page = import('playwright').Page\n\nconst TEMPLATE = {\n  id: 'own-checkout',\n  kind: 'container',\n  layout: 'stack',\n  space: 'md',\n  children: [\n    { id: 'own-ship-to', kind: 'control', control: 'ship-to', role: 'body' },\n    { id: 'own-message', kind: 'control', control: 'message', role: 'small' },\n    {\n      id: 'own-continue-box',\n      kind: 'box',\n      axes: { surfaceFill: '#222222', borderRadiusPx: 4 },\n      padding: { topPx: 8, rightPx: 8, bottomPx: 8, leftPx: 8 },\n      spaceBelow: 16,\n      children: [\n        {\n          id: 'own-continue',\n          kind: 'control',\n          control: 'continue',\n          role: 'label',\n          axes: { color: '#ffffff', surfaceFill: '#222222' },\n          padding: { topPx: 12, rightPx: 28, bottomPx: 12, leftPx: 28 },\n        },\n      ],\n    },\n  ],\n}\"\"\")\nbody='''type Box = { x: number; y: number; width: number; height: number }\n\n/** Continue's button (the site's filled box), its label, the visible Cancel and the actions' column. */\nasync function measure(page: Page) {\n  return page.evaluate(() => {\n    const box = (el: Element) => {\n      const r = el.getBoundingClientRect()\n      return { x: r.x, y: r.y, width: r.width, height: r.height }\n    }\n    const visible = (el: Element) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0\n    const cont = document.querySelector('button[data-checkout-control=\"continue\"]')!\n    const button = document.getElementById('own-continue-box')!\n    const range = document.createRange()\n    range.selectNodeContents(cont)\n    return {\n      button: box(button),\n      label: box(range),\n      column: box(button.parentElement!),\n      form: box(document.getElementById('own-checkout')!),\n      cancels: [...document.querySelectorAll('a[data-checkout-control=\"cancel\"]')].filter(visible).map(box),\n    }\n  })\n}\n\nconst centre = (b: Box) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })\n\ndescribe(\"BUG-368 — a site's own checkout page draws the checkout's actions\", () => {\n  itBrowser('test_UAT_FC_BUG-368_own_template_actions_sit_right_sized_to_their_labels', async () => {\n    await withPage(1024, async (page) => {\n      const m = await measure(page)\n      expect(m.button.width).toBeLessThan(m.form.width / 2)\n      expect(Math.abs(m.button.x + m.button.width - (m.form.x + m.form.width))).toBeLessThanOrEqual(1)\n      expect(m.cancels).toHaveLength(1)\n      const cancel = m.cancels[0] as Box\n      expect(cancel.x + cancel.width).toBeLessThanOrEqual(m.button.x)\n      expect(Math.abs(cancel.y - m.button.y)).toBeLessThanOrEqual(1)\n      expect(Math.abs(cancel.height - m.button.height)).toBeLessThanOrEqual(1)\n      expect(Math.abs(centre(m.label).x - centre(m.button).x)).toBeLessThanOrEqual(1)\n    })\n  })\n\n  itBrowser('test_UAT_FC_BUG-368_own_template_actions_stack_full_width_on_a_phone', async () => {\n    await withPage(375, async (page) => {\n      const m = await measure(page)\n      expect(Math.abs(m.button.width - m.form.width)).toBeLessThanOrEqual(1)\n      expect(m.cancels).toHaveLength(1)\n      const cancel = m.cancels[0] as Box\n      expect(Math.abs(cancel.width - m.form.width)).toBeLessThanOrEqual(1)\n      expect(cancel.y).toBeGreaterThan(m.button.y)\n      // The label sits in the middle of the full-width button, across and down.\n      expect(Math.abs(centre(m.label).x - centre(m.button).x)).toBeLessThanOrEqual(1)\n      expect(Math.abs(centre(m.label).y - centre(m.button).y)).toBeLessThanOrEqual(1)\n    })\n  })\n})\n'''\ndoc='''/**\n * [[BUG-368]] — a site's OWN checkout page, as real Chromium lays it out. Its\n * template places Continue inside a filled box spanning the column and no\n * Cancel; the page is drawn with BUG-367's action row all the same: the button\n * label-sized at the right from a tablet's width, Cancel to its left at the same\n * height, both full width on a phone, and the label centred in the button.\n */\n\n'''\nopen('tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts','w').write(doc+head+body)\nEOF\ngrep -n \"export function latestModuleVersion\" packages/framework/src/modules/*.ts; grep -n \"latestModuleVersion\" tests/support/catalog-site.ts | head -2","description":"Write BUG-368 Chromium UAT"}
```

**Result**

```
packages/framework/src/modules/catalog.ts:53:export function latestModuleVersion(id: string): number {
1:import { latestModuleVersion } from '../../packages/framework/src/worker'
76:    version: latestModuleVersion('catalog'),
```

## Bash grep -n "include\|exclude" vitest.config.mts vitest.node.config.mts vitest.browser.config.mts | head -20; cat ~/.claude-…
<!-- xgd-tool name="Bash" id="toolu_01B66VPpH3FZKbeoeGQ9FGu7" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:56:15.190219+00:00" -->

**Input**

```json
{"command":"grep -n \"include\\|exclude\" vitest.config.mts vitest.node.config.mts vitest.browser.config.mts | head -20; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/test-harness-gotchas.md | grep -i \"chromium\\|browser\" | head","description":"Find which config runs chromium tests"}
```

**Result**

```
vitest.browser.config.mts:6: * `sandbox.excluded_commands` entry lets launch Chromium outside the sandbox.
vitest.browser.config.mts:10:    include: ['tests/browser/**/*.test.ts'],
vitest.config.mts:26: * The node project excludes the directory.
vitest.node.config.mts:65:// The include/exclude pair is the whole routing convention: `*.workers.test.ts`
vitest.node.config.mts:71:    include: ['tests/**/*.test.ts'],
vitest.node.config.mts:72:    exclude: ['tests/**/*.workers.test.ts', 'tests/browser/**'],
description: Hub of vitest / jsdom / Chromium / scripted-model test-harness gotchas in 1stcontact.
- [[slow-tools-not-enabled-without-browser]] — `launch: fakeBrowser()`.
- [[chromium-cannot-launch-in-sandbox]] — `--single-process` runs gated suites.
- [[real-video-in-chromium-tests]] — record WebM with MediaRecorder.
- [[real-http-server-for-chromium-tests]] — `--host-resolver-rules=MAP *`.
```

## Bash cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-cannot-launch-in-sandbox.md | tail -15
<!-- xgd-tool name="Bash" id="toolu_01E6ZcZHkkfsdJuyakaSWd1P" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:56:17.789101+00:00" -->

**Input**

```json
{"command":"cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-cannot-launch-in-sandbox.md | tail -15","description":"Read chromium sandbox memory"}
```

**Result**

```
**The exact cause (re-probed 2026-11-02):** `bootstrap_check_in` is a Seatbelt **mach-register** (publishing a Mach service), not a mach-lookup. The interactive role's `mach_lookup: 'on'` (permissions.yaml, BUG-1202 → `allowMachLookup: ["*"]`) does NOT cover it, and the probe still fails with it on. The full fix is to run browser tests outside the sandbox through a narrow `sandbox.excluded_commands` entry in main's `.xgd/permissions.yaml` (operator-owned, self-protected). `--single-process` is only the degraded workaround.

**Why:** found in REQ-452 (2026-10-24) when `1c eval-builder run`'s layout check returned `{}`, which read as "zero findings".

**But `launchAnyChromium` from `tests/support/chromium.ts` does start** (its degraded single-process fallback), so REQ-447-style rendered checks run in the sandbox. To run a `checkLayoutAt` check here, hand it a driver factory built on `launchAnyChromium` (`navigate`/`query`/`close`) in a throwaway test file (REQ-456, 2026-10-24).

**Simpler, and covers the `engineAvailable('chromium')`-gated suites too (which otherwise skip silently):** `export CHROMIUM_LAUNCH_ARGS=--single-process` before `vitest run`. `browserLaunchOptions` reads it, so `engineAvailable` and `createPlaywrightDriver` both launch. Used for BUG-281 (2026-10-25) across all 22 gated layout suites. Several of those (REQ-415, REQ-418, BUG-237, BUG-276) were already red on clean working from `edge_distance`, so baseline before blaming a diff.

**External sites still fail:** with `--single-process`, `1c capture page <live url>` launches but navigation gets `net::ERR_ACCESS_DENIED`, because Chromium bypasses the sandbox's HTTP proxy. Live-site captures go to the operator (2026-10-25, DOC-69).

**One context per browser in the degraded mode.** A `--single-process` browser from `launchAnyChromium` dies (SIGTRAP, "Target page, context or browser has been closed") on the SECOND `newContext()`/`newPage()` once the first context has closed. Probe once at collection, then launch a fresh browser per test and close the browser rather than the context (BUG-299, 2026-10-26).

**WebKit doesn't run here at all.** 1st Contact's Playwright 1.61 wants `webkit-2311`, which isn't installed. The xgd venv's Python Playwright 1.62 driver (`xgd/.venv-working/lib/python3.12/site-packages/playwright/driver/package`, requirable from Node) matches the installed `webkit-2336` and launches, but `newPage()` always fails with "Target page, context or browser has been closed" and logs nothing. Safari-only bugs go to the operator (BUG-321, 2026-10-31). For a caret check in Chromium, compare `el.screenshot({caret:'initial'})` against `{caret:'hide'}`. A collapsed Range before a `<br>` has no client rects, so measuring the Range reads 0 whether or not a caret is drawn.

**How to apply:** don't treat an empty layout or picture result from a sandboxed run as evidence. Hand browser-path verification to the operator, and make code report "not looked" (null plus a note) rather than an empty count. Related: [[slow-tools-not-enabled-without-browser]].
```

## Bash export CHROMIUM_LAUNCH_ARGS=--single-process; node_modules/.bin/vitest run --config vitest.node.config.mts tests/test_UA…
<!-- xgd-tool name="Bash" id="toolu_01EtJjMH68QEXiZ8RdRnBwAs" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:56:21.849652+00:00" -->

**Input**

```json
{"command":"export CHROMIUM_LAUNCH_ARGS=--single-process; node_modules/.bin/vitest run --config vitest.node.config.mts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts 2>&1 | tail -40","description":"Run chromium and checkout page UATs","timeout":600000}
```

**Result**

```
 ❯ |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts (2 tests | 2 failed) 392ms
     × test_UAT_FC_BUG-368_own_template_actions_sit_right_sized_to_their_labels 258ms
     × test_UAT_FC_BUG-368_own_template_actions_stack_full_width_on_a_phone 134ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_own_template_actions_sit_right_sized_to_their_labels
Error: /pages/0/modules/0/slots/page/space: a design reference must name something the design of the site defines: the space step 'md' is not in the site's design; /pages/0/modules/0/slots/page/children/1/role: a design reference must name something the design of the site defines: the type role 'small' is not in the site's design; /pages/0/modules/0/slots/page/children/2/children/0/role: a design reference must name something the design of the site defines: the type role 'label' is not in the site's design
 ❯ siteFiles tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts:82:25
     80|   store.seed(seed.slug, seed)
     81|   const loaded = (await store.loadDraft(seed.slug))!.result
     82|   if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}:…
       |                         ^
     83|   const catalog: SiteCatalog = { items: catalogItems(), canTakePayment…
     84|   return new Map((await renderSiteFiles(loaded.value, { catalog })).fi…
 ❯ withPage tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts:94:19
 ❯ tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts:139:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_own_template_actions_stack_full_width_on_a_phone
Error: /pages/0/modules/0/slots/page/space: a design reference must name something the design of the site defines: the space step 'md' is not in the site's design; /pages/0/modules/0/slots/page/children/1/role: a design reference must name something the design of the site defines: the type role 'small' is not in the site's design; /pages/0/modules/0/slots/page/children/2/children/0/role: a design reference must name something the design of the site defines: the type role 'label' is not in the site's design
 ❯ siteFiles tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts:82:25
     80|   store.seed(seed.slug, seed)
     81|   const loaded = (await store.loadDraft(seed.slug))!.result
     82|   if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}:…
       |                         ^
     83|   const catalog: SiteCatalog = { items: catalogItems(), canTakePayment…
     84|   return new Map((await renderSiteFiles(loaded.value, { catalog })).fi…
 ❯ withPage tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts:94:19
 ❯ tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts:153:5

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯


 Test Files  1 failed | 2 passed (3)
      Tests  2 failed | 9 passed (11)
   Start at  17:56:23
   Duration  2.81s (transform 2.14s, setup 0ms, import 4.81s, tests 1.42s, environment 0ms)
```

## Bash F=tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; sed -i '' -e "s/ space: 'md',$/ gapPx: 16,/" -e "s/con…
<!-- xgd-tool name="Bash" id="toolu_01TdofB9SfcyLnDnzXasYXER" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:56:32.574058+00:00" -->

**Input**

```json
{"command":"F=tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; sed -i '' -e \"s/  space: 'md',$/  gapPx: 16,/\" -e \"s/control: 'message', role: 'small' }/control: 'message' }/\" -e \"s/control: 'ship-to', role: 'body' }/control: 'ship-to' }/\" -e \"/          role: 'label',/d\" $F; grep -n \"gapPx\" packages/site-schema/src/l1/schema.ts | head -2; export CHROMIUM_LAUNCH_ARGS=--single-process; node_modules/.bin/vitest run --config vitest.node.config.mts $F 2>&1 | grep -E \"✓|×|Error|expected|Tests\" | head -20","description":"Remove design refs and rerun new UAT","timeout":600000}
```

**Result**

```
381: * - `gap` — one uniform `gapPx` between every pair. For card grids, image rows,
384: * Unset, a container with a `gapPx` uses `gap`; a `stack` holding text with no
     × test_UAT_FC_BUG-368_own_template_actions_sit_right_sized_to_their_labels 212ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected 223.21875 to be less than 169.5546875
      Tests  1 failed | 1 passed (2)
```

## Bash F=tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; sed -i '' "s| expect(m.button.width).toBeLessThan(m.fo…
<!-- xgd-tool name="Bash" id="toolu_01A1UvCUuwnhBbZ48sk6xnnf" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:56:42.066266+00:00" -->

**Input**

```json
{"command":"F=tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; sed -i '' \"s|      expect(m.button.width).toBeLessThan(m.form.width / 2)|      console.log('M1024', JSON.stringify(m))\\n      expect(m.button.width).toBeLessThan(m.form.width / 2)|\" $F; export CHROMIUM_LAUNCH_ARGS=--single-process; node_modules/.bin/vitest run --config vitest.node.config.mts $F -t right_sized 2>&1 | grep M1024","description":"Print desktop measurements","timeout":600000}
```

**Result**

```
M1024 {"button":{"x":458.328125,"y":226,"width":223.21875,"height":58},"label":{"x":494.328125,"y":246,"width":151.21875,"height":18},"column":{"x":342.4375,"y":226,"width":339.109375,"height":58},"form":{"x":342.4375,"y":176,"width":339.109375,"height":108},"cancels":[{"x":342.4375,"y":226,"width":107.890625,"height":58}]}
    140|       console.log('M1024', JSON.stringify(m))
```

## Bash F=tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; python3 - <<'EOF' p='tests/test_UAT_FC_BUG-368_checkou…
<!-- xgd-tool name="Bash" id="toolu_01A6tX8Ro4WKRXCMUJFCNCfT" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:56:53.064088+00:00" -->

**Input**

```json
{"command":"F=tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts'\ns=open(p).read()\ns=s.replace(\"\"\"      console.log('M1024', JSON.stringify(m))\n      expect(m.button.width).toBeLessThan(m.form.width / 2)\n\"\"\",\"\"\"      // As wide as its label: the label plus the button's and its box's padding.\n      expect(Math.abs(m.button.width - (m.label.width + 2 * 28 + 2 * 8))).toBeLessThanOrEqual(1)\n      expect(m.button.width).toBeLessThan(m.form.width)\n\"\"\")\nopen(p,'w').write(s)\nEOF\nexport CHROMIUM_LAUNCH_ARGS=--single-process; node_modules/.bin/vitest run --config vitest.node.config.mts $F tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts 2>&1 | grep -E \"✓|×|Tests\" | head","description":"Fix assertion and rerun chromium UATs","timeout":600000}
```

**Result**

```
      Tests  6 passed (6)
```

## Bash C=packages/framework/src/modules/checkout/component.ts; cp $C $TMPDIR/bug368-component.ts; sed -i '' "s/? checkoutAction…
<!-- xgd-tool name="Bash" id="toolu_013wgB3BtSaZcYzHr49pemkw" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:57:02.181936+00:00" -->

**Input**

```json
{"command":"C=packages/framework/src/modules/checkout/component.ts; cp $C $TMPDIR/bug368-component.ts; sed -i '' \"s/? checkoutActions(authored, design) : authored/? authored : authored/\" $C; export CHROMIUM_LAUNCH_ARGS=--single-process; node_modules/.bin/vitest run --config vitest.node.config.mts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts 2>&1 | grep -E \"✓|×|Tests\"; cp $TMPDIR/bug368-component.ts $C; git diff --stat $C","description":"Confirm new UAT fails without the fix","timeout":600000}
```

**Result**

```
     × test_UAT_FC_BUG-368_own_template_actions_sit_right_sized_to_their_labels 199ms
     × test_UAT_FC_BUG-368_own_template_actions_stack_full_width_on_a_phone 457ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
      Tests  2 failed (2)
 packages/framework/src/modules/checkout/component.ts | 9 +++++++--
 1 file changed, 7 insertions(+), 2 deletions(-)
```

## Bash python3 - <<'EOF' p='tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts' s=open(p).read() s=s.replace("impor…
<!-- xgd-tool name="Bash" id="toolu_01BCdceghYq46yWhmnkJHsVY" turn="bdf0552e297046979eef40e743d29cda" ts="2026-11-06T01:57:14.024680+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts'\ns=open(p).read()\ns=s.replace(\"import { latestModuleVersion } from '../packages/framework/src/modules/catalog'\",\"import { latestModuleVersion } from '../packages/framework/src/modules/catalog'\\nimport { checkoutActions } from '../packages/framework/src/l2/checkout'\\nimport type { L1Node } from '../packages/site-schema/src/index'\")\ns=s.rstrip()\nassert s.endswith('})')\ns=s[:-2]+'''\n  it('test_UAT_FC_BUG-368_a_template_placing_its_own_cancel_keeps_its_placement', () => {\n    const own = {\n      ...TEMPLATE,\n      children: [...TEMPLATE.children, { id: 'own-cancel', kind: 'control', control: 'cancel' }],\n    } as unknown as L1Node\n    expect(checkoutActions(own)).toBe(own)\n    // Without one, the row stands where the box stood, and holds that box.\n    const drawn = checkoutActions(TEMPLATE as unknown as L1Node) as unknown as typeof TEMPLATE\n    const row = drawn.children[2] as unknown as { layout: string; spaceBelow: number; children: Array<{ control?: string; id?: string }> }\n    expect(row.layout).toBe('row')\n    expect(row.spaceBelow).toBe(16)\n    expect(row.children.map((c) => c.control ?? c.id)).toEqual(['cancel', 'own-continue-box', 'cancel'])\n  })\n})\n'''\nopen(p,'w').write(s)\nEOF\nexport CHROMIUM_LAUNCH_ARGS=--single-process; node_modules/.bin/vitest run --config vitest.node.config.mts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts 2>&1 | grep -E \"×|Tests|Error\"; ls vitest.workers.config.mts && node_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts 2>&1 | grep -E \"✓|×|Tests|Error|expected\" | head -30","description":"Add cancel-placement test; run workers UATs","timeout":600000}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug…
<!-- xgd-tool name="Bash" id="toolu_01215eiEA9QJ8frGxSTum9hj" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:11:40.572076+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-5b30954f\"}'; python -m lagrangefoundry.ai.agent_cli AgentHistory --in '{\"session\":\"bug-5b30954f\",\"last\":6}' | head -c 12000","description":"Read session summary and recent history"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv*/bin/python 2>/dev/null; which xgd; cat /Users/martin/.claud…
<!-- xgd-tool name="Bash" id="toolu_01W4nfKzJq1xhHA2nLCtYNor" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:11:45.543305+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv*/bin/python 2>/dev/null; which xgd; cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-ticket-cli-quirks.md /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/worktree-and-store-setup.md","description":"Find venv and read relevant memories"}
```

**Result**

````
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
(eval):1: no matches found: .venv*/bin/python
/Users/martin/.xgd/bin/xgd
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
with the same *"already present at the tip"* message even though the fast-forward
was done correctly. Holding `xgd branch lock` does not prevent it. Run the whole
tail as a retry loop and let it burn version numbers:

```
for attempt in 1 2 3 4 5 6; do
  xgd branch lock <TICKET-ID> >/dev/null 2>&1
  git -C <worktree> merge xgd-working >/dev/null 2>&1
  (cd <worktree> && ./bin/project/xgd_version_bump)
  VER=$(grep '"version"' <worktree>/package.json | sed 's/.*"\([0-9.]*\)".*/\1/')
  git -C <worktree> commit -qam "chore(version): $VER for <TICKET-ID>"
  BUMP=$(git -C <worktree> log --format=%H -1)
  git -C <main> merge --ff-only free-<TICKET-ID> >/dev/null 2>&1
  xgd ticket move-to-free-coded <uid> <work-sha> "$BUMP" --version "$VER" && break
done
```

Versions are cheap; a burnt one costs nothing. Acquiring the lock can itself take
minutes — loop on `xgd branch lock` too (it was held by four different tickets in
one 25-minute window).

**The shell is zsh, which does NOT word-split an unquoted variable.**
`SHAS="a b"; xgd ticket move-to-free-coded $uid $SHAS` passes both SHAs as ONE
argument and fails *"invalid SHA — expected 40 lowercase hex characters"*, which
reads like a typo rather than a quoting bug. Write each SHA as its own literal
argument, or use an array.

**Before merging back, the main checkout may hold uncommitted or untracked files
the branch supersedes** — the merge aborts naming them. Back them up, diff them
against the branch's versions to confirm they are the older copy, then discard.

Never start a `git stash`-based baseline test run while another suite is running
in the same worktree; it removes the files mid-run and corrupts both results.

**2026-10-22 update (BUG-254):** the merge back is no longer a plain `git merge --ff-only`. The xgd-working checkout is sparse, so run `/Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-<TICKET-ID>` from `/Users/martin/lagrangefoundry/1stcontact`; it merges with sparse-checkout off and rematerializes tickets. The path `xgd branch lock` prints (`.venv-working/lib/python3.12/site-packages/bin/xgd-merge`) does not exist. The rest of the order is unchanged: lock → merge xgd-working into the branch → bump → commit → xgd-merge → move-to-free-coded → `xgd branch clean` as its own Bash call.

Related: [[xgd-ticket-json-shape]], [[never-edit-ticket-files-directly]].
---
name: xgd-ticket-cli-quirks
description: "Hub of xgd ticket/report/branch CLI behaviours that surprise: stores, flags, bodies, the free_coded gate."
metadata:
  node_type: memory
  type: reference
  originSessionId: cbdeb153-884f-4f2d-86ad-5f9023f6778e
  modified: 2026-10-25T18
````

[elided — kept 5800 of 9621 bytes]

## Bash head -5 /Users/martin/.xgd/bin/xgd; ls /Users/martin/lagrangefoundry/xgd/.venv*/bin/python 2>/dev/null; git -C /Users/ma…
<!-- xgd-tool name="Bash" id="toolu_01GTqHVHps1oiFS1AFoGuCow" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:11:47.941027+00:00" -->

**Input**

```json
{"command":"head -5 /Users/martin/.xgd/bin/xgd; ls /Users/martin/lagrangefoundry/xgd/.venv*/bin/python 2>/dev/null; git -C /Users/martin/lagrangefoundry/1stcontact branch --list 'free-*' | head; xgd branch list 2>&1 | head -20","description":"Locate xgd python and branches"}
```

**Result**

```
#!/bin/sh
# xgd release shim (REQ-934). A pinned run stays on its release; everything
# else follows the newest deployed release.
root="$HOME/.xgd/releases"
if [ -n "$XGD_RUN_RELEASE" ]; then
/Users/martin/lagrangefoundry/xgd/.venv-main/bin/python
/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python
+ free-BUG-359
+ free-BUG-368
  free-REQ-632
  free-REQ-634
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:11:48
usage: xgd branch [-h] {cut,lock,clean,session} ...
xgd branch: error: argument branch_command: invalid choice: 'list' (choose from cut, lock, clean, session)
Try 'xgd branch --help' for available commands.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:11:48
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git worktree list | grep -i 368; P=/Users/martin/lagrangefoundry/xgd/.venv-…
<!-- xgd-tool name="Bash" id="toolu_01FXCyLtPDt7MkUNM2LAqtN3" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:11:50.815686+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git worktree list | grep -i 368; P=/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-5b30954f\"}' 2>&1 | head -c 6000","description":"Locate worktree and read summary"}
```

**Result**

```
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368         0e3a2ee8af [free-BUG-368]
[18:11:51] │ 
           │ ⚠️  Configuration warnings:
[18:11:51] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[18:11:51] │ 
[18:11:51] │ 
           │ ⚠️  Configuration warnings:
[18:11:51] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[18:11:51] │ 
[18:11:53] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2391.48, 'pid': 22793}
{"count":0,"entries":[],"framing":"BUG-368 (bug-5b30954f), free-coded. Objective: (1) renderer draws the BUG-367 action row (label-sized right-aligned from 768, secondary Cancel at left, stacked full width on phones, Continue on top) wherever a checkout template places `continue`; a template already placing `cancel` keeps its placement. (2) button labels centred unless the control node itself has textAlign. (3) draft/preview checkout start = published start: real Stripe session, return URLs on preview complete/cancelled pages; delete BUG-367 owner-only notice and preview branch in startCheckout. (4) confirm update_component reaches countryPrompt; playbook notes new default.\nSettled: not a dupe (checked bug list). Cause confirmed from dev D1 site_pages checkout.json: authored slot `page` = stack[ship-to, message, box(component button.primary)[continue control w/ own textAlign:center]]; no cancel.\nRejected: none yet."}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git status --short | head -3…
<!-- xgd-tool name="Bash" id="toolu_019zJDsjJwTZzvHnmzfHRQNK" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:11:55.752391+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git status --short | head -30; git log --oneline -3; git log --oneline xgd-working -1; git diff --stat; git log --oneline xgd-working..HEAD","description":"Inspect worktree state"}
```

**Result**

```
 M apps/control-app/src/checkout-intake.ts
 M apps/control-app/src/router.ts
 M packages/framework/src/l2/checkout.ts
 M packages/framework/src/modules/behavior.ts
 M packages/framework/src/modules/checkout/client.js
 M packages/framework/src/modules/checkout/component.ts
 M tests/test_UAT_FC_BUG-367_checkout_page.test.ts
 M tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
 M tools/generate/src/render/render.ts
?? tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts
0e3a2ee8af xgd(ticket): update comment comment-f2d5499d
1e55898cd8 xgd(ticket): update bug bug-2568c791
8a88cab860 xgd(ticket): update comment comment-8f2e8ae3
55cb8200f7 xgd(ticket): update comment comment-91847602
 apps/control-app/src/checkout-intake.ts            |  29 ------
 apps/control-app/src/router.ts                     |  28 ++++--
 packages/framework/src/l2/checkout.ts              | 105 ++++++++++++++++++---
 packages/framework/src/modules/behavior.ts         |   8 ++
 packages/framework/src/modules/checkout/client.js  |   6 --
 .../framework/src/modules/checkout/component.ts    |   9 +-
 tests/test_UAT_FC_BUG-367_checkout_page.test.ts    |  14 ---
 ...t_UAT_FC_BUG-367_draft_checkout.workers.test.ts |  56 ++++++++---
 tools/generate/src/render/render.ts                |   8 +-
 9 files changed, 177 insertions(+), 86 deletions(-)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git diff -- packages tools a…
<!-- xgd-tool name="Bash" id="toolu_01DCyg3VSpsXkKzJA3oAjFZW" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:11:58.537834+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git diff -- packages tools apps","description":"Show source diff"}
```

**Result**

```
diff --git a/apps/control-app/src/checkout-intake.ts b/apps/control-app/src/checkout-intake.ts
index 5ec439c8b7..685307de99 100644
--- a/apps/control-app/src/checkout-intake.ts
+++ b/apps/control-app/src/checkout-intake.ts
@@ -64,32 +64,3 @@ export function checkoutIntake(env: OrdersEnv, options: CheckoutIntakeOptions =
   }
 }
 
-/**
- * [[BUG-367]] — what Continue to payment answers in the builder's draft preview.
- * Only the owner sees the draft, so this speaks to them.
- */
-export const PREVIEW_PAYMENT_NOTICE = 'Payment opens on your published site. Only you see this.'
-
-/**
- * [[BUG-367]] — the checkout as the builder's draft preview reaches it: the same
- * `quote` the published site's binding calls, so the draft shows the current
- * price, the Ship to countries, the rate and the total exactly as published.
- *
- * THE DRAFT NEVER TAKES MONEY. `start` re-reads the quote and answers the owner
- * the notice above with it; it holds no stock, writes no order and opens no
- * Stripe session. `cancel` and `status` are an order's, and the draft has none.
- */
-export function previewCheckoutIntake(env: OrdersEnv, options: CheckoutIntakeOptions = {}) {
-  const live = checkoutIntake(env, options)
-  const noOrder = (): Promise<CheckoutAnswer> => Promise.resolve({ status: 404, body: { error: 'Orders open on your published site.' } })
-  return {
-    quote: live.quote,
-    start: async (siteKey: string, _siteUrl: string, body: unknown): Promise<CheckoutAnswer> => {
-      const quoted = await live.quote(siteKey, body)
-      if (quoted.status !== 200) return quoted
-      return { status: 200, body: { notice: PREVIEW_PAYMENT_NOTICE, ...quoted.body } }
-    },
-    cancel: noOrder,
-    status: noOrder,
-  }
-}
diff --git a/apps/control-app/src/router.ts b/apps/control-app/src/router.ts
index c31d0cf6c0..ee822e16e5 100644
--- a/apps/control-app/src/router.ts
+++ b/apps/control-app/src/router.ts
@@ -122,7 +122,7 @@ import { captureLead, type LeadEnv as LeadIntakeEnv, type LeadSubmission } from
  * `checkoutIntake` the `SHOP_CHECKOUT` binding wraps — reached in-process here.
  */
 import { checkoutVerb, handleCheckout, type CheckoutEnv } from '../../public-site/src/checkout'
-import { previewCheckoutIntake } from './checkout-intake'
+import { checkoutIntake } from './checkout-intake'
 import { UnknownTenantError } from '../../../tools/generate/src/store/d1r2-store'
 import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
 import { StoreConflictError, type SiteStore } from '../../../tools/generate/src/store/site-store'
@@ -8556,7 +8556,7 @@ async function routeUncached(
 
       /**
        * POST /preview/<siteKey>/draft/api/checkout/<verb> — the draft's checkout
-       * page asks for its quote ([[BUG-367]]).
+       * page asks for its quote and starts its payment ([[BUG-367]], [[BUG-368]]).
        *
        * WHY THIS EXISTS AT ALL is `api/lead`'s reason: the checkout page's script
        * posts to `api/checkout/<verb>` relative to the page, and in the preview
@@ -8568,8 +8568,15 @@ async function routeUncached(
        * the published page shows. The rate limiter is not asked (`identified`):
        * the caller is the signed-in operator, as for the draft's `api/lead`.
        *
-       * THE DRAFT NEVER TAKES MONEY: `start` answers the owner that payment
-       * opens on the published site, and writes nothing ({@link previewCheckoutIntake}).
+       * [[BUG-368]] — THE DRAFT'S CHECKOUT IS THE PUBLISHED SITE'S, all four
+       * verbs over the same `checkoutIntake` (supersedes BUG-367's "the draft
+       * never takes money"). Only the signed-in owner sees the draft, so no
+       * visitor buys from it; price, stock and shipping are the same live
+       * records; an order is a real order through the same webhook. Whether
+       * money moves is the Stripe connection's mode, as it is published. The one
+       * difference is where Stripe sends the buyer back: the preview's own
+       * order-complete and order-cancelled pages, under this request's own
+       * address (its business prefix included).
        *
        * `draft` ONLY, and the site key is the route's and is checked, exactly as
        * the `api/lead` route above does.
@@ -8579,11 +8586,20 @@ async function routeUncached(
         if (channel !== 'draft') return text(404, 'Not found')
         const store = await openStore()
         if (!(await store.hasDraft(site))) return text(404, 'Not found')
+        const draftUrl = `${url.origin}${url.pathname.slice(0, url.pathname.length - (preview[3] ?? '').length)}/`
+        const intake = checkoutIntake(env as never, {
+          ...(deps.fetch ? { fetch: deps.fetch } : {}),
+          rebuild: (businessId, itemId) => {
+            const rebuilt = rebuildCatalogFor(env, { businessId }, itemId, deps.fetch)
+            if (ctx) ctx.waitUntil(rebuilt)
+            return ctx ? Promise.resolve() : rebuilt
+          },
+        })
         return handleCheckout(request, {
           siteKey: site,
           verb: checkoutPath,
-          siteUrl: publicSiteUrl(site, '/'),
-          env: { SHOP_CHECKOUT: previewCheckoutIntake(env as never) } as CheckoutEnv,
+          siteUrl: draftUrl,
+          env: { SHOP_CHECKOUT: intake } as CheckoutEnv,
           identified: true,
         })
       }
diff --git a/packages/framework/src/l2/checkout.ts b/packages/framework/src/l2/checkout.ts
index 76f6f694e7..12177207c4 100644
--- a/packages/framework/src/l2/checkout.ts
+++ b/packages/framework/src/l2/checkout.ts
@@ -66,17 +66,36 @@ function message(): L1Node {
   return { kind: 'control', control: 'message', role: 'small' } as L1Node
 }
 
+const ACTION_PAD = { topPx: 14, rightPx: 24, bottomPx: 14, leftPx: 24 }
+
+/** A Continue control
```

[elided — kept 5800 of 17358 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn "BUG-367" packages/…
<!-- xgd-tool name="Bash" id="toolu_018pK6oTikpKR64JTkAW7LGM" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:03.217769+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn \"BUG-367\" packages/framework/src --include=*.ts --include=*.js -l; grep -rn \"textAlign\" packages/framework/src/l1/render.ts | head -30","description":"Find label centring code"}
```

**Result**

```
Exit code 1
(eval):1: no matches found: --include=*.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rln "BUG-367" packages…
<!-- xgd-tool name="Bash" id="toolu_01Rq1VcUvkzA4rGJYHV5UdUd" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:09.463232+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rln \"BUG-367\" packages tools apps --include='*.ts' --include='*.js' --include='*.css' | grep -v node_modules; grep -rn \"centre\\|center\" packages/framework/src/l1/*.ts | grep -i \"label\\|button\\|BUG-36\" | head -30","description":"Find label centring code"}
```

**Result**

```
packages/framework/src/l2/checkout.ts
packages/framework/src/l1/render.ts
packages/framework/src/modules/module-assets.ts
packages/framework/src/modules/checkout/client.js
packages/framework/src/modules/checkout/meta.ts
packages/framework/src/modules/checkout/component.ts
apps/public-site/src/checkout.ts
apps/control-app/src/router.ts
apps/control-app/src/orders.ts
packages/framework/src/l1/render.ts:2465: * [[REQ-655]] — and its label is one line, centred in the box's height too, so a
packages/framework/src/l1/render.ts:4237:  // `currentColor`, centred in the button.
packages/framework/src/l1/render.ts:5561:      decls: ['display: flex', 'align-items: center', 'justify-content: center', `gap: ${NAV_BUTTON_GAP_PX}px`, `min-width: ${NAV_BUTTON_MIN_PX}px`, `min-height: ${NAV_BUTTON_MIN_PX}px`],
packages/framework/src/l1/render.ts:6083:      // link drawn as a button (a fill or a border) is centred the same way.
packages/framework/src/l1/render.ts:6084:      if (el.tag === 'button') base.unshift('text-align: center')
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 6040,6120p packages/f…
<!-- xgd-tool name="Bash" id="toolu_01VqCbRrQm1XAe92aCML5V7r" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:11.270653+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 6040,6120p packages/framework/src/l1/render.ts; grep -n \"BUG-367\\|BUG-368\" packages/framework/src/l1/render.ts","description":"Read centring code region"}
```

**Result**

```
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
      // [[BUG-367]] — A BUTTON'S LABEL IS CENTRED, across and down, unless the
      // node says otherwise: unshifted, so an authored `textAlign` still wins. A
      // link drawn as a button (a fill or a border) is centred the same way.
      if (el.tag === 'button') base.unshift('text-align: center')
      else if (el.tag === 'a' && (node.axes?.surfaceFill || node.axes?.border)) {
        base.unshift('display: inline-flex', 'justify-content: center', 'align-items: center', 'text-align: center')
      }
      // [[BUG-367]] — A DISABLED CONTROL LOOKS DISABLED. The script and the
      // module set `disabled` when a control cannot work; without this a disabled
      // button painted exactly like a live one. Dimmed, a not-allowed cursor, and
      // no hover change (the hover rules below skip `:disabled`).
      if (el.tag === 'button' || el.tag === 'input' || el.tag === 'select' || el.tag === 'textarea') {
        state.rules.push({ selector: `${selector}:disabled`, decls: [`opacity: ${DISABLED_OPACITY}`, 'cursor: not-allowed'] })
      }
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
1014:  // [[BUG-367]] — a control's hover is a live control's: a disabled one keeps
2354:/** [[BUG-367]] — how far a disabled control is dimmed. */
6081:      // [[BUG-367]] — A BUTTON'S LABEL IS CENTRED, across and down, unless the
6088:      // [[BUG-367]] — A DISABLED CONTROL LOOKS DISABLED. The script and the
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; cat tests/test_UAT_FC_BUG-36…
<!-- xgd-tool name="Bash" id="toolu_01JPs82jaexXBxX45EghiLAc" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:17.414520+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; cat tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; git diff tests","description":"Read new and modified tests"}
```

**Result**

```
/**
 * [[BUG-368]] — a site's OWN checkout page, as real Chromium lays it out. Its
 * template places Continue inside a filled box spanning the column and no
 * Cancel; the page is drawn with BUG-367's action row all the same: the button
 * label-sized at the right from a tablet's width, Cancel to its left at the same
 * height, both full width on a phone, and the label centred in the button.
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { chromiumAvailable } from '../tools/generate/src/cli/capture'
import { browserLaunchOptions } from '../tools/generate/src/cli/capture/launch-args'
import { renderSiteFiles, type SiteCatalog } from '../tools/generate/src/render'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { l1DesignVariables, type L1Design } from '../packages/site-schema/src/index'
import { catalogItems, catalogSeed } from './support/catalog-site'
import { latestModuleVersion } from '../packages/framework/src/modules/catalog'
import { checkoutActions } from '../packages/framework/src/l2/checkout'
import type { L1Node } from '../packages/site-schema/src/index'

const itBrowser = it.runIf(await chromiumAvailable())

const ORIGIN = 'http://fixture.test'
const SHIPPING = { currency: 'EUR', dispatchNote: 'Ships within 3 working days', countries: [{ code: 'FR', rate: 500 }, { code: 'GB', rate: 800 }] }

type Page = import('playwright').Page

const TEMPLATE = {
  id: 'own-checkout',
  kind: 'container',
  layout: 'stack',
  gapPx: 16,
  children: [
    { id: 'own-ship-to', kind: 'control', control: 'ship-to' },
    { id: 'own-message', kind: 'control', control: 'message' },
    {
      id: 'own-continue-box',
      kind: 'box',
      axes: { surfaceFill: '#222222', borderRadiusPx: 4 },
      padding: { topPx: 8, rightPx: 8, bottomPx: 8, leftPx: 8 },
      spaceBelow: 16,
      children: [
        {
          id: 'own-continue',
          kind: 'control',
          control: 'continue',
          axes: { color: '#ffffff', surfaceFill: '#222222' },
          padding: { topPx: 12, rightPx: 28, bottomPx: 12, leftPx: 28 },
        },
      ],
    },
  ],
}

/**
 * A module's fragment sizes itself from the site's design variables, which a
 * designed site's page declares at `:root`. The fixture site has no L1 design,
 * so the page is served with the variables a plain one declares.
 */
const DESIGN = { layout: { contentWidth: 720, gutter: 16 }, space: { scale: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } } } as unknown as L1Design
const ROOT_VARS = `<style>:root { ${l1DesignVariables(DESIGN)
  .map(({ name, length }) => `${name}: ${length as number}px`)
  .join('; ')} }</style>`

async function siteFiles(): Promise<Map<string, string>> {
  const seed = catalogSeed()
  // A site's own checkout page: its template draws Continue inside a filled box
  // that spans the column, and places no Cancel.
  const contact = structuredClone(seed.pages['contact.json']) as Record<string, any>
  seed.pages['checkout.json'] = {
    ...contact,
    id: 'checkout',
    slug: 'checkout',
    title: 'Checkout',
    seoMeta: { title: 'Checkout', description: 'Checkout page.' },
    modules: [{ id: 'checkout', type: 'checkout', version: latestModuleVersion('checkout'), slot: 'contact', config: { mode: 'checkout' }, slots: { page: TEMPLATE } }],
  }
  const store = memorySiteStore()
  store.seed(seed.slug, seed)
  const loaded = (await store.loadDraft(seed.slug))!.result
  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))
  const catalog: SiteCatalog = { items: catalogItems(), canTakePayments: true, shipping: SHIPPING }
  return new Map((await renderSiteFiles(loaded.value, { catalog })).files)
}

/** Playwright is tools/generate's dependency; one browser per page (see BUG-259's suite). */
async function withPage<T>(width: number, run: (page: Page) => Promise<T>): Promise<T> {
  const require = createRequire(path.resolve(__dirname, '../tools/generate/package.json'))
  const mod = (await import(/* @vite-ignore */ pathToFileURL(require.resolve('playwright')).href)) as typeof import('playwright')
  const browser = await mod.chromium.launch(browserLaunchOptions())
  try {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
    const files = await siteFiles()
    await page.route(`${ORIGIN}/**`, (route) => {
      const file = new URL(route.request().url()).pathname.replace(/^\/+/, '')
      if (file.endsWith('.js')) return route.abort()
      const found = files.get(file) ?? files.get(`${file}.html`)
      const body = found && !file.endsWith('.css') ? found.replace('</head>', `${ROOT_VARS}</head>`) : found
      if (body === undefined) return route.fulfill({ status: 404, body: '' })
      const contentType = file.endsWith('.css') ? 'text/css' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html'
      return route.fulfill({ contentType, body })
    })
    await page.goto(`${ORIGIN}/checkout/brass-lamp`)
    return await run(page)
  } finally {
    await browser.close()
  }
}

type Box = { x: number; y: number; width: number; height: number }

/** Continue's button (the site's filled box), its label, the visible Cancel and the actions' column. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }
    const visible = (el: Element) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0
    const cont = document.querySelector('button[data-checkout-control="continue"]')!
    const button = docu
```

[elided — kept 5800 of 15787 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "textAlign" packages…
<!-- xgd-tool name="Bash" id="toolu_01VmP5N9D92zasMvNXv1arzC" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:21.865660+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"textAlign\" packages/framework/src/l1/render.ts | head -40","description":"Find textAlign handling in renderer"}
```

**Result**

```
2476:  const own = a.textAlign === 'center' ? 'center' : a.textAlign === 'right' ? 'end' : 'start'
3476:   * REQ-372 — the run's `textAlign`. A relaxed run (below) grows past its captured
3479:  textAlign?: string,
3568:  const pivot = textAlign === 'center' ? 0.5 : textAlign === 'right' ? 1 : 0
5891:    const textAlign = node.kind === 'text' || node.kind === 'control' ? node.axes?.textAlign : undefined
5899:        textAlign,
5928:      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
6032:        if (node.axes?.textAlign === 'center') base.push('margin-left: auto', 'margin-right: auto')
6082:      // node says otherwise: unshifted, so an authored `textAlign` still wins. A
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 2455,2500p packages/f…
<!-- xgd-tool name="Bash" id="toolu_012AXxjqhcWRDtHRrT8aFP1W" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:27.008705+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 2455,2500p packages/framework/src/l1/render.ts; sed -n 5915,5935p packages/framework/src/l1/render.ts","description":"Read textAlign emission sites"}
```

**Result**

```
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
      if (c) base.push(`color: ${c}`)
      const ff = cssFontFamily(a.fontFamily)
      if (ff) base.push(`font-family: ${ff}`)
      const fontSize = px(a.fontSizePx)
      if (!r?.fontSizePx && fontSize) base.push(`font-size: ${fontSize}`)
      if (a.fontWeight !== undefined) base.push(`font-weight: ${Math.round(a.fontWeight)}`)
      const lineHeight = px(a.lineHeightPx)
      if (!r?.lineHeightPx && lineHeight) base.push(`line-height: ${lineHeight}`)
      const letterSpacing = px(a.letterSpacingPx)
      if (!r?.letterSpacingPx && letterSpacing) base.push(`letter-spacing: ${letterSpacing}`)
      if (r?.fontSizePx) state.rules.push(...scalarAxisRules(selector, 'font-size', r.fontSizePx))
      if (r?.lineHeightPx) state.rules.push(...scalarAxisRules(selector, 'line-height', r.lineHeightPx))
      if (r?.letterSpacingPx) state.rules.push(...scalarAxisRules(selector, 'letter-spacing', r.letterSpacingPx))
      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
      // REQ-370 — spaces that take width (see `axes.whiteSpace`).
      if (a.whiteSpace) base.push(`white-space: ${a.whiteSpace}`)
      // REQ-88 — a run the reference kept on one line must not become breakable
      // just because the fold gave it a fixed-width box (see `axes.nowrapFromPx`).
      // At or below the ladder's floor the pin is unconditional; above it, it
      // starts at the width from which the reference stopped wrapping.
      // REQ-370 — on a run that preserves its spaces only the WRAP mode is pinned:
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF' p='tests/t…
<!-- xgd-tool name="Bash" id="toolu_01NrEJCwZ8jF3TNoNnco9DQW" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:34.771872+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts'\ns=open(p).read()\ns=s.replace(\"\"\"      axes: { surfaceFill: '#222222', borderRadiusPx: 4 },\"\"\",\"\"\"      // The container asks for left-aligned text; the button's label is centred\n      // all the same, since only the control's own node can say otherwise.\n      axes: { surfaceFill: '#222222', borderRadiusPx: 4, textAlign: 'left' },\"\"\",1)\ns=s.replace(\"\"\" * Cancel; the page is drawn with\"\"\",\"\"\" * Cancel, and its container asks for left-aligned text; the page is drawn with\"\"\",1)\nopen(p,'w').write(s)\nEOF\nls node_modules >/dev/null 2>&1 && echo nm-ok; timeout 580 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts 2>&1 | tail -30","description":"Add container textAlign to UAT and run node suites","timeout":600000}
```

**Result**

```
nm-ok
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m



 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368


 Test Files  2 passed (2)
      Tests  6 passed | 2 skipped (8)
   Start at  18:12:36
   Duration  1.35s (transform 993ms, setup 0ms, import 2.17s, tests 184ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; cat /Users/martin/.claude-2/…
<!-- xgd-tool name="Bash" id="toolu_01W8FKLWV4uaDd4y2AX6Z7Jz" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:42.144166+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/npx-finds-python-playwright.md | tail -8; grep -n \"include\\|exclude\" vitest.config.mts vitest.browser.config.mts | head","description":"Check playwright memory and vitest configs"}
```

**Result**

```
**How to apply:** always name the repo's own binary by path —
`tools/generate/node_modules/.bin/playwright install chromium`. Confirm with
`ls ~/Library/Caches/ms-playwright/ | grep 1228`, and read the revision the repo
actually wants out of
`node_modules/.pnpm/playwright-core@<ver>/node_modules/playwright-core/browsers.json`
rather than assuming. Hand the command over — see
[[user-runs-install-scripts]]. Related: [[chromium-blocked-by-mach-bootstrap]].
vitest.config.mts:26: * The node project excludes the directory.
vitest.browser.config.mts:6: * `sandbox.excluded_commands` entry lets launch Chromium outside the sandbox.
vitest.browser.config.mts:10:    include: ['tests/browser/**/*.test.ts'],
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 1,80p tools/generate/…
<!-- xgd-tool name="Bash" id="toolu_01XhRn1zdx29W7qtBTYakh8R" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:43.384921+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 1,80p tools/generate/src/cli/capture.ts | grep -n \"chromiumAvailable\" ; grep -rn \"export async function chromiumAvailable\" -A25 tools/generate/src/cli/ | head -40","description":"Inspect chromiumAvailable"}
```

**Result**

```
sed: tools/generate/src/cli/capture.ts: No such file or directory
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn "function chromiumA…
<!-- xgd-tool name="Bash" id="toolu_01D3BDX9Dq8Yy6fAfkLEWNHG" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:45.830706+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn \"function chromiumAvailable\" -A20 tools/generate/src/cli/capture/ | head -30; cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-blocked-by-mach-bootstrap.md 2>/dev/null | tail -10","description":"Inspect chromiumAvailable and mach-bootstrap memory"}
```

**Result**

```
browser serves ONE context: a second `browser.newPage()` fails "Target page,
context or browser has been closed". Launch one browser per page.

**How to apply (fallback only):** don't spend a call trying to make Chromium run without the flag. Author the
browser-gated leg anyway — `it.runIf(browserOk)` reports SKIPPED, so the matrix
stops advertising evidence it lacks and the test runs the moment a capable runner
does. Report the cause by name and escalate; see
[[verify-uats-behind-a-blocking-regression]] for the shape of an honest
"authored but unobserved" claim. Note also that a bare `VAR=x cmd` env-prefix Bash
call is denied here — set `process.env.X` inside the script instead.
```

## Bash cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-blocked-by-mach-bootstrap.…
<!-- xgd-tool name="Bash" id="toolu_01QJiqswKBFqAhZHEHRk6cpU" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:47.527795+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-blocked-by-mach-bootstrap.md | head -30","description":"Read chromium memory head"}
```

**Result**

```
---
name: chromium-blocked-by-mach-bootstrap
description: "Default Chromium launch dies on the sandbox's Mach bootstrap, but CHROMIUM_LAUNCH_ARGS=--single-process gets past it and browser UATs really run (verified 2026-10-04)."
metadata: 
  node_type: memory
  type: project
  originSessionId: afda79a1-9917-40b9-bcef-5ad1a74069c3
  modified: 2026-10-23T23:11:15.882Z
---

`chromiumAvailable()` (`tools/generate/src/cli/capture/playwright-driver.ts:281`)
returns false under this session's sandbox, and every `it.runIf(browserOk)` leg
skips. Two independent causes, neither of them "no browser installed":

1. **The seatbelt profile denies Chromium's Mach bootstrap.** The binary launches
   and dies at once:
   `FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == KERN_SUCCESS.`
   `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.<pid>: Permission denied (1100)`
   → `<process did exit: exitCode=null, signal=SIGTRAP>`. No flag, build or
   `PLAYWRIGHT_BROWSERS_PATH` shim gets past it.
2. **A build-number pin.** `~/Library/Caches/ms-playwright/` holds
   `chromium-1234` / `chromium_headless_shell-1234`; the repo's `playwright@1.61.1`
   wants **1228**, so the default resolve fails first with "Executable doesn't
   exist … chromium_headless_shell-1228". `npx playwright install` would fix the
   pin but `npx` is denied ([[dont-ask-blocks-loops-and-test-runners]]) and the
   network allowlist is empty.

**Why:** it looks like a provisioning gap, so the reflex is to install a browser or
symlink the cache. Both fail — symlinking into `~/Library/Caches` is denied, and a
`PLAYWRIGHT_BROWSERS_PATH` dir of symlinks only gets you as far as cause 1.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; export CHROMIUM_LAUNCH_ARGS=…
<!-- xgd-tool name="Bash" id="toolu_016KJJR8RQ7VTAG7nww8fAvX" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:50.505214+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; export CHROMIUM_LAUNCH_ARGS=--single-process; timeout 580 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts --reporter=verbose 2>&1 | grep -E \"✓|×|↓|skipped|passed|failed|Error|expected\" | head -30","description":"Run Chromium UAT with single-process flag","timeout":600000}
```

**Result**

```
 × |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_own_template_actions_sit_right_sized_to_their_labels 248ms
 × |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_own_template_actions_stack_full_width_on_a_phone 113ms
 ✓ |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_a_template_placing_its_own_cancel_keeps_its_placement 1ms
Error: /pages/0/modules/0/slots/page/children/2/axes: Unrecognized key: "textAlign"
     85|   if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}:…
Error: /pages/0/modules/0/slots/page/children/2/axes: Unrecognized key: "textAlign"
     85|   if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}:…
 Test Files  1 failed (1)
      Tests  2 failed | 1 passed (3)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn "textAlign" package…
<!-- xgd-tool name="Bash" id="toolu_01AfKzaj2kZ3uhnSFB7Pabk2" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:56.130758+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn \"textAlign\" packages/site-schema/src/*.ts | head -20","description":"Find textAlign in schema"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rln "textAlign" packag…
<!-- xgd-tool name="Bash" id="toolu_01GL4wqa7jCAxddVP4vUTGcw" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:12:57.851157+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rln \"textAlign\" packages/site-schema/src | head; grep -rn \"textAlign:\" packages/site-schema/src | head","description":"Search schema recursively"}
```

**Result**

```
packages/site-schema/src/l1/schema.ts
packages/site-schema/src/l1/email.ts
packages/site-schema/src/l1/design.ts
packages/site-schema/src/l1/schema.ts:2136:    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 2100,2135p packages/s…
<!-- xgd-tool name="Bash" id="toolu_014G55yaV18aFkfQFWDSzvSJ" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:00.145716+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 2100,2135p packages/site-schema/src/l1/schema.ts | grep -n \"const\\|textAxes\\|=\" | head; grep -n \"textAxesSchema\\|l1TextAxes\" packages/site-schema/src/l1/schema.ts | head","description":"Which nodes use text axes"}
```

**Result**

```
8:export const l1TextStyleSchema = z.object({ ...l1TypeAxesShape, ...l1RhythmSpaceShape }).strict()
18:export const l1TypeSchema = z
29:export const l1TextAxesSchema = z
77: * every other axis stays single-valued in {@link l1TextAxesSchema}. When present,
2061: * own (see {@link l1TextAxesSchema}), so a style is a value a run could have
2128:export const l1TextAxesSchema = z
2529: * subset of {@link l1TextAxesSchema}, not the whole bag.
2752:    axes: l1TextAxesSchema.optional(),
3024:export const l1ControlAxesSchema = l1TextAxesSchema.extend({
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "textAlign" packages…
<!-- xgd-tool name="Bash" id="toolu_01LpkzTqjY57K3jF54ehY2dX" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:03.683983+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"textAlign\" packages/site-schema/src/l1/design.ts packages/framework/src/l1/*.ts | head -20","description":"textAlign in design and l1"}
```

**Result**

```
packages/site-schema/src/l1/design.ts:884:        setRuns(kids, 'textAlign', 'center').map((n) => (isGroup(n) && n.width === undefined ? { ...n, width: 'text' } : n)),
packages/framework/src/l1/email-render.ts:201:  if (typeof axes.textAlign === 'string') out.push(`text-align:${axes.textAlign}`)
packages/framework/src/l1/render.ts:2476:  const own = a.textAlign === 'center' ? 'center' : a.textAlign === 'right' ? 'end' : 'start'
packages/framework/src/l1/render.ts:3476:   * REQ-372 — the run's `textAlign`. A relaxed run (below) grows past its captured
packages/framework/src/l1/render.ts:3479:  textAlign?: string,
packages/framework/src/l1/render.ts:3568:  const pivot = textAlign === 'center' ? 0.5 : textAlign === 'right' ? 1 : 0
packages/framework/src/l1/render.ts:5891:    const textAlign = node.kind === 'text' || node.kind === 'control' ? node.axes?.textAlign : undefined
packages/framework/src/l1/render.ts:5899:        textAlign,
packages/framework/src/l1/render.ts:5928:      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
packages/framework/src/l1/render.ts:6032:        if (node.axes?.textAlign === 'center') base.push('margin-left: auto', 'margin-right: auto')
packages/framework/src/l1/render.ts:6082:      // node says otherwise: unshifted, so an authored `textAlign` still wins. A
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF' p='tests/t…
<!-- xgd-tool name="Bash" id="toolu_014os8JWLkS4QY2ZpybSHRWW" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:14.549920+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts'\ns=open(p).read()\ns=s.replace(\"\"\"      // The container asks for left-aligned text; the button's label is centred\n      // all the same, since only the control's own node can say otherwise.\n      axes: { surfaceFill: '#222222', borderRadiusPx: 4, textAlign: 'left' },\"\"\",\"\"\"      axes: { surfaceFill: '#222222', borderRadiusPx: 4 },\"\"\")\ns=s.replace(\"\"\"  .join('; ')} }</style>`\"\"\",\"\"\"  .join('; ')} }\n#own-checkout, #own-continue-box { text-align: left }</style>`\n// ^ L1 gives a container no \\\\`textAlign\\\\` of its own, so the left-aligned text the\n// button's containers hand down is set on them directly: an INHERITED value,\n// which must not move the label (only the control's own node may).\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"own-continue-box { text\" -A4 tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; export CHROMIUM_LAUNCH_ARGS=--single-process; timeout 580 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts --reporter=verbose 2>&1 | grep -E \"✓|×|↓|passed|failed|Error|expected\" | head -30","description":"Simulate inherited textAlign and rerun Chromium UAT","timeout":600000}
```

**Result**

```
66:#own-checkout, #own-continue-box { text-align: left }</style>`
67-// ^ L1 gives a container no \`textAlign\` of its own, so the left-aligned text the
68-// button's containers hand down is set on them directly: an INHERITED value,
69-// which must not move the label (only the control's own node may).
70-
 ✓ |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_own_template_actions_sit_right_sized_to_their_labels 310ms
 ✓ |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_own_template_actions_stack_full_width_on_a_phone 137ms
 ✓ |node| tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts > BUG-368 — a site's own checkout page draws the checkout's actions > test_UAT_FC_BUG-368_a_template_placing_its_own_cancel_keeps_its_placement 1ms
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -i '' 's/no \\`textAlign…
<!-- xgd-tool name="Bash" id="toolu_01V87UQ8whfHghEKNr8MyEaE" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:23.063172+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -i '' 's/no \\\\`textAlign\\\\` of/no `textAlign` of/' tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; sed -n 67p tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts; ls tests | grep -E \"BUG-367|BUG-363|REQ-643|BUG-368\"","description":"Fix comment and list regression suites"}
```

**Result**

```
// ^ L1 gives a container no `textAlign` of its own, so the left-aligned text the
test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts
test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts
test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts
test_UAT_FC_BUG-367_checkout_page.test.ts
test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts
test_UAT_FC_REQ-643_checkout_pages.test.ts
test_UAT_FC_REQ-643_purchase.workers.test.ts
test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; export CHROMIUM_LAUNCH_ARGS=…
<!-- xgd-tool name="Bash" id="toolu_012B1wbexuBUNoyVbhaSFzUY" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:27.666886+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; export CHROMIUM_LAUNCH_ARGS=--single-process; timeout 580 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts tests/test_UAT_FC_REQ-643_checkout_pages.test.ts tests/test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts 2>&1 | grep -E \"×|FAIL|Test Files|Tests \" | head -30","description":"Run node regression suites","timeout":600000}
```

**Result**

```
 Test Files  6 passed (6)
      Tests  30 passed (30)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; timeout 590 npx vitest run -…
<!-- xgd-tool name="Bash" id="toolu_01AGuLSTECn98syaFRKn7e1E" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:29.666024+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; timeout 590 npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts tests/test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts tests/test_UAT_FC_REQ-643_purchase.workers.test.ts 2>&1 | grep -E \"×|FAIL|Test Files|Tests |Error\" | head -30","description":"Run workers regression suites","timeout":600000}
```

**Result**

```
 Test Files  3 passed (3)
      Tests  16 passed (16)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn "countryPrompt\|Ple…
<!-- xgd-tool name="Bash" id="toolu_01YbWTkd9tC3M5Mzd89qroGk" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:42.881106+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rn \"countryPrompt\\|Please select a region\" --include='*.ts' --include='*.md' --include='*.json' packages apps tools kb 2>/dev/null | grep -v node_modules | grep -v \"/generated/\" | head -30","description":"Find countryPrompt references"}
```

**Result**

```
packages/framework/src/modules/checkout/meta.ts:38:    // Ship to choice's first, empty option (default "Please select a region for
packages/framework/src/modules/checkout/meta.ts:41:    countryPrompt: { type: 'string', required: false },
packages/framework/src/modules/checkout/component.ts:33: * [[BUG-367]] — the Ship to choice's wording when the page's `countryPrompt`
packages/framework/src/modules/checkout/component.ts:36:export const DEFAULT_COUNTRY_PROMPT = 'Please select a region for delivery'
packages/framework/src/modules/checkout/component.ts:133:    const prompt = copy(config.countryPrompt, DEFAULT_COUNTRY_PROMPT)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 20,60p packages/frame…
<!-- xgd-tool name="Bash" id="toolu_01GxgKScHJJwrgL54EWjeQrf" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:45.262189+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 20,60p packages/framework/src/modules/checkout/meta.ts; grep -rln \"update_component\" apps tools packages --include='*.ts' | grep -v node_modules | grep -v test | head; grep -rln \"checkout\" kb apps/*/src --include='*.md' 2>/dev/null | head","description":"Read meta config and find update_component and playbook"}
```

**Result**

```
 * other section; values reach it only through L1's typed field binding, and the
 * Ship to choice and the Continue button are `control` nodes whose look is L1's
 * and whose attributes are the module's. There is no visual dial here and must
 * never be (the REQ-96 note in `carousel/meta.ts`).
 *
 * A SITE THAT SELLS NEEDS NONE OF IT AUTHORED. Where the site has no page
 * holding a `checkout` instance for a mode, the generator draws the framework's
 * default (`l2/checkout.ts`) inside the site's own header and footer; a page in
 * the definition, once there, is what the owner and the Site consultant restyle.
 */
export const checkoutMeta = {
  id: 'checkout',
  version: 1,
  kind: 'behavior',
  config: {
    // Which page this instance is.
    mode: { type: 'enum', required: true, values: ['checkout', 'complete', 'cancelled'] },
    // Copy, so it lives in the definition: the Continue button's label, the
    // Ship to choice's first, empty option (default "Please select a region for
    // delivery"), and [[BUG-367]] the Cancel link's label (default "Cancel").
    continueLabel: { type: 'string', required: false },
    countryPrompt: { type: 'string', required: false },
    cancelLabel: { type: 'string', required: false },
  },
  slots: {
    // The page: one L1 subtree. On the checkout page it is drawn for the item.
    page: { required: false },
  },
  controls: {
    // The buyer's country: the countries the business ships to.
    'ship-to': { element: 'select', required: false },
    // Continue to payment.
    continue: { element: 'button', required: false },
    // [[BUG-367]] — Cancel: back to the piece's product page, or the shop.
    cancel: { element: 'a', required: false },
    // Where the script says what went wrong (a refusal, a network failure).
    message: { element: 'span', required: false },
  },
  conformance: {
    obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'],
  },
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rlna "update_component…
<!-- xgd-tool name="Bash" id="toolu_0197HLg7bDLtmVqUHGz6ZdTu" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:47.703977+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -rlna \"update_component\" apps packages tools kb 2>/dev/null | grep -v node_modules | head -20","description":"Find update_component anywhere"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nal "update_compon…
<!-- xgd-tool name="Bash" id="toolu_015gQXAAFQ3QuXSpPFgjzsRF" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:49.792069+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nal \"update_component\\|updateComponent\\|update_module\\|set_module_config\" -- . ':!*.ndjson' | head -20","description":"git grep for component update tools"}
```

**Result**

```
.xgd/tickets/hot/bug-5b30954f.md
.xgd/tickets/hot/comment-8f2e8ae3.md
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 1,200p .xgd/tickets/h…
<!-- xgd-tool name="Bash" id="toolu_013EuuwZveBQpFmAtSWEJXN8" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:53.953345+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 1,200p .xgd/tickets/hot/comment-8f2e8ae3.md | head -80","description":"Read comment mentioning update_component"}
```

**Result**

```
---
uid: comment-8f2e8ae3
id: COMMENT-7899
type: comment
title: Comment on bug BUG-368
created_by: xgd
created_at: '2026-11-06T01:49:04.854524+00:00'
updated_at: '2026-11-06T01:49:05.308100+00:00'
completed_at: null
last_field_updated: framing
status: null
fields:
  subject_uid: bug-5b30954f
  kind: chat_summary
  framing: |-
    BUG-368 (bug-5b30954f), free-coded. Objective: (1) renderer draws the BUG-367 action row (label-sized right-aligned from 768, secondary Cancel at left, stacked full width on phones, Continue on top) wherever a checkout template places `continue`; a template already placing `cancel` keeps its placement. (2) button labels centred unless the control node itself has textAlign. (3) draft/preview checkout start = published start: real Stripe session, return URLs on preview complete/cancelled pages; delete BUG-367 owner-only notice and preview branch in startCheckout. (4) confirm update_component reaches countryPrompt; playbook notes new default.
    Settled: not a dupe (checked bug list). Cause confirmed from dev D1 site_pages checkout.json: authored slot `page` = stack[ship-to, message, box(component button.primary)[continue control w/ own textAlign:center]]; no cancel.
    Rejected: none yet.
---
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nE "tool: '[a-z_]*…
<!-- xgd-tool name="Bash" id="toolu_01Q8GFgY7CGvwi7MU2go4cFm" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:57.138273+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nE \"tool: '[a-z_]*(module|component)[a-z_]*'\" -- apps packages tools | head -20; git grep -nE \"'(set|update|edit)_[a-z_]*'\" -- apps/control-app/src | grep -i \"module\\|config\\|component\" | head","description":"Find consultant module editing tools"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nE "continueLabel|…
<!-- xgd-tool name="Bash" id="toolu_01BKGxGbfdMCUuEzsHyZF3L6" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:13:59.948428+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nE \"continueLabel|cancelLabel\" -- apps packages tools ':!*.test.ts' | grep -v \"modules/checkout\" | head; git grep -nlE \"playbook\" -- apps packages tools kb | head -20","description":"Find config editing paths and playbooks"}
```

**Result**

```
tools/generate/src/cli/ai/cadence-core.ts
tools/generate/src/cli/ai/host-core.ts
tools/generate/src/cli/ai/plan-core.ts
tools/generate/src/cli/ai/priming.json
tools/generate/src/cli/ai/stage-guide-core.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nE "module.*config…
<!-- xgd-tool name="Bash" id="toolu_01M41mwbpfSc6Dvh8xYYJsEG" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:04.082161+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nE \"module.*config|config.*module\" -- tools/generate/src/cli/ai/priming.json | head -10; git grep -noE '\"(op|tool)\": ?\"[a-z_]+\"' -- tools/generate/src/cli/ai | grep -iE \"module|instance|page|patch\" | sort -u | head -20; grep -o \"checkout[^\\\"]\\{0,200\\}\" tools/generate/src/cli/ai/priming.json | head -10","description":"Search consultant ops and priming for module config editing"}
```

**Result**

```
tools/generate/src/cli/ai/l1-surface.json:204:"op": "list_pages"
tools/generate/src/cli/ai/l1-surface.json:205:"tool": "list_pages"
tools/generate/src/cli/ai/l1-surface.json:217:"op": "describe_page"
tools/generate/src/cli/ai/l1-surface.json:218:"tool": "describe_page"
tools/generate/src/cli/ai/l1-surface.json:278:"op": "get_page_style"
tools/generate/src/cli/ai/l1-surface.json:279:"tool": "get_page_style"
tools/generate/src/cli/ai/l1-surface.json:469:"op": "set_page_style"
tools/generate/src/cli/ai/l1-surface.json:470:"tool": "set_page_style"
tools/generate/src/cli/ai/l1-surface.json:529:"op": "add_page"
tools/generate/src/cli/ai/l1-surface.json:530:"tool": "add_page"
tools/generate/src/cli/ai/l1-surface.json:592:"op": "copy_page"
tools/generate/src/cli/ai/l1-surface.json:593:"tool": "copy_page"
tools/generate/src/cli/ai/l1-surface.json:633:"op": "update_page"
tools/generate/src/cli/ai/l1-surface.json:634:"tool": "update_page"
tools/generate/src/cli/ai/l1-surface.json:821:"op": "remove_page"
tools/generate/src/cli/ai/l1-surface.json:822:"tool": "remove_page"
tools/generate/src/cli/ai/l1-surface.json:862:"op": "decompose_page"
tools/generate/src/cli/ai/l1-surface.json:863:"tool": "decompose_page"
tools/generate/src/cli/ai/l1-surface.json:882:"op": "recompose_page"
tools/generate/src/cli/ai/l1-surface.json:883:"tool": "recompose_page"
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n '"tool": ' tools/gen…
<!-- xgd-tool name="Bash" id="toolu_01XejD94BmPsWMr1bvgvPu4F" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:06.732075+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n '\"tool\": ' tools/generate/src/cli/ai/l1-surface.json | sed 's/.*\"tool\": //' | tr '\\n' ' '; echo; sed -n 633,700p tools/generate/src/cli/ai/l1-surface.json | grep -n \"module\\|config\" | head","description":"List all consultant L1 tools"}
```

**Result**

```
"describe_site", "list_pages", "describe_page", "get_l1", "get_page_style", "list_assets", "get_asset", "get_config", "list_behaviors", "get_palette", "get_design", "status", "list_changes", "set_l1", "set_page_style", "use_font", "add_page", "copy_page", "update_page", "add_component", "configure_component", "hold_upgrade", "remove_component", "remove_page", "set_navigation", "decompose_page", "recompose_page", "add_section", "remove_section", "move_section", "set_config", "make_favicon", "set_palette_color", "add_palette_color", "remove_palette_color", "add_asset", "measure_drawing", "remove_asset", "publish",
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; n=$(grep -n '"tool": "config…
<!-- xgd-tool name="Bash" id="toolu_01JUSVtnPKNh6zwtn4ujstEB" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:09.799492+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; n=$(grep -n '\"tool\": \"configure_component\"' tools/generate/src/cli/ai/l1-surface.json | cut -d: -f1); sed -n \"$((n-3)),$((n+40))p\" tools/generate/src/cli/ai/l1-surface.json","description":"Read configure_component declaration"}
```

**Result**

```
    },
    {
      "op": "configure_component",
      "tool": "configure_component",
      "effect": "write",
      "summary": "Change how a component on a page is set up.",
      "description": "Only the settings you name change; the rest are left alone. This is the working half of a component — where a form sends its enquiries, what its fields are, what its button says. How it *looks* is page content, so that is `set_l1`.\n\nA form's `template` names **which message it sends** — the id of an email page of this same site. Naming one that does not exist is refused on the spot, and the refusal tells you which messages the site does hold and how to make another. A form that names nothing captures the contact and mails no one, which is an ordinary thing for a form to do.",
      "params": {
        "page": {
          "type": "page_id",
          "required": true
        },
        "name": {
          "type": "component_name",
          "required": true
        },
        "config": {
          "type": "object",
          "required": true,
          "description": "The settings to change."
        }
      },
      "returns": {
        "shape": "change"
      },
      "errors": [
        "NOT_FOUND",
        "SCHEMA_INVALID",
        "NOT_APPROVED",
        "NO_FOCAL_POINT"
      ]
    },
    {
      "op": "hold_upgrade",
      "tool": "hold_upgrade",
      "effect": "write",
      "summary": "Put a component back as published when its upgrade broke the look and you could not fix it.",
      "description": "Only after an UNEXPECTED VISUAL CHANGE you tried and failed to fix within the new version's settings. File it first with ReportBug (the component, both versions, the site, what changed and what you tried) and pass its id as `issue`. The component returns to the version the published site was built from, edits to it are refused, and the site is not published until a fixed version ships or the operator lifts the hold. Tell your client the change they asked for waits on a fix on our side.",
      "params": {
        "page": {
          "type": "page_id",
          "required": true
        },
        "name": {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n "configure_compo…
<!-- xgd-tool name="Bash" id="toolu_01C52zHdued72cjy5py2Byxh" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:12.669237+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n \"configure_component\\|configureComponent\" -- tools apps packages ':!*.json' ':!*.test.ts' | head","description":"Find configure_component implementation"}
```

**Result**

```
tools/generate/src/cli/ai/toolbox-core.ts:858:    configure_component: async (p) => {
tools/generate/src/publish/publish.ts:317: * IT STAYS EVEN THOUGH `configure_component` NOW REFUSES THE SAME THING
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 855,900p tools/genera…
<!-- xgd-tool name="Bash" id="toolu_01TXSZdGxNZFoRSKiH3U8JHQ" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:15.024048+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 855,900p tools/generate/src/cli/ai/toolbox-core.ts","description":"Read configure_component handler"}
```

**Result**

```
      return { changed: out.data, message: out.human, now: out.at }
    },

    configure_component: async (p) => {
      const out = await editModuleConfigure(
        slug,
        req(p, 'page'),
        req(p, 'name'),
        obj(p, 'config') ?? {},
        opts,
      )
      return { changed: out.data, message: out.human, now: out.at }
    },

    // [[REQ-484]] — an upgrade that broke the look and could not be fixed.
    hold_upgrade: async (p) => {
      const issue = typeof p.issue === 'string' && p.issue.trim() !== '' ? p.issue.trim() : undefined
      const out = await editModuleHoldUpgrade(slug, req(p, 'page'), req(p, 'name'), {
        ...opts,
        problem: req(p, 'problem'),
        ...(issue ? { issue } : {}),
      })
      return { changed: out.data, message: out.human, now: out.at }
    },

    remove_component: async (p) => {
      const out = await editModuleRm(slug, req(p, 'page'), req(p, 'name'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    remove_page: async (p) => {
      const out = await editPageRm(slug, req(p, 'page'), opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    // [[REQ-422]] — the menu's order, labels and which pages it shows.
    set_navigation: async (p) => {
      const out = await editNavSet(slug, (Array.isArray(p.entries) ? p.entries : []) as NavEntrySpec[], opts)
      return { changed: out.data, message: out.human, now: out.at }
    },

    // [[REQ-396]] — how a page is stored: whole, or a frame plus one unit per
    // section, so a builder can read and write one section without the rest.
    decompose_page: async (p) => {
      const out = await editPageDecompose(slug, req(p, 'page'), opts)
      return { changed: out.data, message: out.human, now: out.at ?? (await opts.store.counter(slug)) }
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; f=$(git grep -l "export asyn…
<!-- xgd-tool name="Bash" id="toolu_01LoAtAe1rWxs5VSmZPS2fzG" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:17.160855+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; f=$(git grep -l \"export async function editModuleConfigure\" -- tools); echo $f; n=$(grep -n \"export async function editModuleConfigure\" $f | cut -d: -f1); sed -n \"$((n-15)),$((n+50))p\" $f","description":"Read editModuleConfigure"}
```

**Result**

```
tools/generate/src/cli/edit.ts
    {
      data: { module: { id: moduleId, type: meta.id, version: meta.version, slot: opts.slot } },
      human: `Added ${meta.id} '${moduleId}' to page '${pageId}'${opts.slot ? ` at slot '${opts.slot}'` : ''}.`,
    },
    { op: 'component.add', page: pageId, module: moduleId, label: `${meta.id} '${moduleId}'` },
  )
}

/**
 * Change an instance's behavioural configuration.
 *
 * Merged, so naming one setting leaves the rest alone — the same rule
 * {@link editConfigSet} follows and for the same reason. Presentation is not
 * reachable here: a slot is L1 and `set_l1` owns L1.
 */
export async function editModuleConfigure(
  slug: string,
  pageId: string,
  moduleId: string,
  config: Record<string, unknown>,
  opts: EditOptions,
): Promise<EditOutput> {
  const base = await readBase(slug, opts)
  const files = await readPageFiles(slug, opts)
  const file = requirePageFile(files, slug, pageId)

  const page = structuredClone(file.page)
  const instance = moduleList(page).find((m) => m.id === moduleId)
  if (!instance) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Page '${pageId}' has no component called '${moduleId}'.`,
      path: `${pageId}/${moduleId}`,
      hint: `Read the page's components with '1c page get ${slug} ${pageId}'.`,
    })
  }
  refuseHeldUpgrade(instance, pageId)
  const meta = requireBehavior(String(instance.type), Number(instance.version))
  instance.config = mergeConfigValue(instance.config, config) as Record<string, unknown>
  assertBehaviorInstance(
    meta,
    {
      config: instance.config as Record<string, unknown>,
      slots: (instance.slots ?? {}) as Record<string, BehaviorSlotValue>,
    },
    pageId,
  )

  const resulting = files.map((f) => (f === file ? page : f.page))
  assertNamedMessagesExist(resulting, pageId)
  await validateOrThrow(slug, opts, base, resulting)

  await writeSite(slug, opts, { pages: [{ name: file.name, page }] })
  return note(
    slug,
    opts,
    {
      data: { module: { id: moduleId, type: instance.type }, config: instance.config },
      human: `Configured '${moduleId}' on page '${pageId}'.`,
    },
    {
      op: 'component.configure',
      page: pageId,
      module: moduleId,
      label: `${String(instance.type)} '${moduleId}'`,
      after: clip(JSON.stringify(instance.config)),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; n=$(grep -n "function mergeC…
<!-- xgd-tool name="Bash" id="toolu_01KjDhJzmnkSebppG8Fa1Qg1" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:19.644049+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; n=$(grep -n \"function mergeConfigValue\" tools/generate/src/cli/edit.ts | cut -d: -f1); sed -n \"$((n-12)),$((n+20))p\" tools/generate/src/cli/edit.ts","description":"Read mergeConfigValue semantics"}
```

**Result**

```
 * Merge `patch` over `existing` (REQ-130).
 *
 * The rule is one sentence: **two objects merge, everything else replaces.** So
 * naming one setting inside a group leaves its siblings alone, and a list or a
 * scalar is written whole because there is no meaningful way to merge one.
 *
 * The alternative — replace at the addressed key, as this surface did before —
 * is what makes structured config dangerous rather than useful: a caller
 * changing a single colour in a palette family would have to resend the whole
 * family, and any entry it forgot would be silently deleted. That failure is
 * invisible until someone looks at the site, which is the worst kind.
 */
function mergeConfigValue(existing: unknown, patch: unknown): unknown {
  if (!isMapping(existing) || !isMapping(patch)) return patch
  const out: Record<string, unknown> = { ...existing }
  for (const [key, value] of Object.entries(patch)) {
    out[key] = mergeConfigValue(out[key], value)
  }
  return out
}

// ── reference scanning (rm integrity checks) ─────────────────────────────────

/** Nav entry labels whose target points at `pageId` (page or anchor targets). */
function navEntriesTargeting(base: Record<string, unknown>, pageId: string): string[] {
  const nav = base.nav
  if (nav === null || typeof nav !== 'object') return []
  const entries = (nav as Record<string, unknown>).entries
  if (!Array.isArray(entries)) return []
  const labels: string[] = []
  for (const entry of entries) {
    if (entry === null || typeof entry !== 'object') continue
    const target = (entry as Record<string, unknown>).target as Record<string, unknown> | undefined
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "function copy" -A6…
<!-- xgd-tool name="Bash" id="toolu_01PgtL6fEBZZy6yvSCTGbKLv" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:23.952608+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"function copy\" -A6 packages/framework/src/modules/checkout/component.ts; git grep -n \"null\" -- tools/generate/src/cli/edit.ts | grep -i \"config\\|remove\\|clear\\|delete\" | head","description":"Check copy() and null handling"}
```

**Result**

```
tools/generate/src/cli/edit.ts:2179: * An explicit `null` REMOVES the key. Four of the five are optional in the
tools/generate/src/cli/edit.ts:2238:    if (value === null) delete l1[key]
tools/generate/src/cli/edit.ts:4105:    return { data: { config: base }, human: JSON.stringify(base, null, 2) }
tools/generate/src/cli/edit.ts:4245:    favicon: config.favicon ?? null,
tools/generate/src/cli/edit.ts:4246:    shareCard: config.shareCard ?? null,
tools/generate/src/cli/edit.ts:4281:      data: { shareCard: config.shareCard ?? null },
tools/generate/src/cli/edit.ts:4288:      after: clip(JSON.stringify(config.shareCard) ?? 'null'),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "copy" packages/fram…
<!-- xgd-tool name="Bash" id="toolu_01R69nW4F6ue6x9SJF9VGfec" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:26.668348+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"copy\" packages/framework/src/modules/checkout/component.ts | head -5; grep -rn \"export function copy\\|function copy\" packages/framework/src/modules/*.ts packages/framework/src/modules/checkout/*.ts | head","description":"Find copy helper"}
```

**Result**

```
15: * meets the same sinks authored copy does; the script later writes figures into
44:const copy = (value: unknown, fallback: string): string => (typeof value === 'string' && value ? value : fallback)
78:/** The order-complete page's record: every figure is the script's, so each bound node keeps its own copy. */
133:    const prompt = copy(config.countryPrompt, DEFAULT_COUNTRY_PROMPT)
156:      text: copy(config.continueLabel, 'Continue to payment'),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n "mergeConfigValu…
<!-- xgd-tool name="Bash" id="toolu_01GQyyzc2PJTSA56mS14pAX8" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:33.991445+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n \"mergeConfigValue(\" -- tools/generate/src/cli/edit.ts; sed -n 2175,2185p tools/generate/src/cli/edit.ts; git grep -ln \"configure_component\" -- tests | head","description":"Check mergeConfigValue callers and tests"}
```

**Result**

```
tools/generate/src/cli/edit.ts:871:function mergeConfigValue(existing: unknown, patch: unknown): unknown {
tools/generate/src/cli/edit.ts:875:    out[key] = mergeConfigValue(out[key], value)
tools/generate/src/cli/edit.ts:2864:          design: mergeConfigValue(current, look.design),
tools/generate/src/cli/edit.ts:3208:  if (opts.seoMeta !== undefined) updated.seoMeta = mergeConfigValue(file.page.seoMeta, opts.seoMeta)
tools/generate/src/cli/edit.ts:3892:  instance.config = mergeConfigValue(instance.config, config) as Record<string, unknown>
tools/generate/src/cli/edit.ts:4148:  const merged = mergeConfigValue(scoped ? base : getDotted(base, key), value)
tools/generate/src/cli/edit.ts:4704:  const merged = mergeConfigValue(base.design ?? {}, design) as L1Design
 * `{ref: 'sand', shade: -0.4}` would leave a shade the caller never asked for on
 * an entry that never had it. A partial value is refused by the envelope
 * instead, which tells the caller what the whole value needs.
 *
 * An explicit `null` REMOVES the key. Four of the five are optional in the
 * schema, and a document that has been given a background must be able to give
 * it back — otherwise the surface could reach a state the importer can produce
 * and then never leave it, which is the parity gap this ticket exists to close,
 * pointed the other way.
 *
 * Atomic on the same terms as every other write here: the change lands in a
tests/reconciliation-assistant-control-surface.test.ts
tests/reconciliation-beyond-l1-authoring.test.ts
tests/support/lead-site.ts
tests/test_UAT_FC_REQ-126_l1_surface.test.ts
tests/test_UAT_FC_REQ-130_beyond_l1.test.ts
```

## Edit /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368/tools/generate/src/cli/edit.ts
<!-- xgd-tool name="Edit" id="toolu_01Fvzh12t5jMutVvR77EMA5p" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:37.960254+00:00" -->

**Input**

```json
{"file_path":"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368/tools/generate/src/cli/edit.ts","new_string":"  instance.config = mergeConfigValue(instance.config, config) as Record<string, unknown>\n  // [[BUG-368]] — an explicit `null` REMOVES a setting, so a page's own wording\n  // (a checkout's `countryPrompt`) can be given back to the framework's default.\n  // Top-level only: `null` is never a setting's value.\n  for (const [key, value] of Object.entries(config)) if (value === null) delete instance.config[key]\n  assertBehaviorInstance(","old_string":"  instance.config = mergeConfigValue(instance.config, config) as Record<string, unknown>\n  assertBehaviorInstance("}
```

**Result**

```
The file /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368/tools/generate/src/cli/edit.ts has been updated successfully.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; n=$(grep -n '"tool": "config…
<!-- xgd-tool name="Bash" id="toolu_01BcVGYDY3rzzjbvCYTA3PRt" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:40.038105+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; n=$(grep -n '\"tool\": \"configure_component\"' tools/generate/src/cli/ai/l1-surface.json | cut -d: -f1); sed -n \"$((n+3))p\" tools/generate/src/cli/ai/l1-surface.json | cut -c1-120; grep -n \"configure_component\\|countryPrompt\\|checkout\" tools/generate/src/cli/ai/priming.json | cut -c1-200 | head","description":"Look at description line and playbook mentions"}
```

**Result**

```
      "description": "Only the settings you name change; the rest are left alone. This is the working half of a componen
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nil "playbook" --…
<!-- xgd-tool name="Bash" id="toolu_01QTkAweKx3wUT5UWH2kbZR6" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:43.986107+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -nil \"playbook\" -- . ':!.xgd' ':!*.ndjson' | head -20; git grep -nl \"checkout\" -- tools/generate/src/cli/ai kb 2>/dev/null | head","description":"Locate consultant playbook"}
```

**Result**

```
tests/support/stage-guides.ts
tests/test_UAT_FC_BUG-202_comps_capture_and_show.test.ts
tests/test_UAT_FC_BUG-245_one_voice_one_thing.test.ts
tests/test_UAT_FC_BUG-303_corpus_follows_its_tickets.test.ts
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts
tests/test_UAT_FC_BUG-311_established_site_is_past_its_first_build.workers.test.ts
tests/test_UAT_FC_BUG-357_started_hand_off_still_says_stopped.test.ts
tests/test_UAT_FC_BUG-65_priming_names_no_documents.test.ts
tests/test_UAT_FC_REQ-171_session_texts.test.ts
tests/test_UAT_FC_REQ-408_story_board.test.ts
tests/test_UAT_FC_REQ-424_focus_on_the_surface.test.ts
tests/test_UAT_FC_REQ-473_v2_priming.test.ts
tests/test_UAT_FC_REQ-632_discovery_and_story_board.test.ts
tests/test_UAT_FC_REQ-638_playbook_with_its_tool.test.ts
tools/generate/src/cli/ai/cadence-core.ts
tools/generate/src/cli/ai/host-core.ts
tools/generate/src/cli/ai/plan-core.ts
tools/generate/src/cli/ai/priming.json
tools/generate/src/cli/ai/stage-guide-core.ts
tools/generate/src/cli/ai/host-core.ts
tools/generate/src/cli/ai/host.ts
tools/generate/src/cli/ai/platform-fonts.ts
tools/generate/src/cli/ai/toolbox-core.ts
tools/generate/src/cli/ai/toolbox.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 1,40p tests/test_UAT_…
<!-- xgd-tool name="Bash" id="toolu_01CFMqd4CCD381cArmryhWe5" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:46.660682+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 1,40p tests/test_UAT_FC_REQ-638_playbook_with_its_tool.test.ts | head -40; git grep -n \"checkout\" -- tools/generate/src/cli/ai/toolbox-core.ts tools/generate/src/cli/ai/host-core.ts | head","description":"Understand what the playbook is"}
```

**Result**

```
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { fsSiteStore } from '../tools/generate/src/store'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { openSession, resetAiHost, setModelClient, streamPrompt, type HostDeps } from '../tools/generate/src/cli/ai/host-core'
import { checkPlan, seedPlan, type Plan, type PlanDeps } from '../tools/generate/src/cli/ai/plan-core'
import { GUIDE_RULES } from '../tools/generate/src/cli/ai/stage-guide-core'
import { calls, says, scriptedClient, type ModelRequest, type ModelStep } from './support/scripted-model-client'

/**
 * [[REQ-638]] — **the playbook arrives with its tool** ([[DOC-82]] §7): each DOC-75
 * section belongs to its tools, and the host hands it over with the result of the
 * first call to one of them on a site, once. No piece starting hands one over.
 *
 * THROUGH THE REAL HOST: every message goes through `streamPrompt`, so the real
 * manager records the turn and the tool results, and the plan is read and written
 * through the host's own port. The playbook is a fixture document in DOC-75's shape,
 * so the suite pins the hand-over and not the playbook's wording. Only the Anthropic
 * client is scripted.
 */

const STORY = "## Playbook: the story board (about 10 minutes)\n\nPin only their stories, one story per note."
const COMPS = '## Playbook: the comparison board (10–15 minutes)\n\nAsk for sites they like first.'
const DOC = `# Playbook: the Site consultant's tools\n\nAdvice, not a route.\n\n${COMPS}\n\n${STORY}\n`
const NOTE = { text: 'My dad taught me to weld in his garage.', quote: 'My dad taught me to weld in his garage.', emoji: '👪', theme: 'Family' }

let cwd: string
let ai: Record<string, unknown>

beforeAll(async () => {
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
  cwd = mkdtempSync(path.join(tmpdir(), 'req638-playbook-'))
}, 180000)

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})
tools/generate/src/cli/ai/host-core.ts:58: * specifier resolves it from the main checkout and not from a linked worktree.
tools/generate/src/cli/ai/host-core.ts:858:  checkout?: (() => Promise<unknown>) | null
tools/generate/src/cli/ai/host-core.ts:4316:      checkout: deps.checkout ?? null,
tools/generate/src/cli/ai/host-core.ts:4827:  // workspace and half in the home directory, and two checkouts would share a
tools/generate/src/cli/ai/toolbox-core.ts:210: * resolves the shared store from the main checkout and not from a linked
tools/generate/src/cli/ai/toolbox-core.ts:452:   * are a build product and a fresh checkout has none. `resolveFont` says so in a
tools/generate/src/cli/ai/toolbox-core.ts:473:   * business behind the site; `describe_site` then carries no `checkout`.
tools/generate/src/cli/ai/toolbox-core.ts:475:  checkout: (() => Promise<unknown>) | null = null,
tools/generate/src/cli/ai/toolbox-core.ts:496:      ...(checkout ? { checkout: await checkout() } : {}),
tools/generate/src/cli/ai/toolbox-core.ts:1025:          checkout: (() => Promise<unknown>) | null = null,
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; f=$(grep -l "^id: DOC-75$" .xgd/tickets/hot/*.md | head -1); echo $f; grep…
<!-- xgd-tool name="Bash" id="toolu_017Q6ASFwyqiCsukpbfzqaVd" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:50.067254+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; f=$(grep -l \"^id: DOC-75$\" .xgd/tickets/hot/*.md | head -1); echo $f; grep -n \"^## \\|checkout\\|Ship to\\|countryPrompt\\|configure_component\" $f | head -40; wc -c $f","description":"Inspect DOC-75 playbook for checkout section"}
```

**Result**

```
.xgd/tickets/hot/doc-50b859e0.md
21:## Playbook: gathering and taking stock
41:## Playbook: focus tasks
45:## Playbook: the comparison board
55:## Playbook: the story board
68:## Playbook: the design and looks
78:## Playbook: the site plan
88:## Playbook: the first draft
98:## Playbook: checking your work
108:## Playbook: refinement
119:## Playbook: finishing touches
125:## Playbook: publishing
   20728 .xgd/tickets/hot/doc-50b859e0.md
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; sed -n 1,20p .xgd/tickets/hot/doc-50b859e0.md; sed -n 105,135p .xgd/tickets…
<!-- xgd-tool name="Bash" id="toolu_01HGW4qUJ86fcWcknDoht631" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:52.205496+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; sed -n 1,20p .xgd/tickets/hot/doc-50b859e0.md; sed -n 105,135p .xgd/tickets/hot/doc-50b859e0.md","description":"Read DOC-75 header and refinement sections"}
```

**Result**

```
---
uid: doc-50b859e0
id: DOC-75
type: doc
title: 'Playbook: the Site consultant''s tools'
created_by: REQ-473
created_at: '2026-10-27T15:59:26.408155+00:00'
updated_at: '2026-11-05T22:12:11.990609+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  doc_kind: system_kb
  parent_uid: request-bfa0b74f
---

# Playbook: the Site consultant's tools

**Audience:** the Site consultant. This is advice, not a route. The goal is a great site for this client, aligned with them, and a plan they agreed ([[DOC-82]]); each section below is about one tool or moment, and you reach for it because the plan has a gap it fills. The host hands you a section the first time you use its tool on a site; your knowledge map finds any section whenever you want it. What you choose to do for this client is yours to judge.


**The critic** is a tool: call critique when a change is big enough to want a fresh pair of eyes (a new look, a page largely rewritten), and answer every finding before you hand back. The review before publishing runs when Publish is opened; its findings are suggestions for your client.

## Playbook: refinement

**What it's for:** finishing the site through conversation, until they say it's right. The first draft was your best effort; the changes here come from what they tell you.

- **Lead it.** Take them through the site and ask what they think, a page or an area at a time when that helps them.
- **Turn a vague concern into something actionable:** say in a line what you think is behind it, then offer one to three concrete options. A change to the whole site's design as Looks; one section as a before and after. A precise request: just do it.
- **Change only what came from them,** and fix what the checks find broken in what that change touched. Anything else is a suggestion, one at a time with your reason. A smaller version of something they rejected is still rejected.
- **Several changes in one message:** do them in one batch and report each.
- **When you think it's ready, ask once:** look at it in a real browser tab and on your phone (*View on your phone* beside the preview shows a code for the phone's camera, and they sign in with the email they use here); point at anything with Marked Points; is anything missing; does it meet your standard compared with the sites we looked at? They decide when it's right.
- **The same thing changing back and forth** means part of the plan isn't settled: go back to it with them rather than keep polishing.

## Playbook: finishing touches

Life once the basics are settled: often the signature effect plus entrance reveals. The motion reference in your knowledge base has the patterns, taste tests and don'ts. When they prefer you to lead, suggest, then go ahead unless they object; when they lead, offer, with your pick. Never undo a choice they made to add an effect. Check the tab icon and the share card: both are site settings (`favicon`, `shareCard`), also on the Settings tab.

**Making a clip:** an eye-catcher that ends on the original photo, then quieter ongoing motion. The eye-catcher is what visitors notice: a clear action they see in the first second or two (something enters the frame, is poured, falls, is lifted in, lights up); a faint stir is a loop, not an eye-catcher. Then: a clean last frame; allow for the end state; give the moving element room in the frame; strong motion plays once.

## Playbook: publishing

**Publishing is your client's decision,** made with the Publish button. Tell them where they stand from what you have:
- **an address is chosen** (your plan entry says when there is none): a free address ending in `.1stc.site` is enough; pointing their own domain is done on the Settings tab with the Settings assistant. Send them to the web address section with show_client (target `web_address`) before they ever discover it by pressing Publish;
- **no placeholders remain;**
- **nothing is broken:** the host's look after a build, and your own final checks at both widths;
- **the contact form works.**

Facts to state truthfully, never guessing or giving dates: contact-form messages land in Contacts and the owner isn't emailed, so tell them to check the Contacts tab; a visitor gets an automatic reply only if the form has one; the share card defaults to the site's name and tagline. Never tell them a capability is missing until you've checked your tools.

**The moment it's live:** the live link, where enquiries arrive, and that nothing goes live again until they publish again; when they prefer you to lead, add a ready-made line to share it and a warm, easy question.
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git grep -n "DOC-75\|doc-50b859e0" -- tests | grep -iv "fixture" | head; ca…
<!-- xgd-tool name="Bash" id="toolu_01WUmNWWth1Yzp5AXpeuCBjE" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:14:58.620993+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git grep -n \"DOC-75\\|doc-50b859e0\" -- tests | grep -iv \"fixture\" | head; cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/system-kb-doc-cannot-ride-a-branch.md | sed -n 5,30p","description":"Check tests pinning DOC-75 and memory"}
```

**Result**

```
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts:36: * [[DOC-75]], read from the ticket store the release exports.
tests/test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop.test.ts:14: * The first-draft guide is the shipped [[DOC-75]], read from the ticket store the
tests/test_UAT_FC_BUG-356_signature_effect_by_default.test.ts:36: * surface, with the plan held in memory; the playbook is the shipped [[DOC-75]].
tests/test_UAT_FC_REQ-623_refinement_is_client_sourced.test.ts:43: * (`streamPrompt`) with the shipped [[DOC-75]]. Doubles only at the edges: the
tests/test_UAT_FC_REQ-638_playbook_with_its_tool.test.ts:14: * [[REQ-638]] — **the playbook arrives with its tool** ([[DOC-82]] §7): each DOC-75
  node_type: memory
  type: reference
  originSessionId: d651f26b-9c7a-4c34-85fa-a17fcef2a771
  modified: 2026-11-03T20:01:32.865Z
---

Editing a `doc_kind: system_kb` ticket (DOC-75, the playbook/stage guides) from a branch worktree does not stay on the branch: `xgd ticket update` writes xgd-working's store, the KB that `bin/deploy` ships is built from that store, and tests read the doc through `readDocTickets()` (spawns the xgd CLI against the main store), not the worktree's file.

**How to apply:** for an unmerged branch whose code depends on a rewritten KB doc, park the new body (REQ-638 parked DOC-75 as COMMENT-7250), make the code tolerate both headings, keep the doc-pinning tests on the live wording, and list "apply the doc, then update the tests that pin its wording" as a merge step. Applying it early changes what the next production deploy ships ([[production-deploys-from-xgd-working]]).
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n "refinement\|toContain\|toMatch\|length" tests/test_UAT_FC_REQ-623_…
<!-- xgd-tool name="Bash" id="toolu_01DV9p9JpTTDWdTmoai26P9e" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:03.089232+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n \"refinement\\|toContain\\|toMatch\\|length\" tests/test_UAT_FC_REQ-623_refinement_is_client_sourced.test.ts | head -30","description":"Check REQ-623 refinement pins"}
```

**Result**

```
33: * [[REQ-623]] — **refinement is consultant-led and client-sourced; the AI's own
35: * first draft's review ran 46 minutes into refinement, its fixes chained into
70:    verdict: findings.length ? 'The hero needs work.' : 'Good enough.',
101:        const reply = replies[Math.min(ran, replies.length - 1)]
165:describe('REQ-623 — refinement is client-sourced; the AI reviews the first draft before it is shown', () => {
167:  it('test_UAT_FC_REQ-623_no_critique_in_refinement', async () => {
174:    expect(reminder(deps)).not.toMatch(/Review:/)
178:    expect(answered).not.toMatch(/call critique once more/)
187:    expect(reminder(deps)).not.toMatch(/Review:/)
193:    expect(reminder(deps)).toMatch(/Review: A review of the site is due/)
226:    expect(offered).not.toMatch(/Error|NO_LOOKS|DESIGN_INVALID/)
229:    expect(chosen).not.toMatch(/Error|UNKNOWN_LOOK|PLAN_INVALID/)
261:    expect(brief).toContain('Lose the box, I want to see the sparks.')
262:    expect(brief).toContain(CLIENT_DECIDED)
263:    expect(ran).not.toMatch(/Error/)
266:  it('test_UAT_FC_REQ-623_priming_says_refinement_is_client_sourced', () => {
268:    const refinement = parseStageGuides(doc).get('refinement') ?? ''
269:    expect(refinement).toMatch(/\*\*Lead it\.\*\*/)
270:    expect(refinement).toMatch(/the changes here come from what they tell you/)
271:    expect(refinement).toMatch(/offer one to three concrete options/)
272:    expect(refinement).toMatch(/Change only what came from them/)
273:    expect(refinement).toMatch(/Anything else is a suggestion, one at a time with your reason/)
278:    expect(rules.replace(/\s+/g, ' ')).toMatch(/After that, an improvement they didn't ask for is a suggestion, one at a time with your reason, built only if they say yes/)
279:    expect(rules).not.toMatch(/prefer you to lead:\*\* go ahead with the improvements/)
280:    expect(rules).not.toMatch(/this is where they try things/)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "editModuleConfigure…
<!-- xgd-tool name="Bash" id="toolu_019FeLpwKmuLQ2dBMerFmTbZ" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:07.399748+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"editModuleConfigure\\|configure_component\" -B2 -A12 tests/test_UAT_FC_REQ-130_beyond_l1.test.ts | head -60; sed -n 1,40p tests/test_UAT_FC_REQ-130_beyond_l1.test.ts | grep -n \"import\\|beforeEach\\|mkdtemp\\|store\"","description":"Read REQ-130 configure test pattern"}
```

**Result**

```
301-    // the fields the form asks for. (It used to say "the endpoint the form posts
302-    // to"; [[BUG-86]] removed that from config, so `fields` carries the case.)
303:    await box.run('configure_component', {
304-      page: 'home',
305-      name: 'signup',
306-      config: { submitLabel: 'Get early access' },
307-    })
308-    const config = readPage().modules[0].config
309-    expect(config.submitLabel).toBe('Get early access')
310-    expect(config.fields).toHaveLength(1)
311-
312-    // The page map is where a caller sees what is already there.
313-    const map = await json<{ components: any[] }>(box, 'describe_page', { page: 'home' })
314-    expect(map.components).toHaveLength(1)
315-    expect(map.components[0]).toMatchObject({ id: 'signup', type: 'contact-form', slot: 'signup-form' })
--
507-      'list_behaviors',
508-      'add_component',
509:      'configure_component',
510-      'remove_component',
511-    ]) {
512-      expect(declared).toContain(op)
513-    }
514-    // A method with no declaration is a capability nothing documents, validates
515-    // or audits; a declaration with no method is a startup failure on an
516-    // operator's machine with a turn in flight.
517-    // Both halves — the agnostic core and the two operations that need a disk
518-    // (REQ-146). Node's surface is their union.
519-    const opsUnion = {
520-      ...l1Operations(SLUG, fsOpts(cwd)),
521-      ...nodeOperations(SLUG, fsOpts(cwd)),
1:import { LEAD_ACTION } from '../packages/framework/src/modules/contact-form/fields'
24:import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
25:import { mkdtempSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
26:import { tmpdir } from 'node:os'
27:import path from 'node:path'
28:import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
29:import {
39:import { validateSvg } from '../packages/site-schema/src/svg'
40:import { fsOpts } from './support/site-factory'
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "export function fsO…
<!-- xgd-tool name="Bash" id="toolu_019kmD19FmwuqYKhpzvBMZpV" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:11.107200+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"export function fsOpts\" -A10 tests/support/site-factory.ts; grep -n \"export interface EditOptions\" -A15 tools/generate/src/cli/edit.ts; git grep -ln \"memorySiteStore\" -- tests | xargs grep -l \"editModule\\|editPage\" | head -3","description":"Find EditOptions and memory store usage in tests"}
```

**Result**

```
100:export function fsOpts(cwd: string, root: Root = 'sites'): EditOptions {
101-  return { cwd, sandbox: root === 'sandbox', store: fsSiteStore({ cwd, root }) }
102-}
103-
104-/** Both adapters, for `describe.each` — the shape AC-4 and AC-7 are asserted in. */
105-export const SITE_BACKENDS: ReadonlyArray<{
106-  name: string
107-  make: (options?: SiteSeedOptions) => SiteFixture
108-}> = [
109-  { name: 'filesystem', make: makeFsSite },
110-  { name: 'memory', make: makeMemorySite },
151:export interface EditOptions extends GlobalOptions {
152-  store: SiteStore
153-  /**
154-   * [[REQ-484]] — how a host checks a component upgrade a write has just
155-   * landed for a visible change, answering the finding in words for whoever
156-   * made the write, or null when there is nothing to say. Absent where there
157-   * is no published page or no browser to compare against: the upgrade is
158-   * still saved and still reported, only not checked.
159-   */
160-  upgradeCheck?: (slug: string, landed: readonly LandedUpgrade[]) => Promise<string | null>
161-}
162-
163-/**
164- * [[REQ-484]] — what the last write through these options said about the
165- * component upgrades it carried, waiting for {@link note} to put it on the
166- * command's answer and in the change journal. Keyed by the options object a
tests/reconciliation-cloudflare-site-store.workers.test.ts
tests/test_UAT_FC_REQ-143_d1r2_store.workers.test.ts
tests/test_UAT_FC_REQ-247_email_page.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "memorySiteStore\|ed…
<!-- xgd-tool name="Bash" id="toolu_01Ww9yy9whCyNWQkx83n6bo6" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:13.587245+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"memorySiteStore\\|editModule\\|editPage\\|EditOptions\\|cwd\" tests/test_UAT_FC_REQ-247_email_page.test.ts | head -15","description":"See memory-store edit test pattern"}
```

**Result**

```
17: * real grant — and never `editPageAdd` directly. A test calling the edit
54:import { editPageList } from '../tools/generate/src/cli/edit'
65:import { fsSiteStore, memorySiteStore, memoryReferenceStore } from '../tools/generate/src/store'
76:let cwd: string
85:  return createL1Toolbox(SLUG, { cwd, sandbox: true }) as Promise<Box>
117:  cwd = mkdtempSync(path.join(tmpdir(), 'req247-'))
118:  cmdNew(SLUG, { cwd, sandbox: true })
123:  require('node:fs').rmSync(cwd, { recursive: true, force: true })
255:    await cmdRender(SLUG, { cwd, sandbox: true })
256:    const out = path.join(cwd, 'storage', 'dist', 'sandbox', SLUG, 'draft')
795:    const store = fsSiteStore({ cwd, root: 'sandbox' })
796:    const human = (await editPageList(SLUG, { cwd, sandbox: true, store })).human
862:    const payload = await readSitePayload(fsSiteStore({ cwd, root: 'sandbox' }), memoryReferenceStore(), SLUG)
865:    const landed = memorySiteStore()
```

## Write /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368/tests/test_UAT_FC_BUG-368_ship_t…
<!-- xgd-tool name="Write" id="toolu_018Uium67QiDjG373D8fPtmk" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:25.847476+00:00" -->

**Input**

```json
{"content":"/**\n * [[BUG-368]] — the Site consultant can give a checkout page's Ship to wording\n * back to the framework's default. `configure_component` merges the settings it\n * names, so until an explicit `null` removed one, a page's own `countryPrompt`\n * could be reworded but never cleared.\n */\n\nimport { describe, expect, it } from 'vitest'\nimport { tmpdir } from 'node:os'\nimport { editModuleConfigure } from '../tools/generate/src/cli/edit'\nimport { renderSiteFiles, type SiteCatalog } from '../tools/generate/src/render'\nimport { memorySiteStore } from '../tools/generate/src/store/memory-store'\nimport { latestModuleVersion } from '../packages/framework/src/modules/catalog'\nimport { DEFAULT_COUNTRY_PROMPT } from '../packages/framework/src/modules/checkout/component'\nimport { catalogItems, catalogSeed } from './support/catalog-site'\n\nconst SHIPPING = { currency: 'EUR', dispatchNote: 'Ships within 3 working days', countries: [{ code: 'FR', rate: 500 }, { code: 'GB', rate: 800 }] }\n\nfunction shop() {\n  const seed = catalogSeed()\n  const contact = structuredClone(seed.pages['contact.json']) as Record<string, any>\n  seed.pages['checkout.json'] = {\n    ...contact,\n    id: 'checkout',\n    slug: 'checkout',\n    title: 'Checkout',\n    seoMeta: { title: 'Checkout', description: 'Checkout page.' },\n    modules: [\n      {\n        id: 'checkout',\n        type: 'checkout',\n        version: latestModuleVersion('checkout'),\n        slot: 'contact',\n        config: { mode: 'checkout', countryPrompt: 'Where shall we send it?', continueLabel: 'Pay now' },\n      },\n    ],\n  }\n  const store = memorySiteStore()\n  store.seed(seed.slug, seed)\n  return { slug: seed.slug as string, store }\n}\n\nasync function firstShipToOption(store: ReturnType<typeof memorySiteStore>, slug: string): Promise<string> {\n  const loaded = (await store.loadDraft(slug))!.result\n  if (!loaded.ok) throw new Error(loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '))\n  const catalog: SiteCatalog = { items: catalogItems(), canTakePayments: true, shipping: SHIPPING }\n  const files = new Map((await renderSiteFiles(loaded.value, { catalog })).files)\n  const html = files.get('checkout/brass-lamp') ?? files.get('checkout/brass-lamp.html') ?? ''\n  const select = html.match(/<select[^>]*data-checkout-control=\"ship-to\"[^>]*>\\s*<option[^>]*>([^<]*)</)\n  if (!select) throw new Error('no Ship to choice on the checkout page')\n  return select[1]\n}\n\ndescribe(\"BUG-368 — a checkout page's Ship to wording can be cleared\", () => {\n  it('test_UAT_FC_BUG-368_configure_component_null_restores_the_default_ship_to_prompt', async () => {\n    const { slug, store } = shop()\n    expect(await firstShipToOption(store, slug)).toBe('Where shall we send it?')\n\n    const out = await editModuleConfigure(slug, 'checkout', 'checkout', { countryPrompt: null }, { cwd: tmpdir(), store })\n    const config = (out.data as { config: Record<string, unknown> }).config\n    expect(config).not.toHaveProperty('countryPrompt')\n    // Only the named setting goes; the rest are left alone.\n    expect(config).toMatchObject({ mode: 'checkout', continueLabel: 'Pay now' })\n\n    expect(DEFAULT_COUNTRY_PROMPT).toBe('Please select a region for delivery')\n    expect(await firstShipToOption(store, slug)).toBe(DEFAULT_COUNTRY_PROMPT)\n  })\n})\n","file_path":"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368/tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts"}
```

**Result**

```
File created successfully at: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368/tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts (file state is current in your context — no need to Read it back)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; timeout 580 npx vitest run -…
<!-- xgd-tool name="Bash" id="toolu_01C9vXzLYDUDesdic5MtcPY4" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:27.493472+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; timeout 580 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts 2>&1 | grep -E \"✓|×|Error|expected|Test Files|Tests \" | head -20","description":"Run new ship-to UAT","timeout":600000}
```

**Result**

```
     × test_UAT_FC_BUG-368_configure_component_null_restores_the_default_ship_to_prompt 40ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
Error: no Ship to choice on the checkout page
     50|   if (!select) throw new Error('no Ship to choice on the checkout page…
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; cat > $TMPDIR/dbg368.test.ts…
<!-- xgd-tool name="Bash" id="toolu_01WusZZ1YNrkH1EmbLFustG4" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:34.673474+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; cat > $TMPDIR/dbg368.test.ts <<'EOF'\nEOF\nsed -i '' 's|  if (!select) throw new Error(.no Ship to choice on the checkout page.)|  if (!select) throw new Error(`no Ship to: ${[...files.keys()].filter((k) => k.includes(\"checkout\")).join(\",\")} :: ${(html.match(/<select[^]{0,300}/) ?? [\"\"])[0]}`)|' tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts; timeout 580 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts 2>&1 | grep -E \"Error\" | head -5","description":"Debug rendered checkout file","timeout":600000}
```

**Result**

```
Error: no Ship to: checkout/brass-lamp.html,checkout/glass-lamp.html,checkout/old-lamp.html,checkout/sold-lamp.html,checkout/oak-chair.html :: 
     50|   if (!select) throw new Error(`no Ship to: ${[...files.keys()].filter…
[This command modified 1 file you've previously read: tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts. Call Read before editing.]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n "region for deli…
<!-- xgd-tool name="Bash" id="toolu_01AQNSNqLF8SrmLgUvXWgMYH" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:40.371233+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n \"region for delivery\\|countryPrompt\" -- tests | head; sed -n 125,145p packages/framework/src/modules/checkout/component.ts","description":"See how prompt is drawn and tested"}
```

**Result**

```
tests/test_UAT_FC_BUG-367_checkout_page.test.ts:102:    expect(DEFAULT_COUNTRY_PROMPT).toBe('Please select a region for delivery')
tests/test_UAT_FC_BUG-367_checkout_page.test.ts:118:          config: { mode: 'checkout', countryPrompt: 'Where should we send it?' },
tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts:416:    expect(html).toContain('aria-label="Please select a region for delivery"')
    // shown the total first; when every country costs the same there is nothing
    // to choose, so the page draws no Ship to and Stripe's address form offers
    // every country shipped to (`orders.ts`'s `singleRate`).
    const singleRate = shipping.countries.length > 0 && shipping.countries.every((c) => c.rate === shipping.countries[0].rate)
    const names = regionNames(localeTag)
    const countries = shipping.countries
      .map((c) => ({ ...c, name: names?.of(c.code) ?? c.code, display: formatMoney(c.rate, shipping.currency, localeTag) }))
      .sort((a, b) => a.name.localeCompare(b.name, localeTag))
    const prompt = copy(config.countryPrompt, DEFAULT_COUNTRY_PROMPT)
    if (!singleRate || shipping.countries.length === 0) {
      controls['ship-to'] = {
        tag: 'select',
        attrs: {
          name: 'country',
          required: true,
          'aria-label': prompt,
          'data-checkout-control': 'ship-to',
          disabled: !buyable,
        },
        options: [
          ...(only ? [] : [{ value: '', label: prompt }]),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF' p='tests/t…
<!-- xgd-tool name="Bash" id="toolu_01HCCwF1FXYp7M1gvWg4cmky" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:50.081718+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts'\ns=open(p).read()\ns=s.replace(\"\"\"        config: { mode: 'checkout', countryPrompt: 'Where shall we send it?', continueLabel: 'Pay now' },\n\"\"\",\"\"\"        config: { mode: 'checkout', countryPrompt: 'Where shall we send it?', continueLabel: 'Pay now' },\n        slots: {\n          page: {\n            id: 'own-checkout',\n            kind: 'container',\n            layout: 'stack',\n            children: [\n              { id: 'own-ship-to', kind: 'control', control: 'ship-to' },\n              { id: 'own-continue', kind: 'control', control: 'continue' },\n            ],\n          },\n        },\n\"\"\")\nimport re\nstart=s.index(\"  const select = html.match(\")\nend=s.index(\"  return select[1]\\n\")+len(\"  return select[1]\\n\")\ns=s[:start]+\"\"\"  const select = html.match(/<select[^>]*data-checkout-control=\"ship-to\"[^>]*>/)?.[0]\n  const label = select?.match(/aria-label=\"([^\"]*)\"/)?.[1]\n  if (label === undefined) throw new Error('no Ship to choice on the checkout page')\n  return label\n\"\"\"+s[end:]\ns=s.replace(\"firstShipToOption\",\"shipToPrompt\")\nopen(p,'w').write(s)\nEOF\ntimeout 580 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts 2>&1 | grep -E \"✓|×|Error|expected|Test Files|Tests \" | head -10","description":"Fix test and rerun","timeout":600000}
```

**Result**

```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; timeout 590 npx vitest run -…
<!-- xgd-tool name="Bash" id="toolu_01NJHLQqxrxpVhVjXYPSuBtY" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:15:58.260003+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; timeout 590 npx vitest run --config vitest.config.mts tests/test_UAT_FC_REQ-130_beyond_l1.test.ts tests/test_UAT_FC_REQ-126_l1_surface.test.ts 2>&1 | grep -E \"×|Test Files|Tests \" | head; grep -n '\"typecheck\\|\"tsc' package.json","description":"Run configure suites and find typecheck script","timeout":600000}
```

**Result**

```
 Test Files  2 passed (2)
      Tests  29 passed (29)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; ls tsconfig*.json packages/f…
<!-- xgd-tool name="Bash" id="toolu_01NrR3MyQcyh5TFewyBfWZs5" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:05.832697+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; ls tsconfig*.json packages/framework/tsconfig.json tools/generate/tsconfig.json apps/control-app/tsconfig.json 2>/dev/null; for p in packages/framework tools/generate apps/control-app; do echo \"== $p\"; (timeout 300 npx tsc -p $p --noEmit 2>&1 | grep -E \"error\" | grep -E \"l2/checkout|checkout/|behavior.ts|render/render.ts|cli/edit.ts|router.ts|checkout-intake\" | head -10); done","description":"Typecheck touched packages, filter to touched files","timeout":600000}
```

**Result**

```
apps/control-app/tsconfig.json
packages/framework/tsconfig.json
tools/generate/tsconfig.json
tsconfig.base.json
== packages/framework
== tools/generate
tools/generate/src/cli/edit.ts(3896,81): error TS18046: 'instance.config' is of type 'unknown'.
== apps/control-app
tools/generate/src/cli/edit.ts(3896,81): error TS18046: 'instance.config' is of type 'unknown'.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF' p='tools/g…
<!-- xgd-tool name="Bash" id="toolu_01A78Brr2iMJXjdnhY8W6oNC" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:18.622197+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; python3 - <<'EOF'\np='tools/generate/src/cli/edit.ts'\ns=open(p).read()\ns=s.replace(\"if (value === null) delete instance.config[key]\",\"if (value === null) delete (instance.config as Record<string, unknown>)[key]\")\nopen(p,'w').write(s)\nEOF\nfor p in tools/generate apps/control-app packages/framework; do echo \"== $p\"; timeout 300 npx tsc -p $p --noEmit 2>&1 | grep -E \"error\" | grep -E \"l2/checkout|checkout/|behavior.ts|render/render.ts|cli/edit.ts|router.ts|checkout-intake|BUG-36\" | head; done","description":"Fix type error and re-typecheck","timeout":600000}
```

**Result**

```
== tools/generate
== apps/control-app
== packages/framework
```

## Bash sed -n 1,20p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/lf-js-python-peers-in-sync…
<!-- xgd-tool name="Bash" id="toolu_01DmB8RYeyCQzFjLM85MASZw" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:32.576847+00:00" -->

**Input**

```json
{"command":"sed -n 1,20p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/lf-js-python-peers-in-sync.md | tail -12","description":"Read LF peers memory"}
```

**Result**

```
metadata:
  node_type: memory
  type: feedback
  originSessionId: 54c5972a-e95a-41e6-a502-3b2e42627c6f
  modified: 2026-11-01T18:05:28.647Z
---

In lagrange-framework, the JS and Python peers are kept in sync: every change (e.g. delegation REQ-148/205/207/210, REQ-232's detached Delegate) ships in both, with shared declaration bytes and the tests run against both.

**Why:** on 2026-11-01 I answered a framework session's "JS only now, Python follow-up?" with JS-only; the operator overruled it: "No we keep python and JS in sync."

**How to apply:** when scoping or answering questions on a framework ticket, include the Python peer in scope and in the test plan by default, even when only 1st Contact (JS) needs the feature. See [[cross-repo-ticket-not-code]].
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -c "Only you see this\|…
<!-- xgd-tool name="Bash" id="toolu_01FTUmrbFQH5ux7PkwyaTedR" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:36.430168+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -c \"Only you see this\\|r.data.notice\" packages/framework/src/modules/module-assets.ts; head -c 600 packages/framework/src/modules/module-assets.ts; git log --oneline -3 -- packages/framework/src/modules/module-assets.ts","description":"Check module-assets embeds client.js"}
```

**Result**

```
1
// GENERATED by `1c assets` (REQ-145). Do not edit.
//
// The behavior modules' static chrome, read from their `styles.css` and
// `client.js` sources at BUILD time so that `theme.css` and `capabilities.js` can be
// composed in a runtime with no filesystem. See tools/generate/src/cli/module-assets.ts
// for why, and the REQ-145 UAT for the check that this file still matches its
// sources.

/** Every catalogued module's static `<style>` content, in catalog order. */
export const MODULE_CSS = "/* module: contact-form */\n/*\n * REQ-96 — every rule here belongs to an INVARIANT element: presen1f69cf7322 fix(BUG-367): builder draft checkout quotes, never takes money, says what failed
6b6c4bb1f7 feat(shop): orders, shipping zones, checkout pages and endpoint, Buy, Orders mode [FREE-CODED]
7bd3700ce8 feat(catalog): Save follows the item, live preview, per-site coordinator, form prefill [FREE-CODED]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n "^export" tools/gene…
<!-- xgd-tool name="Bash" id="toolu_014k53GNb32H5DKsFRmA5Qdx" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:40.935380+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; grep -n \"^export\" tools/generate/src/cli/module-assets.ts; ls tests | grep REQ-145","description":"Find module-assets generator exports"}
```

**Result**

```
72:export function scopeBehaviorJs(id: string, js: string): string {
77:export interface ModuleAssetBuild {
94:export function composeModuleAssets(repoRoot: string): {
139:export function buildModuleAssets(repoRoot: string): ModuleAssetBuild {
150:export const MODULE_CSS = ${literal(css)}
153:export const MODULE_CLIENT_JS = ${literal(clientJs)}
test_UAT_FC_REQ-145_build_artifacts.test.ts
test_UAT_FC_REQ-145_builder_in_workerd.workers.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 77,95p tools/generate…
<!-- xgd-tool name="Bash" id="toolu_01Mfxe1LmmdsQVY8thD2toQh" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:43.069669+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; sed -n 77,95p tools/generate/src/cli/module-assets.ts; sed -n 139,160p tools/generate/src/cli/module-assets.ts","description":"Read buildModuleAssets"}
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

/** Every catalogued module's static \`<style>\` content, in catalog order. */
export const MODULE_CSS = ${literal(css)}

/** Every catalogued behavior's \`client.js\`, in catalog order. */
export const MODULE_CLIENT_JS = ${literal(clientJs)}
`
  fs.writeFileSync(path.join(repoRoot, GENERATED), source)
  return { file: GENERATED, css: cssIds, clientJs: clientJsIds }
}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; W=$PWD; cat > tests/zz_tmp_b…
<!-- xgd-tool name="Bash" id="toolu_014NyrJ53PrZ3nDo8qAGpLfy" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:47.440866+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; W=$PWD; cat > tests/zz_tmp_bug368_assets.test.ts <<EOF\nimport { it } from 'vitest'\nimport { buildModuleAssets } from '../tools/generate/src/cli/module-assets'\nit('regen', () => { buildModuleAssets('$W') })\nEOF\ntimeout 300 npx vitest run --config vitest.config.mts tests/zz_tmp_bug368_assets.test.ts 2>&1 | grep -E \"Tests \"; rm tests/zz_tmp_bug368_assets.test.ts; git diff --stat packages/framework/src/modules/module-assets.ts; grep -c \"Only you see this\\|r.data.notice\" packages/framework/src/modules/module-assets.ts; timeout 400 npx vitest run --config vitest.config.mts tests/test_UAT_FC_REQ-145_build_artifacts.test.ts 2>&1 | grep -E \"×|Test Files|Tests \"","description":"Regenerate module-assets.ts and verify REQ-145","timeout":600000}
```

**Result**

```
      Tests  1 passed (1)
 packages/framework/src/modules/module-assets.ts | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
0
 Test Files  1 passed (1)
      Tests  7 passed (7)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n "previewCheckout…
<!-- xgd-tool name="Bash" id="toolu_01Ku2aZK2qRzQtXzTwRSpWHH" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:54.252553+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n \"previewCheckoutIntake\\|PREVIEW_PAYMENT_NOTICE\\|Only you see this\\|never takes money\" -- apps packages tools tests | head","description":"Check stale references"}
```

**Result**

```
apps/control-app/src/router.ts:8573:       * never takes money"). Only the signed-in owner sees the draft, so no
packages/framework/src/modules/product-catalog/items.ts:194:  return `${where === 'buy' ? 'Buy appears here' : 'Checkout opens'} once ${missing}. Only you see this.`
tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts:127:      expect(text).toContain('Only you see this.')
tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts:139:      expect([...published.values()].some((html) => html.includes('Only you see this.'))).toBe(false)
tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts:150:    expect(unavailable.textContent).toBe(`Checkout opens once ${SAYS_PAYMENTS}. Only you see this.`)
tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts:322:  // [[BUG-368]] — supersedes BUG-367's "the draft never takes money": the draft's
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n "startCheckout"…
<!-- xgd-tool name="Bash" id="toolu_017BhsSb5L5x6F7MdEqqkiyi" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:16:58.268999+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git grep -n \"startCheckout\" -- apps packages | head; git grep -n \"preview\" -- apps/control-app/src/orders.ts apps/public-site/src/checkout.ts | head","description":"Check startCheckout for preview branch"}
```

**Result**

```
apps/control-app/src/checkout-intake.ts:17:import { cancelCheckout, CheckoutBlockedError, checkoutStatus, quoteCheckout, startCheckout, type OrdersEnv } from './orders'
apps/control-app/src/checkout-intake.ts:54:        ...(await startCheckout(
apps/control-app/src/orders.ts:13: * countries and rate, and {@link startCheckout} re-reads every one of them from
apps/control-app/src/orders.ts:428:export async function startCheckout(
apps/public-site/src/checkout.ts:89:     * preview), as `handleLead`'s flag of the same name means: the per-IP limiter
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; P=/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python; $P -m lagrang…
<!-- xgd-tool name="Bash" id="toolu_01AJ8VMRn4DhP1UBUQYCXLPE" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:05.886060+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; P=/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-5b30954f\",\"text\":\"2026-11-05 build done in worktree free-BUG-368: (1) checkoutActions() in l2/checkout.ts wraps an authored template'\"'\"'s continue (+ boxes holding only it) into the BUG-367 row; component.ts applies it (checkout mode, not edit channel); design threaded via BehaviorProps.design from render.ts. (2) L1 gives containers no textAlign (only text/control axes), and a button'\"'\"'s own text-align:center beats CSS inheritance, so no renderer change needed; Chromium UAT injects inherited text-align:left to prove it. (3) router draft api/checkout uses real checkoutIntake, siteUrl = request'\"'\"'s own draft base (keeps /b/<biz> prefix); previewCheckoutIntake + PREVIEW_PAYMENT_NOTICE + client.js notice branch deleted; module-assets.ts regenerated via buildModuleAssets (not 1c assets). (4) the op is configure_component (ticket says update_component); it merged and could not clear a key -> editModuleConfigure now deletes keys given as null. DOC-75 note to be applied post-merge (system_kb can'\"'\"'t ride a branch). Chromium runs with CHROMIUM_LAUNCH_ARGS=--single-process. All BUG-363/367/368, REQ-643, REQ-130/126/145 suites green.\"}' 2>&1 | tail -c 200","description":"Append summary log entry"}
```

**Result**

```
firmed from dev D1 site_pages checkout.json: authored slot `page` = stack[ship-to, message, box(component button.primary)[continue control w/ own textAlign:center]]; no cancel.\nRejected: none yet."}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git add apps/control-app/src…
<!-- xgd-tool name="Bash" id="toolu_01111trbvFSg8qYzd4qgeFNA" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:15.138573+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git add apps/control-app/src/checkout-intake.ts apps/control-app/src/router.ts packages/framework/src/l2/checkout.ts packages/framework/src/modules/behavior.ts packages/framework/src/modules/checkout/client.js packages/framework/src/modules/checkout/component.ts packages/framework/src/modules/module-assets.ts tools/generate/src/render/render.ts tools/generate/src/cli/edit.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts && git status --short && git commit -q -F - <<'EOF'\nfix(BUG-368): checkout actions on every checkout page; draft checkout works like published\n\n- Wherever a checkout template places `continue` (and no `cancel`), draw\n  BUG-367's action row: label-sized at the right from 768px, secondary\n  Cancel on its left, both stacked full width on phones, Continue on top.\n- The builder draft's checkout uses the real checkout intake: a real Stripe\n  session and order, returning to the preview's own complete/cancelled\n  pages. BUG-367's owner-only notice and preview intake are removed.\n- configure_component: an explicit null removes a setting, so a page's\n  countryPrompt can be cleared back to the framework default.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nEOF\ngit log --format=%H -1","description":"Commit the work on the branch"}
```

**Result**

```
M  apps/control-app/src/checkout-intake.ts
M  apps/control-app/src/router.ts
M  packages/framework/src/l2/checkout.ts
M  packages/framework/src/modules/behavior.ts
M  packages/framework/src/modules/checkout/client.js
M  packages/framework/src/modules/checkout/component.ts
M  packages/framework/src/modules/module-assets.ts
M  tests/test_UAT_FC_BUG-367_checkout_page.test.ts
M  tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts
A  tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts
A  tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts
M  tools/generate/src/cli/edit.ts
M  tools/generate/src/render/render.ts
0024b3a07dca22f40f702afa4675cb38dcff1121
```

## Bash sed -n 8,40p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/free-coded-version-gate-ra…
<!-- xgd-tool name="Bash" id="toolu_01AQeX4wazVn3x7J6r6XCWpx" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:18.568497+00:00" -->

**Input**

```json
{"command":"sed -n 8,40p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/free-coded-version-gate-race.md","description":"Read version gate race memory"}
```

**Result**

```
  modified: 2026-09-19T20:19:35.151Z
---

`xgd ticket move-to-free-coded` rejects with *"version X is already present at
the tip of xgd-working (<sha>), on a commit not reachable from any of the
provided SHAs"* whenever the branch tip is not one of your own SHAs. The gate
asks `xgd_version_bump --check <tip>`, and that script tests whether the
commit's `package.json` **contains** the version — not whether it *introduced*
it. So every descendant carries it, including the `xgd(ticket): update ...`
auto-commits other concurrent sessions (and the dashboard's own chat-transcript
capture for THIS session) produce constantly.

**Why:** the gate has an escape (`_tip_is_own`) for the tip being your SHA, and
another for a merge commit whose branch-side parent holds it — but a plain
single-parent ticket auto-commit on top of your commit matches neither.

**How to apply:** don't bump by hand at all. **Omit `--version`** — the command
then runs `./bin/project/xgd_version_bump` itself, inside its own lock hold,
commits the bump, appends that SHA to the list, and skips the tip-currency
check entirely (`_auto_version` short-circuits it). One invocation, no race, no
retry loop. Seen twice in a row on 2026-09-19: manual bump → rejected → re-bump
→ rejected again within 30 seconds; the no-`--version` call succeeded first try.

Related: [[version-claimed-by-another-ticket]],
[[xgd-free-coded-promotion]], [[git-add-all-sweeps-untracked-caches]].
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; for i in 1 2 3 4 5 6 7 8; do xgd branch lock BUG-368 2>&1 | grep -viE "warn…
<!-- xgd-tool name="Bash" id="toolu_01F1knH7msfVY3S1w4FkMkU3" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:20.834730+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; for i in 1 2 3 4 5 6 7 8; do xgd branch lock BUG-368 2>&1 | grep -viE \"warning|Unknown field|^\\s*│\\s*$|index_query\" | tail -4 && break; done","description":"Acquire merge lock for BUG-368","timeout":600000}
```

**Result**

```
then: /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-rematerialize-tickets --repo /Users/martin/lagrangefoundry/1stcontact --enforce --changed ORIG_HEAD..HEAD --apply
(or run /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-merge free-BUG-368 from the xgd-working worktree)
[18:17:21] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:17:21
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git merge -q --no-edit xgd-w…
<!-- xgd-tool name="Bash" id="toolu_01Ag8G8PJbtFHLfAKmjNdwYX" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:24.301890+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; git merge -q --no-edit xgd-working 2>&1 | tail -5; git status --short | grep -v \"^??\" | head; git log --oneline -1; git diff --stat HEAD~1 HEAD -- apps packages tools | tail -3","description":"Merge xgd-working into the branch"}
```

**Result**

```
Auto-merging apps/control-app/src/router.ts
0e553e4fb9 Merge branch 'xgd-working' into free-BUG-368
 tools/generate/src/cli/index.ts             |  22 +++
 tools/generate/src/cli/showcase-measure.ts  |  79 +++++++++
 18 files changed, 1069 insertions(+), 41 deletions(-)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; export CHROMIUM_LAUNCH_ARGS=…
<!-- xgd-tool name="Bash" id="toolu_01NT7oBrLoadPnkfDMWronqu" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:30.960893+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-368; export CHROMIUM_LAUNCH_ARGS=--single-process; timeout 590 npx vitest run --config vitest.config.mts tests/test_UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts tests/test_UAT_FC_BUG-367_checkout_buttons_in_chromium.test.ts tests/test_UAT_FC_BUG-367_checkout_page.test.ts tests/test_UAT_FC_BUG-368_checkout_actions_in_chromium.test.ts tests/test_UAT_FC_BUG-368_ship_to_prompt_cleared.test.ts tests/test_UAT_FC_REQ-643_checkout_pages.test.ts tests/test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts tests/test_UAT_FC_REQ-145_build_artifacts.test.ts tests/test_UAT_FC_REQ-130_beyond_l1.test.ts 2>&1 | grep -E \"×|Test Files|Tests \" ; timeout 590 npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-367_draft_checkout.workers.test.ts tests/test_UAT_FC_BUG-363_describe_site_checkout_readiness.workers.test.ts tests/test_UAT_FC_REQ-643_purchase.workers.test.ts 2>&1 | grep -E \"×|Test Files|Tests \"","description":"Rerun all relevant suites after merge","timeout":600000}
```

**Result**

```
 Test Files  9 passed (9)
      Tests  53 passed (53)
 Test Files  3 passed (3)
      Tests  16 passed (16)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git status --short | grep -v "^??" | head; /Users/martin/lagrangefoundry/xg…
<!-- xgd-tool name="Bash" id="toolu_01PUxQntXU81ps9Uycihuwes" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:49.289271+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git status --short | grep -v \"^??\" | head; /Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-BUG-368 2>&1 | grep -viE \"Unknown field|warning|index_query|^\\s*│\\s*$\" | tail -8; git log --oneline -3","description":"Merge branch back into xgd-working","timeout":600000}
```

**Result**

```
 M .xgd/_changes/log.ndjson
 M .xgd/_changes/meta.json
 M .xgd/dispatcher.release
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:17:51
[18:17:51] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket-store', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket-store', 'rematerialize', '--repo', '.', '--enforce', '--changed', '693784b18717242d17e448bf0b6e98759a4c80b6..HEAD', '--apply'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[18:17:51] │ 11100 hidden / 1054 visible tracked tickets; 0 candidates; to hide: 0; left to canonical: main-newer=0 tie-different=0 unparsed=0
[18:17:51] │ dry run: nothing changed (use --apply)
[18:17:51] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket-store'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:17:51

✓ Verified: free-BUG-368 (0e553e4fb9ba3543de4a6f5da66e275125f9f3dc) is in HEAD
0e553e4fb9 Merge branch 'xgd-working' into free-BUG-368
0024b3a07d fix(BUG-368): checkout actions on every checkout page; draft checkout works like published
693784b187 xgd(ticket): update comment comment-8f2e8ae3
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update --help 2>&1 | grep -E "body|uid|usage" | head -10
<!-- xgd-tool name="Bash" id="toolu_01LxT4ziSiN2U8JDrtwVGJQc" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:17:54.969624+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update --help 2>&1 | grep -E \"body|uid|usage\" | head -10","description":"Check ticket update flags"}
```

**Result**

```
usage: xgd ticket update [-h] [--id ID] [--title TITLE] [--fields FIELDS]
                         [--done] [--body BODY] [--body-file BODY_FILE]
                         [--append-body APPEND_BODY]
                         [--append-body-file APPEND_BODY_FILE] [--stdin]
                         [uid]
  uid                   Ticket UID (or use --id for human-readable ID). Also
  --body BODY           New markdown body (replaces existing)
  --body-file BODY_FILE
                        Read body content from file or stdin (use - for stdin;
                        alternative to --body)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; python3 - <<'EOF' import os,re src=open('.xgd/tickets/hot/doc-50b859e0.md')…
<!-- xgd-tool name="Bash" id="toolu_018zuLL4z3xHoR8S4XxQ3c4S" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:00.176179+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; python3 - <<'EOF'\nimport os,re\nsrc=open('.xgd/tickets/hot/doc-50b859e0.md').read()\nbody=src.split('\\n---\\n',1)[1].lstrip('\\n')\nanchor=\"- **The same thing changing back and forth** means part of the plan isn't settled: go back to it with them rather than keep polishing.\\n\"\nassert body.count(anchor)==1\nnote=(\"- **A shop's checkout:** Continue to payment in the preview opens a real payment, exactly as published: in Stripe test mode no money moves; in live mode it charges and the owner refunds in Stripe. \"\n\"The Ship to choice reads \\\"Please select a region for delivery\\\" unless the checkout page sets its own `countryPrompt`; to give it back, configure_component with `countryPrompt: null`.\\n\")\nbody=body.replace(anchor,anchor+note)\np=os.path.join(os.environ['TMPDIR'],'bug368-doc75-body.md')\nopen(p,'w').write(body)\nprint(p, len(body))\nEOF","description":"Prepare DOC-75 body with checkout note"}
```

**Result**

```
/tmp/claude-501/bug368-doc75-body.md 20773
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update doc-50b859e0 --body-file /tmp/claude-501/bug368-doc75-bod…
<!-- xgd-tool name="Bash" id="toolu_01Nq63UvoUS1oLqk2cGkzign" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:03.805421+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update doc-50b859e0 --body-file /tmp/claude-501/bug368-doc75-body.md 2>&1 | grep -viE \"Unknown field|warning|index_query|^\\s*│\\s*$|cli_command\" | tail -4; grep -n \"A shop's checkout\" .xgd/tickets/hot/doc-50b859e0.md | cut -c1-120","description":"Update DOC-75 playbook body"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:18:04
[18:18:04] │ Updated doc: DOC-75 (doc-50b859e0)
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:18:04
118:- **A shop's checkout:** Continue to payment in the preview opens a real payment, exactly as published: in Stripe te
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; timeout 590 npx vitest run --config vitest.config.mts tests/test_UAT_FC_REQ…
<!-- xgd-tool name="Bash" id="toolu_0169b5hPPoxgyQ2SbCB8SEgw" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:09.726468+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; timeout 590 npx vitest run --config vitest.config.mts tests/test_UAT_FC_REQ-623_refinement_is_client_sourced.test.ts tests/test_UAT_FC_REQ-473_v2_priming.test.ts tests/test_UAT_FC_REQ-171_session_texts.test.ts 2>&1 | grep -E \"×|Test Files|Tests \" | head","description":"Run playbook-reading suites","timeout":600000}
```

**Result**

```
 Test Files  1 failed | 2 passed (3)
      Tests  24 passed | 2 skipped (26)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; timeout 590 npx vitest run --config vitest.config.mts tests/test_UAT_FC_REQ…
<!-- xgd-tool name="Bash" id="toolu_01Lnt9v4d26iKKP434UV4BtW" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:23.493823+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; timeout 590 npx vitest run --config vitest.config.mts tests/test_UAT_FC_REQ-623_refinement_is_client_sourced.test.ts tests/test_UAT_FC_REQ-473_v2_priming.test.ts tests/test_UAT_FC_REQ-171_session_texts.test.ts 2>&1 | grep -E \"FAIL|Error\" -A3 | head -20","description":"Show failing suite error","timeout":600000}
```

**Result**

```
 FAIL  |node| tests/test_UAT_FC_REQ-473_v2_priming.test.ts > REQ-473 — the stage guides are in the Site consultant's knowledge base
AssertionError: expected [] to have a length of 1 but got +0

- Expected
+ Received
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n "stage guides are in the Site consultant's knowledge base" -A30 tes…
<!-- xgd-tool name="Bash" id="toolu_01L1DKN1Vv23tQJ6bJkxSSQn" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:37.365390+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n \"stage guides are in the Site consultant's knowledge base\" -A30 tests/test_UAT_FC_REQ-473_v2_priming.test.ts | head -40","description":"Read the failing REQ-473 test"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n "knowledge base" tests/test_UAT_FC_REQ-473_v2_priming.test.ts | hea…
<!-- xgd-tool name="Bash" id="toolu_01NPmSF9ns2fAm5YokZkKpvz" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:39.238286+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n \"knowledge base\" tests/test_UAT_FC_REQ-473_v2_priming.test.ts | head; grep -n \"toHaveLength(1)\" -B12 tests/test_UAT_FC_REQ-473_v2_priming.test.ts | head -40","description":"Locate failing assertion"}
```

**Result**

```
22: * searchable document in the system knowledge base, and Part D's two reminder
163:describe('REQ-473 — the stage guides are in the Site consultant\'s knowledge base', () => {
169-  beforeAll(async () => {
170-    process.env.LAGRANGE_KM_EMBEDDER = STUB_MODEL
171-    process.env.LAGRANGE_KM_DESCRIBER = STUB_MODEL
172-    root = mkdtempSync(path.join(tmpdir(), 'req473-kb-'))
173-    writeFileSync(
174-      configPath(root),
175-      JSON.stringify({
176-        knowledge_bases: { system: { description: 'Test.', corpus: {}, landscape: 'authored', source: 'shipped' } },
177-      }),
178-      'utf8',
179-    )
180-    const found = readDocTickets().filter((ticket) => ticket.title === TITLE)
181:    expect(found).toHaveLength(1)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; f=$(git grep -l "export function readDocTickets" -- tools tests packages);…
<!-- xgd-tool name="Bash" id="toolu_01LYfsbyZi3sa6TiiLyLUN5t" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:42.408737+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; f=$(git grep -l \"export function readDocTickets\" -- tools tests packages); echo $f; n=$(grep -n \"export function readDocTickets\" $f | cut -d: -f1); sed -n \"$n,$((n+30))p\" $f","description":"Read readDocTickets"}
```

**Result**

```
tools/generate/src/cli/kb.ts
export function readDocTickets(): DocTicket[] {
  const raw = execFileSync(
    'xgd',
    ['ticket', 'list', '--type', CORPUS_TYPE, '--view', '--json', '--no-limit'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024,
    },
  )
  const parsed = JSON.parse(raw) as {
    items?: DocTicket[]
    next_cursor?: string | null
    truncated?: boolean
  }
  if (parsed.truncated === true || (parsed.next_cursor ?? null) !== null) {
    throw new Error(
      `xgd ticket list returned a truncated page despite --no-limit ` +
        `(${(parsed.items ?? []).length} item(s), more to come). The corpus would be ` +
        `silently short, so this fails instead. Check the xgd on PATH supports --no-limit.`,
    )
  }
  return parsed.items ?? []
}

/**
 * The frontmatter field carrying a document's kind, and the kind that means
 * "this document is the assistant's, not ours".
 *
 * MEMBERSHIP IS A KIND, NOT A FLAG (DOC-39 §3.3). A boolean invites the sentence
 * *"this architecture document is **also** a system document"*, and that
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n "const TITLE" tests/test_UAT_FC_REQ-473_v2_priming.test.ts; xgd tic…
<!-- xgd-tool name="Bash" id="toolu_01RrxLSRAcENoPNPqGVzzKTn" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:45.587392+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n \"const TITLE\" tests/test_UAT_FC_REQ-473_v2_priming.test.ts; xgd ticket list --type doc --view --json --no-limit 2>/dev/null | python3 -c \"\nimport json,sys; d=json.load(sys.stdin); it=d.get('items',[]); print(len(it)); print([ (t.get('id'),t.get('title')) for t in it if 'laybook' in (t.get('title') or '')])\"","description":"Check DOC-75 visible in ticket list"}
```

**Result**

```
66:const TITLE = "Stage guides: the Site consultant's route through the work"
82
[('DOC-75', "Playbook: the Site consultant's tools"), ('DOC-33', 'The Consultation Playbook — how the builder AI takes a client from nothing to a live site')]
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket move-to-free-coded bug-5b30954f 0024b3a07dca22f40f702afa4675cb38…
<!-- xgd-tool name="Bash" id="toolu_01KThRbEZRFR8UkTT5ay8vAf" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:18:57.173341+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket move-to-free-coded bug-5b30954f 0024b3a07dca22f40f702afa4675cb38dcff1121 0e553e4fb9ba3543de4a6f5da66e275125f9f3dc 2>&1 | grep -viE \"Unknown field|warning|index_query|^\\s*│\\s*$|cli_command\" | tail -8","description":"Move BUG-368 to free_coded","timeout":600000}
```

**Result**

```
[18:19:05] │   [ ] No new tickets were created for scope that belongs on this one
[18:19:05] │ 
[18:19:05] │ This ticket has 3 commit(s). Have you remembered to add all the commits
[18:19:05] │ for this work? Any commits that have not been added will not be correctly reconciled
[18:19:05] │ and may be reverted. Have you run the version increment script?
[18:19:05] │ 
[18:19:05] │ Moved to free_coded: bug: BUG-368 (bug-5b30954f)
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:19:05
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd branch clean BUG-368 2>&1 | grep -viE "Unknown field|warning|index_quer…
<!-- xgd-tool name="Bash" id="toolu_01GxyrD1N7tTdyJ3RmGXAqT8" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:19:08.455276+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd branch clean BUG-368 2>&1 | grep -viE \"Unknown field|warning|index_query|^\\s*│\\s*$|cli_command\" | tail -4","description":"Clean up BUG-368 branch and lock"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:19:08
[18:19:11] │ Error removing worktree: error: failed to delete '.git/worktrees/free-BUG-368': Operation not permitted
[18:19:11] │ This command is still running inside the OS sandbox. Re-run it as exactly `xgd branch clean <TICKET-ID> [--force]` — no `cd`, pipe, `;`/`&&` chain or redirect around it, and `xgd` invoked by bare name — so the `xgd branch clean *` sandbox exclusion applies.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:19:11
```

## Bash xgd branch clean BUG-368
<!-- xgd-tool name="Bash" id="toolu_01BUPtMsdBvYHjY7jibgUdv7" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:19:12.558723+00:00" -->

**Input**

```json
{"command":"xgd branch clean BUG-368","description":"Clean branch as bare command"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:19:12
[18:19:13] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-368'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Cleaned up free-BUG-368 (worktree removed, branch deleted, lock released).
[18:19:13] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:19:13
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; P=/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python; $P -m lagrang…
<!-- xgd-tool name="Bash" id="toolu_018WeR9a7bkExwXeQnAYeDWN" turn="5c68df9a09f541ee8432f616df360580" ts="2026-11-06T02:19:21.615551+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; P=/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-5b30954f\",\"text\":\"2026-11-05 DONE: commits 0024b3a07d (fix) + 0e553e4fb9 (merge of xgd-working) xgd-merged; moved to free_coded (gate auto-bumped version); branch cleaned. DOC-75 refinement section gained a \\\"A shop'\"'\"'s checkout\\\" bullet (real payment in preview; countryPrompt default + configure_component null). Pre-existing red: REQ-473 v2_priming KB test looks for old DOC-75 title \\\"Stage guides: ...\\\" (doc was retitled \\\"Playbook: ...\\\" earlier) - not caused here.\"}' >/dev/null && $P -m lagrangefoundry.ai.agent_cli AgentSummaryFrame --in '{\"session\":\"bug-5b30954f\",\"text\":\"BUG-368 (bug-5b30954f), free-coded. STATUS: COMPLETE 2026-11-05 - merged to xgd-working, moved to free_coded, branch cleaned.\\nDelivered: (1) checkoutActions() (l2/checkout.ts) draws BUG-367 action row around an authored template'\"'\"'s continue (unless it places cancel); (2) no renderer change needed - containers carry no textAlign in L1 and button'\"'\"'s own text-align:center beats inheritance; proven in Chromium UAT; (3) draft api/checkout uses real checkoutIntake, return URLs on preview'\"'\"'s own pages (business prefix kept); notice/preview intake removed; (4) op is configure_component; null now removes a setting; DOC-75 notes default + null.\\nRejected: none.\"}' >/dev/null && echo ok","description":"Update summary log and frame"}
```

**Result**

```
[18:19:22] │ 
           │ ⚠️  Configuration warnings:
[18:19:22] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[18:19:22] │ 
[18:19:22] │ 
           │ ⚠️  Configuration warnings:
[18:19:22] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[18:19:22] │ 
[18:19:24] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2543.54, 'pid': 79118}
[18:19:25] │ 
           │ ⚠️  Configuration warnings:
[18:19:25] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[18:19:25] │ 
[18:19:25] │ 
           │ ⚠️  Configuration warnings:
[18:19:25] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[18:19:25] │ 
[18:19:27] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2335.35, 'pid': 79561}
ok
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; sed -n 1,25p .xgd/tickets/hot/bug-5b30954f.md | grep -E "^status|updated_at…
<!-- xgd-tool name="Bash" id="toolu_01KdSMyaFQDdqDyDnjpf6Xzz" turn="37f8a30af4324c13a1091ba1aa2d3444" ts="2026-11-06T02:20:03.788771+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; sed -n 1,25p .xgd/tickets/hot/bug-5b30954f.md | grep -E \"^status|updated_at|commits|version|  - \" | head -15; git log --oneline -1 0024b3a07dca22f40f702afa4675cb38dcff1121; git merge-base --is-ancestor 0e553e4fb9ba3543de4a6f5da66e275125f9f3dc xgd-working && echo merged; git branch --list free-BUG-368","description":"Check ticket status and merge state"}
```

**Result**

```
updated_at: '2026-11-06T02:19:05.346400+00:00'
status: free_coded
  commits:
  - working_sha: 0024b3a07dca22f40f702afa4675cb38dcff1121
  - working_sha: 0e553e4fb9ba3543de4a6f5da66e275125f9f3dc
0024b3a07d fix(BUG-368): checkout actions on every checkout page; draft checkout works like published
merged
```
