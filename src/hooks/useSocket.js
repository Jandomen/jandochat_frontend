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

    const onConnect = () => {
      // console.log("Socket re-connected, re-joining rooms...");
      socket.emit("join-user", user._id);
    };

    socket.on("connect", onConnect);
    socket.emit("join-user", user._id);

    // Dynamic listener that always uses the latest handler
    const createListener = (eventName) => (data) => {
      if (handlersRef.current[eventName]) {
        handlersRef.current[eventName](data);
      }
    };

    const listeners = {};
    Object.keys(eventHandlers).forEach((event) => {
      listeners[event] = createListener(event);
      socket.on(event, listeners[event]);
    });

    return () => {
      socket.off("connect", onConnect);
      Object.entries(listeners).forEach(([event, listener]) => {
        socket.off(event, listener);
      });
      // socket.disconnect(); // We keep it connected as a singleton
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]); // Only re-setup on user change

  return socket;
}
