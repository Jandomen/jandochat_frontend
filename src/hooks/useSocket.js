import { useEffect, useRef } from "react";
import socket from "../socket/socketChat";
import useAuth from "../hooks/useAuth";

export default function useSocket(eventHandlers = {}) {
  const handlersRef = useRef(eventHandlers);
  const { user } = useAuth();

  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    if (!user?._id) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-user", user._id);

    const handlers = handlersRef.current;
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [user?._id]);

  return socket;
}
