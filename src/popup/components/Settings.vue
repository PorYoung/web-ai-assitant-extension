<template>
  <div class="settings-container">
    <div class="settings-form">
      <div class="form-group">
        <label for="sidebarUrl">自定义侧边栏URL：</label>
        <input
          type="url"
          id="sidebarUrl"
          v-model="sidebarUrl"
          placeholder="请输入URL地址"
          @input="handleUrlChange"
        />
      </div>
      <div class="url-preview" v-if="sidebarUrl">
        预览：{{ sidebarUrl }}
      </div>
      <div class="form-footer">
        <button class="save-btn" @click="$emit('back')">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const sidebarUrl = ref('');

// 从Chrome存储中加载URL
onMounted(async () => {
  try {
    const result = await chrome.storage.sync.get(['sidebarUrl']);
    if (result.sidebarUrl) {
      sidebarUrl.value = result.sidebarUrl;
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
});

// 处理URL变更
const handleUrlChange = async () => {
  try {
    await chrome.storage.sync.set({ sidebarUrl: sidebarUrl.value });
  } catch (error) {
    console.error('保存配置失败:', error);
  }
};

defineEmits(['back']);
</script>

<style scoped>
.settings-container {
  padding: 20px;
  background-color: #fff;
  height: calc(100vh - 42px);
  box-sizing: border-box;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  color: #202124;
  font-weight: 500;
}

input {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  color: #202124;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.url-preview {
  font-size: 12px;
  color: #5f6368;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  word-break: break-all;
}

.form-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: 8px 16px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background-color: #1557b0;
}

.save-btn:active {
  transform: scale(0.98);
}
</style>