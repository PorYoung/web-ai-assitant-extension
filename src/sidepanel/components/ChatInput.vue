<template>
  <div class="chat-input">
    <ReferenceList :references="references" @remove="removeReference" />
    <div class="chat-input-wrapper">
      <textarea v-model="messageInput" @keydown.enter="handleEnterKey" @input="adjustTextareaHeight"
        placeholder="输入消息，按Enter发送，Shift+Enter换行" ref="messageTextarea" rows="1"></textarea>

      <div class="chat-toolbar">
        <button class="toolbar-button" title="引用历史消息">
          <span>↑</span>
        </button>
        <button class="toolbar-button" title="上传图片">
          <span>📷</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import ReferenceList from './ReferenceList.vue';

const props = defineProps({
  initialReferences: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['send']);

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
</style>