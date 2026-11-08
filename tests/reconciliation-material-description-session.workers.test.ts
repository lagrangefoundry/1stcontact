import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { sessionImageDescriber, sessionTextDescriber } from '../apps/control-app/src/ai'
import {
  describe as describeMaterial,
  DOCUMENT_DIGEST_SYSTEM,
  IMAGE_DIGEST_SYSTEM,
} from '../apps/control-app/src/describe'
import { ingestUpload } from '../apps/control-app/src/material'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { bytesOf } from './support/material-fixtures'
import { says, scriptedClient, type ModelRequest } from './support/scripted-model-client'

/**
 * Reconciliation UATs for story-4cabde9a (STORY-141), plan item 4 of BUNDLE-40:
 * **REQ-207 — the image describer becomes a session on the AI host**, beside the
 * document describer REQ-173 already put there.
 *
 * Two criteria move here:
 *   - AC-2097 (modified): describing a document OR AN IMAGE opens one tool-less,
 *     unprimed session per item, leaves no conversation record, is closed after,
 *     and an image goes on the wire as an image content block beside the
 *     instruction, image first.
 *   - AC-2378 (new): the two describers are separately registered on the host,
 *     so whichever was built last, neither answers under the other's instruction.
 *
 * THE ONE DOUBLE IS THE NETWORK. `scriptedClient` is the Anthropic client the AI
 * library's backend is written to have injected; the session manager, role,
 * junction, archive, D1 and R2 are all real.
 */

const APPLIED = applySchema()

function storeFor(tenant: string): Promise<TicketStore> {
  return ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket, TENANT_ID: tenant })
}

/** Flatten a request's system content to its text. */
function systemText(req: ModelRequest): string {
  const system: unknown = req.system
  if (typeof system === 'string') return system
  if (!Array.isArray(system)) return ''
  return system
    .map((block: unknown) =>
      typeof block === 'string'
        ? block
        : block && typeof block === 'object' && 'text' in block
          ? String((block as { text: unknown }).text ?? '')
          : '',
    )
    .join('\n')
}

type Block = { type: string; [k: string]: unknown }

/** The content blocks of the request's user message ([] when it is a plain string). */
function userBlocks(req: ModelRequest): Block[] {
  const user = req.messages.find((m) => m.role === 'user')
  return Array.isArray(user?.content) ? (user.content as Block[]) : []
}

function hasImageBlock(req: ModelRequest): boolean {
  return JSON.stringify(req.messages).includes('"type":"image"')
}

const PNG_A_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const PNG_B_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

