---
uid: request-3f8737f2
id: REQ-157
type: request
title: 'The fidelity surface: the assistant can look, compare and judge'
created_by: xgd
created_at: '2026-08-20T23:16:44.004000+00:00'
updated_at: '2026-08-20T23:16:44.004000+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 13
  depends_on:
  - REQ-154
  - REQ-155
  - REQ-156
  - REQ-149
  auto_merge_back: true
  needs_review: true
  chat_comment: comment-422ff2d4
---

# The fidelity surface: the assistant can look, compare and judge

## Why

The assistant's entire tool surface is 27 site-editing operations ([[DOC-30]],
`l1-surface.json`). It can author a page and it can draw an SVG. It has **never been able to see
anything** — not a reference site, not its own output, not the difference between them. No
operation in any surface returns an image; `get_asset` returns *"its file and its alt text"*.

[[DOC-13]] §6 is titled *"Screenshots — the AI's eyes"*. In the cloud the assistant has none, and
[[DOC-9]] §2.1's "convert an existing site" — named there as the killer demo — is unreachable
without capture.

## A second surface, not more operations on the first

`l1-surface.json` is the **L1 control surface**: the documented, maintained way to *change a site*
([[DOC-30]]). Nothing in this ticket changes a site — capturing, shooting, comparing and judging
are all read-only with respect to the site. Bolting them onto the L1 surface would make that
document's own claim about itself false.

So this is a second declared surface, implemented the same way: declared as data, implemented
against the store, granted per role. `createL1Toolbox` already takes a **list** of surfaces
(`host-core.ts:515`) and the knowledge surface is the working precedent for a second one.

## The picture vocabulary — "anything against anything"

Today each verb has its own flags: `--ref <bundleDir|refPng>`, `--actual <png>`, `--source
draft|published`, `--size`, `--url`. That is fine for a person typing and useless as a tool
surface, where the model must be able to name any picture in one consistent way.

One **picture source**, resolved in one place:

| Source | Named by |
|---|---|
| a captured reference | bundle id + viewport |
| an authored draft | slug + page + viewport |
| the edit channel | slug + page + viewport |
| a published revision | slug + page + revision + viewport |
| any URL | url + viewport |

`screenshot` takes one. `compare` takes two, in any combination — which is what makes "compare
anything to anything" true rather than aspirational: draft against reference is the reproduction
case, draft against published revision is *what did I just change*, revision against revision is
*what changed between releases*, and reference against reference is a competitor over time.

**Shooting a published revision needs revisions to exist** — [[REQ-149]].

## Operations (provisional)

| Operation | Effect |
|---|---|
| `capture_site(url)` | fetch and capture; returns a reference bundle id |
| `list_references()` / `describe_reference(id)` | what has been captured, and what is in it |
| `screenshot(source)` | an image the model can **see** |
| `compare(a, b)` | perceptual verdict, ranked regions, crop pairs |
| `check_fidelity(actual, reference)` | `gate`'s three-way reconciliation and its verdict |

`check_fidelity` is `1c gate`, and it is included because it is the only verb that catches the
failure the other two cannot: `l1-gate` is blind to colour, font and media by design, and
`values-diff` can only compare elements present in **both** manifests — so a page whose capture
missed its imagery passes both while the perceptual eye reads 80% of pixels wrong. `gate` makes
that **disagreement** the finding, and names the likely cause (`capture-incomplete`,
`reproduction-wrong`, `unexplained-disagreement`). An assistant that could compare but not
reconcile would confidently work value deltas against a reference that was never valid.

## The hard part: an image has to reach the model

This is the risk in the ticket and it should be settled **before** the operations are built.

The Anthropic wire format accepts a `tool_result` whose `content` is an array of blocks including
`{type: 'image', source: {type: 'base64', …}}`, and `api_tools.js:407` passes the operation's
output straight through — **so the transport does not block it.** What is undecided is whether a
Toolbox operation may *declare* an image return at all: every `returns` in `l1-surface.json` names
a JSON shape, and the surface declaration format has no vocabulary for bytes.

That is likely an upstream `@lagrangefoundry/ai` change, exactly as [[REQ-103]] was for the
Workers export rung. Settle it first.

**A tool that returns "a screenshot was taken, it is at this key" and nothing the model can look
at satisfies none of this ticket.** The point is the eyes.

## Grant and safety

- `capture_site` fetches an **arbitrary URL on the operator's behalf**. That is an SSRF surface
  and [[DOC-2]] applies: refuse private and link-local address space, cap redirects, cap response
  size, cap time. The URL and the refusal are journalled.
- Everything a capture returns is a third party's content arriving inside a tool result. The L1
  surface already marks reads `provenance: 'untrusted'`; this is more so, and a captured page's
  text must never be able to read as an instruction.
- The caretaker grant is the whole surface: this is the role that builds sites, and looking at
  what it built is not a privileged act. It remains ungranted `Publish` and `ManageAssets`, which
  this ticket does not touch.

## Acceptance criteria

1. A second toolbox surface, declared as data and implemented against the store, registered
   alongside the L1 surface rather than merged into it.
2. The picture-source vocabulary resolves all five sources through one function, and every
   operation takes it — no verb carries its own `--ref`-shaped parameters.
3. `screenshot` returns an image the model can actually see. A UAT asserts an image content block
   reaches the backend; asserting that a key or a URL was returned does not satisfy this.
4. `compare` of any two sources returns the verdict `1c diff` returns for the equivalent CLI
   invocation.
5. `check_fidelity` reproduces `1c gate`'s reconciliation, including which of the three causes it
   names.
6. `capture_site` is refused for private address space, over-large responses and redirect loops;
   each refusal is journalled with the URL.
7. The caretaker is granted the surface and its manual says what it can now do.
8. No operation on this surface can change a site — asserted, not asserted-by-inspection.

## Origin

[[CHAT-27]]. Last of four, and the only one the operator asked for directly; the other three are
what it stands on.