var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' })
})

router.get('/info', (req, res, next) => {
  console.log(`url path: ${req.baseUrl}`)
  res.send('respond with a resource')
})

module.exports = router
