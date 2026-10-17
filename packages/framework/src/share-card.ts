/**
 * The tab icon and the share card, as a published page's `<head>` carries them
 * ([[REQ-400]]).
 *
 * PRODUCER AND CONSUMER IN ONE FILE, on `turnstile.ts`'s reasoning. The page
 * renderer emits these tags; the serving Worker rewrites the share image's
 * address on the way out. A change to the markup that left the Worker matching a
 * tag that had moved would quietly ship cards with no picture, so both halves
 * live here.
 *
 * WHY THE SERVING WORKER TOUCHES THEM AT ALL. Every address a snapshot emits is
 * document-relative (REQ-109) so a published revision is relocatable under any
 * host and any prefix. A browser resolves `assets/logo.png` against the page; a
 * link-preview crawler does not, and a card whose `og:image` is relative shows
 * no picture. The absolute address is a fact about the REQUEST — which host the
 * page was asked for on, and a site can gain a domain long after a revision was
 * published — so it is stamped at serve time from the URL the page was fetched
 * at, exactly as the browser would have resolved it. The snapshot stays
 * relocatable and the card is right on every host the site is served from.
 *
 * NOTHING IS EMITTED FOR WHAT IS NOT SET. A site with no icon and no card gets a
 * head byte-identical to the one it had before this existed — no empty
 * `content=""`, no link to a file that is not there.
 *
 * EVERY VALUE IS A TYPED FIELD. The icon and the picture are asset NAMES
 * (`siteAssetNameSchema`), so the address is composed here and can only point
 * into the site's own `assets/`; titles and descriptions are text, escaped at
 * this sink like every other text the renderer writes.
 */

/** What one page's head says about its icon and its card. */
export interface ShareHead {
  /** The tab icon's asset name. */
  icon?: string
  /** The 180px home-screen icon's asset name. */
  appleTouchIcon?: string
  /**
   * The card, or absent for a page that has none. Present means the card is
   * emitted, with whichever of its parts are non-empty.
   */
  card?: {
    title: string
    description?: string
    image?: string
  }
}

/** The attributes the serving Worker absolutises. Read here, nowhere else. */
const IMAGE_META = ['property="og:image"', 'name="twitter:image"'] as const

/** The tags for one page, one per line, in the order a head conventionally has them. */
export function shareHeadTags(head: ShareHead): string[] {
  const tags: string[] = []
  if (head.icon) tags.push(`<link rel="icon" href="${assetHref(head.icon)}" />`)
  if (head.appleTouchIcon) {
    tags.push(`<link rel="apple-touch-icon" sizes="180x180" href="${assetHref(head.appleTouchIcon)}" />`)
  }
  const card = head.card
  if (!card) return tags
  const description = card.description?.trim() ?? ''
  tags.push('<meta property="og:type" content="website" />')
  if (card.title) tags.push(`<meta property="og:title" content="${escapeAttribute(card.title)}" />`)
  if (description) tags.push(`<meta property="og:description" content="${escapeAttribute(description)}" />`)
  if (card.image) tags.push(`<meta ${IMAGE_META[0]} content="${assetHref(card.image)}" />`)
  // A LARGE CARD ONLY WITH A PICTURE: `summary_large_image` with nothing to show
  // is a grey rectangle where the preview should be.
  tags.push(`<meta name="twitter:card" content="${card.image ? 'summary_large_image' : 'summary'}" />`)
  if (card.title) tags.push(`<meta name="twitter:title" content="${escapeAttribute(card.title)}" />`)
  if (description) tags.push(`<meta name="twitter:description" content="${escapeAttribute(description)}" />`)
  if (card.image) tags.push(`<meta ${IMAGE_META[1]} content="${assetHref(card.image)}" />`)
  return tags
}

/**
 * Make the share card's picture address absolute against the URL the page was
 * served at — the serving Worker's half (see the note at the top).
 *
 * ONLY A RELATIVE ADDRESS IS TOUCHED, so stamping twice is the identity, and a
 * page with no card is returned exactly as published.
 */
export function absolutizeShareImages(html: string, pageUrl: string): string {
  if (!IMAGE_META.some((attr) => html.includes(attr))) return html
  let out = html
  for (const attr of IMAGE_META) {
    const marker = `<meta ${attr} content="`
    out = out
      .split(marker)
      .map((part, i) => {
        if (i === 0) return part
        const end = part.indexOf('"')
        const value = part.slice(0, end)
        if (end === -1 || /^[a-z][a-z0-9+.-]*:/i.test(value)) return part
        // The value is an `assetHref`, so it needs no entity decoding: an asset
        // name is URL-safe by schema and was percent-encoded on the way in.
        return new URL(value, pageUrl).href + part.slice(end)
      })
      .join(marker)
  }
  return out
}

/** The document-relative address of a site asset (REQ-109). */
function assetHref(name: string): string {
  return `assets/${encodeURIComponent(name)}`
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
