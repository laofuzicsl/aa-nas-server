/**
 * 文件操作工具类
 */

const { dialog, ipcMain } = require('electron')
const fs = require('fs')
const pathLib = require('path')
const axios = require('axios')
const FormData = require('form-data')
const os = require('os')
const { exec } = require('child_process')
const promisify = require('util').promisify
const execAsync = promisify(exec)

import { randomUUID } from 'crypto'
import { getAddress } from './config'
import { FOLDER_KEY, FILE_KEY } from '../../renderer/src/const/type'

// 拼接路径
const joinPath = (e, paths) => {
  if (!Array.isArray(paths)) return ''

  return pathLib.normalize(pathLib.join(...paths))
}

/**
 * 打开文件并读取文件的text
 */
export const readFile = () => {
  const filePath = this.getFilePath()
  const data = fs.readFile(filePath)
  return { filePath, data: data.toString() }
}
// 获取文件路径
export const getFilePath = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    // 文件过滤
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (!canceled) {
    return filePaths[0]
  }
  return ''
}
/**
 * 获取文件夹下所有文件路径
 */
export const getAllFilePathByFolderPath = async (e, dirPath) => {
  // if (!dirPath) {
  //   dirPath = pathLib.normalize('E:/study/file-serves/test')
  // }
  const pathArr = []
  if (dirPath) {
    // 读取文件夹下的所有文件
    const files = fs.readdirSync(dirPath)
    files.forEach((fileName) => {
      const filePath = pathLib.join(dirPath, fileName)
      const stats = fs.statSync(filePath)
      let isFile = stats.isFile()
      let isDir = stats.isDirectory()
      let fileType = (isDir || isFile) && isDir ? FOLDER_KEY : FILE_KEY
      pathArr.push({ path: filePath, fileName, fileType, ...stats })
    })
  }

  return pathArr
}

// 获取文件夹路径
export const getFolderPath = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (!canceled) {
    return filePaths[0]
  }
  return ''
}

// 根据文件的绝对路径或者文件的路径
const getFilePathByAbsolutePath = (e, path) => {
  if (!path) return ''

  return pathLib.dirname(path)
}

// 获取文件并获取同文件件下所有的同类型问题
// export const getFileAndAllFile = async () => {
//   const { canceled, filePaths } = await dialog.showOpenDialog({
//     // 文件过滤
//     filters: [
//       { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
//       { name: 'All Files', extensions: ['*'] }
//     ]
//   })
//   let data = { current: '', all: [] }
//   if (!canceled) {
//     data.current = filePaths[0]
//   }
//   // 判断选中的是否为图片
//   if (!isImage(data.current)) return null

//   data.all = getPeerFiles(data.current)

//   return data
// }

// 根据文件路径获取同级别路径下的所有文件
// export const getPeerFiles = (path) => {
//   if (path === '') {
//     return
//   }
//   const arr = path.split('\\')
//   arr.pop()
//   let dirPath = arr.join(`\\`)

//   const paths = []
//   if (dirPath) {
//     // 读取文件夹下的所有文件
//     const files = fs.readdirSync(dirPath)
//     files.forEach((path) => {
//       if (isImage(path)) {
//         paths.push(dirPath + '\\' + path)
//       }
//     })
//   }
//   return paths
// }

// 判断路径是否为图片路径
// const isImage = (path) => {
//   if (!path) return false
//   const reg = /(\.jpg|\.jpeg|\.JPG|\.JPEG|\.PNG|\.png|\.GIF|\.gif|\.'WebP')$/g
//   return reg.test(path)
// }

const createFolder = (folderPath) => {
  return new Promise((resolve, reject) => {
    const path = pathLib.normalize(folderPath)
    fs.access(path, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.log(`${path} 文件夹不存在。`)
          fs.mkdir(path, { recursive: true }, (err) => {
            if (err) {
              console.error(`${path} 文件夹创建失败：${err}`)
              reject(false)
            }
            console.log(`${path} 文件夹创建成功。`)
            resolve(true)
          })
        } else {
          console.error(`出现错误：${err}`)
          reject(false)
        }
      } else {
        console.log(`${path} 文件夹存在且具有访问权限。`)
        resolve(true)
      }
    })
  })
}

