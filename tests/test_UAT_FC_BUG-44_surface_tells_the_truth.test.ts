import { describe, expect, it } from 'vitest'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'

/**
 * BUG-44 — **the declared surface stops telling the assistant things that are false**.
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
 *
 * BUG-45 answered the second of those beliefs by explaining registration as
 * provenance rather than permission. BUG-44 removed the registry it explained,
 * so the assertion below inverted: the manual must not describe registration at
 * all, because there is nothing left to describe and a surviving mention could
 * only be describing something the tools no longer have.
 */

interface Operation {
  op: string
  summary: string
  description?: string
  params?: Record<string, unknown>
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

describe('BUG-44 — the surface no longer says a file cannot arrive through the chat', () => {
  it('test_UAT_FC_BUG-44_no_absence_claims_a_file_cannot_reach_the_site', () => {
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

  it('test_UAT_FC_BUG-44_the_absence_says_to_ask_for_the_file_here', () => {
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

  it('test_UAT_FC_BUG-44_registration_is_not_described_at_all', () => {
    // THE SECOND FALSE BELIEF, AND ITS FINAL ANSWER. `asset_id` read "The
    // REGISTERED name of an image or font already in the site", and `get_asset`
    // "one REGISTERED image or font" — so an assistant that found an asset listed
    // `(unregistered)` could only conclude it was ineligible. BUG-45 reframed the
    // word; BUG-44 removed the thing. A manual that still explained registration
    // would be explaining a distinction no tool can now report, which is a worse
    // failure than the original: the assistant would look for a flag that is not
    // in any answer and have to guess what its absence meant.
    const everything = JSON.stringify(declaration)
    expect(everything).not.toMatch(/registered/i)
    expect(everything).not.toMatch(/registry|registration/i)

    // The two descriptions that carried the claim now say what is true instead.
    expect(declaration.param_types.asset_id.description ?? '').not.toMatch(/^The registered name/i)
    expect(prose('get_asset')).not.toMatch(/one registered image or font/i)
    // And the listing says plainly that everything it reports may be used, since
    // that is the inference that has to be blocked rather than merely not made.
    expect(prose('list_assets')).toMatch(/every one of them may be referenced/i)
  })

  it('test_UAT_FC_BUG-44_alt_text_belongs_to_the_element_not_the_file', () => {
    // WHAT THE DELETION COST, AND WHERE THE MANUAL HAS TO POINT INSTEAD. The
    // registry was the only place a site could hold alt text for a file, so a
    // promoted upload no longer arrives carrying the description ingestion wrote
    // for it. That description still exists — on the material the file came from
    // — and the assistant has to be told to go and get it, or the accessible
    // name for every client photograph silently becomes empty.
    expect(operation('write_image').params ?? {}).not.toHaveProperty('alt')
    expect(operation('add_asset').params ?? {}).not.toHaveProperty('alt')

    const upload = declaration.absences.find((a) => /file/i.test(a.name))!.note
    expect(upload).toMatch(/description/i)
    expect(upload).toMatch(/element/i)

    // A drawing has no description of its own either, and is told the same thing.
    expect(prose('write_image')).toMatch(/element that places it/i)
  })

  it('test_UAT_FC_BUG-44_write_image_forbids_standing_in_for_a_supplied_file', () => {
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

  it('test_UAT_FC_BUG-44_the_surface_version_moved_with_the_surface', () => {
    // Two shapes lost a field, `write_image` lost a parameter and an absence
    // inverted its meaning. A consumer that recorded which surface it was
    // written against (DOC-30 R6) is entitled to see that number change.
    expect(declaration.surface_version).toBeGreaterThan(5)
  })
})
