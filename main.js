const peerConnection = new RTCPeerConnection();
const dataChannel = peerConnection.createDataChannel('chat')
const chatLog = document.getElementById('chatLog')
let socket = new WebSocket('ws://Ваш ip:8080')
let inviteLink = 'http://Ваш ip:5500'

const PInviteLink = document.getElementById('inviteLink')
PInviteLink.innerHTML += `Ваша пригласительная ссылка${inviteLink}`
function copyLink() {
  const text = document.getElementById('inviteLink').innerText
  navigator.clipboard.writeText(text)
}


dataChannel.onopen = () => {
  console.log('канал открыт');
  chatLog.innerHTML += 'Канал открыт <br>' 
}
dataChannel.onmessage = event => {
  console.log('получено сообщение: ', event.data);

  //chatLog.innerHTML += `Другой: ${event.data}<br>`
	
}

peerConnection.ondatachannel = (event) => {
  console.log('Получено событие ondatachannel: ', event)
  
  const dataChannel = event.channel;
  dataChannel.onopen = () => {
    console.log('канал открыт у получателя')
    //chatLog.innerHTML += 'Канал открыт 2/2<br>'
  }
  dataChannel.onmessage = event => {
    console.log('получено сообщение: ', event.data)
			//chatLog.innerHTML += `Другой: ${event.data}<br>`
			addMessageOther(event.data)
  }
}

//отправляем ICE кандидата  
peerConnection.onicecandidate = event => {
  if (event.candidate) {
    socket.send(JSON.stringify({candidate: event.candidate}))
    console.log('Отправлен ICE-кандидат:', event.candidate)
  }
}


const createOfferButton = document.getElementById('createOfferButton')
//создаем offer по нажатию кнопки 
let createOffer = async () => {
  let offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)
  socket.send(JSON.stringify({'offer': offer}))

  console.log('offer создан: ', offer)
}

//если соединение установлено выводим это в консоль
socket.onopen = async () => {
  console.log('соеденение установлено')
  //socket.send('hello world')
}

//когда приходит сообщение с сервера то вызывается это
socket.onmessage = async (event) => {
	console.log(`данные получены с сервера: ${event.data}`)

	//так как сообщение приходит типа Blob нужно его изменить в json
	if (event.data instanceof Blob) {
		const text = await event.data.text()
		data = JSON.parse(text)
	} else {
		data = JSON.parse(event.data)
	}

	let message = data
	console.log('data: ', message)

  if (message.candidate) {
		try {
			await peerConnection.addIceCandidate(
				new RTCIceCandidate(message.candidate)
			)
			console.log('Получен ICE-кандидат добавлен:', message.candidate)
		} catch (error) {
			console.error('Ошибка при добавлении ICE-кандидата:', error)
		}
	}


	//если пришло сообщение типа offer то истанавливаем его как RemoteDescription
	//создаём и отправляем answer
	if (message.offer) {
		peerConnection.setRemoteDescription(
			new RTCSessionDescription(message.offer)
		)
		const answer = await peerConnection.createAnswer()
		await peerConnection.setLocalDescription(answer)

		socket.send(JSON.stringify({ type: 'answer', sdp: answer }))
		console.log('answer создан: ', answer)
	}
	//если пришло сообщение типа answer то устанавливаем его как RemoteDescription
	if (message.type === 'answer') {
		await peerConnection.setRemoteDescription(
			new RTCSessionDescription(message.sdp)
		)
		console.log('Answer принят и установлен как RemoteDescription')
	}
}

//преверка соединения 
peerConnection.onsignalingstatechange = () => {
  console.log('signalingState:', peerConnection.signalingState)
}
//ещё одна проверка 
peerConnection.onconnectionstatechange = () => {
	console.log('Состояние соединения:', peerConnection.connectionState)

	if (peerConnection.connectionState === 'connected') {
		console.log('Соединение установлено. Можно использовать канал.');
		// Здесь можно начать работу с dataChannel
	}
}

peerConnection.oniceconnectionstatechange = () => {
	console.log('ICE-состояние:', peerConnection.iceConnectionState);
}

function sendMessage() {
  const input = document.getElementById('input');
  const msg = input.value;

  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(msg)
    //chatLog.innerHTML += `Вы: ${msg}<br>`
		addMessageYou(msg)
    input.value = '';
	}
}
function addMessageYou(text) {
	const chat = document.getElementById('chat')
	const message = document.createElement('p')
	message.textContent = text
	message.className = 'message__you'
	chat.appendChild(message)
}

function addMessageOther(text) {
	const chat = document.getElementById('chat')
	const message = document.createElement('p')
	message.textContent = text
	message.className = 'message__other' 
	chat.appendChild(message)
}


const input = document.querySelector('.message__input')
const sendButton = document.getElementById('sendButton')

input.addEventListener('keydown', event => {
	if (event.key === 'Enter') {
		event.preventDefault() 
		sendButton.click()
	}
})