function decode(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

const PNG_A = decode(PNG_A_B64)
const PNG_B = decode(PNG_B_B64)

beforeAll(async () => {
  await APPLIED
})

describe('story-4cabde9a — describer sessions on the AI host (REQ-207)', () => {
  it('test_UAT_AC2097_documents_and_images_are_each_described_in_their_own_toolless_unprimed_session', async () => {
    const tenant = 'story4cabde9a-describer-sessions'
    const store = await storeFor(tenant)

    // ── Documents: two in turn, through the real ingestion ──
    const docs = scriptedClient([says('A supplier note for a bakery.'), says('A farm price list.')])
    const describeText = sessionTextDescriber('sk-not-a-real-key', { client: docs })
    // ── Images: two different pictures in turn, through the real ingestion ──
    const images = scriptedClient([
      says('Kitchen at dusk\n\nA galley kitchen under the pass light.'),
      says('Bread on a rack\n\nLoaves cooling on a wire rack.'),
    ])
    const describeImage = sessionImageDescriber('sk-not-a-real-key', { client: images })

    const firstDoc = await ingestUpload(
      store,
      {
        bytes: bytesOf('# Mill note\n\nThe stoneground rye comes from Bennett Mill.'),
        filename: 'mill.md',
        contentType: 'text/markdown',
      },
      { describeText, describeImage },
    )
    await ingestUpload(
      store,
      {
        bytes: bytesOf('# Farm list\n\nThe oats come from Calder Farm.'),
        filename: 'farm.md',
        contentType: 'text/markdown',
      },
      { describeText, describeImage },
    )
    const firstImage = await ingestUpload(
      store,
      { bytes: PNG_A, filename: 'IMG_4821.png', contentType: 'image/png' },
      { describeText, describeImage },
    )
    await ingestUpload(
      store,
      { bytes: PNG_B, filename: 'IMG_4822.png', contentType: 'image/png' },
      { describeText, describeImage },
    )

    // One request per item, each to the describer for its kind.
    expect(docs.seen).toHaveLength(2)
    expect(images.seen).toHaveLength(2)

    // NO TOOLS, and the kind's digest instruction is the ONLY system content.
    for (const req of docs.seen) {
      expect(req.tools ?? []).toEqual([])
      expect(systemText(req).trim()).toBe(DOCUMENT_DIGEST_SYSTEM.trim())
    }
    for (const req of images.seen) {
      expect(req.tools ?? []).toEqual([])
      expect(systemText(req).trim()).toBe(IMAGE_DIGEST_SYSTEM.trim())
    }

    // A document goes as the text of the request; the second carries none of the first.
    expect(JSON.stringify(docs.seen[0].messages)).toContain('Bennett Mill')
    const secondDoc = JSON.stringify(docs.seen[1].messages)
    expect(secondDoc).toContain('Calder Farm')
    expect(secondDoc).not.toContain('Bennett Mill')
    expect(secondDoc).not.toContain('supplier note')
    expect(hasImageBlock(docs.seen[0])).toBe(false)

    // An image goes as an image block carrying the uploaded bytes, image FIRST,
    // with one instruction line after it.
    const expected = [
      { b64: PNG_A_B64, req: images.seen[0] },
      { b64: PNG_B_B64, req: images.seen[1] },
    ]
    for (const { b64, req } of expected) {
      const blocks = userBlocks(req)
      expect(blocks[0].type).toBe('image')
      const image = JSON.stringify(blocks[0])
      expect(image).toContain(b64)
      expect(image).toContain('image/png')
      const texts = blocks.filter((b) => b.type === 'text')
      expect(texts).toHaveLength(1)
      expect(blocks[blocks.length - 1].type).toBe('text')
      expect(blocks.filter((b) => b.type === 'image')).toHaveLength(1)
    }
    // The second image's request carries none of the first image or its answer.
    const secondImage = JSON.stringify(images.seen[1].messages)
    expect(secondImage).not.toContain(PNG_A_B64)
    expect(secondImage).not.toContain('Kitchen at dusk')

    // The describer reports the model that answered, and that is what is recorded.
    expect(firstImage.description.status).toBe('ok')
    expect(firstImage.description.title).toBe('Kitchen at dusk')
    const imageModel = String(firstImage.description.describer)
    expect(imageModel).toMatch(/\S/)
    const reader = await storeFor(tenant)
    const { ticket: imageTicket } = await reader.get({ uid: firstImage.ticket.uid })
    expect(imageTicket.fields.description_model).toBe(imageModel)
    const { ticket: docTicket } = await reader.get({ uid: firstDoc.ticket.uid })
    expect(String(docTicket.fields.description_model)).toMatch(/^\S.* \(text-decode\)$/)

    // NO CONVERSATION RECORD: four descriptions created no chat ticket.
    const { tickets: chats } = await reader.query({ predicate: 'type=chat', limit: 'all' })
    expect(chats).toHaveLength(0)

    // CLOSED ON THE FAILING PATH, for both kinds: the failure rejects, and a fresh
    // session afterwards answers cleanly, carrying nothing of the failed one.
    for (const kind of ['document', 'image'] as const) {
      let calls = 0
      const flaky = scriptedClient([
        (req) => {
          calls += 1
          if (calls === 1) throw new Error(`upstream refused the ${kind}`)
          return says('Recovered\n\nA description.')(req)
        },
      ])
      const run =
        kind === 'document'
          ? (n: number) =>
              sessionTextDescriber('sk-not-a-real-key', { client: flaky })(`Document number ${n}.`)
          : (() => {
              const d = sessionImageDescriber('sk-not-a-real-key', { client: flaky })
              return (n: number) => d(n === 1 ? PNG_A : PNG_B, 'image/png')
            })()
      await expect(run(1)).rejects.toThrow(new RegExp(`upstream refused the ${kind}`))
      const recovered = await run(2)
      expect(recovered.text).toContain('Recovered')
      expect(flaky.seen).toHaveLength(2)
      const second = JSON.stringify(flaky.seen[1].messages)
      expect(second).not.toContain('Document number 1.')
      expect(second).not.toContain(PNG_A_B64)
    }

    // The failure surfaces to the description step rather than being swallowed.
    const failing = scriptedClient([
      () => {
        throw new Error('vision model unavailable')
      },
    ])
    const failed = await describeMaterial(
      { bytes: PNG_A, kind: 'image', contentType: 'image/png', filename: 'x.png' },
      { describeImage: sessionImageDescriber('sk-not-a-real-key', { client: failing }) },
    )
    expect(failed.status).toBe('failed')
    expect(failed.body).toContain('vision model unavailable')
  })

  it('test_UAT_AC2378_image_and_document_describers_never_answer_for_each_other_in_either_build_order', async () => {
    for (const order of ['text-then-image', 'image-then-text'] as const) {
      const documents = scriptedClient([says('A document answer.')])
      const images = scriptedClient([says('Image title\n\nAn image answer.')])

      let describeText: ReturnType<typeof sessionTextDescriber>
      let describeImage: ReturnType<typeof sessionImageDescriber>
      if (order === 'text-then-image') {
        describeText = sessionTextDescriber('sk-not-a-real-key', { client: documents })
        describeImage = sessionImageDescriber('sk-not-a-real-key', { client: images })
      } else {
        describeImage = sessionImageDescriber('sk-not-a-real-key', { client: images })
        describeText = sessionTextDescriber('sk-not-a-real-key', { client: documents })
      }

      const document = await describeMaterial(
        {
          bytes: bytesOf('# Mill note\n\nThe rye comes from Bennett Mill.'),
          kind: 'document',
          contentType: 'text/markdown',
          filename: 'mill.md',
        },
        { describeText, describeImage },
      )
      const image = await describeMaterial(
        { bytes: PNG_A, kind: 'image', contentType: 'image/png', filename: 'IMG_4821.png' },
        { describeText, describeImage },
      )

      // Each answered through its own describer, and only its own.
      expect(document.status, order).toBe('ok')
      expect(document.body, order).toBe('A document answer.')
      expect(image.status, order).toBe('ok')
      expect(image.body, order).toContain('An image answer.')
      expect(documents.seen, order).toHaveLength(1)
      expect(images.seen, order).toHaveLength(1)

      // The document request: document-digest instruction, no image block.
      const docReq = documents.seen[0]
      expect(systemText(docReq).trim(), order).toBe(DOCUMENT_DIGEST_SYSTEM.trim())
      expect(systemText(docReq), order).not.toContain(IMAGE_DIGEST_SYSTEM.trim())
      expect(hasImageBlock(docReq), order).toBe(false)

      // The image request: image-digest instruction, carrying the image block.
      const imageReq = images.seen[0]
      expect(systemText(imageReq).trim(), order).toBe(IMAGE_DIGEST_SYSTEM.trim())
      expect(systemText(imageReq), order).not.toContain(DOCUMENT_DIGEST_SYSTEM.trim())
      expect(hasImageBlock(imageReq), order).toBe(true)
      expect(JSON.stringify(userBlocks(imageReq)[0]), order).toContain(PNG_A_B64)
    }
  })
})
