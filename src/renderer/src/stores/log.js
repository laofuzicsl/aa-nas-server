import { defineStore } from 'pinia'
import { getCurrentTime } from '../utils'

/**
 * 暂时没用
 */
export const useLogStore = defineStore(`global-log`, {
  state: () => ({
    log: {}
  }),
  actions: {
    addLog(log) {
      this.log = `${log}--${getCurrentTime()}`
    }
  }
})
