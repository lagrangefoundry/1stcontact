import { describe, expect, it } from 'vitest'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'

/**
 * BUG-45 — **the declared surface stops telling the assistant things that are false**.
 *
 * WHY THESE ARE ASSERTIONS ABOUT TEXT, AND WHAT THAT IS WORTH. The declaration is
 * projected verbatim into the assistant's manual ([[DOC-39]] §3.2), so what it
 * says IS what the assistant is told — but nothing mechanically stops a model
 * ignoring it. These prove the manual no longer contains the false claims that
 * produced the incident; they cannot prove obedience, and are not written as
 * though they do.
 *
 * WHAT THE INCIDENT WAS. A client dropped a logo on the chat and asked for it in
 * the hero. The assistant substituted a drawing and explained that the file had
 * to be "registered in the asset manager — that's done through the builder
 * interface, not through our chat". That reply was not invented: it is the
 * `absences` entry below, read back almost word for word, from a declaration
 * written before [[REQ-161]] wired the upload overlay and never revisited.
 */

interface Operation {
  op: string
  summary: string
  description?: string
}

interface Declaration {
  surface_version: number
  operations: Operation[]
  absences: Array<{ name: string; note: string }>
  param_types: Record<string, { description?: string }>
  shapes: Record<string, Record<string, string>>
}

const declaration = l1Surface as unknown as Declaration

function operation(op: string): Operation {
  const found = declaration.operations.find((o) => o.op === op)
  if (!found) throw new Error(`no operation '${op}' in the declaration`)
  return found
}

/** Everything the assistant is told about one operation, as one blob of prose. */
function prose(op: string): string {
  const o = operation(op)
  return `${o.summary}\n${o.description ?? ''}`
}

describe('BUG-45 — the surface no longer says a file cannot arrive through the chat', () => {
  it('test_UAT_FC_BUG-45_no_absence_claims_a_file_cannot_reach_the_site', () => {
    // THE SENTENCE THAT CAUSED IT. The old note read: "you cannot take a file
    // from a conversation and put it in the site … tell them adding a file is
    // done outside the chat." Since REQ-161 the overlay's first area does exactly
    // that, and the upload route promotes the bytes in the same request.
    const notes = declaration.absences.map((a) => `${a.name}\n${a.note}`).join('\n\n')

    expect(notes).not.toMatch(/cannot take a file from a conversation/i)
    expect(notes).not.toMatch(/outside the chat/i)
    // And nobody is DIRECTED to a second screen to do it — the specific
    // instruction the assistant followed when it told the client to go and
    // register the image themselves. Naming the asset manager is fine, and the
    // note does: what it may not do is send anyone there, so the check is on
    // the preposition that turns a mention into an errand.
    expect(notes).not.toMatch(/(?:through|via|in|from|using) the (?:asset manager|builder interface)/i)
  })

  it('test_UAT_FC_BUG-45_the_absence_says_to_ask_for_the_file_here', () => {
    // The absence is still an absence — the assistant genuinely cannot go and
    // FETCH a file — but the remedy it names has to be the one that works.
    const upload = declaration.absences.find((a) => /file/i.test(a.name))
    expect(upload).toBeDefined()
    const note = upload!.note

    // What it still cannot do.
    expect(note).toMatch(/cannot|not/i)
    // What the client can do instead, named precisely enough to be followed:
    // the drop area's own words, so the assistant asks for the thing the UI
    // actually offers rather than describing a gesture that does not exist.
    expect(note).toMatch(/drop/i)
    expect(note).toMatch(/Put it on the site/i)
  })

  it('test_UAT_FC_BUG-45_registration_is_never_described_as_permission', () => {
    // THE SECOND FALSE BELIEF. `asset_id` read "The REGISTERED name of an image
    // or font already in the site", and `get_asset` "one REGISTERED image or
    // font" — so an assistant that found an asset listed `(unregistered)` could
    // only conclude it was ineligible. Nothing consults the registry before a
    // page references an asset; every capture-folded page proves it.
    const assetId = declaration.param_types.asset_id.description ?? ''
    expect(assetId).not.toMatch(/^The registered name/i)

    const list = prose('list_assets')
    const get = prose('get_asset')

    // `get_asset` no longer advertises itself as registry-only.
    expect(get).not.toMatch(/one registered image or font/i)

    // And the listing says plainly that an unregistered asset is usable, since
    // that is the inference that has to be blocked rather than merely not made.
    expect(`${list}\n${declaration.shapes.asset_list.registered ?? ''}`).toMatch(
      /provenance|usable|not permission/i,
    )
  })

  it('test_UAT_FC_BUG-45_write_image_forbids_standing_in_for_a_supplied_file', () => {
    // THE THIRD FAILURE, AND THE ONE THE CLIENT ACTUALLY SAW. Having decided it
    // could not use their logo, the assistant drew a substitute and reported
    // completion. `write_image` warned it was "not a way to make a photograph"
    // but said nothing about standing in for a file that had been supplied.
    const write = prose('write_image')

    expect(write).toMatch(/never draw a stand-in|do not compose something similar/i)
    // It must name the remedy, not only the prohibition — a refusal with no
    // next move is how the original conversation dead-ended.
    expect(write).toMatch(/say so/i)
    expect(write).toMatch(/drop/i)
    // The older constraint is not lost in the rewrite.
    expect(write).toMatch(/not a way to make a photograph/i)
  })

  it('test_UAT_FC_BUG-45_the_surface_version_moved_with_the_surface', () => {
    // `get_asset` returns a different shape and an absence inverted its meaning.
    // A consumer that recorded which surface it was written against (DOC-30 R6)
    // is entitled to see that number change.
    expect(declaration.surface_version).toBeGreaterThan(4)
  })
})
