import dayjs from 'dayjs'

// 根据路径获取文件名称
export function getFileNameFromPath(path) {
  if (typeof path !== 'string') return ''
  if (path === '') return ''

  const arr = path.split('/')
  if (arr.length > 0) return arr[arr.length - 1]

  return ''
}

// 获取当前时间
export function getCurrentTime() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}
