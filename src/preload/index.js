import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { STARTUP_PARAMETERS } from '../renderer/src/const/window'

// 渲染器的定制api
const api = {
  /**
   * 充当消息中间件
   */
  message: (callback) => {
    ipcRenderer.on(STARTUP_PARAMETERS, (param, message) =>
      callback({ type: STARTUP_PARAMETERS, data: message })
    )
  },
  notification: {
    clientOfflineNotification: () => ipcRenderer.invoke('clientOfflineNotification'), // 服务器离线通知
    clientOnlineNotification: () => ipcRenderer.invoke('clientOnlineNotification') // 服务器在线通知
  },
  getAllFilePathByFolderPath: (path) => ipcRenderer.invoke('getAllFilePathByFolderPath', path), // 获取文件夹目录下的所有文件
  getFilePathByAbsolutePath: (path) => ipcRenderer.invoke('getFilePathByAbsolutePath', path), // 根据文件绝对路径，获取文件路径
  downloadFile: (data) => ipcRenderer.invoke('downloadFile', data), // 下载文件
  uploadFile: (data) => ipcRenderer.invoke('uploadFile', data), // 更新文件
  getFolderPath: () => ipcRenderer.invoke('getFolderPath'), // 获取文件夹路径
  getLargestFreeSpacePartitionWindows: () =>
    ipcRenderer.invoke('getLargestFreeSpacePartitionWindows'), // 获取windows下最大的可用磁盘空间
  regroupUploadFileInfo: (data) => ipcRenderer.invoke('regroupUploadFileInfo', data), // 重组文件上传信息
  deleteFile: (data) => ipcRenderer.invoke('deleteFile', data), // 删除文件或者文件夹
  newFolder: (data) => ipcRenderer.invoke('newFolder', data), // 创建文件夹
  joinPath: (data) => ipcRenderer.invoke('joinPath', data), // 拼接路径
  checkFileExistSync: (data) => ipcRenderer.invoke('checkFileExistSync', data), // 检查文件是否存在
  getMacAddress: () => ipcRenderer.invoke('getMacAddress'), // 获取mac地址

  // 配置文件相关
  readConfig: () => ipcRenderer.invoke('readConfig'), // 读取配置文件
  writeConfig: (data) => ipcRenderer.invoke('writeConfig', data), // 写入配置文件
  getAddress: () => ipcRenderer.invoke('getAddress') // 获取服务器地址
}

// 使用'contextBridge' api只在启用上下文隔离的情况下将Electron api暴露给渲染器，否则只添加到DOM全局。
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
