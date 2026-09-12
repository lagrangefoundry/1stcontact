/**
 * Clearing a list-detail host means the DETAIL goes too ([[BUG-89]]).
 *
 * THE ROWS AND THE DETAIL ARE TWO SEPARATE THINGS INSIDE THE COMPONENT, and that
 * is the whole bug. In `no-tab` mode `mountListDetail` holds the open detail as a
 * record in a map keyed by the item, independent of the item list, so
 * `setItems([])` re-renders the list pane and does not touch the detail body: the
 * rows go and the rendered pane stays exactly as it was. On a business switch
 * that is the previous business's contact still on screen under a switcher naming
 * another — nothing leaked on the wire, but a pane asserting that a contact
 * belongs to the business currently open when it does not, which an operator
 * cannot tell apart from a leak ([[DOC-40]] §2.1, [[DOC-42]]).
 *
 * ONE FUNCTION RATHER THAN THE SAME THREE LINES IN EVERY PANEL. The Contacts pane
 * and the Library both got it wrong in exactly the same shape, each having
 * written down the promise it then kept only for the list, and the next panel to
 * mount a list-detail inherits the same trap. Single-sourced, the rule is one
 * thing to state and one thing to hold.
 *
 * THROUGH THE COMPONENT'S OWN PUBLIC SURFACE and not around it. Closing the
 * active detail is already defined to destroy the record and put `emptyDetail`
 * back, which is exactly the wanted end state — so this needs nothing added to
 * the out-of-repo primitive, and cannot drift from what that primitive does with
 * a detail the operator closes by hand.
 *
 * THE SELECTION GOES WITH IT. A selected key is a pointer into a list that no
 * longer exists, and left standing it makes `getSelectedKey()` name a row nobody
 * can see.
 *
 * @param {{ getActiveTab: () => unknown, closeTab: (key: unknown) => void, select: (key: unknown) => void }} listDetail
 */
export function clearDetail(listDetail) {
  if (!listDetail) return
  const open = listDetail.getActiveTab()
  if (open != null) listDetail.closeTab(open)
  listDetail.select(null)
}
