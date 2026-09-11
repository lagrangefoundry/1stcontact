/**
 * The Library name — one field, one meaning, both places (REQ-220).
 *
 * A GENERATED IMAGE ARRIVES UNDER A SENTENCE NOBODY CHOSE TO CALL IT. The
 * imagegen plugin titles its ticket from the prompt that made the picture
 * (`imagegen.ts`), and an upload is titled by whatever the describer wrote — so
 * the Library lists a client's own photographs under names none of them picked,
 * with no way to fix one. This is that fix.
 *
 * **IT IS THE TITLE, AND IT IS NOT THE FILENAME.** The Library lists a row under
 * `title` and falls back to `filename` only where there is no title, so the title
 * is what *"the name it appears under in the Library"* means. The filename is the
 * name the bytes arrived with, it is what the download link saves under, and the
 * rights block shows it read-only for the reason REQ-213 gives about that block.
 * Renaming a picture therefore changes what we call it and changes nothing about
 * the file — two different facts about one material, which a single control that
 * wrote both would quietly conflate.
 *
 * **ONE DESCRIPTOR, MOUNTED TWICE.** The detail pane and the modal are the same
 * field committed through the same call, because *editing it in either place
 * changes the same thing* is a claim about the code as much as about the screen.
 * Two descriptors that happen to agree today is exactly the drift this epic keeps
 * naming — and it is why this is a module rather than a few lines copied into
 * `library.js` and `image-editor.js`.
 *
 * `commit: 'auto'`, FOR THE REASON THE DESCRIPTION FIELD ALREADY GIVES. There is
 * one field and no other decision beside it, so a Save button would be a second
 * click to confirm the first — and `auto` reverts the control itself when the
 * origin refuses, which a hand-rolled Save would have to reimplement in both
 * places.
 */

import { mountFields } from '@lagrangefoundry/webui-fields'

/**
 * The one descriptor.
 *
 * `label` IS WHAT IT IS FOR, NOT WHAT IT IS. *Title* would be honest about the
 * record and useless on screen: the client is not thinking about tickets, they
 * are thinking about the word this picture is filed under.
 */
export const MATERIAL_NAME_FIELD = Object.freeze({
  name: 'title',
  label: 'Name in your Library',
  required: true,
})

/** Said when the box is emptied — the origin refuses it, and so does the copy. */
export const NAME_REQUIRED = 'Give it a name — this is what you will find it by.'

/**
 * Mount the name field.
 *
 * @param {Element} host
 * @param {object} spec
 * @param {string} spec.name          what it is called now
 * @param {(name: string) => Promise<object>} spec.save  the origin call
 * @param {(row: object) => void} [spec.onSaved]  told the row the origin returned
 * @returns {{setName: (name: string) => void, destroy: () => void, element: Element}}
 */
export function mountMaterialName(host, spec) {
  const { name, save, onSaved = () => {} } = spec
  const fields = mountFields(host, {
    schema: [MATERIAL_NAME_FIELD],
    values: { title: name ?? '' },
    layout: 'stacked',
    editable: ['title'],
    commit: 'auto',
    onCommit: async (changes) => {
      const next = String(changes.title ?? '').trim()
      // REFUSED HERE AS WELL AS AT THE ORIGIN, and the duplication is deliberate:
      // `auto` reverts the control when the commit throws, so throwing is how the
      // client gets their own word back instead of watching the box empty itself
      // and a request go out that the Worker will refuse anyway.
      if (next === '') throw new Error(NAME_REQUIRED)
      onSaved(await save(next))
    },
  })
  return {
    element: host,
    /**
     * Say what it is called now, from somewhere else.
     *
     * THIS IS THE OTHER HALF OF *"both places"*. Renaming in the modal has to
     * reach the pane behind it, and renaming in the pane has to reach a modal
     * that is open over it — otherwise the two agree only until somebody uses
     * one of them.
     */
    setName(next) {
      fields.setValues({ title: next ?? '' })
    },
    destroy: () => fields.destroy(),
  }
}
