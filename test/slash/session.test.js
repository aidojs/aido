const fs = require('fs')
const sinon = require('sinon')

const Slash = require('../../lib/slash')
const databaseFactory = require('../../lib/database')

describe('Slash class - Session management', () => {
  beforeEach(() => {
    this.slash = new Slash()
    this.slash.command = 'foo'
    this.slash.user = { slackId: 'UW0TM8888' }
  })

  describe('Session ID', () => {
    test('Simple conversation - Session ID is the command name', () => {
      expect(this.slash.sessionId).toBe(this.slash.command)
    })

    test('Multi conversation - Session ID is the command name suffixed with the user IDs', () => {
      this.slash.conversationWith = ['UW0TM8', 'UW0TM9']
      const expectedSessionId = [this.slash.command, this.slash.user.slackId, ...this.slash.conversationWith].join('-')
      expect(this.slash.sessionId).toBe(expectedSessionId)
    })

    test('Multi conversation with a session ID - just return it', () => {
      this.slash.conversationWith = ['UW0TM8', 'UW0TM9']
      this.slash.trigger = { sessionId: 'foo' }
      expect(this.slash.sessionId).toBe(this.slash.trigger.sessionId)
    })
  })

  describe('Session state retrieval', () => {
    beforeEach(() => {
      this.initialState = 'initialState'
      this.memoryState = 'memoryState'
      this.persistentState = 'persistentState'
      this.slash.initState = sinon.stub().callsFake(() => this.initialState)
    })

    test('Session is present in memory - return it', async () => {
      sinon.stub(this.slash, 'inMemorySession').get(() => ({ state: this.memoryState }))
      await this.slash.setUser('UW0TM1')
      expect(this.slash.state).toBe(this.memoryState)
    })

    test('No session in memory - find it in database and cache it in memory', async () => {
      sinon.stub(this.slash, 'getPersistedSession').callsFake(() => ({ state: this.persistentState }))
      await this.slash.setUser('UW0TM2')
      expect(this.slash.state).toBe(this.persistentState)
      // Session should now be cached in memory
      expect(this.slash.inMemorySession).toMatchObject({ state: this.persistentState })
    })

    test('No session in memory or db - use slash initState', async () => {
      sinon.stub(this.slash, 'getPersistedSession').callsFake(() => null)
      await this.slash.setUser('UW0TM3')
      expect(this.slash.initState.called).toBe(true)
      expect(this.slash.state).toBe(this.initialState)
      // Session should now be cached in memory
      expect(this.slash.inMemorySession).toMatchObject({ state: this.initialState })
    })

    test('No session in memory and no persistent storage - use slash initState', async () => {
      this.slash.persistentState = false
      const getPersistedSessionStub = sinon.stub(this.slash, 'getPersistedSession').callsFake(() => ({ state: this.persistentState }))
      await this.slash.setUser('UW0TM4')
      expect(this.slash.initState.called).toBe(true)
      expect(getPersistedSessionStub.called).toBe(false)
      expect(this.slash.state).toBe(this.initialState)
      // Session should now be cached in memory
      expect(this.slash.inMemorySession).toMatchObject({ state: this.initialState })
    })
  })

  describe('Session persistence', () => {
    beforeEach(async () => {
      if (fs.existsSync(`${__dirname}/test.db`)) {
        fs.unlinkSync(`${__dirname}/test.db`)
      }
      this.database = await databaseFactory(`${__dirname}/test.db`)
      await this.database.Session.query().truncate()
      this.slash.database = this.database
    })

    test('No persistent storage - nothing is written to the database', async () => {
      this.slash.persistentState = false
      await this.slash.persistState()
      const sessions = await this.database.Session.query()
      expect(sessions.length).toBe(0)
    })

    test('No existing session in database - insert', async () => {
      this.slash.state = { foo: 'bar' }
      await this.slash.persistState()
      const [session] = await this.database.Session.query()
      expect(session).not.toBeNull()
      expect(session.state).toEqual(this.slash.state)
    })

    test('Existing session in database - update', async () => {
      this.slash.state = { foo: 'bar' }
      await this.slash.persistState()
      this.slash.state = { foo: 'baz' }
      await this.slash.persistState()
      // Check that there is only one session in database, and that its state corresponds to the last one persisted
      const sessions = await this.database.Session.query()
      expect(sessions.length).toBe(1)
      const [session] = sessions
      expect(session.state).toEqual(this.slash.state)
    })
  })
})
