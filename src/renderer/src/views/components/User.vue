<template>
  <div class="container">
    <div class="left-container">
      <el-dropdown placement="top" trigger="click">
        <div class="user-avatar">
          <el-icon><Avatar /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>个人中心</el-dropdown-item>
            <!-- <el-dropdown-item @click="set">偏好设置</el-dropdown-item> -->
            <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <div class="user-name">{{ globalStore.userInfo.userName || getItem(USER_NAME_KEY) }}</div>
    </div>
    <div class="right-container">
      <div class="status">
        <div class="desc">{{ globalStore.clientOnline ? '客户端在线' : '客户端离线' }}</div>
        <div :class="{ icon: true, 'online-icon': globalStore.clientOnline }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useGlobalStore } from '../../stores/global'
import { setItem, getItem, removeItem } from '../../utils/localStorage'
import { TOKEN_KEY, USER_ID_KEY, USER_NAME_KEY } from '../../const/user_key'
import { Avatar } from '@element-plus/icons-vue'
import { wsClose } from '../../api/websocket'

const router = useRouter()
const globalStore = useGlobalStore()

const logout = () => {
  // 移除缓存信息
  globalStore.setUserInfo({})
  removeItem(USER_NAME_KEY)
  removeItem(USER_ID_KEY)
  removeItem(TOKEN_KEY)
  // 断开websocket连接
  wsClose()
  // 跳转到登录页面
  router.push('/login')
}

// const set = () => {
//   router.push('/set')
// }
</script>

<style lang="less" scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  width: 100%;
  padding-left: 15px;
  padding-right: 15px;
  font-size: 14px;
  .left-container {
    display: flex;
    align-items: center;
    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background-color: burlywood;
      margin-right: 10px;
      text-align: center;
      line-height: 25px;
    }
    .user-name {
      line-height: 30px;
      font-size: 14px;
    }
  }
  .right-container {
    display: flex;
    align-items: center;
    .status {
      display: flex;
      align-items: center;
      margin-left: 10px;
      .desc {
        line-height: 30px;
      }
      .icon {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: red;
        margin-left: 6px;
      }
      .online-icon {
        background-color: green;
      }
    }
  }
}
</style>
