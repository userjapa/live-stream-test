import './../css/style.css'

import io from 'socket.io-client'

const socket = io.connect(window.location.host)

socket.on('connect', () => {
  console.log('You are Connected!')
})

let answers = {}
let offer = null

const PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection

const SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitSessionDescription

var pc = new PeerConnection({ iceServers: [{ url: 'stun:stun.services.mozilla.com' }]})

pc.onaddstream = function (obj) {
  let video = document.createElement('video')
  video.setAttribute('class', 'video-small')
  video.setAttribute('id', 'video-small')
  video.src = window.URL.createObjectURL(obj.stream)
  video.play()
  document.getElementById('users-container').appendChild(video)
}

navigator.mediaDevices.getUserMedia(
  {
    video: true
  }
)
  .then(stream => {
    let video = document.getElementById('camera')
    video.src = window.URL.createObjectURL(stream)
    pc.addStream(stream)
  })
  .catch(error => {
    console.warn('Failed to GET User Media', error)
  })

const createOffer = id => {
  pc.createOffer(offer => {
    pc.setLocalDescription(new SessionDescription(offer), () => {
      socket.emit('make-offer', {
        offer: offer,
        to: id
      })
    }, error => {
      console.warn('Failed to  Set Local Description Offer', error)
    })
  }, error => {
    console.warn('Failed to Create Offer', error)
  })
}

socket.on('answer-made', data => {
  pc.setRemoteDescription(new SessionDescription(data.answer), function () {
    document.getElementById(data.socket).setAttribute('class', 'active')
    if (!answers[data.socket]) {
      createOffer(data.socket)
      answers[data.socket] = true
    }
  }, error => {
    console.warn('Failed to Set Remote Description', error)
  })
})


socket.on('offer-made', data => {
  offer = data.offer

  pc.setRemoteDescription(new SessionDescription(data.offer), function () {
    pc.createAnswer(function (answer) {
      pc.setLocalDescription(new SessionDescription(answer), function () {
        socket.emit('make-answer', {
          answer: answer,
          to: data.socket
        })
      }, error => {
        console.warn('Failed to Set Local Description', error)
      })
    }, error => {
      console.warn('Failed to Create Answer', error)
    })
  }, error => {
    console.warn('Failed to Set Remove Description')
  })
})

socket.on('add-users', data => {
  for (const x of data.users) {
    let user = document.createElement('div')
    user.setAttribute('id', x)
    user.innerHTML = x
    user.addEventListener('click', () => {
      createOffer(x)
    })
    document.getElementById('users').appendChild(user)
  }
})

socket.on('remove-user', id => {
  const user = document.getElementById(id)
  const small = document.getElementsByClassName('video-small')[0]
  document.getElementById('users').removeChild(user)
  document.getElementById('users-container').removeChild(small)
})
