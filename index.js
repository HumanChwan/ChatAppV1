import express from 'express';
import { Room, User } from './Classes.js';
const app = express();
app.use(express.static('public'));
const port = process.env.PORT || 3000;
import { createServer } from 'http';
const server = createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);
const setTyping = new Set();

const allClients = [];
const publicChat = new Room('public chat', true, 'Free-Chat');
const DMRooms = [];

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

function formRoomID(userID, clientID) {
	if (userID < clientID) {
		return userID + clientID;
	} else {
		return clientID + userID;
	}
}

function formNewRooms(user) {
	allClients.forEach((client) => {
		let newRoomID = formRoomID(user.senderID, client.senderID);
		const newRoom = new Room('DM', false, newRoomID);
		newRoom.appendMembers(user);
		newRoom.appendMembers(client);
		DMRooms.push(newRoom);
	});
}

io.on('connection', (socket) => {
	console.log('connect');

	socket.on('public chat join', (userName) => {
		io.to(socket.id).emit(
			'initiate Chat',
			allClients.map((user) => [
				user.userName,
				formRoomID(user.senderID, socket.id),
			]),
			publicChat
		);
		const newUser = new User(socket.id, userName);

		formNewRooms(newUser);
		allClients.push(newUser);
		publicChat.appendMembers(newUser);

		socket.broadcast.emit('Public connect', userName, socket.id);
	});

	socket.on('DM chat join', (roomID) => {
		const i = allClients.findIndex((user) => user.senderID === socket.id);
		const j = DMRooms.findIndex((room) => roomID === room.RoomID);
		allClients[i].ChatTo = roomID;
		io.to(socket.id).emit(
			'initiate Chat',
			allClients.map((user) => {
				if (user.senderID !== socket.id) {
					return [
						user.userName,
						formRoomID(user.senderID, socket.id),
					];
				}
			}),
			DMRooms[j]
		);
	});

	socket.on('disconnect', () => {
		const i = allClients.findIndex((user) => user.senderID === socket.id);
		const userLeft = allClients[i];
		allClients.splice(i, 1);
		io.emit('Public disconnect', userLeft?.userName, userLeft?.senderID);
	});

	socket.on('message', (message, senderName) => {
		const i = allClients.findIndex((user) => user.senderID === socket.id);
		const sender = allClients[i];
		if (sender.ChatTo === 'Free-Chat') {
			publicChat.appendMessage(message, socket.id, senderName);
			socket.broadcast.emit(
				'message',
				message,
				senderName,
				sender.ChatTo
			);
		} else {
			io.to(sender.ChatTo.replace(socket.id, '')).emit(
				'message',
				message,
				senderName,
				sender.ChatTo
			);
			const j = DMRooms.findIndex(
				(room) => room.RoomID === sender.ChatTo
			);
			DMRooms[j].appendMessage(message, socket.id, senderName);
		}
	});

	socket.on('typing', (userName, roomID) => {
		if (!setTyping.has(userName)) {
			socket.broadcast.emit('isTyping', userName, roomID);
			setTyping.add(userName);
			setTimeout(() => {
				setTyping.delete(userName);
			}, 1000);
		}
	});
});

server.listen(port, () => {
	console.log(`listening at http://localhost:${port}`);
});
