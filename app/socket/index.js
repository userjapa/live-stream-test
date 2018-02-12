
module.exports = server => {
  const io = require('socket.io')(server)

  let sockets = []

  io.on('connection', socket => {
    console.log(`User ${socket.id} connected!`);

    socket.emit('add-user', {
      sockets: sockets
    })

    socket.broadcast.emit('add-users', {
      users: [socket.id]
    })

    socket.on('make-offer', data => {
      socket.to(data.to).emit('offer-made', {
        offer: data.offer,
        socket: socket.id
      })
    })

    socket.on('make-answer', data => {
      socket.to(data.to,).emit('answer-made', {
        socket: socket.id,
        answer: data.answer
      })
    })

    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected!`);
      sockets.splice(sockets.indexOf(socket.id), 1)
      io.emit('remove-user', socket.id)
    })

    sockets.push(socket.id)
  })
}
