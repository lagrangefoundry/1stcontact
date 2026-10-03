---
uid: request-b0cba795
id: REQ-376
type: request
title: 'Site pane: View on your phone — a QR code for the draft preview'
created_by: EPIC-19
created_at: '2026-10-03T22:37:53.385855+00:00'
updated_at: '2026-10-03T23:28:23.495853+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c232ad5b
---

## What changes

A **"View on your phone"** control sits beside **"Open in a new tab"** in the site pane's toolbar. Choosing it shows a QR code that encodes the same honest draft URL "Open in a new tab" opens (`previewChannelUrl(src, 'draft')`, `app.js:874` — the draft channel in both View and Edit modes, per BUG-131). The client points their phone camera at it and the draft opens on the phone.

Nothing about who can see a draft changes. The phone goes through the normal Cloudflare Access sign-in with the same email; the QR code is a way to carry a URL across devices, not a credential.

## Why

The consultant asked Charlie's Plumbing to "have a scroll through it, ideally on your phone too" — a good request the product gave the client no way to act on. Today the client would have to copy the URL, send it to themselves, open it on the phone and sign in, and nothing in the UI suggests any of that.

## Requirements

1. **Same URL as "Open in a new tab".** One source for both controls, so they can never disagree; the QR encodes the draft channel at the page currently shown, never the edit channel.
2. **Shown in both View and Edit modes**, wherever "Open in a new tab" is offered.
3. **The code is generated in the browser** from the URL — no network call, no third-party QR service (the URL would leak to it). There is no QR library in the repo today; either vendor a small one or write the encoder. Decide in implementation; whichever, it ships with the builder bundle.
4. **The popover says what will happen**, in plain words: point your phone's camera at this; you'll be asked to sign in with the same email you use here. Also shows the URL itself with a copy button, for a phone without a camera scanner.
5. **The code tracks the page.** If the client changes page while the popover is open, the code updates (or the popover closes) — it must never show the URL of a page that's no longer in the pane.
6. **The consultant knows the control exists.** Its priming / tool manual says how the client gets the draft onto a phone ("use *View on your phone* beside the preview"), so a suggestion to check mobile comes with a way to act on it.

## Out of scope

**A shareable, sign-in-free draft link** (read-only, expiring, revocable — "let my wife look at it"). That makes a private draft reachable by anyone holding the link and is a policy decision belonging with DOC-5's magic-link and scoped-access rules. Parked as an open question on EPIC-19.

**Dev reach.** On the local dev setup the builder is on 127.0.0.1 and a phone can't reach it at all; this ticket doesn't change that. It works in production.

## Test plan

UATs named `test_UAT_FC_<TICKET-ID>_*`:
- the control is present beside "Open in a new tab" in View and Edit modes;
- the encoded URL equals the "Open in a new tab" href, and is the draft channel in Edit mode;
- the QR decodes back to that URL (round-trip through a decoder in the test);
- changing page updates the encoded URL;
- the consultant's priming/manual names the control.