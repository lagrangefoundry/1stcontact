---
uid: comment-d658a91b
id: COMMENT-5858
type: comment
title: Comment on bug BUG-315
created_by: xgd
created_at: '2026-10-31T17:50:19.276154+00:00'
updated_at: '2026-10-31T18:18:42.806213+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-84072362
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "88a72757-9d5e-43cf-92f1-ea6bcee2983b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7cc38d29-c9cb-4fd5-9ca0-238a9d47f21e-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T17:49:12.935568+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="7cc38d29-c9cb-4fd5-9ca0-238a9d47f21e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T17:54:53.085422+00:00" -->
#### Claude
Quick empirical check: does Playwright's `page.route` see redirect hops (this decides whether gap 3 is real)?

I've checked the ticket against the current code, and two of its five gaps clash with fixes that landed after it was filed. I'd like your call on those before I write any code.

**Where each gap stands now**

| Gap | Status |
|---|---|
| 1. Size cap | **Clashes with BUG-172.** That fix deliberately removed the 32 MiB cap (`egress-guard.ts`, "NO BYTE CAP" comment). The cap was refusing ordinary photo-heavy sites, because each width on the ladder reloads the page. |
| 2. Redirect loop | **Already fixed by BUG-127.** The cap now counts hops along one redirect chain, not origins. A page whose own navigation is refused (including a redirect-cap trip) now comes back as `REFUSED` with no reference. |
| 3. Node redirect hops | **Still open, and it's a real SSRF hole.** I tested it in a scratch script. Playwright's `page.route` is called only for the first URL, and later hops go straight to the network with no check. That also means the hop counter on Node is always 0. Chrome's own request interception (CDP `Fetch`) does stop on every hop, with an id that ties hops to one chain, and the page ends up on the right final URL. |
| 4. 60 s time cap | **Still open.** `MAX_CAPTURE_MS` is set but nothing uses it. BUG-172's comment says how long a capture runs is the session lease's business. |
| 5. Refused URLs not journalled | **Still open.** `capture_site` declares no `summary`, so a refusal during a capture never reaches the audit record. |

**What I need from you**

1. **Size cap (gap 1):** I recommend dropping it and noting in the ticket that BUG-172, the later decision, supersedes "over-large responses" in REQ-157 AC6. I'd also fix the line in `fidelity-surface.json` that tells the model "an enormous one is not brought back", because that's no longer true. Agree, or should a cap come back in some form (e.g. per response rather than per capture)?
2. **Time cap (gap 4):** applying 60 s to a whole capture (several widths, each with a load and a quiet period) could cut off legitimate captures. Options:
   - (a) apply it to the whole capture on both hosts;
   - (b) apply it to each page load;
   - (c) delete the constant and its claim, following BUG-172's reasoning.

   I lean towards (b), at 60 s per load. Which do you want?
3. **Node fix (gap 3):** I'd replace `page.route` in the guarded Playwright driver with Chrome's request interception, so every redirect hop goes through the same address rule and per-chain hop count as the Worker. The Node capture path is always Chromium, so it's fine there. A non-Chromium guarded driver would refuse to run rather than run unguarded. OK?
4. **Journalling (gap 5):** I'd add a declared `summary` to `capture_site` so the audit record names the refused URLs and reasons. Should it hold:
   - (a) every refused URL, shortened (complete, but can be large: one site had about 300 `data:` refusals before BUG-202), or
   - (b) the same counts plus up to 5 examples the model already sees?

   I'd pick (b), with the full count, unless you need every URL in the journal.

The ticket points the tests at `tests/test_reconciliation_capture_site_egress.test.ts`, which doesn't exist. Free-coding naming would put them in `tests/test_UAT_FC_BUG-315_capture_site_egress.test.ts`, run on both hosts. I'll use that unless you say otherwise.

<!-- xgd-turn id="23854ece-b549-4e9e-a601-54c35408b3c2-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T18:01:24.958509+00:00" -->
#### You
go with your recommendations

<!-- xgd-turn id="23854ece-b549-4e9e-a601-54c35408b3c2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T18:18:35.705796+00:00" -->
#### Claude
Updating the ticket with the agreed scope first.

Branch `free-BUG-315` is cut and the ticket is updated; now reading the driver code to make the changes.

Testing whether a host-resolver mapping lets a real local server stand in for public hosts inside this sandbox:

Locating how the toolbox's audit record builds its `summary` so I can declare one for `capture_site`.

