import { getItem } from '../utils/localStorage'
import { useGlobalStore } from '../stores/global'

// token的key值
export const TOKEN_KEY = 'file-serves-token'

// 用户id的key值
export const USER_ID_KEY = 'file-serves-user-id'

// 用户名的key值
export const USER_NAME_KEY = 'file-serves-user-name'

// 数据文件夹路径
export const NAS_FOLDER_PATH = 'file-serves-nas-folder-path'

export const getUserId = () => getItem(USER_ID_KEY)
// export const getUserId = () => '3dca2ee2-4a25-47f6-9933-c736385f83c1'

const globalStore = useGlobalStore()

export const getSelfInfo = (isString = false) => {
  const userId = getItem(USER_ID_KEY)

  let res = {
    userId,
    deviceType: 'server',
    deviceModel: 'PC',
    mac: globalStore.macAddress
  }
  if (isString) {
    res = JSON.stringify(res)
  }

  return res
}
