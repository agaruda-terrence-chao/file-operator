process.env.NODE_ENV = 'test'

const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')
const FileService = require('../../../src/services/fileService')
const futil = require('../../../src/util/fileUtil')

describe('FileService', () => {
  let fileService
  let sandbox

  beforeEach(() => {
    fileService = new FileService()
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('delete', () => {
    it('should delete file successfully when file exists and is a file', async () => {
      // arrange
      const filePath = '/path/to/file.txt'
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'isFile').returns(true)
      sandbox.stub(futil, 'delete').resolves(null)

      // act
      const actual = await fileService.delete(filePath)

      // assert
      should.equal(null, actual)
      sinon.assert.calledOnce(futil.isExists)
      sinon.assert.calledWith(futil.isExists, filePath)
      sinon.assert.calledOnce(futil.isFile)
      sinon.assert.calledWith(futil.isFile, filePath)
      sinon.assert.calledOnce(futil.delete)
      sinon.assert.calledWith(futil.delete, filePath)
    })

    it('should return error when file does not exist', async () => {
      // arrange
      const filePath = '/path/to/nonexistent.txt'
      sandbox.stub(futil, 'isExists').resolves(false)
      sandbox.stub(futil, 'isFile')
      sandbox.stub(futil, 'delete')

      // act
      const actual = await fileService.delete(filePath)

      // assert
      should.exist(actual.err)
      should.equal('file doesn\'t exists', actual.err)
      sinon.assert.calledOnce(futil.isExists)
      sinon.assert.notCalled(futil.isFile)
      sinon.assert.notCalled(futil.delete)
    })

    it('should return error when path is a directory', async () => {
      // arrange
      const filePath = '/path/to/directory/'
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'isFile').returns(false)
      sandbox.stub(futil, 'delete')

      // act
      const actual = await fileService.delete(filePath)

      // assert
      should.exist(actual.err)
      should.equal('is a directory', actual.err)
      sinon.assert.calledOnce(futil.isExists)
      sinon.assert.calledOnce(futil.isFile)
      sinon.assert.notCalled(futil.delete)
    })

    it('should check existence before checking file type', async () => {
      // arrange
      const filePath = '/path/to/file.txt'
      const callOrder = []
      sandbox.stub(futil, 'isExists').callsFake(async () => {
        callOrder.push('isExists')
        return false
      })
      sandbox.stub(futil, 'isFile').callsFake(() => {
        callOrder.push('isFile')
        return true
      })

      // act
      await fileService.delete(filePath)

      // assert
      should.deep.equal(['isExists'], callOrder)
    })

    it('should handle errors from futil.delete', async () => {
      // arrange
      const filePath = '/path/to/file.txt'
      const deleteError = { err: 'delete fail' }
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'isFile').returns(true)
      sandbox.stub(futil, 'delete').resolves(deleteError)

      // act
      const actual = await fileService.delete(filePath)

      // assert
      should.exist(actual.err)
      should.equal('delete fail', actual.err)
    })

    it('should handle unexpected errors during deletion', async () => {
      // arrange
      const filePath = '/path/to/file.txt'
      const error = new Error('Unexpected error')
      sandbox.stub(futil, 'isExists').rejects(error)

      // act
      const actual = await fileService.delete(filePath)

      // assert
      should.exist(actual.err)
      should.equal(error, actual.err)
    })
  })

  describe('read', () => {
    it('should return error when path does not exist', async () => {
      // arrange
      const filePath = '/path/to/nonexistent'
      const query = {}
      sandbox.stub(futil, 'isExists').resolves(false)

      // act
      const actual = await fileService.read(filePath, query)

      // assert
      should.exist(actual.err)
      should.equal('file or directory path doesn\'t exists', actual.err)
    })

    it('should read file when path is a file', async () => {
      // arrange
      const filePath = '/path/to/file.txt'
      const query = {}
      const mockStream = { pipe: () => {} }
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'isFile').returns(true)
      sandbox.stub(futil, 'readFile').resolves(mockStream)

      // act
      const actual = await fileService.read(filePath, query)

      // assert
      should.equal(mockStream, actual)
      sinon.assert.calledOnce(futil.readFile)
    })

    it('should read directory without ordering', async () => {
      // arrange
      const filePath = '/path/to/dir'
      const query = { filterByName: 'test' }
      const mockPayload = { isDirectory: true, files: ['test.txt'] }
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'isFile').returns(false)
      sandbox.stub(futil, 'readDir').resolves(mockPayload)

      // act
      const actual = await fileService.read(filePath, query)

      // assert
      should.equal(mockPayload, actual)
      sinon.assert.calledOnce(futil.readDir)
      sinon.assert.calledWith(futil.readDir, filePath, 'test')
    })

    it('should read directory with ordering', async () => {
      // arrange
      const filePath = '/path/to/dir'
      const query = { orderBy: 'size', orderByDirection: 'ascending', filterByName: null }
      const mockPayload = { isDirectory: true, files: ['file1.txt', 'file2.txt'] }
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'isFile').returns(false)
      sandbox.stub(futil, 'readDirByOrder').resolves(mockPayload)

      // act
      const actual = await fileService.read(filePath, query)

      // assert
      should.equal(mockPayload, actual)
      sinon.assert.calledOnce(futil.readDirByOrder)
      sinon.assert.calledWith(futil.readDirByOrder, filePath, 'size', 'ascending', null)
    })

    it('should handle errors during read', async () => {
      // arrange
      const filePath = '/path/to/file.txt'
      const query = {}
      const error = new Error('Read error')
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'isFile').returns(true)
      sandbox.stub(futil, 'readFile').rejects(error)

      // act
      const actual = await fileService.read(filePath, query)

      // assert
      should.exist(actual.err)
      should.equal(error, actual.err)
    })
  })

  describe('create', () => {
    it('should create file when it does not exist', async () => {
      // arrange
      const filePath = '/path/to/newfile.txt'
      const file = { buffer: Buffer.from('content') }
      sandbox.stub(futil, 'isExists').resolves(false)
      sandbox.stub(futil, 'write').resolves(true)

      // act
      const actual = await fileService.create(filePath, file)

      // assert
      should.equal(true, actual)
      sinon.assert.calledOnce(futil.write)
      sinon.assert.calledWith(futil.write, filePath, file.buffer)
    })

    it('should return error when file already exists', async () => {
      // arrange
      const filePath = '/path/to/existing.txt'
      const file = { buffer: Buffer.from('content') }
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'write')

      // act
      const actual = await fileService.create(filePath, file)

      // assert
      should.exist(actual.err)
      should.equal('file already exists', actual.err)
      sinon.assert.notCalled(futil.write)
    })

    it('should handle errors during file creation', async () => {
      // arrange
      const filePath = '/path/to/newfile.txt'
      const file = { buffer: Buffer.from('content') }
      const error = new Error('Write error')
      sandbox.stub(futil, 'isExists').resolves(false)
      sandbox.stub(futil, 'write').rejects(error)

      // act
      const actual = await fileService.create(filePath, file)

      // assert
      should.exist(actual.err)
      should.equal(error, actual.err)
    })
  })

  describe('patch', () => {
    it('should update file when it exists', async () => {
      // arrange
      const filePath = '/path/to/existing.txt'
      const file = { buffer: Buffer.from('new content') }
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'write').resolves(true)

      // act
      const actual = await fileService.patch(filePath, file)

      // assert
      should.equal(true, actual)
      sinon.assert.calledOnce(futil.write)
      sinon.assert.calledWith(futil.write, filePath, file.buffer)
    })

    it('should return error when file does not exist', async () => {
      // arrange
      const filePath = '/path/to/nonexistent.txt'
      const file = { buffer: Buffer.from('content') }
      sandbox.stub(futil, 'isExists').resolves(false)
      sandbox.stub(futil, 'write')

      // act
      const actual = await fileService.patch(filePath, file)

      // assert
      should.exist(actual.err)
      should.equal('file doesn\'t exists', actual.err)
      sinon.assert.notCalled(futil.write)
    })

    it('should handle errors during file update', async () => {
      // arrange
      const filePath = '/path/to/existing.txt'
      const file = { buffer: Buffer.from('content') }
      const error = new Error('Write error')
      sandbox.stub(futil, 'isExists').resolves(true)
      sandbox.stub(futil, 'write').rejects(error)

      // act
      const actual = await fileService.patch(filePath, file)

      // assert
      should.exist(actual.err)
      should.equal(error, actual.err)
    })
  })
})