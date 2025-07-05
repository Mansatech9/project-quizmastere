import { io } from 'socket.io-client';

export const socket = io(process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000', {
  path: '/api/socketio',
});