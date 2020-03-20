const normalizeObject = require('../../lib/normalizeObject')

describe('Object normalizer', () => {
  it('should camelCase the keys of a simple object', () => {
    const input = {
      snakey_casey: 1,
      OldieCasie: 1,
      'kebabie-casie': 1,
      anaRchYcaSe: 1,
    }
    expect(normalizeObject(input)).toMatchObject({
      snakeyCasey: 1,
      oldieCasie: 1,
      kebabieCasie: 1,
      anaRchYcaSe: 1,
    })
  })

  it('should camelCase the keys of any children objects', () => {
    const input = {
      first_level: 1,
      first_child: { second_level: 2 },
      second_child: {
        second_level: 2,
        third_child: { 'third-level': 3 },
      },
    }
    expect(normalizeObject(input)).toMatchObject({
      firstLevel: 1,
      firstChild: { secondLevel: 2 },
      secondChild: {
        secondLevel: 2,
        thirdChild: { thirdLevel: 3 },
      },
    })
  })
})
