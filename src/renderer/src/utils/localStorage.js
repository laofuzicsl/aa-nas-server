/**
 * node中没有window和localStorage的概念，所以如果在主进程中需要这个方法的话
 * 需要将值传递过去，不能直接通过调用的方法进行获取
 */

export const setItem = (key, value) => {
  window.localStorage.setItem(key, value)
}

export const getItem = (key) => {
  return window.localStorage.getItem(key)
}

export const removeItem = (key) => {
  window.localStorage.removeItem(key)
}

export const clear = () => {
  window.localStorage.clear()
}
