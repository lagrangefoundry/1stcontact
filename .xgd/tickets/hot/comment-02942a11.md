---
uid: comment-02942a11
id: COMMENT-4643
type: comment
title: Comment on request REQ-356
created_by: xgd
created_at: '2026-10-01T21:02:19.782839+00:00'
updated_at: '2026-10-02T00:19:23.839281+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-d27ae815
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7eab8b53-d308-4c11-80da-cb3d0e1e03a4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-01T21:02:10Z" model="claude-opus-5-5" continued_from="dashboard" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-01T21:02:10Z" -->
#### You
Does Bob have anywhere to record/manage the state of the project? What I had in mind was a new ticket type "plan". It could start with a generic list of things that need to be decided. If there is any thinking to do Alice should create and update the plan, Bob should be responsible for tracking. It is never appropriate for Bob to say things like "I think the layout needs work" but completely appropriate for Bob to ask "Are we all happy with the layout" and to collect and record answers from Alice and the user. The plan ticket should have a structured plan in its front matter, that can be displayed on a panel or a card by Bob and unstructured content in the body - such as a log of decisions made etc. The ticket should capture all the input from the user about the goals, purpose and anything else that helps build the site. Lets design the plan ticket type if we do not already have it?

<!-- xgd-chat role="assistant" ts="2026-10-01T21:02:10Z" -->
#### Claude
No `plan` type exists, but two near-misses do: (1) a declared-but-never-written `brief` type in productTypePack() — per-site canonical decisions doc (DOC-9 §4, DOC-38 §9), zero instances; (2) the per-session decision ledger on the chat ticket body (REQ-171 record_decision) plus `frame` standing note (REQ-283). Recommendation: one type, not a third — rename/widen `brief` into `plan` (free while no instance exists) and move the decision log from the chat ticket into the plan body so a multi-session site has one log. Proposed shape: one living plan per site; frontmatter holds phase, structured brief (business, site_job distinct from audience, audiences, goal+measure/proxy, quality_bar, existing site + feeling, constraints), functionality from the fixed catalogue, decisions seeded from a generic list with area/tier(concept|detail)/state(open|defaulted|proposed|not_objected|chosen|delegated|parked)/compared/parked_reason, checks (Bob's 'are we all happy with…' questions with answers), and Alice's tasks with optional depends_on. Body: the client's own words, append-only decision log, notes. Write authority: Alice owns tasks and proposes decisions; Bob records intake answers, asks/records checks, updates progress; only a client answer moves a decision to chosen/delegated/parked. Schema invariant: checks[].answers[].by ∈ {alice, user} — Bob can never be an answerer, so 'Bob has no opinion' is enforced by data, not prompt. Open questions: rename brief→plan and move the log? depends_on optional? Bob-recorded answer sufficient as confirmation? one plan per site?

<!-- xgd-chat role="user" ts="2026-10-01T21:02:10Z" -->
#### You
Perfect, yes please create and REQ for this. Then I want you to write a document that captures this conversations conclusions: The roles, how they are expected to interact, how they are expected to use a plan ticket, the generic decisions that need to be checked off, the way we expect to get there. It should be written as core content for Alice and Bob

<!-- xgd-chat role="assistant" ts="2026-10-01T21:02:10Z" -->
#### Claude
Filed REQ-356 as an upgrade of `brief` → `plan` with the recommended answers taken: rename and move the decision log into the plan body; depends_on optional; Bob recording the client's stated answer is the confirmation; one plan per site. Notes that it resolves DOC-62 open questions 1 (structure keyed on the site — survives a lost conversation) and 3 (panel and log are one object), and refines DOC-62's write-authority rule: Bob may record the client settling a decision, never settle one himself. Bob's runtime (room, turn-taking, triggers) is out of scope.

<!-- xgd-turn id="da47ec6f-d91f-4490-a2d7-015c4eb60ee5-user" -->

<!-- xgd-chat role="user" ts="2026-10-01T23:11:24.641466+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-cli-session ts="2026-10-01T23:30:58Z" model="claude-opus-5-5" continued_from="cli" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-01T23:30:58Z" -->
#### You
When should the plan ticket be created? I think it is tied to the business 1-1 so it should probably be created at the same time the business is provisioned - would you agree? We may later have other plan tickets associated with the business - such as a marketing ticket - so this should clearly be the site plan.

<!-- xgd-chat role="assistant" ts="2026-10-01T23:30:58Z" -->
#### Claude
Agreed. provisionBusiness creates exactly one starter site ('the one site a business has'), and local data is 7 businesses / 7 sites, so site plan and business are 1:1 today; create it at provisioning right after createStarterSite. Refinements folded into REQ-356: (1) type stays `plan` with `kind: site` as a field — a marketing plan has the same shape with a different seed, so per DOC-38 §9 it's a kind not a type; uniqueness on (kind, site_key). (2) Key on the store-minted site_key, not site_slug — DOC-45 §6 removed site names. The plan sits in the business's own store, so it belongs to the business by store and to the site by field. (3) Lazy create-on-first-open for businesses provisioned earlier (incl. Lagrange Foundry) and for partial provisioning failures, idempotent. Watch item: brief.business is a business fact that a future marketing plan would duplicate.

<!-- xgd-turn id="da47ec6f-d91f-4490-a2d7-015c4eb60ee5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T00:19:21.538908+00:00" -->
#### Claude
I'm working through the existing code (the ledger surface, the `brief` type, and the priming path) so I know how REQ-356 fits before I write anything.

Still reading: I'm checking which field types the ticket store's `TypePack` can validate, so I know whether the plan's nested frontmatter can be checked declaratively or needs its own validator.

I'm checking how far the store's own validator reaches. It handles `list`/`object` fields, and I need to know whether it validates nested items or only the top level.

The site slug is already passed where the ledger is bound (`ai.ts:852`), so moving `record_decision` to the site's plan fits the existing port. Reading the host wiring and the seed providers now.

Now DOC-64, which defines the generic decision list (§6) and standing checks (§7) the seed has to use.

I have the design shape now. Next I'm checking how a surface declaration gets registered and validated in tests, so the new plan surface goes through the same checks as the ledger surface.

I'm reading the consultant's priming configuration to see where a per-turn plan entry belongs.

Plan for priming: a per-turn `site.plan` reminder entry for the consultant, fed from the same plan port that `record_decision` will append to. Now I'm reading the REQ-283 test to reuse its harness.

Still reading. I'm checking whether the framework's tool-declaration parser supports enum parameters, so the plan tools can declare things like decision states directly.

Branch `free-REQ-356` is cut. Writing the seed data first: DOC-64's generic decisions (§6) and standing checks (§7) as a JSON file, so the list can change without a code change.

No feature catalogue exists in the codebase yet, so `functionality` will accept any feature id; I'll note that on the ticket. Writing `plan-core.ts`.

Now the tool declaration, `plan-surface.json`, modelled on the ledger's.

Next, the host side: `apps/control-app/src/plan.ts`, which stores the plan as a `plan` ticket with compare-and-set writes.

Now updating the type pack: `brief` becomes `plan` with the structured fields.

Now the rename in the corpus type list, the KB config and the repro-console list.

The repro-console `'brief'` is a folder name for its prompt file, not a ticket type, so it stays. Checking the BUG-108 test reference before deciding on it.

Now `ledger.ts`: `record_decision` appends to the site plan's `## Decision log`. The chat ticket keeps the title and the standing note.

`countEntries` is now dead (plan-core's `logEntries` replaces it), so I'm deleting it and updating `ledger.ts`'s header comment to match.

Wiring the host next: a `plan` dep in `host-core.ts`, the plan surface composed with the consultant's grant, and a per-turn `site.plan` provider.

Now `ai.ts`: pass the site into the ledger and add the plan factory.

Running the typechecker over the changes.

The fresh worktree is missing the gitignored `generated/` shims, a known worktree artifact. Copying them over from the main checkout, then re-running and filtering to my own files.

The control app typechecks clean, apart from a pre-existing `_declared` error that isn't mine. Now `tools/generate`:

Both projects typecheck. I'm now writing the UATs that drive the new plan tools, and checking how the existing tests read a tool's result.

Writing the node suite. It drives the plan surface through `box.run`, the AI's own entry point, against an in-memory plan port, following the REQ-171 ledger tests' precedent.

All 6 node UATs pass. Now the workers suite against real D1. Checking how the existing tests read which tools a session was offered.

The REQ-283 workers test pins decisions to the chat ticket's body. That's exactly what REQ-356 supersedes, so I'm pointing those assertions at the site plan.

Now the REQ-171 ledger tests, which call `chatLedger` against a fake store.

Now the workers suite for REQ-356, against the real Worker and D1.

workerd segfaulted, taking one of the three files down (21 tests passed in the other two). Running them one at a time to find which, and whether it's my change or the environment.

My file crashes workerd on its own, and the other two pass. First suspect is the import of `tools/generate/src/cli/kb.ts`, a CLI module that may pull in node-only code. Checking.

Renaming `brief` to `plan` across the test fixtures that use it as an ordinary ticket type. The BUG-108 and REQ-256 hits are file paths, so they're left alone.

The REQ-356 workers suite passes (5/5). Running the wider regression scope next: every file I touched plus the suites that exercise priming, the ledger, and record_decision.

REQ-159 passes now. REQ-295 fails the same way on the unchanged `xgd-working` checkout, so it's pre-existing and not mine. Running the workers regression scope.

All 14 workers files pass (131 tests). One last check: whether any suite scans every `*-surface.json` (conformance or validation), so the new declaration gets covered there too.

The surface-adjacent suites pass too (5 files, 78 tests). Now committing. Checking for this repo's version-bump script.

Most recent free-coded commits here carry the trailer, so mine matches. `xgd-working` has moved 14 commits; merging it into the branch before the bump.

Fast-forwarded onto `xgd-working`. Ticket auto-commits landing after the bump can block the version gate, so I'm claiming `free_coded` immediately and updating the body afterwards.

Branch cleaned up and story points set. Now syncing the ticket body. It changed on disk earlier, so I'm re-reading it before editing.

The operator added a "When it is created" section while I was building. Reading it to check it against what I built.

I'll give `kind` an enum default of `site`, so the generic fixtures only need `site_slug` → `site_key`. Cutting a fresh branch for the follow-up commit.

Now the rescope edits, starting with `plan-core.ts`: `site_slug` becomes `site_key`, and `kind` is added.

Now the type pack fields, and `plan.ts` rewritten around find-or-create with the settle step.

The cycle is safe: `scope.ts` only calls `admissibleBusiness` inside functions. I'm now adding plan creation to `provisionBusiness`, right after the starter site is made.

Updating the tests for the new contract. First, finding an existing test that provisions a business, so the provisioning UAT can reuse its setup.

I'll use `inviteAccount` plus `provisionBusiness`, then assert the plan exists for the returned `siteKey`. Updating the workers suite.

Typechecking and running the REQ-356, REQ-171 and REQ-162 suites.

That's the known vitest quirk: a long list of paths finds nothing. Splitting into smaller batches.

All 31 provisioning-related suites pass (344 tests). Re-running the node suites touched by the `plan-core` changes.

Everything passes. Committing the follow-up, then merging `xgd-working` into the branch and bumping the version at the tip.

REQ-356 is built and merged into `xgd-working` (four commits, version 0.2.430). The ticket is at `free_coded` and its body describes what landed. All 51 test files I ran pass except one REQ-295 test, which also fails on the unchanged checkout (it stumbles on `ManageTextStyles`), so it isn't caused by this work.

**What changed:**
- **`brief` is now `plan`.** There is one site plan per site, keyed by `kind: site` plus the site key, as you re-scoped it while I was building. It is created when a business is provisioned, or the first time it's opened if it's missing. If several sessions open a missing plan at the same moment, they still end up with exactly one.
- **Starting state.** Every new plan begins with DOC-64's generic decisions and standing checks. Those lists live in a data file (`plan-seed.json`), so they can change without a code change.
- **The decision log moved.** `record_decision` now appends to the site plan's `## Decision log`, numbered across sessions. The chat ticket keeps only the session's title and standing note. This supersedes the REQ-171 and REQ-283 behaviour, and I updated their tests to match.
- **The rules are enforced on every write.** Only Alice or the client can answer a check, so Bob never has an opinion. A decision reaches `chosen`, `delegated` or `parked` only with the client's own words attached, and `parked` needs a reason. A refused write leaves the plan unchanged.
- **Tools.** There's a new `plan` tool set, with separate permissions for Alice and Bob. Alice proposes decisions, owns the tasks and answers checks; she can't settle a decision. Bob records the client's answers, asks checks, and tracks task progress and phase.
- **Alice sees the plan every turn**, with decisions that were only defaulted labelled as such.

**Decisions I made that you may want to revisit:**
- **Bob isn't live.** His tools and permissions exist and are tested, but nothing runs them, because his runtime was out of scope. So the plan reaches Alice's priming only, not "both agents'" as the ticket says.
- **Provisioning still succeeds if creating the plan fails.** The plan is then created the first time it's opened.
- **No feature catalogue exists yet**, so `functionality` accepts any feature name.
- **I added fields** to the plan's structure: `title`, `settle` (ask, talk, show or offer) and the client's `answer` on each decision. Checks now take a list of `triggers` rather than one trigger, because DOC-64 gives several per check.
- **The panel is data only.** There's a projection the client view can use, but no UI or route serves it yet.

<!-- xgd-chat-end -->