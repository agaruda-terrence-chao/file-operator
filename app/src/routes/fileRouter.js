var express = require('express')
var router = express.Router()
var multer = require('multer')
var path = require('path')
var { fileValidator } = require('./request/fileValidator')
const futil = require('../util/fileUtil')
const FileService = require('../services/fileService')
const {
  getRes,
  postRes,
  patchRes,
  deleteRes
} = require('../routes/response/formatRes')

const fileService = new FileService()

module.exports = router
  .get('*', async (req, res, next) => {
    const filePath = futil.getPath(req)
    const payload = await fileService.read(filePath, req.query)
    if (!payload.err && !payload.files) {
      res.setHeader('Content-type', 'application/zip')
      res.setHeader('Content-Disposition', 'attachment')
      payload.pipe(res)
    } else {
      res.locals.data = payload
      next()
    }
  }, getRes)

  .post('*',
    multer().single('file'),
    fileValidator,
    async (req, res, next) => {
      // TODO 英文以外的無法解析
      const basePath = futil.getPath(req)
      const filePath = path.join(basePath, req.file.originalname).replace(/\\/g, '/')
      res.locals.data = await fileService.create(filePath, req.file)
      next()
    },
    postRes)

  .patch('*',
    multer().single('file'),
    fileValidator,
    async (req, res, next) => {
      // TODO 英文以外的無法解析
      const basePath = futil.getPath(req)
      const filePath = path.join(basePath, req.file.originalname).replace(/\\/g, '/')
      res.locals.data = await fileService.patch(filePath, req.file)
      next()
    },
    patchRes)

  .delete('*', async (req, res, next) => {
    // TODO 英文以外的無法解析
    const filePath = futil.getPath(req)
    res.locals.data = await fileService.delete(filePath)
    next()
  }, deleteRes)
