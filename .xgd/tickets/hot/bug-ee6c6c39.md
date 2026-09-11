---
uid: bug-ee6c6c39
id: BUG-83
type: bug
title: Sixteen tests fail on a clean tree, and the suite's red masks new breakage
created_by: REQ-220
created_at: '2026-09-11T21:46:08.377325+00:00'
updated_at: '2026-09-11T22:38:50.680640+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-71f5f2fc
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