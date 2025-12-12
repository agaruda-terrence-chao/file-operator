const path = require('path')
const fsp = require('fs/promises')
const {
  orderBy,
  orderByDirect
} = require('../common/enum')

function metadata (dirPath, fileName) {
  return {
    name: fileName,
    path: path.join(dirPath, fileName)
  }
}

async function statAsync (metadata) {
  try {
    const stat = await fsp.stat(metadata.path)
    stat.name = metadata.name
    stat.path = metadata.path
    return stat
  } catch (err) {
    // If stat fails, return metadata as fallback
    return metadata
  }
}

function sortAsc (list, field) {
  list.sort((a, b) => {
    if (a[field] < b[field]) { return -1 }
    if (a[field] > b[field]) { return 1 }
    return 0
  })

  return list
}

function sortDesc (list, field) {
  list.sort((a, b) => {
    if (a[field] < b[field]) { return 1 }
    if (a[field] > b[field]) { return -1 }
    return 0
  })

  return list
}

function sort (list, field, orderByDirection) {
  if (orderByDirection != null && orderByDirection === orderByDirect.descending) {
    return sortDesc(list, field)
  }

  return sortAsc(list, field)
}

async function orderByLastModified (dirPath, files, orderByDirection) {
  const metadataList = files.map(name => metadata(dirPath, name))
  const statList = await Promise.all(metadataList.map(meta => statAsync(meta)))
  const sortedList = sort(statList, 'mtime', orderByDirection)
  
  // Optional: Remove or make debug logging conditional
  if (process.env.DEBUG) {
    for (const f of sortedList) console.log(' >>> ', { mtime: f.mtime, name: f.name })
  }
  
  return sortedList.map(f => f.name)
}

async function orderBySize (dirPath, files, orderByDirection) {
  const metadataList = files.map(name => metadata(dirPath, name))
  const statList = await Promise.all(metadataList.map(meta => statAsync(meta)))
  const sortedList = sort(statList, 'size', orderByDirection)
  
  // Optional: Remove or make debug logging conditional
  if (process.env.DEBUG) {
    for (const f of sortedList) console.log(' >>> ', { size: f.size, name: f.name })
  }
  
  return sortedList.map(f => f.name)
}

async function orderByFileName (dirPath, files, orderByDirection) {
  const metadataList = files.map(name => metadata(dirPath, name))
  const sortedList = sort(metadataList, 'name', orderByDirection)
  
  // Optional: Remove or make debug logging conditional
  if (process.env.DEBUG) {
    for (const f of sortedList) console.log(' >>> ', { name: f.name })
  }
  
  return sortedList.map(f => f.name)
}

module.exports = {
  [orderBy.lastModified]: orderByLastModified,
  [orderBy.size]: orderBySize,
  [orderBy.fileName]: orderByFileName
}
