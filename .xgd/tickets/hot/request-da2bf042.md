---
uid: request-da2bf042
id: REQ-326
type: request
title: Allow multiple animations on one element
created_by: xgd
created_at: '2026-09-25T23:28:53.663349+00:00'
updated_at: '2026-09-25T23:28:53.663349+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c2e3d5af
---

## What I was trying to achieve

Give one element more than one motion behaviour at a time — for example an image that has a one-shot entry reveal **and** a scroll-linked property track, or an entry reveal plus a hover response.

## What stopped me

An element's motion is a single value, so naming a second behaviour replaces the first. There is no way to express "this node does A on entry and B thereafter", or "A and B simultaneously with different durations".

## What would let me finish

Let the motion field take a **list** of behaviours rather than one, each with its own trigger, duration, delay and easing. Composition rules worth settling in the spec:

- Two behaviours animating the **same property** — last one wins, or refuse the write. Refusing is probably better: silently dropping one is the failure mode that costs a diagnosis cycle.
- Two behaviours animating **different properties** — compose, which is the common case (fade on entry, translate on scroll).
- Order in the list is paint/priority order, so it is authorable rather than implicit.

Backwards compatible if a single object is still accepted and treated as a one-item list.

## Why it matters

Once scroll-linked motion exists (filed separately), one-behaviour-per-element becomes the binding constraint immediately: entry reveal and scroll tracking are the obvious pairing and an author cannot have both. It is worth landing the two together.