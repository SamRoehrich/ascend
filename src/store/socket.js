import { writable } from 'svelte/store';

const messageStore = writable('');

const socket = new WebSocket("ws://localhost:8080/ws");

socket.addEventListener('open', function(event) {
	console.log("Open the gates")
})

socket.addEventListener('message', function(event) {
	messageStore.set(event.data)

})

const sendMessage = (message) => {
	if (socket.readyState <= 1) {
		socket.send(message)
	}
}


export default {
	subscribe: messageStore.subscribe,
	sendMessage
}
