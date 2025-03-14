<template>
  <div class="container">
    <el-main>
      <el-form :model="formState" label-width="110px">
        <el-form-item label="文件服务路径：">
          <div class="form-content">
            <el-input
              style="min-width: 290px"
              v-model="formState.fileServerPath"
              placeholder="请输入文件服务路径"
              disabled
            ></el-input>
            <el-button style="margin-left: 10px" type="primary" plain @click="selectSavePath"
              >选取路径</el-button
            >
          </div>
        </el-form-item>
      </el-form>
    </el-main>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getItem, setItem } from '../../utils/localStorage'
import { NAS_FOLDER_PATH } from '../../const/user_key'
import { useRouter } from 'vue-router'

const router = useRouter()

const formState = reactive({
  fileServerPath: ''
})

// 返回
const back = () => {
  router.back()
}

const selectSavePath = async () => {
  const folderPath = await window.api.getFolderPath()
  if (!folderPath) return
  formState.fileServerPath = folderPath
  setItem(NAS_FOLDER_PATH, folderPath)
}

const initSet = async () => {
  let folderPath = getItem(NAS_FOLDER_PATH)
  if (!folderPath) {
    // 在页面刚加载的时候已经出对路径进行了检查，这里理论上不会走到这个判断
    const res = await window.api.getLargestFreeSpacePartitionWindows()
    console.log(
      `在 Windows 系统下，剩余空间最大的分区是：${res.drive}，剩余空间为 ${res.freeSpace / 1024 / 1024 / 1024} GB。`
    )
    folderPath = res.drive
  }
  formState.fileServerPath = folderPath
  setItem(NAS_FOLDER_PATH, folderPath)
}

onMounted(() => {
  initSet()
})
</script>

<style lang="less" scoped>
.container {
  padding: 15px;
  .form-content {
    display: flex;
  }
}
</style>
