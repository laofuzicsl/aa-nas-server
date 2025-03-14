const { ipcMain } = require('electron')
const macaddress = require('node-macaddress')

// 获取设备的MAC地址
export const getMacAddress = async () => {
  try {
    const macs = await macaddress.all()
    const keys = Object.keys(macs)

    if (keys.length === 0) return null

    const mac = macs[keys[0]].mac

    console.log('MAC Address: ', mac)
    return mac
  } catch (error) {
    console.error('Failed to obtain the mac address: ', error.message)
    return null
  }
}

ipcMain.handle('getMacAddress', getMacAddress)
