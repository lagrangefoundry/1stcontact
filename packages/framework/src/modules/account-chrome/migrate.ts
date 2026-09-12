import type { L1Node } from '@1stcontact/site-schema'
import type { BehaviorInstance } from '../behavior'

/**
 * `account-chrome` v1 → v2 ([[BUG-85]], migrating [[BUG-76]]'s contract change).
 *
 * WHAT v2 BROKE, AND WHICH HALVES ARE MECHANICAL. Three of the four changes
 * need nothing from anybody: `labelMode` arrives with a default, `dismissLabel`
 * and the rest are untouched, and `config.account` — which no version ever
 * declared — is dropped by {@link ../upgrade.upgradeInstance} along with any
 * other undeclared key. The fourth is not mechanical at all: `sentMessage` was
 * a string the module painted into an invariant `<p>`, and v2 requires `sent`
 * to be an **authored L1 card**. The words survive the move; the card they sit
 * in did not exist in v1 and has to come from somewhere. `error` is worse — v2
 * requires it, and v1 stored nothing whatsoever to build it from, because the
 * error text was hardcoded in the component.
 *
 * That is why this file is hand-written and why {@link BehaviorMeta.migrations}
 * holds a function rather than a diff: there is no rule that derives a card
 * from a string, and no rule at all that derives a card from nothing.
 *
 * THE CARD IS CUT FROM THE INSTANCE'S OWN DIALOG, not from the L2 preset. The
 * obvious move is `accountChromePreset().sent`, and it is wrong for every site
 * that has ever been designed: the preset paints `#ffffff` at radius 8 because
 * it has no site to look at, so a migrated card would arrive in the preset's
 * clothes and sit next to a dialog in the author's. The dialog is the panel
 * this card replaces, on screen, in the same place — copying its fill, border,
 * radius, padding and measure is what makes the panel keep its shape when it
 * changes state, which is the property [[BUG-76]] Defect 4c was chasing when
 * it moved these words into slots in the first place.
 */

/**
 * The words shown when the request never reached the server.
 *
 * A CONSTANT BECAUSE v1 STORED NOTHING TO DERIVE IT FROM — the string was
 * hardcoded in the component (`component.ts:123` at `9ff59758e8`, the v1
 * commit), so there is nothing in any stored instance to read it out of. This
 * is the one place in the migration that invents content, and it is not
 * invented freely: it is **verbatim what v1 put on the screen**, which is the
 * only choice that keeps the upgrade a change to where the words are authored
 * rather than a change to what the visitor reads. v2's own preset uses the same
 * sentence, so a migrated card and a fresh one agree.
 *
 * An author who wants different words edits the slot afterwards — exactly the
 * freedom that moving this out of the component bought them, and what 1st
 * Contact's own site did during the BUG-85 repair. `accountChromeV1ToV2` only
 * authors a card where none exists, so that edit survives a re-run.
 */
const ERROR_TEXT = 'Could not reach the server. Please try again.'

/** Fall back to v2's own default when v1 held no `sentMessage` to carry. */
const SENT_FALLBACK = 'Check your email for a sign-in link.'

/** A container's paint-and-shape, or nothing when the source has none to lend. */
function borrow(dialog: L1Node | undefined): Pick<L1Node, 'axes' | 'padding' | 'sizing'> {
  if (dialog === undefined || Array.isArray(dialog)) return {}
  const { axes, padding, sizing } = dialog as Record<string, unknown>
  return {
    ...(axes === undefined ? {} : { axes: structuredClone(axes) }),
    ...(padding === undefined ? {} : { padding: structuredClone(padding) }),
    ...(sizing === undefined ? {} : { sizing: structuredClone(sizing) }),
  } as Pick<L1Node, 'axes' | 'padding' | 'sizing'>
}

/**
 * The colour the dialog gives its own text, so a migrated card is not the one
 * element on the panel painted in a default.
 *
 * Reads the first text run it finds rather than guessing: the dialog's prompt
 * is the nearest thing on screen to the sentence this card will hold.
 */
function borrowTextColor(dialog: L1Node | undefined): unknown {
  const stack: unknown[] = [dialog]
  while (stack.length > 0) {
    const node = stack.pop() as Record<string, unknown> | undefined
    if (node === undefined || node === null || typeof node !== 'object') continue
    if (node.kind === 'text') {
      const color = (node.axes as Record<string, unknown> | undefined)?.color
      if (color !== undefined) return color
    }
    if (Array.isArray(node.children)) stack.push(...node.children)
  }
  return undefined
}

/** One sentence in a card shaped like the dialog it replaces. */
function messageCard(text: string, dialog: L1Node | undefined): L1Node {
  const color = borrowTextColor(dialog)
  return {
    kind: 'container',
    layout: 'stack',
    gapPx: 12,
    ...borrow(dialog),
    children: [
      {
        kind: 'text',
        text,
        axes: {
          ...(color === undefined ? {} : { color }),
          fontSizePx: 15,
          lineHeightPx: 22,
        },
      },
    ],
  } as L1Node
}

/**
 * Carry a v1 instance to v2: the confirmation's words move from config into an
 * authored card, and the network-failure card is authored for the first time.
 *
 * `sentMessage` is deleted here rather than left for the undeclared-key sweep
 * so that this function reads as the whole of the contract change: the key is
 * not junk, it is a field whose content went somewhere, and the line that
 * removes it should sit beside the line that places it.
 */
export function accountChromeV1ToV2(prev: BehaviorInstance): BehaviorInstance {
  const { sentMessage, ...config } = prev.config as { sentMessage?: unknown } & Record<
    string,
    unknown
  >
  const dialog = prev.slots.dialog as L1Node | undefined
  const sentWords = typeof sentMessage === 'string' && sentMessage !== '' ? sentMessage : SENT_FALLBACK

  return {
    config,
    slots: {
      ...prev.slots,
      // Only authored where absent. Re-running an upgrade must not overwrite a
      // card the author has since drawn — and an instance can reach here
      // already holding one, because v1 refused neither undeclared slot.
      sent: prev.slots.sent ?? messageCard(sentWords, dialog),
      error: prev.slots.error ?? messageCard(ERROR_TEXT, dialog),
    },
  }
}
