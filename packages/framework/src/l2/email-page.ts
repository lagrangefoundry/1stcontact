/**
 * The copy a new email page starts with ([[REQ-247]] §2, AC-4).
 *
 * L2 IS WHERE A VETTED DEFAULT LOOK LIVES, and that is the whole reason this is
 * here rather than in the tool that creates the page. `presets.ts` already holds
 * the default presentation a behavior module is instantiated with — a starting
 * point expressed as ordinary L1, refined afterwards by `set_l1` like anything
 * else. A message is the same shape of thing: somebody has to be able to read it
 * before anybody receives it, so it cannot arrive empty.
 *
 * IT IS BUSINESS-NEUTRAL, for the reason `SEED_TEMPLATES` is. The same default
 * is written into whichever site asks, so naming 1st Contact here would put our
 * name in a plumber's mail to their own customers.
 *
 * AND IT IS BUILT FROM THE DECLARED PLACEHOLDERS RATHER THAN BESIDE THEM. An
 * email page whose `placeholders` name a token its copy does not contain is
 * refused by the site validator ([[REQ-247]] AC-12) — so a default that ignored
 * the declaration would be refused the moment it was written, for a form that
 * gates a download, which is the most common reason to make one of these at all.
 * Declaring `cta_url` therefore produces the button and the pasteable fallback;
 * declaring anything else produces a line carrying it, to be rewritten.
 */
import type { L1Document, L1Node } from '@1stcontact/site-schema'

/** The canvas an email is authored at — the width every mail client agrees on. */
export const EMAIL_CANVAS_PX = 600

/** The neutral type and colour a message starts in. Literals, never palette refs. */
const INK = '#1a1a1a'
const MUTED = '#5a5a5a'
const ACCENT = '#111111'
const PAPER = '#ffffff'
/*
 * A STACK AND NOT A BARE NAME, because L1 refuses a bare one. A painted family
 * must resolve to a served face or name a generic — no email page serves a face
 * (a mail client loads no web font, which is the whole reason this target
 * exists), so the generic is the only thing that makes the choice the author's
 * rather than the reading client's. Written bare, this default would be refused
 * by the validator the moment `add_page` tried to write it.
 */
const FAMILY = 'Helvetica, sans-serif'

function line(text: string, fontSizePx: number, extra: Record<string, unknown> = {}): L1Node {
  return {
    kind: 'text',
    text,
    axes: { fontFamily: FAMILY, fontSizePx, lineHeightPx: Math.round(fontSizePx * 1.5), color: INK, ...extra },
  } as L1Node
}

/**
 * THE CALL TO ACTION IS A BUTTON *AND* THE SAME URL AGAIN AS PASTEABLE TEXT,
 * which [[REQ-197]] required of the invite for a reason that has not changed: a
 * meaningful share of mail clients strip or mangle a styled anchor, and the
 * button is the only route in. Without the fallback those recipients are simply
 * lost, and they are lost silently.
 */
function callToAction(token: string): L1Node[] {
  return [
    {
      kind: 'text',
      text: 'Open',
      link: { href: `{{${token}}}` },
      padding: { topPx: 12, rightPx: 20, bottomPx: 12, leftPx: 20 },
      sizing: { width: { mode: 'hug' } },
      axes: {
        fontFamily: FAMILY,
        fontSizePx: 16,
        fontWeight: 600,
        color: PAPER,
        surfaceFill: ACCENT,
        borderRadiusPx: 6,
        textAlign: 'center',
        textDecoration: 'none',
      },
    } as L1Node,
    line('If that button does not work, copy the address below and paste it into your browser:', 14, {
      color: MUTED,
    }),
    line(`{{${token}}}`, 14, { color: MUTED }),
  ]
}

/**
 * A readable message, ready to be read and rewritten.
 *
 * `title` IS THE HEADING AND NOT THE SUBJECT. The subject lives on the page
 * (`page.email.subject`) because it is not painted and has no box; what goes at
 * the top of the copy is a heading, which is an ordinary text run an author will
 * change along with everything else.
 */
export function defaultEmailDocument(title: string, placeholders: readonly string[] = []): L1Document {
  const children: L1Node[] = [
    line(title, 24, { fontWeight: 700 }),
    line('Hello,', 16),
    line(
      'This is the message this form sends. Nobody has received it yet — it is ' +
        'here so it can be read and rewritten before anyone does.',
      16,
    ),
  ]
  for (const token of placeholders) {
    if (token === 'cta_url') children.push(...callToAction(token))
    else children.push(line(`{{${token}}}`, 16, { color: MUTED }))
  }
  children.push(line('Thank you.', 16))

  return {
    widths: [EMAIL_CANVAS_PX],
    background: '#f4f4f5',
    textColor: INK,
    root: {
      kind: 'container',
      layout: 'stack',
      gapPx: 16,
      padding: { topPx: 32, rightPx: 32, bottomPx: 32, leftPx: 32 },
      axes: { surfaceFill: PAPER },
      children,
    },
  } as L1Document
}
