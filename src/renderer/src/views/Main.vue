<template>
  <div class="main">
    <div class="main-top">
      <!-- <p>一款将旧电脑变成文件存储设备的的软件</p> -->
      <Set></Set>
    </div>
    <div class="toolbar">
      <User></User>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { getItem, setItem } from '../utils/localStorage'
import { NAS_FOLDER_PATH, USER_ID_KEY } from '../const/user_key'
import { initWebSocket, wsSend } from '../api/websocket'
import User from './components/User.vue'
import { useGlobalStore } from '../stores/global'
import { useConfigStore } from '../stores/config'
import Set from './set/Set.vue'

const globalStore = useGlobalStore()
const configStore = useConfigStore()

const router = useRouter()

const initBaseInfo = async () => {
  const addressInfo = await window.api.getAddress()
  if (addressInfo) {
    configStore.setServerIP(addressInfo.SERVER_IP)
    configStore.setServerAddr(addressInfo.SERVER_ADDR)
    configStore.setServerAddrWs(addressInfo.SERVER_ADDR_WS)
  }

  let folderPath = getItem(NAS_FOLDER_PATH)
  if (!folderPath) {
    const res = await window.api.getLargestFreeSpacePartitionWindows()
    console.log(
      `在 Windows 系统下，剩余空间最大的分区是：${res.drive}，剩余空间为 ${res.freeSpace / 1024 / 1024 / 1024} GB。`
    )
    setItem(NAS_FOLDER_PATH, res.drive)
  }

  // 获取Mac地址
  const macAddress = await window.api.getMacAddress()
  console.log(`mac地址为：${macAddress}`)
  globalStore.setMacAddress(macAddress)
}

onMounted(async () => {
  await initBaseInfo()

  const userId = getItem(USER_ID_KEY)
  if (userId) {
    initWebSocket()
  } else {
    // 跳转到登录页面
    router.push('/login')
  }
})
</script>

<style lang="less" scoped>
.main {
  width: 100vw;
  height: 100vh;
  .main-top {
    height: calc(100vh - 30px);
    padding: 15px;
    overflow: hidden;
    &:hover {
      overflow-y: auto;
    }
  }

  .toolbar {
    background-color: #409eff;
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 30px;
    display: flex;
    align-items: center;
  }
}
</style>
