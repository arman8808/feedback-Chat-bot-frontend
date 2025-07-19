import { io } from "socket.io-client";

let socket;

export const connectSocket = (token) => {
  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
  });

  return socket;
};

export const getSocket = () => socket;
