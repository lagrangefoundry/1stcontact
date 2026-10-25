---
uid: comment-66f7c2b3
id: COMMENT-5549
type: comment
title: Comment on request REQ-422
created_by: xgd
created_at: '2026-10-21T20:52:59.495349+00:00'
updated_at: '2026-10-21T21:37:26.187801+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-570d8fda
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8d6e21f3-ee93-433f-8b1d-d7966d4f7994",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6044368b-f157-4a4e-9c1c-526d62c9edcb-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T20:51:59.215691+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6044368b-f157-4a4e-9c1c-526d62c9edcb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T21:37:25.524227+00:00" -->
#### Claude
Wait for the research agents.

There's already a site-level `nav` block (with `entries` and a `pattern`) in `site.json`. I'm reading its schema now, because the navigation work should build on it rather than add a second one.

Now the text-node schema and the page-kind schema, since the `nav` node will reuse the text axes.

Starting the implementation with the schema layer. First, `children.ts` and the validator's per-kind handling.

Now types, children and exports.

Next, `validateSite` refuses a node id shared between a page and the header or footer it carries, because the two end up in one HTML document.

Schema layer typechecks. Now the renderer: `RenderState` and the text case in `emitNode`.

Writing the `nav` emitter now. Each item is drawn once and the same markup is reused in the phone `<details>` menu, so item CSS isn't duplicated.

Now the render options: `navigation`, plus a `prefix` that renders a document as a part of a page (prefixed classes, no document reset, its own background painted on its root).

Framework typechecks too. Checking how the edit channel classifies the new node, since `segmentKind` decides what is click-editable.

Now page composition in `renderPage`, plus the `application-name` meta.

Those errors are the known missing generated control-app files in a fresh worktree. Filtering to the files I touched:

Typecheck is clean. Next is the page-map label for the new node.

Now the page commands in `edit.ts`. Five changes: add/copy append a nav entry, rename relabels it, remove drops it, list reports the new kinds, and reachability follows the shared parts' links.

Typecheck is clean. Now the toolbox operations.

Now the remaining places that tell served pages from email pages: `describe_page`, the page digest, and the host's look.

Per the project memory, I'll splice `priming.json` textually rather than round-tripping it through a JSON parser.

Fixing `homePageId` so it uses the renderer's own served-page rule, not "not a look". Otherwise a header or footer could be taken for the front door.

Now wiring the site findings into the host's after-build look in `host-core.ts`.

Next, the tool specs in `l1-surface.json` and the role permissions in `talker.json`.

Splicing the tool specs into `l1-surface.json`:

Next is teaching. I'll check how REQ-418 taught `table` in priming, so `nav` and the shared parts are taught the same way.

Teaching is in. The CLI's `page add --kind` also only accepts `web`/`email`, so I'll widen it.

Implementation typechecks. Now the UATs. First I'll look at REQ-300's test harness (memory site, `l1Operations`) to mirror it.

Before writing the browser UATs I'll check that the existing BUG-238 browser suite runs in this sandbox. Project memory notes Chromium and socket restrictions here.

The fresh worktree is missing control-app's generated files, a known issue in project memory. Checking the memory note for the fix:

Browser UATs run here, and BUG-238 still passes with the changed layout script. Checking how the renderer rewrites `/` and `/about` hrefs so the UATs assert the right strings:

The schema-test helper is a dead end. I'll use the real scaffolder's `site.json`, and check `set_l1`'s parameter names.

All 17 node UATs pass. Now the browser UATs. They build a real site through the grant, render it, serve it, and run the real layout check.

All four browser UATs pass. Next is regressions. Reading the project note on running the full suite here:

First a targeted regression run over the suites nearest the change: pages, navigation, layout check, surface, priming, render and sections.

18 failures. Pulling each failure message to sort mine from pre-existing ones:

BUG-48 checks a generated L1 vocabulary reference, which presumably lacks the new `nav` node. Finding the gap and how the reference is generated:

The reference is generated from the schema, so `nav` should appear automatically. I'll print the actual gaps with a throwaway test:

The BUG-48 gap is `zoomGroupChromeAgrees`, which isn't mine. I'll baseline all the suspect suites in the main checkout, which has the same base code.

Baseline confirms 14 of the failures are pre-existing: BUG-128, four BUG-48 cases, eight REQ-122 cases, and REQ-350's browser case. REQ-182 passes on base, so that one is mine. Reading what it flags:

