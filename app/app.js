require('dotenv').config()
var createError = require('http-errors')
var express = require('express')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var indexRouter = require('./src/routes/index')
var fileRouter = require('./src/routes/fileRouter')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const ALLOW_REGION = process.env.ACCESS_CONTROL_ALLOW_ORIGIN
const ALLOW_METHODS = process.env.ACCESS_CONTROL_ALLOW_METHODS
const ALLOW_HEADERS = process.env.ACCESS_CONTROL_ALLOW_HEADERS

app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', ALLOW_REGION)
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', ALLOW_METHODS)
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS)

  console.log(`\n>> worker port: ${req.socket.localPort}\n`)
  next()
})

app.use('/', indexRouter)
app.use('/file', fileRouter)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404))
})

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
