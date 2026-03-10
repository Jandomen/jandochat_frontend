import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

class CallSocket {
  constructor() {
    this.socket = null;
    this.userId = null;
  }

  connect(userId) {
    this.userId = userId;
    
    if (this.socket?.connected) {
      this.socket.emit("join-user", userId);
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      this.socket.emit("join-user", userId);
    });

    this.socket.on("connect_error", (err) => {
      console.error("Error de conexión:", err.message);
    });

    return this.socket;
  }

  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event) {
    if (!this.socket) return;
    this.socket.off(event);
  }

  emit(event, data) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data);
  }

  startCall(to, caller) {
    this.emit("call:start", { to, caller });
  }

  acceptCall(to, callerId) {
    this.emit("call:accept", { to, callerId });
  }

  rejectCall(to, callerId) {
    this.emit("call:reject", { to, callerId });
  }

  endCall(to, callerId) {
    this.emit("call:end", { to, callerId });
  }

  sendOffer(to, offer, callerId) {
    this.emit("webrtc:offer", { to, offer, callerId });
  }

  sendAnswer(to, answer, callerId) {
    this.emit("webrtc:answer", { to, answer, callerId });
  }

  sendIceCandidate(to, candidate, callerId) {
    this.emit("webrtc:ice-candidate", { to, candidate, callerId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const callSocket = new CallSocket();
export default callSocket;
