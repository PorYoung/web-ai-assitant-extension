<template>
  <div class="chat-window">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="currentSession" class="messages-list">
        <div v-for="round in currentSession.messages" :key="round.roundId" class="message-round">
          <div v-if="round.userMessage" class="message user">
            <div class="message-meta">
              <button class="delete-message-btn" @click="deleteMessage(round.roundId)" title="删除这轮对话">
                ×
              </button>
              <span class="message-time">{{ formatTime(round.userMessage.timestamp) }}</span>
            </div>
            <div class="message-content">
              <p>{{ round.userMessage.content }}</p>
            </div>
          </div>
          <div v-if="round.aiMessage" class="message assistant">
            <div class="message-meta">
              <span class="message-time">{{ formatTime(round.aiMessage.timestamp) }}</span>
              <button class="delete-message-btn" @click="deleteMessage(round.roundId)" title="删除这轮对话">
                ×
              </button>
            </div>
            <div class="message-content">
              <p>{{ round.aiMessage.content }}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-session">
        <p>请选择或创建一个会话</p>
      </div>
    </div>
    <div class="chat-input" v-if="currentSession">
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
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { chatStorage } from '../utils/storage';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
});

const messageInput = ref('');
const messagesContainer = ref(null);
const currentPage = ref(1);
const isLoading = ref(false);
const hasMoreMessages = ref(true);

// 获取当前会话的消息
const currentSession = computed(() => {
  const sessions = chatStorage.getSessions();
  const session = sessions.find(session => session.id === props.sessionId);
  if (!session) return null;

  // 获取分页消息
  const lastMessageIndex = currentPage.value === 1 ? null : currentSession.value?.messages[0]?.roundId;
  const messages = chatStorage.getSessionMessages(props.sessionId, lastMessageIndex);

  // 更新是否有更多消息的状态
  const totalMessages = chatStorage.getSessionMessageCount(props.sessionId);
  hasMoreMessages.value = messages.length < totalMessages;

  // 创建一个新的响应式会话对象
  return {
    id: session.id,
    title: session.title,
    messages: messages
  };
});

// 加载更多消息
const loadMoreMessages = async () => {
  if (isLoading.value || !hasMoreMessages.value || !currentSession.value) return;

  isLoading.value = true;

  // 获取当前显示的第一条消息作为基准
  const firstMessage = currentSession.value.messages[0];
  if (!firstMessage) {
    isLoading.value = false;
    return;
  }

  // 保持滚动位置
  const scrollContainer = messagesContainer.value;
  const oldHeight = scrollContainer.scrollHeight;

  // 增加页码以加载更多消息
  currentPage.value++;

  await nextTick();

  const newHeight = scrollContainer.scrollHeight;
  if (newHeight > oldHeight) { // 只在高度增加时调整滚动位置
    scrollContainer.scrollTop = newHeight - oldHeight;
  }

  isLoading.value = false;
};

// 监听滚动事件
const handleScroll = () => {
  const container = messagesContainer.value;
  if (container.scrollTop <= 100) { // 当滚动到顶部100px范围内时加载更多
    loadMoreMessages();
  }
};

// 发送消息
const sendMessage = async () => {
  if (!messageInput.value.trim() || !currentSession.value) return;

  // 添加新的对话轮次
  const newRound = chatStorage.addMessageRound(props.sessionId, messageInput.value.trim());
  if (newRound) {
    currentSession.value.messages = [...currentSession.value.messages, newRound];
  }

  messageInput.value = '';

  // TODO: 这里添加调用AI接口的逻辑
  const aiResponse = '这是一个模拟的AI回复，请实现实际的AI调用逻辑。';

  // 更新AI回复
  chatStorage.updateAIResponse(props.sessionId, newRound.roundId, aiResponse);
  const round = currentSession.value.messages.find(msg => msg.roundId === newRound.roundId);
  if (round) {
    round.aiMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    };
  }

  messageInput.value = '';
  currentPage.value = 1; // 重置到第一页以显示最新消息

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  console.log('发送消息:', currentSession.value);
};

// 删除消息
const deleteMessage = async (roundId) => {
  if (confirm('确定要删除这轮对话吗？')) {
    // 删除消息
    chatStorage.deleteMessageRound(props.sessionId, roundId);
    currentSession.value.messages = currentSession.value.messages.filter(msg => msg.roundId !== roundId);

    // 重置分页状态
    currentPage.value = 1;
    isLoading.value = false;

    // 获取最新的会话数据
    const sessions = chatStorage.getSessions();
    const session = sessions.find(s => s.id === props.sessionId);

    if (session) {
      // 获取分页后的消息
      const messages = chatStorage.getSessionMessages(props.sessionId, currentPage.value);
      currentSession.value = {
        ...session,
        messages: messages
      };

      // 更新是否有更多消息的状态
      const totalMessages = chatStorage.getSessionMessageCount(props.sessionId);
      const pageSize = 10;
      hasMoreMessages.value = totalMessages > pageSize;

      // 等待DOM更新后调整滚动位置
      await nextTick();
      if (messages.length > 0) {
        scrollToBottom();
      }
    }
  }
};

// 监听会话变化
watch(
  () => props.sessionId,
  () => {
    currentPage.value = 1;
    hasMoreMessages.value = true;
    nextTick(() => scrollToBottom());
  }
);

// 添加滚动事件监听
onMounted(() => {
  messagesContainer.value?.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  messagesContainer.value?.removeEventListener('scroll', handleScroll);
});

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr;
  } else if (isYesterday) {
    return `昨天 ${timeStr}`;
  } else {
    return `${date.toLocaleDateString('zh-CN')} ${timeStr}`;
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    const container = messagesContainer.value;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    container.scrollTop = scrollHeight - clientHeight;
  }
};

// 监听会话变化，自动滚动到底部
watch(
  () => currentSession.value?.messages,
  () => {
    nextTick(() => scrollToBottom());
  },
  { deep: true }
);

const messageTextarea = ref(null);

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

// 组件挂载时初始化高度
onMounted(() => {
  adjustTextareaHeight();
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
.chat-window {
  display: flex;
  flex-direction: column;
  height: calc(100% - 42px);
  background-color: #ffffff;
  position: relative;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
  scroll-behavior: smooth;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 8px;
}

.message-round {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  min-width: 50%;
  animation: fadeIn 0.3s ease-out;
  gap: 4px;
}

.message.user {
  align-self: flex-end;
}

.message.user .message-meta {
  align-self: flex-end;
}

.message-content {
  padding: 14px 18px;
  border-radius: 4px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.message.user .message-content {
  background: linear-gradient(135deg, #1a73e8, #1557b0);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  background-color: #f8f9fa;
  color: #202124;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  opacity: 0.7;
  padding: 0 4px;
}

.message-time {
  color: #5f6368;
}

.message.user .message-time {
  color: #1a73e8;
}

.delete-message-btn {
  background: none;
  border: none;
  color: #5f6368;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
}

.message:hover .delete-message-btn {
  opacity: 1;
}

.delete-message-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

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

.no-session {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #5f6368;
  font-size: 16px;
  background: #f8f9fa;
}
</style>