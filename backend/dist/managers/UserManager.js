"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const RoomManager_1 = require("./RoomManager");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager_1.RoomManager();
    }
    addUser(name, socket) {
        this.users.push({
            name, socket
        });
        this.queue.push(socket.id);
        socket.send("lobby");
        this.clearQueue();
        this.initHandler(socket);
    }
    removeUser(socketId) {
        const user = this.users.filter(x => x.socket.id === socketId);
        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x => x === socketId);
    }
    clearQueue() {
        if (this.queue.length < 2) {
            return;
        }
        const id1 = this.queue.pop();
        const id2 = this.queue.pop();
        const user1 = this.users.find(x => x.socket.id === id1);
        const user2 = this.users.find(x => x.socket.id === id2);
        //here we have to establish a SDP for the users to talk to each other
        if (!user1 || !user2) {
            return;
        }
        const room = this.roomManager.createRoom(user1, user2);
        this.clearQueue();
    }
    initHandler(socket) {
        socket.on("offer", ({ sdp, roomId }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        socket.on("answer", ({ sdp, roomId }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidate(roomId, socket.id, candidate, type);
        });
    }
}
exports.UserManager = UserManager;
