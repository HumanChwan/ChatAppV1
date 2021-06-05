class Message {
	constructor(content, senderID, userName) {
		this.senderID = senderID;
		this.userName = userName;
		this.content = content;
	}
}

export class User {
	constructor(socketID, userName = 'Anonymous') {
		this.senderID = socketID;
		this.userName = userName;
		this.ChatTo = 'Free-Chat';
	}

	setUserName(userName) {
		this.userName = userName;
	}
}
export class Room {
	constructor(RoomName, isPublic, id) {
		this.public = isPublic;
		this.accessTo = [];
		this.RoomName = RoomName;
		this.chatData = [];
		this.RoomID = id;
	}

	appendMessage(content, senderID, userName) {
		this.chatData.push(new Message(content, senderID, userName));
	}

	appendMembers(user) {
		this.accessTo.push(user);
	}
}
