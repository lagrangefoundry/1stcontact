import { describe, expect, it } from 'vitest'
import {
  LIBRARY_TEXT_PAGE,
  libraryOperations,
  type CatalogueItem,
  type LibraryDeps,
} from '../tools/generate/src/cli/ai/library-core'
import { storedImageOf } from '../apps/control-app/src/material'

/**
 * [[REQ-387]] — **`get_library_item` returns a document's own words, a page at a
 * time, only when asked**.
 *
 * The production operation over a doubled host: what is decided HERE — whether
 * the text is carried, how it is paged, what an item with no text answers — is
 * the surface's, and doubling the port is what lets each be asserted exactly. The
 * sibling `.workers` suite drives the real host, where the text is the real
 * `material_text` comment an upload wrote.
 */

function item(name: string, kind: string): CatalogueItem {
  const row = {
    uid: name,
    type: 'material',
    title: name,
    filename: `${name}.md`,
    kind,
    content_type: kind === 'document' ? 'text/markdown' : 'image/png',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/digest-1',
    edits: [],
    label: null,
    updated_at: '2026-10-04T00:00:00Z',
  }
  return { ...storedImageOf(row as never), ...row } as unknown as CatalogueItem
}

/** A document longer than two pages, whose last page says something the first does not. */
const LONG = `${'a'.repeat(LIBRARY_TEXT_PAGE)}${'b'.repeat(LIBRARY_TEXT_PAGE)}THE END`

function host(texts: Record<string, string | null>): LibraryDeps {
  const items = [item('material-doc', 'document'), item('material-pic', 'image')]
  return {
    slug: 'acme',
    list: async () => items,
    deleted: async () => [],
    read: async (name) => ({ ...items.find((i) => i.name === name)!, description: 'A short digest.' }),
    text: async (name) => texts[name] ?? null,
  } as LibraryDeps
}

type Row = Record<string, unknown>

describe('REQ-387 — a document read in pages', () => {
  it('test_UAT_FC_REQ-387_without_the_flag_the_answer_is_unchanged', async () => {
    const ops = libraryOperations(host({ 'material-doc': LONG }))
    const one = (await ops.get_library_item({ item: 'material-doc' })) as Row
    expect(one.description).toBe('A short digest.')
    for (const key of ['text', 'text_from', 'text_total', 'text_next']) expect(one).not.toHaveProperty(key)
  })

  it('test_UAT_FC_REQ-387_text_pages_through_the_whole_document_and_says_where_it_ends', async () => {
    const ops = libraryOperations(host({ 'material-doc': LONG }))
    const pages: string[] = []
    let from: number | null = 0
    let reads = 0
    while (from !== null) {
      const page = (await ops.get_library_item({ item: 'material-doc', text: true, from })) as Row
      expect(page.text_from).toBe(from)
      expect(page.text_total).toBe(LONG.length)
      expect((page.text as string).length).toBeLessThanOrEqual(LIBRARY_TEXT_PAGE)
      pages.push(page.text as string)
      from = page.text_next as number | null
      reads += 1
    }
    // Three pages, reassembled exactly: nothing cut, nothing repeated.
    expect(reads).toBe(3)
    expect(pages.join('')).toBe(LONG)
    expect(pages.at(-1)).toContain('THE END')
  })

  it('test_UAT_FC_REQ-387_an_item_with_no_text_answers_null_rather_than_its_digest', async () => {
    const ops = libraryOperations(host({ 'material-doc': LONG }))
    const pic = (await ops.get_library_item({ item: 'material-pic', text: true })) as Row
    expect(pic.text).toBeNull()
    expect(pic.text_next).toBeNull()
    expect(pic.text_total).toBe(0)
  })
})
