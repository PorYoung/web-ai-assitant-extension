<template>
  <div class="chat-input">
    <ReferenceList :references="references" @remove="removeReference" />
    <div class="chat-input-wrapper">
      <textarea v-model="messageInput" @keydown.enter="handleEnterKey" @input="adjustTextareaHeight"
        placeholder="输入消息，按Enter发送，Shift+Enter换行" ref="messageTextarea" rows="1"></textarea>
      <div class="chat-toolbar">
        <select class="model-selector" v-model="selectedModel">
          <option v-for="model in modelConfigs" :key="model.name" :value="model">{{ model.name || '未命名模型' }}</option>
        </select>
        <button class="toolbar-button" title="引用当前页面" @click="addCurrentPageReference">
          <span>#️⃣</span>
        </button>
        <button class="toolbar-button" title="模型设置" @click="showModelSettings">
          <span>⚙️</span>
        </button>
      </div>
    </div>
    <ModelSettings v-model:modelSettingsVisible="modelSettingsVisible" @save="handleModelConfigsSave" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import ReferenceList from './ReferenceList.vue';
import ModelSettings from './ModelSettings.vue';

const props = defineProps({
  initialReferences: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['send']);

// 添加引用当前页面的函数
const addCurrentPageReference = () => {
  // 获取当前标签页信息
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs.length > 0 && tabs[0];
    if (tab) {
      console.log(tabs);

      if (!tabs[0].url && !tabs[0].id) return;

      const newReference = {
        type: "page",
        id: tab.id,
        tabId: tab.id,
        url: tab.url,
        title: tab.title || '未命名页面',
        description: tab.title || ''
      };

      // 检查是否已存在相同URL的引用
      if (!references.value.some(ref => ref.id === newReference.id)) {
        references.value.push(newReference);
      }
    }
  });
};

const messageInput = ref('');
const messageTextarea = ref(null);
const references = ref(props.initialReferences);

// 移除引用
const removeReference = (url) => {
  references.value = references.value.filter(ref => ref.url !== url);
};

// 发送消息
const sendMessage = () => {
  if (!messageInput.value.trim()) return;

  emit('send', {
    content: messageInput.value.trim(),
    references: references.value
  });

  messageInput.value = '';
};

// 调整文本框高度
const adjustTextareaHeight = () => {
  const textarea = messageTextarea.value;
  if (!textarea) return;

  // 重置高度以获取正确的scrollHeight
  textarea.style.height = 'auto';

  // 计算行数（每行大约20px，上下padding各14px）
  const lineHeight = 20;
  const padding = 28; // 14px * 2
  const maxHeight = lineHeight * 8 + padding;

  // 设置新高度，但不超过最大高度
  const newHeight = Math.min(textarea.scrollHeight, maxHeight);
  textarea.style.height = `${newHeight}px`;
};

// 监听输入内容变化
watch(messageInput, () => {
  nextTick(() => adjustTextareaHeight());
});

// 处理Enter键事件
const handleEnterKey = (e) => {
  if (e.shiftKey) {
    // Shift+Enter: 插入换行
    e.preventDefault();
    messageInput.value += '\n';
  } else {
    // 仅Enter: 发送消息
    e.preventDefault();
    sendMessage();
  }
};

const modelSettingsVisible = ref(false);
const modelConfigs = ref([]);
const selectedModel = ref(null);

// 从localStorage加载模型配置
onMounted(() => {
  const savedConfigs = localStorage.getItem('modelConfigs');
  if (savedConfigs) {
    modelConfigs.value = JSON.parse(savedConfigs);
    if (modelConfigs.value.length > 0) {
      selectedModel.value = modelConfigs.value[0];
    }
  }
});

// 显示模型设置
const showModelSettings = () => {
  modelSettingsVisible.value = true;
};

// 处理模型配置保存
const handleModelConfigsSave = (configs) => {
  modelConfigs.value = configs;
  if (configs.length > 0 && !configs.includes(selectedModel.value)) {
    selectedModel.value = configs[0];
  }
  emit('modelChange', selectedModel.value);
};

// 监听模型选择变化
watch(selectedModel, (newModel) => {
  if (newModel) {
    emit('modelChange', newModel);
  }
});
</script>

<style scoped>
.chat-input {
  padding: 16px;
  background: linear-gradient(to top, rgba(255, 255, 255, 1) 90%, rgba(255, 255, 255, 0.8));
}

.chat-input-wrapper {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.chat-input-wrapper:focus-within {
  border-color: #1a73e8;
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.12);
  transform: translateY(-1px);
}

textarea {
  width: 100%;
  resize: none;
  border: none;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  background-color: transparent;
  transition: all 0.2s ease;
  min-height: 24px;
  max-height: 150px;
  color: #202124;
}

textarea::placeholder {
  color: #5f6368;
  opacity: 0.8;
}

textarea:focus {
  outline: none;
}

.chat-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  gap: 8px;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  border-radius: 16px;
  cursor: pointer;
  color: #5f6368;
  transition: all 0.2s ease;
}

.toolbar-button:active {
  transform: scale(0.95);
}

.toolbar-button span {
  font-size: 18px;
}

.model-selector {
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  color: #5f6368;
  background-color: white;
  cursor: pointer;
  margin-right: 8px;
}

.model-selector:hover {
  border-color: #1a73e8;
}

.model-selector:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}
</style>