process.env.NODE_ENV = 'test'

let chai = require('chai')
let should = chai.should()
let fs = require('fs')
let fsp = require('fs/promises')
const futil = require('../../../src/util/fileUtil')

const srcFilePath = __dirname.concat('/src/berlin_view.jpeg')
const destFilePath = __dirname.concat('/dest/berlin_view.jpeg')

describe('test fileUtil', async () => {
  it('file is not exists', async () => {
    // arrange
    try {
      if (fs.existsSync(destFilePath)) {
        await fsp.unlink(destFilePath)
      }
    } catch (err) {
      console.log('no file there')
    }

    // act
    const actual = await futil.isExists(destFilePath)

    // assert
    should.equal(false, actual)
  })

  it('file is exists', async () => {
    // arrange
    try {
      const buf = await fsp.readFile(srcFilePath)
      fs.writeFileSync(destFilePath, buf)
    } catch (err) {
      console.log('file there')
    }

    // act
    const actual = await futil.isExists(destFilePath)

    // assert
    should.equal(true, actual)
  })

  // TODO 因時間因素，加上大部分都是用 native method 改寫的，因此後面的 unit test 暫時省略...

  describe('isFile', () => {
    it('should return true for file with extension', () => {
      // act
      const actual = futil.isFile('path/to/file.txt')

      // assert
      should.equal(true, actual)
    })

    it('should return true for file with multiple dots', () => {
      // act
      const actual = futil.isFile('path/to/file.tar.gz')

      // assert
      should.equal(true, actual)
    })

    it('should return false for path ending with slash', () => {
      // act
      const actual = futil.isFile('path/to/directory/')

      // assert
      should.equal(false, actual)
    })

    it('should return false for path without extension', () => {
      // act
      const actual = futil.isFile('path/to/directory')

      // assert
      should.equal(false, actual)
    })

    it('should return true for hidden file with extension', () => {
      // act
      const actual = futil.isFile('.gitignore')

      // assert
      should.equal(true, actual)
    })

    it('should return false for path starting with dot only', () => {
      // act
      const actual = futil.isFile('.')

      // assert
      should.equal(false, actual)
    })

    it('should return true for file in root', () => {
      // act
      const actual = futil.isFile('file.txt')

      // assert
      should.equal(true, actual)
    })

    it('should return false for empty string', () => {
      // act
      const actual = futil.isFile('')

      // assert
      should.equal(false, actual)
    })

    it('should handle Windows-style paths', () => {
      // act
      const actual = futil.isFile('C:\\path\\to\\file.txt')

      // assert
      should.equal(true, actual)
    })

    it('should return false for directory path with backslash', () => {
      // act
      const actual = futil.isFile('C:\\path\\to\\directory\\')

      // assert
      should.equal(false, actual)
    })
  })

  describe('getPath', () => {
    it('should extract path from request URL', () => {
      // arrange
      const req = {
        originalUrl: '/file/path/to/resource'
      }

      // act
      const actual = futil.getPath(req)

      // assert
      should.equal('/path/to/resource', actual)
    })

    it('should extract path and remove query string', () => {
      // arrange
      const req = {
        originalUrl: '/file/path/to/resource?orderBy=size&filterByName=test'
      }

      // act
      const actual = futil.getPath(req)

      // assert
      should.equal('/path/to/resource', actual)
    })

    it('should handle root path', () => {
      // arrange
      const req = {
        originalUrl: '/file'
      }

      // act
      const actual = futil.getPath(req)

      // assert
      should.equal('', actual)
    })

    it('should handle path with encoded characters', () => {
      // arrange
      const req = {
        originalUrl: '/file/path%20with%20spaces/file.txt'
      }

      // act
      const actual = futil.getPath(req)

      // assert
      should.equal('/path%20with%20spaces/file.txt', actual)
    })
  })

  describe('filteredByName', () => {
    it('should return all files when filterByName is null', () => {
      // arrange
      const files = ['file1.txt', 'file2.txt', 'dir/']

      // act
      const actual = futil.filteredByName(files, null)

      // assert
      should.deep.equal(files, actual)
    })

    it('should return all files when filterByName is undefined', () => {
      // arrange
      const files = ['file1.txt', 'file2.txt', 'dir/']

      // act
      const actual = futil.filteredByName(files, undefined)

      // assert
      should.deep.equal(files, actual)
    })

    it('should filter files by name case-insensitively', () => {
      // arrange
      const files = ['file1.txt', 'FILE2.txt', 'test.txt', 'dir/']

      // act
      const actual = futil.filteredByName(files, 'file')

      // assert
      should.deep.equal(['file1.txt', 'FILE2.txt'], actual)
    })

    it('should filter with partial match', () => {
      // arrange
      const files = ['document.pdf', 'image.png', 'text.txt']

      // act
      const actual = futil.filteredByName(files, 'doc')

      // assert
      should.deep.equal(['document.pdf'], actual)
    })

    it('should return empty array when no matches', () => {
      // arrange
      const files = ['file1.txt', 'file2.txt']

      // act
      const actual = futil.filteredByName(files, 'xyz')

      // assert
      should.deep.equal([], actual)
    })

    it('should handle filter with uppercase', () => {
      // arrange
      const files = ['file1.txt', 'file2.txt', 'TEST.txt']

      // act
      const actual = futil.filteredByName(files, 'TEST')

      // assert
      should.deep.equal(['TEST.txt'], actual)
    })
  })

  describe('readDir', () => {
    const testDir = __dirname.concat('/testReadDir')

    beforeEach(async () => {
      // arrange - create test directory structure
      try {
        await fsp.mkdir(testDir, { recursive: true })
        await fsp.writeFile(testDir + '/file1.txt', 'content1')
        await fsp.writeFile(testDir + '/file2.txt', 'content2')
        await fsp.mkdir(testDir + '/subdir', { recursive: true })
      } catch (err) {
        console.log('setup error:', err)
      }
    })

    afterEach(async () => {
      // cleanup
      try {
        await fsp.rm(testDir, { recursive: true, force: true })
      } catch (err) {
        console.log('cleanup error:', err)
      }
    })

    it('should read directory and return files with slash for directories', async () => {
      // act
      const actual = await futil.readDir(testDir, null)

      // assert
      should.equal(true, actual.isDirectory)
      should.equal(3, actual.files.length)
      should.equal(true, actual.files.includes('file1.txt'))
      should.equal(true, actual.files.includes('file2.txt'))
      should.equal(true, actual.files.includes('subdir/'))
    })

    it('should filter files by name', async () => {
      // act
      const actual = await futil.readDir(testDir, 'file1')

      // assert
      should.equal(true, actual.isDirectory)
      should.equal(1, actual.files.length)
      should.equal(true, actual.files.includes('file1.txt'))
    })

    it('should return error for non-existent directory', async () => {
      // act
      const actual = await futil.readDir('/non/existent/path', null)

      // assert
      should.exist(actual.err)
      should.equal('not a valid directory path', actual.err)
    })

    it('should return empty files array for empty directory', async () => {
      // arrange
      const emptyDir = testDir + '/empty'
      await fsp.mkdir(emptyDir, { recursive: true })

      // act
      const actual = await futil.readDir(emptyDir, null)

      // assert
      should.equal(true, actual.isDirectory)
      should.equal(0, actual.files.length)
    })
  })

  describe('readDirByOrder', () => {
    const testDir = __dirname.concat('/testReadDirOrdered')

    beforeEach(async () => {
      // arrange - create test directory structure
      try {
        await fsp.mkdir(testDir, { recursive: true })
        await fsp.writeFile(testDir + '/alpha.txt', 'a')
        await fsp.writeFile(testDir + '/beta.txt', 'bb')
        await fsp.writeFile(testDir + '/gamma.txt', 'ccc')
        await fsp.mkdir(testDir + '/subdir', { recursive: true })
      } catch (err) {
        console.log('setup error:', err)
      }
    })

    afterEach(async () => {
      // cleanup
      try {
        await fsp.rm(testDir, { recursive: true, force: true })
      } catch (err) {
        console.log('cleanup error:', err)
      }
    })

    it('should return error for invalid orderBy parameter', async () => {
      // act
      const actual = await futil.readDirByOrder(testDir, 'invalidOrder', 'ascending', null)

      // assert
      should.exist(actual.err)
      should.equal(true, actual.err.includes('invalid order condition'))
    })

    it('should return error for null orderBy parameter', async () => {
      // act
      const actual = await futil.readDirByOrder(testDir, null, 'ascending', null)

      // assert
      should.exist(actual.err)
      should.equal(true, actual.err.includes('invalid order condition'))
    })

    it('should filter files before ordering', async () => {
      // act
      const actual = await futil.readDirByOrder(testDir, 'fileName', 'ascending', 'beta')

      // assert
      should.equal(true, actual.isDirectory)
      should.equal(1, actual.files.length)
      should.equal('beta.txt', actual.files[0])
    })

    it('should return error for non-existent directory', async () => {
      // act
      const actual = await futil.readDirByOrder('/non/existent/path', 'fileName', 'ascending', null)

      // assert
      should.exist(actual.err)
      should.equal('not a valid directory path', actual.err)
    })

    it('should handle empty directory', async () => {
      // arrange
      const emptyDir = testDir + '/empty'
      await fsp.mkdir(emptyDir, { recursive: true })

      // act
      const actual = await futil.readDirByOrder(emptyDir, 'fileName', 'ascending', null)

      // assert
      should.equal(true, actual.isDirectory)
      should.equal(0, actual.files.length)
    })
  })

  describe('write', () => {
    const testFile = __dirname.concat('/testWrite.txt')

    afterEach(async () => {
      // cleanup
      try {
        if (fs.existsSync(testFile)) {
          await fsp.unlink(testFile)
        }
      } catch (err) {
        console.log('cleanup error:', err)
      }
    })

    it('should write content to file', async () => {
      // arrange
      const content = Buffer.from('test content')

      // act
      const actual = await futil.write(testFile, content)

      // assert
      should.equal(true, actual)
      const fileContent = await fsp.readFile(testFile, 'utf8')
      should.equal('test content', fileContent)
    })

    it('should write large content in chunks', async () => {
      // arrange
      const largeContent = Buffer.alloc(1024 * 1024, 'a') // 1MB

      // act
      const actual = await futil.write(testFile, largeContent)

      // assert
      should.equal(true, actual)
      const stats = await fsp.stat(testFile)
      should.equal(1024 * 1024, stats.size)
    })

    it('should overwrite existing file', async () => {
      // arrange
      await fsp.writeFile(testFile, 'old content')
      const newContent = Buffer.from('new content')

      // act
      const actual = await futil.write(testFile, newContent)

      // assert
      should.equal(true, actual)
      const fileContent = await fsp.readFile(testFile, 'utf8')
      should.equal('new content', fileContent)
    })
  })

  describe('delete', () => {
    const testFile = __dirname.concat('/testDelete.txt')

    beforeEach(async () => {
      // arrange - create test file
      try {
        await fsp.writeFile(testFile, 'test content')
      } catch (err) {
        console.log('setup error:', err)
      }
    })

    afterEach(async () => {
      // cleanup
      try {
        if (fs.existsSync(testFile)) {
          await fsp.unlink(testFile)
        }
      } catch (err) {
        console.log('cleanup error:', err)
      }
    })

    it('should delete existing file', async () => {
      // act
      const actual = await futil.delete(testFile)

      // assert
      should.equal(null, actual)
      should.equal(false, fs.existsSync(testFile))
    })

    it('should return error when deleting non-existent file', async () => {
      // arrange
      await fsp.unlink(testFile)

      // act
      const actual = await futil.delete(testFile)

      // assert
      should.exist(actual.err)
      should.equal('delete fail', actual.err)
    })
  })
})
