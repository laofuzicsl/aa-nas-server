import { defineStore } from 'pinia'

export const useGlobalStore = defineStore(`global-var`, {
  state: () => ({
    userInfo: {},
    clientOnline: false, // 客户端是否在线
    macAddress: '' // mac地址
  }),
  actions: {
    setUserInfo(info) {
      this.userInfo = info
    },

    setClientOnline(status) {
      this.clientOnline = status
    },

    setMacAddress(mac) {
      this.macAddress = mac
    }
  }
})
