// import { MAX_DOWNLOAD_COUNT, NAS_FOLDER_SAVE_PATH } from '../const/user_key'
import { getItem } from '../utils/localStorage'
import { UPDATE_DOWNLOAD_PROGRESS } from '../const/event_name'

/**
 * @description 下载管理类
 * 负责文件下载管理和状态更新
 */

class UploadController {
  constructor() {
    this.reserveList = [] // 预备下载列表
    this.uploadingList = new Map() // 正在下载列表

    // 监听下载进度的消息
    window.api.message((message) => {
      const { type, data } = message

      // if (type === UPDATE_DOWNLOAD_PROGRESS) {
      //   uploadListStore.updateStatus({
      //     path: data.filePath,
      //     status: data.data
      //   })
      // }
    })
  }

  // 添加下载任务
  add(item) {
    this.reserveList.push(item)

    // 触发下载动作
    if (this.reserveList.length > 0) {
      this.start()
    }
  }

  // 删除下载任务
  delete(fileInfo) {}

  // 启动下载进程
  start() {
    const maxUploadCount = 3

    while (this.uploadingList.size < maxUploadCount && this.reserveList.length > 0) {
      const item = this.reserveList.shift()
      const { path, savePath, targetInfo, selfInfo } = item
      this.uploadingList.set(path, item)

      window.api
        .uploadFile({ filePath: path, savePath, targetInfo, selfInfo })
        .then((res) => {})
        .catch((err) => {})
        .finally(() => {
          this.uploadingList.delete(path)
          this.start()
        })
    }
  }
}

export const uploadController = new UploadController()
