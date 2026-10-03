---
uid: request-b0cba795
id: REQ-376
type: request
title: 'Site pane: View on your phone — a QR code for the draft preview'
created_by: EPIC-19
created_at: '2026-10-03T22:37:53.385855+00:00'
updated_at: '2026-10-03T23:38:22.825169+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c232ad5b
  commits:
  - working_sha: f3aaf1155ee9986331688abd6964a21088812945
    reconcile_sha: null
    main_sha: null
  - working_sha: 8fbcb133ed517e454a2771e3c37efb67d4112ec2
    reconcile_sha: null
    main_sha: null
  version: 0.2.469
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


## As implemented

- **Control.** `phonePreviewAction` (`toolbar.js`, id `phone-preview`) is a "View on your phone" button declared immediately after `open-new-tab` in both the View and Edit modes (`app.js`). It shares the toolbar's type rule with the other buttons (`builder.css`).
- **One address.** `app.js` defines `draftUrl = (src) => previewChannelUrl(src, 'draft')` once and passes the same function to `openInNewTabAction` and `phonePreviewAction`, so the tab and the code are always the same draft render of the page in the pane (never the edit channel). The dialog resolves it against the document's base URL to an absolute `https://…` address, since a phone has nothing to resolve a root-relative path against.
- **Dialog.** `phone-preview.js` uses the shared modal shell (`modal.js`) and shows: the QR code, a plain sentence ("Point your phone's camera at this code… You'll be asked to sign in — use the same email you use here."), the absolute address in a read-only field with a **Copy** button, and Close. Copy uses `navigator.clipboard`. If that is unavailable, it selects the field and tells the client to press Ctrl+C / ⌘C.
- **Tracks the page.** While the dialog is open, every pane `src` change redraws the code and the written address for the new page. When the toolbar strip is rebuilt (mode or site change), the dialog closes with its control, so it can never name a page or site that is not in the pane.
- **Encoder: written in-repo, no dependency.** `qr.js` is a small QR encoder (~300 lines): byte mode, error-correction level M, smallest of versions 1–40, mask chosen by the ISO 18004 penalty score, drawn as an SVG string with the 4-module quiet zone on a white background. It makes no network call, and ships verbatim in the builder bundle like every other `builder/*.js`.
- **Consultant priming.** `priming.json`'s `product-system` entry, in both of the consultant's declared orders (with and without the corpus), now says: when suggesting they look on their phone, tell them to use *View on your phone* beside the preview. It shows a code for the phone's camera, opens the page they are on, and the phone asks them to sign in with the same email.

## UATs

`tests/test_UAT_FC_REQ-376_view_on_your_phone.test.ts`, driven against the real `mountBuilder` composition. It reads every code back through a decoder written in the test, independently of `qr.js`: it parses the on-screen SVG, takes alignment positions from the ISO table, recovers the mask from the format BCH, and finds the block layout by Reed–Solomon syndromes.
- the control sits immediately after "Open in new tab" in View and Edit;
- in Edit, the decoded code equals the absolute "Open in new tab" href, is the draft channel, never `/edit/`, and equals the written address;
- a long address (version ≥ 7, multiple blocks) round-trips;
- changing page with the dialog open redraws the code for the new page, and a mode change (strip rebuild) closes the dialog;
- the dialog mentions the camera, signing in and the same email, and Copy puts the decoded address on the clipboard;
- both consultant priming orders name *View on your phone* beside the preview.

`tests/reconciliation-builder-toolbar-lifetime.test.ts` — its `DECLARED` View-mode control list now includes `phone-preview`.