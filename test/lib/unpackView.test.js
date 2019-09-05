const { unpackView } = require('../../lib/detectViews')

const modalTemplates = [`
body(class="modal")
  p Test paragraph
`, `
head
  title My Site
  script(src='/javascripts/jquery.js')
  script(src='/javascripts/app.js')
body(class="modal")
  p Test paragraph
`, `
body(
  some-attr="foo"
  onfocus="alert()"
  class="modal"
)
  p Test paragraph
`, `
body(class="big beautiful modal")
  p Test paragraph
`]

const nonModalTemplates = [`
body
  p Test paragraph
`, `
head
  title My Site
  script(src='/javascripts/jquery.js')
  script(src='/javascripts/app.js')
body
  p Test paragraph
`, `
body(
  some-attr="foo"
  onfocus="alert()"
)
  p Test paragraph
`, `
body(class="big somemodalmisdirection beautiful")
  p Test paragraph
`, `
body(class="big some-modal-misdirection beautiful")
  p Test paragraph
`, `
body(class="somemodalmisdirection")
  p Test paragraph
`, `
body(class="some-modal-misdirection")
  p Test paragraph
`]

describe('Aido library - View unpacking', () => {
  test('Modal templates - detect correctly', () => {
    modalTemplates.forEach(template => {
      const unpackedView = unpackView('testView', template)
      expect(unpackedView).toMatchObject({
        name: 'testView',
        modal: true,
        template,
      })
    })
  })

  test('Non modal templates - detect correctly', () => {
    nonModalTemplates.forEach(template => {
      const unpackedView = unpackView('testView', template)
      expect(unpackedView).toMatchObject({
        name: 'testView',
        modal: false,
        template,
      })
    })
  })
})
