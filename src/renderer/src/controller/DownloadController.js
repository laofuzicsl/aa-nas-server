// import { MAX_DOWNLOAD_COUNT, NAS_FOLDER_SAVE_PATH } from '../const/user_key'
import { UploadStatus } from '../const/enum'
import { getItem } from '../utils/localStorage'

import { UPDATE_DOWNLOAD_PROGRESS, UPDATE_UPLOAD_PROGRESS } from '../const/event_name'
import { wsSend } from '../api/websocket'

/**
 * @description 下载管理类
 * 负责文件下载管理和状态更新
 */

class DownloadController {
  constructor() {
    this.reserveList = [] // 预备下载列表
    this.downloadingList = new Map() // 正在下载列表
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
    const maxDownloadCount = 10

    while (this.downloadingList.size < maxDownloadCount && this.reserveList.length > 0) {
      const item = this.reserveList.shift()
      const { fileInfo, selfInfo } = item

      this.downloadingList.set(fileInfo.filePath, item)

      const { uploadPath } = fileInfo
      // 发送文件已经在服务端进行下载的状态
      wsSend(
        { type: UPDATE_UPLOAD_PROGRESS, data: { uploadPath, status: UploadStatus.DONE2 } },
        selfInfo
      )

      window.api
        .downloadFile(item)
        .then((res) => {
          wsSend(
            {
              type: UPDATE_UPLOAD_PROGRESS,
              data: { uploadPath, status: UploadStatus.DONE3 }
            },
            selfInfo
          )
        })
        .catch((err) => {
          wsSend(
            {
              type: UPDATE_UPLOAD_PROGRESS,
              data: { uploadPath, status: UploadStatus.FAIL }
            },
            selfInfo
          )
        })
        .finally(() => {
          // 不管成功还是失败都将该文件从正在下载列表中删除
          this.downloadingList.delete(fileInfo.serverFilePath)
          this.start()
        })
    }
  }
}

export const downloadController = new DownloadController()
