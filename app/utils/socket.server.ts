import { Server } from "socket.io";

let io: Server;

export function initSocket(server: any) {
  if (io) return io;
  io = new Server(server);
  return io;
}

export { io };
