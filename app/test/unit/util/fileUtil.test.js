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
})
