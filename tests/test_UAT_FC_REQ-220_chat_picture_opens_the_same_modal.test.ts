// @vitest-environment jsdom
/**
 * REQ-220 — **the picture in the chat is the picture in the Library**.
 *
 * WHAT THIS FILE PROVES. The ticket says the modal is *"opened from the Library's
 * detail pane and from the picture in the chat, which is the same picture and
 * must go to the same place."* The pane's half is proved beside this; this is the
 * chat's half, and the contract that makes it possible at all.
 *
 * WHY THE CONTRACT IS THE INTERESTING PART. `mountChat` writes each turn's
 * markdown straight into a message element and publishes no per-node hook, so
 * what reaches the DOM is an `<img>` carrying a URL and nothing else. Opening the
 * editor from it means reading the material back OUT of that URL — which makes
 * the address a real contract between whatever writes the line and the surface
 * that reads it, and `materialUidFromUrl` is that contract written once, beside
 * the function that forms the address.
 *
 * THE CLAIMS:
 *
 *  1. THE ADDRESS ROUND-TRIPS. What `materialFileUrl` forms, `materialUidFromUrl`
 *     reads back — relative or absolute, because a browser resolves an `<img
 *     src>` against the document before anyone reads it off the element.
 *  2. A PICTURE FROM ANYWHERE ELSE STAYS A PICTURE IN A CONVERSATION, and a
 *     capture's member is declined rather than resolved to something the editor
 *     would have to refuse.
 *  3. CLICKING A PICTURE IN THE TRANSCRIPT REPORTS IT, through a listener
 *     delegated at the pane's root — so it works for a turn replayed on reload as
 *     well as for one that has just arrived.
 *  4. AND THE PANE STILL KNOWS NOTHING ABOUT MATERIALS. It reports the address;
 *     deciding what that address names is the host's.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import {
  materialFileUrl,
  materialUidFromUrl,
} from '../apps/control-app/src/builder/api.js'

let createChatPanel: (opts?: Record<string, unknown>) => {
  element: HTMLElement
  setSession: (session: unknown, key?: string) => void
}
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`REQ-220 chat suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeAll(async () => {
  if (!WEBUI_INSTALLED) return
  ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
  ;({ setSanitizer, setParser } = await import('../apps/control-app/src/builder/markdown.js'))
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

describe('REQ-220 — the address is the contract', () => {
  it('test_UAT_FC_REQ-220_the_material_a_picture_in_the_conversation_names_is_read_back_off_its_own_url', () => {
    // ROUND-TRIP, THROUGH THE ONE PAIR OF FUNCTIONS. Two places that each knew
    // the shape is how the tool that writes the line and the surface that reads
    // it come to disagree about it.
    expect(materialUidFromUrl(materialFileUrl('made-one'))).toBe('made-one')

    // ABSOLUTE AS WELL AS RELATIVE: the string written into the markdown and the
    // string read off the element are not the same string, and only one of them
    // has an origin on the front.
    expect(materialUidFromUrl(`https://app.test${materialFileUrl('made-one')}`)).toBe('made-one')

    // A uid with awkward characters survives the encoding both ways.
    expect(materialUidFromUrl(materialFileUrl('a b/c'))).toBe('a b/c')
  })

  it('test_UAT_FC_REQ-220_a_picture_from_anywhere_else_in_the_world_is_not_a_material', () => {
    // Which is fine, and is not something this product can open.
    expect(materialUidFromUrl('https://example.com/photo.jpg')).toBeNull()
    expect(materialUidFromUrl('/api/material/item?uid=made-one')).toBeNull()
    expect(materialUidFromUrl('')).toBeNull()
    expect(materialUidFromUrl(null)).toBeNull()

    // A CAPTURE'S MEMBER IS DECLINED HERE rather than resolved to a uid the
    // editor would then have to refuse (REQ-166): a capture is not a picture the
    // client made, and the refusal belongs before the dialog opens.
    expect(materialUidFromUrl(materialFileUrl('their-old-site', 'screenshot.full.png'))).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-220 — clicking the picture in the chat', () => {
  /** The engines, so a markdown image is an `<img>` rather than escaped source. */
  function installEngines() {
    setParser({
      parse: (md: string) =>
        md.replace(/!\[(.*?)\]\((.*?)\)/g, '<p><img alt="$1" src="$2"></p>'),
      parseInline: (md: string) => md,
    })
    setSanitizer((html: string) => html)
  }

  it('test_UAT_FC_REQ-220_a_picture_in_a_replayed_turn_reports_its_own_address_when_it_is_clicked', async () => {
    installEngines()
    const seen: Array<{ src: string; alt: string }> = []
    const chat = createChatPanel({
      transport: { streamPrompt: async () => {} },
      onImageClick: (src: string, alt: string) => seen.push({ src, alt }),
    })
    root.append(chat.element)

    // A TURN FROM THE TRANSCRIPT, which is the case that matters: the picture
    // survives a page reload because it is markdown in the assistant's own turn,
    // and a listener bound per message as one arrived would miss every replayed
    // one.
    chat.setSession({
      sessionId: 'site-bakery',
      turns: [
        {
          role: 'assistant',
          markdown: `Here it is.\n\n![The bakery](${materialFileUrl('made-one')})`,
        },
      ],
      ready: true,
    })
    await settle()

    const img = chat.element.querySelector('img') as HTMLImageElement
    expect(img).toBeTruthy()
    img.click()
    await settle()

    expect(seen).toHaveLength(1)
    // REPORTED AS THE TURN WROTE IT. `getAttribute` rather than `.src`, so the
    // host is not handed an absolute URL for a line that said something relative
    // and then made to undo the resolution.
    expect(seen[0].src).toBe(materialFileUrl('made-one'))
    expect(seen[0].alt).toBe('The bakery')
    // AND THE UID THE HOST WILL RESOLVE IS THE MATERIAL — the same picture, going
    // to the same place as the Library's detail pane sends it.
    expect(materialUidFromUrl(seen[0].src)).toBe('made-one')
  })

  it('test_UAT_FC_REQ-220_a_pane_mounted_without_the_option_behaves_exactly_as_it_did_before', async () => {
    installEngines()
    // The seam is bound only where a host asked for it, so every existing caller
    // — and every suite that mounts this pane to assert something else — is
    // untouched by its existence.
    const chat = createChatPanel({ transport: { streamPrompt: async () => {} } })
    root.append(chat.element)
    chat.setSession({
      sessionId: 'site-bakery',
      turns: [{ role: 'assistant', markdown: `![x](${materialFileUrl('made-one')})` }],
      ready: true,
    })
    await settle()
    expect(() => (chat.element.querySelector('img') as HTMLImageElement).click()).not.toThrow()
  })
})