const download = (fileInfo, rootPath) => {
  return new Promise((resolve, reject) => {
    const { downloadUrl, fileName, currentPath, savePath } = fileInfo

    axios
      .get(downloadUrl, {
        responseType: 'stream'
      })
      .then(async (res) => {
        let copySavePath = pathLib.normalize(savePath)
        copySavePath = copySavePath.replace(pathLib.normalize(rootPath), '')

        // 在根目录下时，需要使用本地存储的rootPath作为保存路径
        const filePath = pathLib.join(rootPath, copySavePath, fileName)
        // 判断保存路径是否存在
        const folderPath = pathLib.dirname(filePath)
        const bRes = await createFolder(folderPath)
        if (!bRes) reject(false)

        const writer = fs.createWriteStream(filePath)
        res.data.pipe(writer)
        writer.on('finish', () => {
          // console.log(fileName, '下载完成')
          resolve(true)
        })
        writer.on('error', (err) => {
          reject(false)
        })
      })
      .catch((err) => {
        reject(false)
      })
  })
}

const downloadFile = (e, { fileInfo, rootPath }) => {
  return download(fileInfo, rootPath)
}

const uploadFile = (e, { filePath, savePath, targetInfo, selfInfo }) => {
  return new Promise((resolve, reject) => {
    // 判断文件是否存在
    if (!fs.existsSync(filePath)) {
      reject(false)
    }

    // 获取文件大小
    const stat = fs.statSync(filePath)
    const fileSize = stat.size

    const CHUNK_SIZE = 1024 * 1024 * 5 // 固定每次读取文件的大小5M，将文件分块上传
    const readStream = fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE }) // 创建可读流

    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE) // 计算文件分块的总数

    let index = 0 // 当前文件块的索引
    const uuid = randomUUID() // 生成一个唯一的uuid,用于文件名
    const fileName = pathLib.basename(filePath)

    readStream.on('data', (chunk) => {
      readStream.pause() // 暂停读取文件
      // console.log('pause write', `file_name_${uuid}${pathLib.extname(fileName)}`)

      const formData = new FormData()

      formData.append('totalChunks', totalChunks)
      formData.append('chunkIndex', index)

      // formData.append('file', chunk, fileName)
      formData.append('file', chunk, `file_name_${uuid}${pathLib.extname(fileName)}%%${index}`)
      formData.append('tempFileName', `file_name_${uuid}${pathLib.extname(fileName)}`)

      formData.append('filePath', filePath)
      formData.append('fileName', fileName)
      formData.append('savePath', savePath) // 在客户端上当前的保存路径
      formData.append('selfInfo', selfInfo)
      formData.append('targetInfo', JSON.stringify(targetInfo))
      formData.append('serverIP', getAddress().SERVER_IP) // 服务端地址

      index++

      axios
        .post(`${getAddress().SERVER_ADDR}/file/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then((res) => {
          // if (res.code === 200) {
          //   console.log(fileName, '文件上传成功', res)
          // }
        })
        .finally(() => {
          readStream.resume() // 恢复读取文件
          // console.log('recover write', `file_name_${uuid}${pathLib.extname(fileName)}`)
        })
    })

    readStream.on('end', () => {
      resolve(`${filePath} 文件上传完成`)
    })

    readStream.on('error', (err) => {
      reject(`${filePath} 文件上传失败 ${err}`)
    })
  })
}

// 将选中的要上传的文件信息进行重组
const regroupUploadFileInfo = (e, { fileList, currentPath, rootPath }) => {
  if (fileList.length === 0) return []

  const res = []

  const getFileInfo = (path, rootPath) => {
    const stats = fs.statSync(path)
    if (stats.isDirectory()) {
      const files = fs.readdirSync(path)

      const filePaths = files.map((fileName) => pathLib.join(pathLib.normalize(path), fileName))
      filePaths.forEach((filePath) => getFileInfo(filePath, rootPath))
    } else {
      // 使用文件所在的文件夹路径与根路径做对比，获取到文件到服务后要保存的路径
      const filePath = pathLib.dirname(path)
      const savePath = filePath.replace(pathLib.normalize(rootPath), '')

      res.push({
        path,
        fileName: pathLib.basename(path),
        size: stats.size,
        type: pathLib.extname(path),
        savePath
      })
    }
  }

  fileList.forEach((path) => {
    getFileInfo(path, rootPath)
  })
  return res
}

// const uploadFile = (e, { data, rootPath, targetInfo, selfInfo }) => {
//   console.log('正在上传文件', data, targetInfo)
//   const { paths, currentPath } = data
//   const fileListInfo = regroupUploadFileInfo({ fileList: paths, currentPath, rootPath })
//   console.log('文件信息', fileListInfo)
//   fileListInfo.forEach((item) => {
//     const { path, savePath } = item
//     // upload(path, savePath, targetInfo, selfInfo)
//     uploadController.add({
//       path,
//       savePath,
//       targetInfo,
//       selfInfo
//     })
//   })
// }

// 获取windows系统中所有的盘符
// const getWindowsDrives = () => {
//   const drives = []
//   if (os.platform() === 'win32') {
//     const fs = require('fs')
//     const driveLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
//     for (const letter of driveLetters) {
//       const drivePath = `${letter}:\\`
//       if (fs.existsSync(drivePath)) {
//         drives.push(drivePath)
//       }
//     }
//   }
//   return drives
// }

// 获取当前电脑上最大的盘符及所剩空间
const getLargestFreeSpacePartitionWindows = async () => {
  let maxFreeSpace = 0
  let maxFreeDisk = null
  const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption')
  const lines = stdout.split('\n').filter(Boolean)
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/).filter(Boolean)
    const freeSpace = parseInt(parts[1])
    if (freeSpace > maxFreeSpace) {
      maxFreeSpace = freeSpace
      maxFreeDisk = parts[0]
    }
  }
  return { drive: maxFreeDisk, freeSpace: maxFreeSpace }
}

// 删除文件或者文件夹
const deleteFileOrFolder = (filePath) => {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath)
      files.forEach((file) => deleteFileOrFolder(pathLib.join(filePath, file)))
      fs.rmdirSync(filePath)
    } else {
      fs.unlinkSync(filePath)
    }
  }
}

const deleteFile = (e, { paths }) => {
  paths.forEach((filePath) => {
    deleteFileOrFolder(filePath)
  })

  return true
}

// 创建文件夹
const newFolder = (e, data) => {
  return createFolder(data)
}

// 校验文件是否存在
export const checkFileExistSync = (e, paths) => {
  if (!Array.isArray(paths)) {
    return []
  }

  paths.forEach((item) => {
    try {
      if (fs.existsSync(item.checkPath)) {
        item.exist = true
      } else {
        item.exist = false
      }
    } catch (err) {
      item.exist = false
    }
  })
  return paths
}

// 打开文件
ipcMain.handle('getAllFilePathByFolderPath', getAllFilePathByFolderPath)
// 获取文件夹下所有文件路径
ipcMain.handle('getFilePathByAbsolutePath', getFilePathByAbsolutePath)
// 下载文件到指定路径
ipcMain.handle('downloadFile', downloadFile)
// 上传文件到指定客户端
ipcMain.handle('uploadFile', uploadFile)
// 获取文件夹路径
ipcMain.handle('getFolderPath', getFolderPath)
// 获取当前电脑上最大的盘符及所剩空间
ipcMain.handle('getLargestFreeSpacePartitionWindows', getLargestFreeSpacePartitionWindows)
// 转换解析上传的文件数据
ipcMain.handle('regroupUploadFileInfo', regroupUploadFileInfo)
// 删除文件或者文件夹
ipcMain.handle('deleteFile', deleteFile)
// 创建文件夹
ipcMain.handle('newFolder', newFolder)
// 拼接路径
ipcMain.handle('joinPath', joinPath)
// 检查文件是否存在
ipcMain.handle('checkFileExistSync', checkFileExistSync)
