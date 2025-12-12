exports.fileValidator = (req, res, next) => {
  res.locals.data = {}
  if (!req.file || !req.file.originalname) {
    return res.status(422).json({ err: 'invalid/empty file' })
  }
  next()
}
