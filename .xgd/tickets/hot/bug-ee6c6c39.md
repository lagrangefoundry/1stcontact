---
uid: bug-ee6c6c39
id: BUG-83
type: bug
title: Sixteen tests fail on a clean tree, and the suite's red masks new breakage
created_by: REQ-220
created_at: '2026-09-11T21:46:08.377325+00:00'
updated_at: '2026-09-11T22:54:58.160011+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-71f5f2fc
  commits:
  - working_sha: 7cfb242650c320d8d4074f44729b91d4253afb1e
    reconcile_sha: null
    main_sha: null
  - working_sha: 06a726f5cf8a6fd2b9b9197af4275b643da5a5d3
    reconcile_sha: null
    main_sha: null
  version: 0.2.170
---

## The gap

Sixteen tests across twelve files fail on a clean `xgd-working` tree. They have
been failing for long enough that the suite's red is now the normal state, which
is the actual damage: a run that is expected to fail cannot tell anybody that
something new broke. REQ-220 was verified by baselining against `xgd-working` and
diffing the failure sets by hand, because there was no other way to know whether
its own work had broken anything.

A test that is red for a known reason and left red is a test that has stopped
being a test. These are worth either fixing or retiring, and each one below is
named with what it actually asserts so that choice can be made per cause rather
than in bulk.

## The five causes

**1. What the providers add to the primed system text does not arrive — 11 of
the 16.** Every failure in this group asserts on what the model was SENT, and in
each the received text is the consultant role and the projected manual with a
provider's contribution missing from it: the site-binding sentence (*the site
"studio"*, *Every tool you have acts on that site*), the change signal
(*changed this site since your last turn*), and the corpus delta (*Two new
documents arrived*, and the document titles REQ-160 expects). One REQ-182 case
reads the system text as the empty string, so in that path nothing is composed at
all.

The files: `test_UAT_FC_BUG-63_priming_configuration` (2),
`test_UAT_FC_REQ-182_priming_is_configuration` (2),
`test_UAT_FC_REQ-122_chat_host` (1), `test_UAT_FC_REQ-131_change_journal` (1),
`reconciliation-draft-change-journal` (1),
`reconciliation-assistant-conversation` (1), and
`test_UAT_FC_REQ-160_two_kb_session.workers` (3).

**There are two candidate causes here and they have to be separated before
either is fixed.** The first is upstream drift: the priming list is loaded
through the framework's own `rolesFromMapping` and the missing sentences are all
PROVIDER output, so a change to how the shared `@lagrangefoundry/ai` registers or
invokes providers would produce exactly this shape — and those packages are not
in the lockfile, so it would land here with no commit in this repo. The shared
store was last refreshed 2026-09-10. The second is environment: the node runs
print *the system knowledge base could not be opened … GET /accounts: fetch
failed*, which is the sandbox having no route to Cloudflare. That one cannot
explain the site-binding sentence, which is composed locally and needs no
network, but it may well explain REQ-160's three document titles. Establish which
tests fail for which reason first; a fix aimed at the wrong one will look like it
worked on eight of eleven.

**2. Three declared origin routes have no non-cacheable probe — 1 test.**
`reconciliation-builder-workspace-origin`'s `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable`
enumerates the routes `router.ts` declares and the routes its own probe list
covers, and reports the difference. It is currently
`/api/material/changes`, `/api/material/name` and `/api/material/recipe`.

**The last two are REQ-220's and are named here rather than quietly left.** That
ticket added them and did not extend the probe list; the test was already red
over `/api/material/changes`, so nothing went from green to red and the omission
did not announce itself — which is the masking effect this ticket is about,
caught happening. The fix is three probes, not a change to the guardrail.

**3. The panel width whitelist is wrapped across lines and the assertion matches
a contiguous substring — 2 tests.** `reconciliation-copy-edit-form-presentation`'s
and `reconciliation-copy-edit-image-picker`'s
`test_UAT_AC1043` both select the rule by
`sel.includes(':has(.builder-modal__box')` and both read the empty string. The
rule is in `builder.css` and is correct; it is formatted as a multi-line
`:not(:has( … ))` with the selector list indented onto its own lines, so between
`:has(` and `.builder-modal__box` there is a newline and eight spaces. The
selector the test wants is present and the string it looks for is not.

**This is an assertion that reads CSS as text and is therefore sensitive to how
the CSS is laid out**, which is a fact about the test and not about the panel. It
should match on the selector's parts rather than on one unbroken substring —
whitespace inside a selector list is not a behaviour anybody meant to pin.

**4. The webui component scope is restated outside its declaration — 1 test.**
`bug32-webui-scope-rebrand`'s `test_UAT_AC960_component_scope_is_written_in_exactly_one_place`
permits the scope literal in its single declaration and in the declared
browser-source exception, and finds it in three other tracked files:
`tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`,
`tests/test_UAT_FC_REQ-199_invite_send.workers.test.ts` and
`tools/generate/src/cli/ai/ledger-core.ts`. Two restatements in tests and one in
source. The AC is *written once*, so each of the three either reads the
declaration or is added to the permitted set with a reason.

**5. `points.js` contains `data-l1-segment` — 1 test.**
`reconciliation-copy-edit-gesture`'s
`test_UAT_AC1006_the_browser_runs_one_address_resolution_served_from_the_renderers_own_source`
asserts that `apps/control-app/src/builder/points.js` does not read the attribute
itself, because address resolution is meant to be the renderer's own source and
one implementation of it. The attribute appears once, at `points.js:49`, inside a
CSS string that outlines the hot segment.

