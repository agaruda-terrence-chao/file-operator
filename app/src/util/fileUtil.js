require('dotenv').config()
const fs = require('fs')
const fsp = require('fs/promises')
const { createGzip } = require('zlib')
const orderFileUtil = require('./orderFileUtil')

const CHUNK_BYTES = parseInt(process.env.CHUNK_BYTES)

function isFile (filePath) {
  // 优化：更健壮的文件名判断逻辑
  // 排除以 '/' 结尾的目录标识，以及没有扩展名的隐藏文件（以 '.' 开头）
  if (filePath.endsWith('/')) {
    return false
  }
  const lastDotIndex = filePath.lastIndexOf('.')
  const lastSlashIndex = filePath.lastIndexOf('/')
  // 有扩展名且扩展名在最后一个 '/' 之后
  return lastDotIndex > lastSlashIndex && lastDotIndex > 0
}

function isExists (filePath) {
  return new Promise(resolve => resolve(fs.existsSync(filePath)))
}

function writeChunks (writeStream, content) {
  for (let i = 0, times = Math.ceil(content.length / CHUNK_BYTES); i < times; i++) {
    const currentBlock = content.slice(
      CHUNK_BYTES * i,
      Math.min(CHUNK_BYTES * (i + 1), content.length)
    )
    writeStream.write(currentBlock)
  }
  writeStream.end()
}

exports.getPath = (req) => {
  return req.originalUrl.replace('/file', '').split('?')[0]
}

exports.isFile = isFile

exports.isExists = isExists

exports.readFile = async (filePath) => {
  return new Promise(resolve => {
    var readStream
    const gzip = createGzip()
    try {
      readStream = fs.createReadStream(filePath, { highWaterMark: CHUNK_BYTES })
    } catch (err) {
      console.error(err)
      return resolve({ err: 'not a valid file path' })
    }

    readStream.on('open', () => resolve(readStream.pipe(gzip)))
    readStream.on('close', () => readStream.destroy())
    readStream.on('error', err => {
      console.error(err)
      resolve({ err: 'Error caused while reading file' })
    })
  })
}

// 提取公共逻辑：读取目录并处理文件名
async function readDirFiles (filePath) {
  const payload = {
    isDirectory: true,
    files: []
  }
  try {
    const files = await fsp.readdir(filePath)
    if (files.length === 0) {
      return payload
    }

    for (let file of files) {
      file = isFile(file) ? file : file.concat('/')
      payload.files.push(file)
    }
  } catch (err) {
    console.error(err)
    return { err: 'not a valid directory path' }
  }

  return payload
}

exports.readDir = async (filePath, filterByName) => {
  const payload = await readDirFiles(filePath)
  if (payload.err) {
    return payload
  }

  // 先过滤，减少后续处理的数据量
  payload.files = filteredByName(payload.files, filterByName)
  return payload
}

exports.readDirByOrder = async (filePath, orderBy, orderByDirection, filterByName) => {
  const payload = await readDirFiles(filePath)
  if (payload.err) {
    return payload
  }

  // 优化：先过滤再排序，减少不必要的文件系统 I/O（stat 调用）
  payload.files = filteredByName(payload.files, filterByName)

  try {
    const orderFileFunc = orderFileUtil[orderBy]
    if (!orderFileFunc) {
      return { err: 'invalid order condition. should be orderBy=lastModified; orderBy=size; orderBy=fileName; ' }
    }
    payload.files = await orderFileFunc(filePath, payload.files, orderByDirection)
  } catch (err) {
    console.error(err)
    return { err: 'invalid order condition. should be orderBy=lastModified; orderBy=size; orderBy=fileName; ' }
  }

  return payload
}

function filteredByName (files, filterByName) {
  if (filterByName != null) {
    filterByName = filterByName.toLowerCase()
    files = files.filter(str => str.toLowerCase().includes(filterByName))
  }
  return files
}

exports.filteredByName = filteredByName

exports.write = async (filePath, content) => {
  return new Promise(resolve => {
    const writeStream = fs.createWriteStream(filePath)
    writeStream.on('open', () => writeChunks(writeStream, content))
    writeStream.on('finish', () => { resolve(true) })
    writeStream.on('error', err => {
      console.error(err)
      resolve({ err: 'Error caused while writing file' })
    })
  })
}

exports.delete = async (filePath) => {
  try {
    await fsp.unlink(filePath)
    console.log(`successfully deleted ${filePath}`)
  } catch (err) {
    console.error(err)
    return { err: 'delete fail' }
  }

  return null
}
