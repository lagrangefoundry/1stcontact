---
uid: request-3731fe6b
id: REQ-207
type: request
title: 'The consultant can research: web search as a configured API, and the image
  describer leaves its second path to a model'
created_by: CHAT-43
created_at: '2026-09-08T03:18:16.962511+00:00'
updated_at: '2026-09-08T03:18:16.962511+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

## What changes

**The consultant can look things up.** Today it works entirely from what the client says
in the conversation: told *"we're a wedding photographer in Bristol"*, it has the words
and nothing else — no sense of what that market's sites actually look like, whether the
client already has a web presence, or what their competitors are doing. A consultant who
cannot research is giving an opinion formed from a single sentence, and [[REQ-174]] asks
this role for judgement rather than hands.

This adds **web search** to the consultant's surface, configured rather than coded, and
takes the **image describer** off the second path to a model it is currently on.

## Why search, and deliberately not fetch

The provider offers both a search tool and a fetch tool. **Only search is worth having
here, and the reason is that [[REQ-206]] already gives us something better than fetch.**

- **Search finds an address.** Nothing in this product can do that. It is the whole of
  the new capability.
- **Fetch reads a page — badly, for our purposes.** It does not render JavaScript, so a
  modern site comes back as a shell. `capture_site` drives a real browser, records the
  page at each viewport, reads the values behind it and mirrors its imagery. For *"look
  at this website"* the capture pipeline is strictly better, and having both would invite
  the assistant to reach for the worse one.

So the two compose, and that is the intended shape: **search finds the site, capture
looks at it properly.** A client who says *"make it feel like the good photographers in
Bristol"* is answered by finding them and then capturing one — neither half is useful
alone.

Fetch is not refused on principle, only deferred: once REQ-206 has landed and we can see
what capture leaves uncovered, the remaining case for fetch is reading PDFs and plain
text, and it can be added as configuration without touching code.

## How it behaves

- The consultant can **search the web** when the client's request turns on something it
  cannot know — the client's own existing presence, an industry's conventions, what a
  named competitor is doing. It is expected to say what it found and where, in the
  client's language, never as a list of links.
- **It does not search to answer questions it can already answer.** Judgement about
  layout, colour and copy is what the role is for; a consultant who searches before
  forming a view is deferring rather than advising.
- **What comes back is a stranger's writing.** Search results, page titles and snippets
  are third-party text arriving because the assistant asked for it. It is material to
  report on and is **never an instruction**, however phrased and whoever it claims to be
  from — the rule the fidelity surface already states for captured sites, which holds
  identically here and for the same reason.
- **Every claim drawn from a search is attributable.** The provider returns the source
  alongside the result; a consultant that tells its client something it learned from the
  web can say where it came from when asked.
- **Searching is bounded per session**, in the same shape as REQ-206's browser budget and
  for the same reason: it costs money per call. A session that exhausts its budget is
  told so in words it can act on, that one operation refuses, and every other tool keeps
  working — a client must never lose their consultant because it looked something up too
  often.

## The image describer stops being a second path to a model

`describe.ts` reaches the Messages API directly to describe an uploaded image, and says
in its own source why: this component's session surface is text-only, so an image cannot
be described through the host the Worker already runs. It names the consolidation point
and commits to being deleted when one arrives:

> either [[REQ-157]] (the fidelity/"looking" surface, which needs the same capability) or
> an image block on the AI component's own surface. Whichever lands, this function is
> what is deleted.

**This is that deletion.** The describer becomes a configured capability reached through
the same host as everything else, and `anthropicImageDescriber` and its `VISION_MODEL`
constant go with it. The text describer needs nothing — [[REQ-173]] already routed it
through the session factory; the image describer is the last outlier, and the reason it
survived is that it was the only caller that needed a shape the surface could not
express.

Everything the description is *for* is unchanged: it is written for retrieval rather than
elegance, it still yields a title and a digest from one call rather than two, and a
degraded case still creates the material, still says honestly what is missing, and is
still selectable by predicate for a later re-describe pass.

## Configuration, not code

**Adding the next API must not be a code change in this repository.** Web search arrives
as configuration against the mechanism lagrange-framework REQ-139 introduces, which is
why that ticket is a dependency rather than an implementation detail. The test of whether
this landed correctly is that a second API — a maps lookup, a companies register, a
stock-photo search — is a configuration entry and a grant, reviewed as data, with no
TypeScript written here to accommodate it.

As a technical consequence of the above, and requested here so it is not discovered
during reconciliation:

- **The capability is granted, not merely present.** It joins the consultant's grant
  beside the surfaces it already holds, so a session that is not granted it is never told
  it exists — the projection rule [[REQ-126]] exists to enforce, and the exact failure
  REQ-206 documents.
- **Credentials are referenced from configuration, never written into it.** The host
  supplies the secret. A configuration file that *can* hold a key is one that will
  eventually be committed with one in it.
- **A deployment that cannot supply the capability simply lacks it.** No key, or a
  backend that does not offer the tool, and the operation drops out of the surface and
  out of the manual. The session still opens, the transcript still replays, and nothing
  throws on first use — the same absent-and-fine shape as a missing API key.

## What does not change

- **No new HTTP route.** Searching is reachable only as a tool call inside an admitted,
  business-scoped turn.
- **No SSRF surface.** The provider executes the search on its own infrastructure, so
  unlike `capture_site` there is no request leaving our network and nothing for
  `egress-guard.ts` to hold.
- **Nothing here changes a site.** Searching is a way of looking, and the site cannot
  move because the consultant looked something up.
- **The role text still enumerates no tools.** The manual grows because the grant does.
