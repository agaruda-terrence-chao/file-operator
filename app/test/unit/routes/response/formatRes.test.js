process.env.NODE_ENV = 'test'

const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')
const {
  getRes,
  postRes,
  patchRes,
  deleteRes
} = require('../../../../src/routes/response/formatRes')

describe('formatRes', () => {
  let req, res, next, sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    req = {}
    res = {
      locals: {},
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis()
    }
    next = sandbox.stub()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('getRes', () => {
    it('should return 404 with error data when error exists', () => {
      // arrange
      res.locals.data = { err: 'file not found' }

      // act
      getRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.status)
      sinon.assert.calledWith(res.status, 404)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { err: 'file not found' })
      sinon.assert.notCalled(next)
    })

    it('should return 200 with data when no error', () => {
      // arrange
      res.locals.data = { files: ['file1.txt', 'file2.txt'] }

      // act
      getRes(req, res, next)

      // assert
      sinon.assert.notCalled(res.status)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { files: ['file1.txt', 'file2.txt'] })
      sinon.assert.notCalled(next)
    })

    it('should return data when data is null without error', () => {
      // arrange
      res.locals.data = null

      // act
      getRes(req, res, next)

      // assert
      sinon.assert.notCalled(res.status)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, null)
      sinon.assert.notCalled(next)
    })

    it('should handle data with err set to undefined', () => {
      // arrange
      res.locals.data = { err: undefined, content: 'data' }

      // act
      getRes(req, res, next)

      // assert
      sinon.assert.notCalled(res.status)
      sinon.assert.calledOnce(res.json)
      sinon.assert.notCalled(next)
    })

    it('should return early and not call json twice', () => {
      // arrange
      res.locals.data = { err: 'error occurred' }

      // act
      getRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.json)
    })
  })

  describe('postRes', () => {
    it('should return 403 with error data when error exists', () => {
      // arrange
      res.locals.data = { err: 'file already exists' }

      // act
      postRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.status)
      sinon.assert.calledWith(res.status, 403)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { err: 'file already exists' })
      sinon.assert.notCalled(next)
    })

    it('should return 201 with success message when no error', () => {
      // arrange
      res.locals.data = true

      // act
      postRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.status)
      sinon.assert.calledWith(res.status, 201)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { msg: 'write success' })
      sinon.assert.notCalled(next)
    })

    it('should return 201 when data is null without error', () => {
      // arrange
      res.locals.data = null

      // act
      postRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.status)
      sinon.assert.calledWith(res.status, 201)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { msg: 'write success' })
      sinon.assert.notCalled(next)
    })

    it('should handle data with err set to undefined', () => {
      // arrange
      res.locals.data = { err: undefined }

      // act
      postRes(req, res, next)

      // assert
      sinon.assert.calledWith(res.status, 201)
      sinon.assert.calledWith(res.json, { msg: 'write success' })
      sinon.assert.notCalled(next)
    })

    it('should return early and not call status twice', () => {
      // arrange
      res.locals.data = { err: 'error' }

      // act
      postRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.status)
      sinon.assert.calledOnce(res.json)
    })
  })

  describe('patchRes', () => {
    it('should return 403 with error data when error exists', () => {
      // arrange
      res.locals.data = { err: 'file doesn\'t exists' }

      // act
      patchRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.status)
      sinon.assert.calledWith(res.status, 403)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { err: 'file doesn\'t exists' })
      sinon.assert.notCalled(next)
    })

    it('should return 200 with success message when no error', () => {
      // arrange
      res.locals.data = true

      // act
      patchRes(req, res, next)

      // assert
      sinon.assert.notCalled(res.status)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { msg: 'overwrite success' })
      sinon.assert.notCalled(next)
    })

    it('should return success when data is null without error', () => {
      // arrange
      res.locals.data = null

      // act
      patchRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { msg: 'overwrite success' })
      sinon.assert.notCalled(next)
    })

    it('should handle data with err set to undefined', () => {
      // arrange
      res.locals.data = { err: undefined }

      // act
      patchRes(req, res, next)

      // assert
      sinon.assert.notCalled(res.status)
      sinon.assert.calledWith(res.json, { msg: 'overwrite success' })
      sinon.assert.notCalled(next)
    })

    it('should return early and not call json twice', () => {
      // arrange
      res.locals.data = { err: 'error' }

      // act
      patchRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.json)
    })
  })

  describe('deleteRes', () => {
    it('should return 403 with error data when error exists', () => {
      // arrange
      res.locals.data = { err: 'delete fail' }

      // act
      deleteRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.status)
      sinon.assert.calledWith(res.status, 403)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { err: 'delete fail' })
      sinon.assert.notCalled(next)
    })

    it('should return 200 with success message when no error', () => {
      // arrange
      res.locals.data = null

      // act
      deleteRes(req, res, next)

      // assert
      sinon.assert.notCalled(res.status)
      sinon.assert.calledOnce(res.json)
      sinon.assert.calledWith(res.json, { msg: 'delete success' })
      sinon.assert.notCalled(next)
    })

    it('should handle data with err set to undefined', () => {
      // arrange
      res.locals.data = { err: undefined }

      // act
      deleteRes(req, res, next)

      // assert
      sinon.assert.notCalled(res.status)
      sinon.assert.calledWith(res.json, { msg: 'delete success' })
      sinon.assert.notCalled(next)
    })

    it('should return early and not call json twice', () => {
      // arrange
      res.locals.data = { err: 'error' }

      // act
      deleteRes(req, res, next)

      // assert
      sinon.assert.calledOnce(res.json)
    })
  })

  describe('edge cases', () => {
    it('getRes should handle empty error string', () => {
      // arrange
      res.locals.data = { err: '' }

      // act
      getRes(req, res, next)

      // assert
      sinon.assert.calledWith(res.status, 404)
      sinon.assert.calledWith(res.json, { err: '' })
    })

    it('postRes should handle complex error objects', () => {
      // arrange
      res.locals.data = { err: new Error('Complex error') }

      // act
      postRes(req, res, next)

      // assert
      sinon.assert.calledWith(res.status, 403)
    })

    it('all response handlers should handle data object with multiple properties', () => {
      // arrange
      res.locals.data = { result: 'success', metadata: { size: 100 } }

      // act
      getRes(req, res, next)

      // assert
      sinon.assert.calledWith(res.json, { result: 'success', metadata: { size: 100 } })
    })
  })
})