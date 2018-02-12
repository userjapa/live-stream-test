const http = require('http')
const express = require('express')
const path = require('path')

const app = express()

const socket = require('./app/socket')

let server = null

app.use(express.static(`${__dirname}/dist`))

app.get('*', (req, res) => {
  res.sendFile(`${__dirname}/dist/index.html`)
})

server = http.Server(app)

socket(server)

server.listen(8080, () => {
  console.log('Running at port 8080');
})