**Whether this is drift or a false positive is the question to answer, and the
answer changes the fix.** A style rule that mentions an attribute is not a second
address resolution, so the AC's intent may be intact and the check too broad —
in which case the check narrows to actual reads. But the overlay knowing that
selector at all may equally be the drift the AC was written to catch. Read the
AC before touching either side.

## What done looks like

`npm test` on a clean tree is green, or every remaining red test has been
deliberately retired with the reason recorded. Not sixteen failures that the next
person has to baseline by hand to work around.

The order that pays off first is cause 2 (three probes), then 3 and 4, which are
small and certain. Cause 1 is eleven of the sixteen and is the one worth real
investigation; it is also the one where a wrong diagnosis costs the most, so it
should not be started until its two candidates have been told apart.


---

## Investigation (this session)

A clean baseline on a fresh worktree gives **17** failures across **13** files —
the sixteen above plus one that landed after this ticket was written, which is
cause 6 below and is the masking effect caught happening a second time.

### Cause 1 is one root cause, not two, and neither candidate was right

All eleven failures are **the reminder tier never reaching the `system` field**.
They look like three different missing sentences because the reminder tier has
three provider entries — `site.line`, `site.changes`, `corpus.delta` — and each
failing assertion happens to name a different one. REQ-160's three document
titles are `corpus.delta`'s output, not a knowledge-base read, so the offline
sandbox does not explain them either.

The reminder still reaches the model. Upstream `@lagrangefoundry/ai` moved it:
`ClaudeAPIBackend.promptStream` used to fold `reminder` into the `system` field
and now passes it through `turnTail`, which appends it to the **last user
message** instead (the package's own REQ-144, for cache-prefix stability — a
marker on the reminder would put a block guaranteed to differ next turn inside
the prefix the next request has to match). Those packages are not in this repo's
lockfile, so the change landed here with no commit, exactly as the ticket
anticipated.

So nothing in this repository is broken and no production behaviour changes. The
defect is in the evidence: `tests/support/scripted-model-client.ts` documents
`system` as *"the assembled priming, reminder included"*, and eleven assertions
read it through `systemText`. That statement is now false.

**The fix is at the one shared double, which is what it exists for.** Two
readers are added beside `systemText` — one for the per-turn tail the reminder
now travels in, one for everything the model was sent this turn — and the
assertions move to whichever of the three they are actually about. The
distinction is load-bearing for REQ-182, whose subject is *where* the reminder
sits relative to the cache boundary, not merely that it was sent.

### Cause 5 is drift, and the fix is in `points.js`

AC-1006's subject is the logic that turns a clicked element into an address, and
a stylesheet is not that. But the overlay restating the renderer's markup
contract in its own CSS is a real second reader of it: rename the attribute
upstream and the dimmed-hover rule silently stops matching, with nothing to say
so. The rule does not need the attribute — `.l1-edit-hot` is the renderer's own
hot-segment marker and already selects exactly the set — so the selector drops
it and takes `!important` to keep winning over the renderer's own hot treatment,
which it previously won by specificity. The guard is left alone.

### Cause 6 — the lead write is routed after all, and the guard says it is not

`test_UAT_FC_REQ-223_internal_seam`'s
`test_UAT_FC_REQ-223_the_write_is_an_entrypoint_and_not_a_route` forbids
`captureLead`, `LeadIntake` and `/api/lead` from appearing in `router.ts`. BUG-78
added `POST /preview/<slug>/draft/api/lead` so that the one surface an operator
can actually press the button on is not the one surface where the button cannot
work, and wired it to `public-site`'s own `handleLead` over an in-process
`captureLead`. Three of the four assertions in that block are now false.

The claim the AC is making is that no **unauthenticated** URL reaches the
tenant-wide contact write. That still holds: the preview route runs under the
same `openStore()` scope every other builder route does, takes the site key from
the slug through that store rather than from the body, stamps the channel itself
and refuses any channel but `draft`. BUG-78's behaviour has its own workers
suite, which passes. So the static guard narrows to what it means — no
`/internal/` path, no service binding to this Worker's own default handler, and
the single lead path is the preview's, gated and channel-bound — rather than
forbidding a mention that a later intent deliberately introduced.

## What this session changes

1. **`tests/support/scripted-model-client.ts`** — `turnTailText` and `sentText`
   beside `systemText`, and the header corrected to say where the reminder
   travels now. The seven suites in cause 1 read the right channel.
2. **`tests/reconciliation-builder-workspace-origin.test.ts`** — three probes,
   for `/api/material/changes` (in its rejection shape, since the success shape
   is an SSE stream that never ends), `/api/material/name` and
   `/api/material/recipe`.
3. **`tests/support/css-rules.ts`** — one `rulesOf`, hoisted out of the three
   copies that had it, handing `keep` a selector whose layout has been
   normalised away. Whitespace inside a selector list is not behaviour.
4. **The scope literal** — the two prose restatements are rephrased to name the
   package without writing the scope, and the markdown suite reaches its two
   components the way every other suite does, through `webuiPackageDir`.
5. **`apps/control-app/src/builder/points.js`** — the dimmed-hover rule stops
   restating the renderer's attribute.
6. **`tests/test_UAT_FC_REQ-223_internal_seam.test.ts`** — the routing guard
   narrowed to the claim it is making.

`npm test` is green on a clean tree afterwards, with nothing retired.