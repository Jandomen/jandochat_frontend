import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_BACKEND;

const socketChat = io(`${SOCKET_URL}`, {
  autoConnect: false,
});

export default socketChat;

