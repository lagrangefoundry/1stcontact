import type { L1Node } from '@1stcontact/site-schema'

/**
 * L2 — a **vetted L1 design** for `account-chrome` ([[DOC-24]], [[REQ-200]]).
 *
 * The module paints nothing, which is what makes placement and look entirely
 * L1's; the cost is that a site would otherwise have to author four subtrees
 * before it could show a Sign In link at all. This is the starting point that
 * removes that cost: ordinary L1, so an author edits, replaces, or ignores it
 * exactly as they would any other subtree — the same move `contact-form`'s
 * preset already made.
 *
 * IT IS A ROW OF LINKS AND A SMALL PANEL, and deliberately nothing more. The
 * chrome sits in somebody else's header; a preset that arrived with its own
 * background, border and rhythm would fight every site it landed on.
 */

/** Overrides for the preset's few design constants. */
export interface AccountChromePresetOptions {
  /** Control text colour. */
  color?: string
  /** The dialog panel's fill. */
  panelFill?: string
  /** Field and panel corner rounding. */
  radiusPx?: number
  /** Field border colour. */
  borderColor?: string
  /** Submit button fill. */
  submitFill?: string
  /** Submit button label colour. */
  submitColor?: string
}

const DEFAULTS = {
  color: '#0f172b',
  panelFill: '#ffffff',
  radiusPx: 8,
  borderColor: '#e5e7eb',
  submitFill: '#0f172b',
  submitColor: '#ffffff',
} satisfies Required<AccountChromePresetOptions>

function link(control: string, o: Required<AccountChromePresetOptions>): L1Node {
  return {
    kind: 'control',
    control,
    axes: { color: o.color, fontSizePx: 15, fontWeight: 500 },
    padding: { topPx: 8, rightPx: 12, bottomPx: 8, leftPx: 12 },
    sizing: { width: { mode: 'hug' } },
    interaction: {
      transition: { durationMs: 120, easing: 'ease-out' },
      hover: { opacity: 0.7 },
      focus: { ring: { widthPx: 2, color: o.submitFill, offsetPx: 2 } },
    },
  }
}

/**
 * A vetted default for every slot of an `account-chrome` instance.
 *
 * Flowed rather than keyframed — a preset has no capture behind it, so it has no
 * per-width geometry to pin and lays itself out from sizing and gaps like any
 * hand-authored L1.
 */
export function accountChromePreset(
  opts: AccountChromePresetOptions = {},
): Record<string, L1Node> {
  const o = { ...DEFAULTS, ...opts }
  return {
    signedOut: link('signIn', o),
    signedIn: link('portal', o),
    businesses: link('businesses', o),
    dialog: {
      kind: 'container',
      layout: 'stack',
      gapPx: 12,
      axes: { surfaceFill: o.panelFill, borderRadiusPx: o.radiusPx },
      padding: { topPx: 24, rightPx: 24, bottomPx: 24, leftPx: 24 },
      sizing: { width: { mode: 'fluid', maxPx: 380 } },
      children: [
        {
          kind: 'control',
          control: 'email',
          axes: {
            color: o.color,
            fontSizePx: 16,
            surfaceFill: '#ffffff',
            borderRadiusPx: o.radiusPx,
            border: { widthPx: 1, color: o.borderColor },
          },
          padding: { topPx: 12, rightPx: 12, bottomPx: 12, leftPx: 12 },
          sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 44 } },
          interaction: {
            transition: { durationMs: 120, easing: 'ease-out' },
            hover: { border: { widthPx: 1, color: o.color } },
            focus: { ring: { widthPx: 2, color: o.submitFill, offsetPx: 2 } },
          },
        },
        {
          kind: 'control',
          control: 'submit',
          axes: {
            color: o.submitColor,
            fontSizePx: 16,
            fontWeight: 600,
            textAlign: 'center',
            surfaceFill: o.submitFill,
            borderRadiusPx: o.radiusPx,
          },
          padding: { topPx: 12, rightPx: 24, bottomPx: 12, leftPx: 24 },
          sizing: { width: { mode: 'fluid' } },
          interaction: {
            transition: { durationMs: 120, easing: 'ease-out' },
            hover: { opacity: 0.9 },
            focus: { ring: { widthPx: 2, color: o.submitFill, offsetPx: 2 } },
          },
        },
        {
          kind: 'control',
          control: 'dismiss',
          axes: { color: o.color, fontSizePx: 14, textAlign: 'center' },
          padding: { topPx: 8, rightPx: 8, bottomPx: 8, leftPx: 8 },
          sizing: { width: { mode: 'fluid' } },
          interaction: {
            transition: { durationMs: 120, easing: 'ease-out' },
            hover: { opacity: 0.7 },
            focus: { ring: { widthPx: 2, color: o.submitFill, offsetPx: 2 } },
          },
        },
      ],
    },
  }
}
