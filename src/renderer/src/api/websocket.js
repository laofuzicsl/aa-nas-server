// import { ElMessage } from 'element-plus'
import { getItem } from '../utils/localStorage'
import { USER_ID_KEY, getSelfInfo, NAS_FOLDER_PATH } from '../const/user_key'
import { OperationType, BroadcastType } from '../const/enum'
import { useGlobalStore } from '../stores/global'
import { debounce } from 'lodash-es'
import { downloadController } from '../controller/DownloadController'
import { uploadController } from '../controller/UploadController'
import { useConfigStore } from '../stores/config'

const globalStore = useGlobalStore()
const configStore = useConfigStore()

let ws = null
let reconnectTimer = null
let connectStatus = false

const resetClientOnline = debounce(() => {
  globalStore.setClientOnline(false)
}, 6000)

const reconnect = () => {
  reconnectTimer = setTimeout(() => {
    if (ws && ws.readyState === WebSocket.CLOSED && getItem(USER_ID_KEY)) {
      console.log('websocket连接断开，正在尝试重连')
      initWebSocket()
    }
  }, 1000)
}

export const initWebSocket = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('websocket已连接，无需再次连接')
    return
  }

  ws = new WebSocket(`${configStore.SERVER_ADDR_WS}?userId=${getSelfInfo(true)}`)

  ws.onopen = () => {
    if (!connectStatus) {
      window.api.notification.clientOnlineNotification()
      connectStatus = true
    }

    console.log('websocket连接已打开')
    resetClientOnline()
  }

  ws.onclose = () => {
    if (connectStatus) {
      window.api.notification.clientOfflineNotification()
      connectStatus = false
    }
    console.log('websocket连接已关闭')
    reconnect()
  }

  ws.onerror = (err) => {
    console.log('websocket连接发生错误', err)
  }

  ws.onmessage = wsOnMessage
}

const wsOnMessage = async (e) => {
  const msg = JSON.parse(e.data)

  const { dataInfo, selfInfo, targetInfo } = msg

  if (!dataInfo) return

  const { type, data } = dataInfo

  console.error('type------', type, 'data------', data)

  if (type === OperationType.UPLOAD) {
    // console.log('客户端要上传的文件', dataInfo)
    // window.api.downloadFile({ fileInfo: data, rootPath: getItem(NAS_FOLDER_PATH) })
    downloadController.add({ fileInfo: data, rootPath: getItem(NAS_FOLDER_PATH), selfInfo })
  } else if (type === OperationType.DOWNLOAD) {
    // const { paths, currentPath } = data
    // const fileListInfo = await window.api.regroupUploadFileInfo({
    //   fileList: paths,
    //   currentPath,
    //   rootPath: getItem(NAS_FOLDER_PATH)
    // })
    // console.log('文件信息', fileListInfo)
    data.forEach((item) => {
      const { path, savePath } = item
      uploadController.add({
        path,
        savePath,
        targetInfo: selfInfo,
        selfInfo: getSelfInfo(true)
      })
    })
  } else if (type === OperationType.REQ_FILE_LIST) {
    let folderPath = data
    if (!data) {
      folderPath = getItem(NAS_FOLDER_PATH)
    }
    const files = await window.api.getAllFilePathByFolderPath(folderPath)

    wsSend({ type: OperationType.FILE_LIST, data: files }, selfInfo)
  } else if (type === BroadcastType.HEARTBEAT) {
    if (data === 'ping') {
      wsSend(
        { type: BroadcastType.HEARTBEAT, data: { data: 'pong', mac: globalStore.macAddress } },
        selfInfo
      )
      globalStore.setClientOnline(true)
      resetClientOnline()
    }
  } else if (type === OperationType.DELETE) {
    window.api.deleteFile({ paths: data }).then((res) => {
      if (res) {
        wsSend({ type: OperationType.REFRESH, data: null }, selfInfo)
      }
    })
  } else if (type === OperationType.CREATE_FOLDER) {
    const path1 = await window.api.joinPath([getItem(NAS_FOLDER_PATH)])
    let path = await window.api.joinPath([data])

    if (!path.includes(path1)) {
      path = await window.api.joinPath([getItem(NAS_FOLDER_PATH), data])
    }

    window.api.newFolder(path).then((res) => {
      if (res) {
        wsSend({ type: OperationType.REFRESH, data: null }, selfInfo)
      }
    })
  } else if (type === OperationType.DOWNLOAD_FILE_IS_EXIST) {
    const { paths, currentPath } = data
    window.api
      .regroupUploadFileInfo({
        fileList: paths,
        currentPath,
        rootPath: getItem(NAS_FOLDER_PATH)
      })
      .then((fileListInfo) => {
        wsSend({ type: OperationType.DOWNLOAD_FILE_IS_EXIST_INFO, data: fileListInfo }, selfInfo)
      })
  } else if (type === OperationType.UPLOAD_FILE_IS_EXIST) {
    if (!Array.isArray(data)) return

    for (let i = 0; i < data.length; i++) {
      const { fileName, savePath } = data[i]
      data[i].checkPath = await window.api.joinPath([
        savePath ? savePath : getItem(NAS_FOLDER_PATH),
        fileName
      ])
    }

    const res = await window.api.checkFileExistSync(data)
    wsSend({ type: OperationType.UPLOAD_FILE_IS_EXIST_INFO, data: res }, selfInfo)
  }
}

export const wsSend = (dataInfo, targetInfo) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    let jsonData = {
      dataInfo,
      selfInfo: getSelfInfo(),
      targetInfo: targetInfo
    }
    jsonData = JSON.stringify(jsonData)

    ws.send(jsonData)
  } else {
    console.log('未连接服务器')
  }
}

export const wsClose = () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
    ws.close()
  }
}