My edited "THIS BUILD IS NOT DONE" sentence went over the 200-character cap REQ-182 sets for prose in code. Shortening it:

Those five suites pass (57 tests). Now the `workers` project suites that drive the host's look and the leases:

Both pass. Now the full node project, in three foreground shards per the project's guidance:

Four failures are new against base. Reading their messages:

Shard 2 matches base exactly (all 33 failures are pre-existing). Shard 3:

REQ-101 has the same cause as REQ-145: main has uncommitted `fonts/platform.json` changes, and I touched no fonts. BUG-237 is a layout-check suite, so it may be mine. Looking:

Those pass (57). Now the whole `workers` project:

Ticket body updated. Committing on the branch, staging each file explicitly (never `git add -A` here):

`module-assets.ts` was rewritten by a test run, a known side effect noted in project memory. Reverting it, then staging my files only:

Committed as `e868abf1`. Now the merge-back: take the lock, merge into `xgd-working` with sparse checkout disabled, and rematerialize tickets.

The merge landed cleanly. Running the ticket overlay rematerialize step:

Now `move-to-free-coded` without `--version`, so the gate bumps the version itself inside its own lock:

The ticket is at `free_coded` with both commits and version 0.2.575. Tearing down the branch and worktree, with the command as the whole call so the sandbox exclusion applies:

REQ-422 is implemented and merged into `xgd-working`. The ticket is at `free_coded` (commits `e868abf1` plus the version bump to 0.2.575, 13 points), and the branch has been cleaned up. I didn't need to ask anything first; the main design calls are below so you can redirect any of them.

**How it works**
- **Header and footer are pages** of a new kind (`header` / `footer`). That gives them their own file and lock and the normal edit tools, and they are never served on their own. Every web page is drawn with both unless it opts out (`shared: { header: false }`). A site can have one of each.
- **They render beside each page's own content, not inside it.** Page addresses, the edit channel and the layout check's section numbering don't change. A page and its header can't share an element id.
- **The menu reuses the site's existing navigation list** (`site.nav.entries`), which was stored but never drawn. A new `nav` element draws it, marks the current page, and on phones folds behind a "Menu" button that needs no script.
- **The menu follows the page list.** Adding or copying a page adds it; renaming relabels it; removing a page removes its entry. A page turned into an alternative look leaves the menu. A site's first header fills an empty menu with its existing pages, home first.
- **Two new operations:** `set_navigation` for order, labels and hiding, and `share_section` for item 6. It turns a page's own header section into the shared one and removes the copies on other pages. The consultant is taught to get the client's yes first.
- **The new header** starts with the business name linking home, beside the menu. Its size (24px phone, 30px desktop) lives in `layout-check.json`.
- **The post-build check** gains five findings. `no_header` and `name_smaller_than_headings` run in the browser. `unreachable`, `dead_end` and `leftover_placeholder` run on the stored site and cover every page, not just the ones the build wrote.
- **Priming** for builders and the consultant now covers all of this. That includes never saying a page is in the menu until the check confirms it.

**Things that behave differently now**
- **Adding, removing or renaming a page now writes `site.json`,** because the menu changes. A builder scoped only to its page will be refused unless it passes `nav: false`. The priming tells the consultant to include `site.json`, but this does mean page-creating builders can't run alongside other `site.json` work.
- **Removing a page the menu names is no longer refused**, which overrides REQ-11's rule; its test was rewritten to match. I also changed BUG-235's "clean check" sample site, which genuinely had an unreachable page and is now coherent. BUG-237's bare form page now ignores the new header findings. All of this is recorded in the ticket body.
- **The two brand checks only run when a page states its business name.** Every real site page now does, through a standard `application-name` meta tag; bare test pages are skipped.

**Not done**
- Capturing a live site turns a rendered menu back into plain links; it doesn't recognise a `nav` or a shared header.
- After a header-only build, only the home page gets the in-browser check.

**Tests:** 21 new UATs pass, 17 on site data and 4 in a real browser. I ran every node and workers suite and compared failures against the main checkout. Six failures were mine and are now fixed or superseded. Everything still failing also fails without my change, except REQ-101, REQ-145 and BUG-134, which fail in a fresh worktree. REQ-101 and REQ-145 pass in your main checkout only because of uncommitted font and module-asset changes there, and BUG-134 needs a `.xgd/tmp` directory the worktree lacks.

<!-- xgd-chat-end -->