Still locating the toolbox's audit-summary mechanism in the framework source.

The toolbox's audit `summary` can only lift scalar fields by dotted path, or a top-level array. Checking which tests read the `refusals` shape before choosing where the example URLs live:

Now writing the code. First the guard: the page-load ceiling becomes something both drivers read from it.

Now the Node driver: replacing `page.route` with CDP `Fetch` interception.

Now the audit summary in `capture_site` and its declaration.

Typechecking:

Clean. Now the UATs; checking how existing real-Chromium suites gate themselves:

Writing the UAT file now (real Chromium + local server for Node; the Worker driver via its fake browser).

Tidying a leftover in `beforeAll` (a single `MAP *` rule covers both hosts):

All 6 pass. Checking the Node tests aren't vacuous: running them against the old `page.route` driver.

The old driver fails the redirect and timeout tests, and the new one passes them. Now the adjacent suites:

Three failures; checking whether they predate my change by running the same files on clean code in the main checkout:

All three predate this change: they fail identically on clean `xgd-working`. Now the Workers-pool suites that drive `capture_site` and the Browser Rendering driver:

Also running the remaining suites that drive `capture_site` or `cmdCapturePage`, since the write order changed:

Nine failures. Baselining those files on clean code, and looking at the hints ones, which could plausibly relate to the write reordering:

The same 9 fail identically on clean code (sandbox-related), so the change adds no regressions. Reading my notes on this project's commit and promotion gate:

Updating the ticket with the behaviour added along the way: refused captures are never stored, and the audit field mechanism.

Committing on the branch:

Now locking and merging back into `xgd-working`:

Only ticket files came in. Fast-merging into the `xgd-working` checkout:

Merged. Moving the ticket to `free_coded`, letting the gate do the version bump itself (per my notes):

BUG-315 is fixed: the change is merged into `xgd-working` and the ticket is at `free_coded` with both commits, version 0.2.712 and 5 story points. Promoting it to `ready_to_reconcile` is your call.

**What changed**
- **Node redirect hops (gap 3, the SSRF hole):** the Node capture driver now uses Chrome's own request interception instead of Playwright's `page.route`, so every redirect hop is checked.
  - A public URL that redirects into private space is refused before the hop is fetched.
  - Redirect loops are now caught on Node, using the same per-chain count of 5 hops as the Worker.
  - A guarded capture on any browser other than Chromium refuses to run rather than running unguarded.
- **A refused capture is never stored.** This was needed for "offers no reference": the capture used to be written to the store before the refusal check, so it showed up in `list_references`. Worse, a refused recapture would overwrite an earlier good capture of the same address. The capture now asks for a verdict after its first page load, so a refused page also stops early, and again before anything is written.
- **Time cap (gap 4):** the 60 s ceiling now applies to each page load on both hosts. On Node, a load that hits it fails with a message naming the ceiling.
- **Journalling (gap 5):** the audit record for every `capture_site` call now lists the refused URLs and reasons, including requests refused partway through a capture that otherwise succeeded. It holds the total plus the same ≤5 examples the model already sees.
  - The toolbox's audit projection can't reach into a nested list, so the examples also travel on the result as a hidden property. The audit reads it; the model's copy doesn't include it, so it costs no tokens.
- **Size cap (gap 1):** dropped, as agreed. The ticket records that BUG-172 supersedes it. I removed the "enormous pages are refused" claim from the `capture_site` description, the `REFUSED` error text and one note in the surface declaration.

**Tests:** `tests/test_UAT_FC_BUG-315_capture_site_egress.test.ts` has 6 UATs and all pass. The Node ones use real Chromium against a local server that issues real redirects, and assert that the server never received a request for the private host. Against the old driver, the redirect, loop and timeout tests fail, so they do test the fix. In the adjacent suites, the Workers capture suites all pass (14/14). Twelve other tests fail exactly the same way on clean `xgd-working`; they look like sandbox issues and aren't caused by this change.

**Not verified:** a guarded Node browser now launches with site isolation off, so cross-origin iframes stay where the interception can see them, and with service workers blocked. That couldn't be checked here because the sandbox runs Chromium in single-process mode, which never splits frames into separate processes anyway. Separately, I didn't confirm whether requests made by a page's background scripts (Web Workers) go through the interception.

Updating the wording of STORY-159's AC-2048 to AC-2051 is left for reconciliation, as the ticket says.

<!-- xgd-chat-end -->