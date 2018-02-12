import './../css/style.css'

import io from 'socket.io-client'

const socket = io.connect('http://192.168.0.16:8080')

socket.on('connect', () => {
  console.log('User Connected!')
})

let answers = {}
let offer = null

const PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection

const SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitSessionDescription

var pc = new PeerConnection({ iceServers: [{ url: 'stun:stun.services.mozilla.com' }]})

pc.onaddstream = obj => {
  let video = document.createElement('video')
  video.setAttribute('class', 'video-small')
  video.setAttribute('id', 'video-small')
  video.src = window.URL.createObjectURL(obj.stream)
  document.getElementById('users-container').appendChild(video)
}

navigator.mediaDevices.getUserMedia(
  {
    audio: false,
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
  pc.setRemoteDescription(new SessionDescription(data.answer), () => {
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

  pc.setRemoteDescription(new SessionDescription(data.offer), () => {
    pc.createAnswer(answer => {
      pc.setLocalDescription(new SessionDescription(answer), () => {
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
    const div = document.createElement('div')
    div.setAttribute('id', x)
    div.addEventListener('click', () => {
      createOffer(x)
    })
    document.getElementById('users').appendChild(div)
  }
})

socket.on('remove-user', id => {
  const div = document.getElementById(id)
  document.getElementById('users').removeChild(div)
})
