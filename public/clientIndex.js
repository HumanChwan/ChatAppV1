var socket = io();

const SendMessage = document.getElementById('message-form');
const EnterName = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const input = document.getElementById('input');
const messages = document.getElementById('messageInterface');
const typing = document.getElementById('typing-list');
const messageBlock = document.getElementById('messaging');
const container = document.querySelector('.container');
const memberList = document.getElementById('member-info');
const address = document.getElementById('chatting-with');
const type = document.querySelector('.typing');
let userName = 'Anonymous';
let isTyping = [];
let RoomID = '';

function updateIsTyping(newUserName = false) {
	if (newUserName) isTyping.push(newUserName);
	if (isTyping.length === 0) {
		type.innerHTML = '';
		return;
	}
	console.log(isTyping);
	let typingShow = '...';
	if (isTyping.length < 4) {
		typingShow += isTyping
			.map((memberName) => {
				return `<span style="font-weight: 700">${memberName}</span>`;
			})
			.join(', ');
		typingShow += isTyping.length === 1 ? ' is ' : ' are ';
	} else {
		typingShow += 'Several People are ';
	}
	typingShow += 'typing';
	type.innerHTML = typingShow;
	setTimeout(() => {
		const i = isTyping.indexOf(newUserName);
		isTyping.splice(i, 1);
		updateIsTyping();
	}, 1000);
}

function messageAppend(messageContent, classes) {
	const para = document.createElement('p');
	para.className = classes;
	para.innerHTML = messageContent;
	messages.appendChild(para);
	messages.scrollTop = messages.scrollHeight;
}

function flushMessages() {
	messages.innerHTML = '';
}

function flushMemberList() {
	memberList.innerHTML = '';
}

function memberListAppend(anotherUser) {
	if (anotherUser === null) return;

	const memberInfo = document.createElement('button');
	memberInfo.classList.add(`unit-member`);
	memberInfo.innerHTML = `<span class="green-circle"></span> <span>${anotherUser[0]}</span>`;
	memberInfo.id = anotherUser[1];
	memberList.appendChild(memberInfo);

	if (anotherUser[1] === 'self') return;

	memberInfo.addEventListener('click', () => {
		console.log('hi');
		socket.emit('DM chat join', anotherUser[1]);
	});
}

function formRoomName(RoomAccessors) {
	let addressName = '@';
	addressName += RoomAccessors.map((user) => {
		if (user.senderid !== socket.id) {
			return user.userName;
		}
	}).join(', @');
	return addressName;
}

function formRoomID(userID, clientID) {
	if (userID < clientID) {
		return userID + clientID;
	} else {
		return clientID + userID;
	}
}

EnterName.addEventListener('submit', (e) => {
	e.preventDefault();
	if (nameInput.value) {
		userName = nameInput.value;
		socket.emit('public chat join', userName);
		EnterName.classList.add('hidden');
		messageBlock.classList.remove('hidden');
		container.classList.add('flex');
		memberList.classList.remove('hidden');
	}
});

function formMessageContent(content, sender) {
	return `<span class="name-header">${sender}</span><br>${content}`;
}

SendMessage.addEventListener('submit', (e) => {
	e.preventDefault();
	if (input.value) {
		socket.emit('message', input.value, userName);
		messageAppend(
			formMessageContent(input.value, userName),
			'message self'
		);
		input.value = '';
	}
});

input.addEventListener('keyup', () => {
	if (input.value !== '') socket.emit('typing', userName, RoomID);
});

socket.on('isTyping', (newUserName, roomID) => {
	if (roomID === RoomID) updateIsTyping(newUserName);
});

socket.on('message', (message, name, roomID) => {
	console.log(RoomID, roomID);
	if (roomID === RoomID)
		messageAppend(formMessageContent(message, name), 'message');
});

socket.on('Public connect', (joinedUserName, userID) => {
	messageAppend(`${joinedUserName} joined the chat`, 'c-dc');
	memberListAppend([joinedUserName, formRoomID(userID, socket.id)]);
});

socket.on('Public disconnect', (leftUserName, userID) => {
	messageAppend(`${leftUserName} left the chat`, 'c-dc');
	const member = document.getElementById(formRoomID(userID, socket.id));
	memberList.removeChild(member);
});

socket.on('initiate Chat', (chatMembers, Room) => {
	flushMemberList();
	flushMessages();
	input.value = '';
	isTyping.splice(0, isTyping.length);
	memberListAppend([`${userName}(You)`, 'self']);
	console.log(chatMembers);
	chatMembers.forEach((userData) => memberListAppend(userData));

	Room.chatData.forEach((message) => {
		messageAppend(
			formMessageContent(message.content, message.userName),
			`message ${message.senderID === socket.id ? 'self' : ''}`
		);
	});

	RoomID = Room.RoomID;
	console.log(Room);
	address.innerText = Room.public
		? Room.RoomName
		: formRoomName(Room.accessTo);
});
