import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { imagesHeicConverter, type ImagesLike } from '../apps/control-app/src/heic'

/**
 * STORY-6ccaedd5 (ingestion), reconciled for REQ-221 — **the image converter
 * binding is declared once, under the same name, on both sides**.
 *
 * THE PARSER IS THE ONE WRANGLER ITSELF USES. A line-based reader cannot see a
 * table declared twice; a real TOML parser refuses the document, exactly as the
 * deployment tool would. `smol-toml` is resolved through the control app's own
 * `wrangler` dependency so this file needs no dependency of its own and parses
 * with the same library that will load the file at deploy time.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const APP = path.join(REPO, 'apps', 'control-app')
const WRANGLER = path.join(APP, 'wrangler.toml')

function wranglersTomlParser(): (text: string) => Record<string, unknown> {
  const fromApp = createRequire(path.join(APP, 'package.json'))
  const fromWrangler = createRequire(fromApp.resolve('wrangler/package.json'))
  return (fromWrangler('smol-toml') as { parse: (t: string) => Record<string, unknown> }).parse
}

describe('STORY-6ccaedd5 — the image converter binding (REQ-221)', () => {
  it('test_UAT_AC2537_the_images_binding_is_declared_once_under_the_same_name_locally_and_in_production', () => {
    const parse = wranglersTomlParser()
    const text = readFileSync(WRANGLER, 'utf8')

    // A table declared twice makes the document invalid, and this throws.
    let config: Record<string, unknown> = {}
    expect(() => {
      config = parse(text)
    }, 'wrangler.toml must be a valid TOML document (no table declared twice)').not.toThrow()

    // Top level (local development) declares IMAGES.
    const topLevel = config.images as { binding?: string } | undefined
    expect(topLevel?.binding).toBe('IMAGES')

    // Production inherits no bindings, so it must declare the same name itself.
    const envs = config.env as Record<string, { images?: { binding?: string } }> | undefined
    expect(envs?.production?.images?.binding).toBe('IMAGES')

  })

  it('test_UAT_AC2537_the_converter_is_built_from_the_binding_under_the_declared_name', async () => {
    // BEHAVIOUR, NOT SOURCE TEXT: an environment holding a binding under the
    // name the configuration declares yields a converter that calls that binding;
    // the same environment without it yields none — the "this deployment cannot
    // convert" state the upload route answers with its no-binding refusal
    // (AC-2534 drives that refusal through the route itself).
    const parse = wranglersTomlParser()
    const config = parse(readFileSync(WRANGLER, 'utf8'))
    const declared = (config.images as { binding: string }).binding
    const production = (config.env as Record<string, { images: { binding: string } }>).production.images.binding
    expect(production).toBe(declared)

    const calls: Array<{ format: string }> = []
    const JPEG = new TextEncoder().encode('jpeg bytes from the binding')
    const fakeImages: ImagesLike = {
      input: () => ({
        output: async (options) => {
          calls.push({ format: options.format })
          return {
            image: () =>
              new ReadableStream<Uint8Array>({
                start(controller) {
                  controller.enqueue(JPEG)
                  controller.close()
                },
              }),
            contentType: () => 'image/jpeg',
          }
        },
      }),
    }

    // Under the declared name: a converter, and it is the binding that converts.
    const converter = imagesHeicConverter({ [declared]: fakeImages } as { IMAGES?: ImagesLike })
    expect(converter, `a binding under '${declared}' yields a converter`).not.toBeNull()
    const converted = await converter!({ bytes: new Uint8Array([1, 2, 3]), filename: 'shopfront.HEIC' })
    expect(calls).toEqual([{ format: 'image/jpeg' }])
    expect(converted.bytes).toEqual(JPEG)
    expect(converted.filename).toBe('shopfront.jpg')
    expect(converted.contentType).toBe('image/jpeg')

    // No binding under that name — none at all, or one under some other name —
    // and there is no converter.
    expect(imagesHeicConverter({})).toBeNull()
    expect(
      imagesHeicConverter({ [`${declared}_ELSEWHERE`]: fakeImages } as { IMAGES?: ImagesLike }),
    ).toBeNull()
  })
})
