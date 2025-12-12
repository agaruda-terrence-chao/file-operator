const futil = require('../util/fileUtil')

function FileService () {}

FileService.prototype.read = async function (filePath, query) {
  const { orderBy, orderByDirection, filterByName } = query
  const readDirFunc = (orderBy == null) ? futil.readDir : futil.readDirByOrder

  if (!await futil.isExists(filePath)) {
    return { err: 'file or directory path doesn\'t exists' }
  }

  try {
    if (futil.isFile(filePath)) {
      return await futil.readFile(filePath)
    } else {
      const payload = await readDirFunc(filePath, orderBy, orderByDirection)
      if (!payload.err) {
        payload.files = futil.filteredByName(payload.files, filterByName)
      }

      return payload
    }
  } catch (err) {
    console.error(err)
    return { err }
  }
}

FileService.prototype.create = async function (filePath, file) {
  try {
    if (await futil.isExists(filePath)) {
      return { err: 'file already exists' }
    } else {
      return await futil.write(filePath, file.buffer)
    }
  } catch (err) {
    console.error(err)
    return { err }
  }
}

FileService.prototype.patch = async function (filePath, file) {
  try {
    if (!await futil.isExists(filePath)) {
      return { err: 'file doesn\'t exists' }
    } else {
      return await futil.write(filePath, file.buffer)
    }
  } catch (err) {
    console.error(err)
    return { err }
  }
}

FileService.prototype.delete = async function (filePath) {
  try {
    if (!futil.isFile(filePath)) {
      return { err: 'is a directory' }
    } else if (!await futil.isExists(filePath)) {
      return { err: 'file doesn\'t exists' }
    } else {
      return await futil.delete(filePath)
    }
  } catch (err) {
    console.error(err)
    return { err }
  }
}

module.exports = FileService
