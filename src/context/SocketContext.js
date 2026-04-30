import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const SOCKET_URL = process.env.REACT_APP_API_BACKEND;
        const newSocket = io(SOCKET_URL, {
            autoConnect: false,
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket && user?._id) {
            socket.io.opts.query = { userId: user._id };
            socket.connect();
            
            socket.on("connect", () => {
                socket.emit("join-user", user._id);
            });

            return () => {
                socket.off("connect");
                socket.disconnect();
            };
        }
    }, [socket, user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
