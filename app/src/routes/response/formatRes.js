
exports.getRes = (req, res, next) => {
  const data = res.locals.data
  if (data !== null && data.err !== undefined) {
    return res.status(404).json(data)
  }

  res.json(data)
}

exports.postRes = (req, res, next) => {
  const data = res.locals.data
  if (data !== null && data.err !== undefined) {
    return res.status(403).json(data)
  }

  res.status(201).json({ msg: 'write success' })
}

exports.patchRes = (req, res, next) => {
  const data = res.locals.data
  if (data !== null && data.err !== undefined) {
    return res.status(403).json(data)
  }

  res.json({ msg: 'overwrite success' })
}

exports.deleteRes = (req, res, next) => {
  const data = res.locals.data
  if (data !== null && data.err !== undefined) {
    return res.status(403).json(data)
  }

  res.json({ msg: 'delete success' })
}
