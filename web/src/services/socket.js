import { io } from 'socket.io-client'
import { useAuthStore } from '../store'
import { useAlertStore } from '../store'

let socket = null

export function connectSocket() {
  if (socket?.connected) return socket

  socket = io('/', {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: { token: useAuthStore.getState().accessToken },
  })

  socket.on('connect', () => {
    console.log('[DEAS] Socket connected:', socket.id)
    const user = useAuthStore.getState().user
    if (user) {
      if (user.base_id) socket.emit('join:base', user.base_id)
      if (user.unit_id) socket.emit('join:unit', user.unit_id)
      socket.emit('join:user', user.id)
      if (['BASE_ADMIN','SUPER_ADMIN','QUARTERMASTER'].includes(user.role)) {
        socket.emit('join:admins')
      }
    }
  })

  socket.on('alert:created', () => {
    useAlertStore.getState().incrementUnread()
  })

  socket.on('disconnect', (reason) => {
    console.log('[DEAS] Socket disconnected:', reason)
  })

  return socket
}

export function getSocket() { return socket }

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
