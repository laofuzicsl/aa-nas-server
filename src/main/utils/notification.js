import { ipcMain, Notification } from 'electron'

function showNotification(title, body) {
  new Notification({ title, body }).show()
}

function clientOfflineNotification() {
  showNotification('通知', '客户端不在线，请检查网络连接')
}

function clientOnlineNotification() {
  showNotification('通知', '客户端在线')
}

ipcMain.handle('clientOnlineNotification', clientOnlineNotification)
ipcMain.handle('clientOfflineNotification', clientOfflineNotification)
ipcMain.handle('showNotification', showNotification)

export { clientOfflineNotification, clientOnlineNotification, showNotification }
