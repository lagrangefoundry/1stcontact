---
uid: request-c7f76fbf
id: REQ-189
type: request
title: The Users tab is unstyled, and its detail panel splits one thing into two tables
created_by: xgd
created_at: '2026-09-05T20:17:18.378919+00:00'
updated_at: '2026-09-05T20:17:18.378919+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-4f89b466
---

# The Users tab is unstyled, and its detail panel splits one thing into two tables

## The presentation

The tab renders correct data as raw DOM. There is **no `builder-people` rule in
`builder.css` at all** — `people.js` emits `builder-people__revokegrant`,
`builder-people__fulfil` and its section wrappers, and nothing anywhere styles
them. So every field runs into the next, the type is at the browser's default
size rather than the shell's, there is no left margin, and nothing aligns to
anything.

`@lagrangefoundry/webui-fields` is the reference. `people.js` already mounts it
for the *Who they are* section (`people.js:354`), so one section of this panel is
already styled correctly and the rest are not — which is both the proof that the
component fits and the reason the inconsistency is so visible. Match its type
scale, gutters and label/value alignment; do not invent a second look for the
same kind of content.

Both surfaces need it: the **list** and the **sections in the detail panel**.

## One table per business, not two tables per person

The detail panel presents *Businesses they run* and *Grants* separately. They are
different relations — [[DOC-42]] §4's operator and entitled — but they share a
key: since [[REQ-184]] an entitlement's object is a **business**, and a membership
is on a business. One row per business, with the membership facts and the grant
facts as columns, is the truer shape.

**The mismatches are the point.** A person who operates a business with no live
grant is the lapsed customer; a grant against a business someone does not operate
is a support arrangement or a mistake. Two separate tables hide exactly those
states — you have to read both and do the join in your head — while one table
with an empty cell shows them at a glance. This is the same argument [[REQ-178]]
made for keeping lapsed businesses visible in the switcher rather than dropping
them.

**Both tables need column headings.** Neither has any today, so the reader is
inferring what each value means from its shape.

## The list shows the name when there is one

The list is addresses only. `users.display_name` exists (`0004:54`) and
`/api/people` already returns it as `displayName`, so the column is a
presentation change rather than a data one.

It will be empty for everybody until something can set it — [[REQ-183]] §5 records
that `display_name` and `tenants.name` are changeable by nobody and calls it a
different ticket. That is not a reason to omit the column; it is the reason the
empty state has to read as *no name yet* rather than as a broken cell.

## Not in scope

- **Editing `display_name`** — [[REQ-183]] §5's ticket, not this one.
- **What the states are called.** [[REQ-188]] changes Member/Contact into a
  three-state model. This ticket styles whatever labels that one lands on and
  must not hard-code two.

## Acceptance

- the list and every detail section match `webui-fields` for type scale, gutters
  and label/value alignment; no section is unstyled
- the detail panel presents one table keyed by business, carrying both the
  membership and the grant facts
- a business operated with no live grant, and a grant with no membership, are
  both visible as such in that table
- every table has column headings
- the list shows `displayName` when set, and reads as *no name yet* when not