---
uid: acceptance_criterion-7c91ad98
id: AC-1515
type: acceptance_criterion
title: The module is written on every build whether or not a knowledge base exists,
  and a build with none says so in its report
created_by: xgd
created_at: '2026-09-04T02:46:22.973880+00:00'
updated_at: '2026-09-04T02:46:22.973880+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The importable knowledge-base module is written **on every asset build, whether or not a knowledge base has been built** — carrying an explicitly absent knowledge base when none has. Reading an unbuilt knowledge base back yields that absence rather than failing.

The unconditionality is the criterion, not an implementation nicety. The generated tree is not in version control — a checked-in generator output would be a second definition site — so a fresh checkout has no module until the asset build writes one. A module written *only* when a knowledge base existed would leave the static import unresolvable on any checkout that had never built one, turning a missing capability into a build that does not compile. The absent case must degrade to an assistant with no knowledge tools, never to a build failure and never to a boot failure.

**Degrading gracefully and saying nothing are different things.** A build that emitted no knowledge base says so in its report, in the operator's own face at the moment they could still fix it: the report names the knowledge base as not built, says what shipping that way costs, and names the command that would fix it. A built one is reported instead as how many documents it carries and how large it is. Silence here would mean shipping an assistant with no knowledge tools and nobody noticing until it answered a question badly, weeks later, in front of a client.

## Verification

Run the asset build in a checkout with **no** knowledge base built and assert the module is written anyway, carrying an explicitly absent knowledge base, and that importing it resolves. Assert reading an unbuilt knowledge base yields absence rather than throwing. Then assert both report renderings against the same build: the absent case names the knowledge base as not built and names the remedy; the built case reports the document count and the size. Assert the absent report is distinguishable from the built one by reading the report alone.
