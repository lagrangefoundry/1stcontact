---
uid: comment-a3f23a36
id: COMMENT-889
type: comment
title: Comment on request REQ-130
created_by: xgd
created_at: '2026-08-09T23:34:30.719051+00:00'
updated_at: '2026-08-09T23:54:15.129309+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ed6ba145
  kind: chat_transcript
---

<!-- xgd-turn id="40662cb5-301a-46c9-aa26-a7e5df279a55-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T23:34:26.782395+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="40662cb5-301a-46c9-aa26-a7e5df279a55-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T23:54:14.986553+00:00" -->
#### Claude
I'll start by reading the ticket.

I'll explore the codebase to understand the current control surface before coding.

The ticket body is already a complete scope. Cutting a branch — this is multi-file work across three packages.

Now the SVG content validator — the security-critical piece.

Now the `edit.ts` write path — the single write path all callers share.

Now the `edit.ts` changes.

Now `editConfigSet`:

Now `seoMeta` on the page write path:

Now the module-instance commands — a new section in `edit.ts`:

Now the generated-asset write path:

Now the CLI dispatch:

Now the USAGE text:

Now the toolbox operations binding:

Now the declaration — the half the model actually reads:

Now the new read op and the rewritten write ops:

Now the groups, sequences and absences:

Now the UATs:

All 17 pass. Now the regression scope:

The REQ-126 guardrail is doing exactly its job — enumerating the write set so a new write can't appear unnoticed. Updating it deliberately:

One performance defect in my own validator: per-character `slice()` makes it O(n²). Fixing with sticky regexes:

Now bump the version and commit:

Now updating the ticket body — preserving the original scope and appending what was decided during implementation:

Done. REQ-130 is at `free_coded`, commit `e6ff11aab`, merged into `xgd-working`.

## What shipped

**1. Structured config.** `set_config` now takes `settings` (a typed object) plus an optional `key` naming the group. The Toolbox's base types offer no union, so an object-valued parameter was the whole design space — which made the *write semantics* the real decision. It **merges** rather than replaces: two objects merge at every depth, lists and scalars replace. Replace-at-key would have made object writes dangerous (changing one palette colour would mean resending the palette, and any family omitted would vanish silently). Merging also keeps single scalars reachable without a second operation. The argv JSON-parse moved out of `edit.ts` into the CLI, so no tool caller re-reads a string as syntax.

**2. Component instantiation.** `list_behaviors` / `add_component` / `configure_component` / `remove_component`, and `describe_page` now lists instances with their config. Two calls worth flagging: `presentation` is **optional** — L2 already held the vetted default look, so `l2/presets.ts` adds `presetSlots(behaviorId, config)` to ask for it by id rather than every caller growing the same `if (type === 'contact-form')`. And `config` is checked against the behavior's *own* contract, since `validateSite` lives in `site-schema` and cannot see the framework's metas. Authoring a new behavior type is a declared absence.

**3. Page metadata.** `seo` on `add_page`/`update_page`, merged, asserted through to the rendered `<title>` and meta description.

**4. Generated SVG — the part that widens the attack surface.** It ships because the validator is closed by construction, not by blocklist: a strict scanner where **every byte must be accounted for** by a named token, with no skip-what-we-don't-recognise branch, so an unanticipated construct is a refusal. Plus element/attribute allowlists, `url(#local)`-only references, no DOCTYPE, 64 KiB and 2000-element caps, a generated filename (no path to traverse because there is no path), and text formats only. Its own capability group (`DrawImages`) so it can be withheld.

## Evidence

17 UATs in `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts`, all passing — including 15 hostile SVG documents each refused with no byte written, and the modal invariant proven over `/api/copy` on copy inside an assistant-instantiated form. Regression scope green across REQ-121/122/126/127/128/129, generate, naming, public-site, conformance and framework suites.

One deliberate change to another ticket's test: REQ-126 enumerates the declared write set precisely so a new write can't appear unnoticed. Four were added, so it fired — that's the guardrail working, and I updated it with a note rather than working around it.

Two things I'd flag for your judgment:

- **`1c config set` semantics changed** from replace to merge for object values. That's the same decision as above applied to the CLI, and I think it's right, but it is a behaviour change to an existing command.
- The ticket said drop the SVG capability if the validator couldn't be made convincingly closed. I judged it closed and shipped it — the closure property is tested directly rather than by payload sampling, but it's the part most worth a second look before this reconciles.

<!-- xgd-chat-end -->