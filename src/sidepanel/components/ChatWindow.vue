<template>
  <div class="chat-window">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="currentSession" class="messages-list">
        <div v-for="round in currentSession.messages" :key="round.roundId" class="message-round">
          <MessageBubble v-if="round.userMessage" message-type="user" :content="round.userMessage.content"
            :timestamp="round.userMessage.timestamp" :references="round.userMessage.references"
            @delete="deleteMessage(round.roundId)" />
          <MessageBubble v-if="round.aiMessage" message-type="assistant" :content="round.aiMessage.content"
            :timestamp="round.aiMessage.timestamp" @delete="deleteMessage(round.roundId)" />
        </div>
        <div v-if="streamingContent" class="message-round">
          <MessageBubble message-type="assistant" :content="streamingContent" :timestamp="new Date()"
            :is-streaming="true" />
        </div>
      </div>
      <div v-else class="no-session">
        <p>请选择或创建一个会话</p>
      </div>
    </div>
    <ChatInput v-if="currentSession" :initial-references="references" @send="handleSendMessage"
      @modelChange="handleModelChange" @clearMessages="clearMessages" @stopResponse="handleStopResponse" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { marked } from 'marked';
import MessageBubble from './MessageBubble.vue';
import ChatInput from './ChatInput.vue';
import { chatStorage } from '../utils/storage';
import { aiService } from '../services/aiService';
import { referenceService } from '../services/referenceService';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
});

const messagesContainer = ref(null);
const isLoading = ref(false);
const hasMoreMessages = ref(true);
const currentSession = ref(null);
const isInitSession = ref(true);
const streamingContent = ref('');
const curNewRound = ref(null);
const curFullResponse = ref('');

// 处理模型变更
const handleModelChange = (model) => {
  if (model) {
    try {
      aiService.initializeModel(model);
    } catch (error) {
      console.error('初始化模型失败:', error);
      // 这里可以添加错误提示UI
    }
  }
};

// 处理发送消息
const handleSendMessage = async (message) => {
  console.debug(message);

  if (!currentSession.value) return;

  // 获取最近10条历史消息
  const recentMessages = currentSession.value.messages
    .slice(-10)
    .map(round => [
      round.userMessage ? {
        role: 'user',
        content: round.userMessage.content
      } : null,
      round.aiMessage ? {
        role: 'assistant',
        content: round.aiMessage.content
      } : null
    ].filter(msg => msg !== null))
    .flat()
    .filter(msg => msg !== null);

  console.debug(recentMessages);

  // 处理引用内容
  const references = message.references || [];
  const referenceContexts = await referenceService.processReferences(references);

  // 添加用户消息
  curNewRound.value = chatStorage.addMessageRound(currentSession.value.id, message);
  if (curNewRound.value) {
    currentSession.value.messages.push(curNewRound.value);
  }

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  // 开始AI响应
  streamingContent.value = '';

  try {
    curFullResponse.value = await aiService.streamResponse(
      [...referenceContexts, ...recentMessages, {
        role: 'user',
        content: message.content
      }],
      (response) => {
        curFullResponse.value = response;
        const chunks = marked.parse(response);
        streamingContent.value = chunks;
        scrollToBottom();
      }
    );
    // 添加AI响应消息
    chatStorage.updateAIResponse(currentSession.value.id, curNewRound.value.roundId, curFullResponse.value);
    const round = currentSession.value.messages.find(msg => msg.roundId === curNewRound.value.roundId);
    if (round) {
      round.aiMessage = {
        content: curFullResponse.value,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('AI响应错误:', error);
  } finally {
    curFullResponse.value = '';
    streamingContent.value = '';
  }
  return;
};

// 初始化会话数据
const initSession = async () => {
  // 移除滚动事件监听器
  messagesContainer.value?.removeEventListener('scroll', handleScroll);

  isInitSession.value = true;
  const sessions = chatStorage.getSessions();
  const session = sessions.find(session => session.id === props.sessionId);
  if (!session) {
    currentSession.value = null;
    return;
  }

  currentSession.value = {
    id: session.id,
    title: session.title,
    messages: []
  };

  hasMoreMessages.value = true;
  isLoading.value = false;

  // 加载初始消息
  await loadMoreMessages();

  // 确保在DOM更新后执行滚动
  await nextTick();

  scrollToBottom();

  isInitSession.value = false;

  // 延迟添加滚动事件监听器
  setTimeout(() => {
    messagesContainer.value?.addEventListener('scroll', handleScroll);
  }, 1000);
};

// 加载更多消息
const loadMoreMessages = async () => {
  if (isLoading.value || !hasMoreMessages.value || !currentSession.value) return;

  isLoading.value = true;

  try {
    // 获取当前显示的第一条消息作为基准
    const lastMessageIndex = currentSession.value.messages[0]?.roundId;

    // 获取更多历史消息
    const oldMessages = chatStorage.getSessionMessages(props.sessionId, lastMessageIndex);
    if (oldMessages.length > 0) {
      // 保持滚动位置
      const scrollContainer = messagesContainer.value;
      const oldHeight = scrollContainer.scrollHeight;
      const oldScrollTop = scrollContainer.scrollTop;

      // 更新消息列表
      currentSession.value.messages = [...oldMessages, ...currentSession.value.messages];

      // 更新是否有更多消息的状态
      const totalMessages = chatStorage.getSessionMessageCount(props.sessionId);
      hasMoreMessages.value = currentSession.value.messages.length < totalMessages;

      if (lastMessageIndex != null) {
        await nextTick();

        // 调整滚动位置以保持视图稳定
        const newHeight = scrollContainer.scrollHeight;
        scrollContainer.scrollTop = newHeight - oldHeight + oldScrollTop;
      }
    } else {
      hasMoreMessages.value = false;
    }
  } catch (error) {
    console.error('加载历史消息失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 监听滚动事件
const handleScroll = () => {
  const container = messagesContainer.value;

  if (!container || isLoading.value || isInitSession.value) {
    return;
  }

  const scrollTop = container.scrollTop;
  const threshold = 100; // 滚动阈值

  // 只有在非初始化状态且滚动到顶部时才加载更多消息
  if (scrollTop <= threshold && hasMoreMessages.value) {
    loadMoreMessages();
  }
};

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', handleScroll);
  }
});

const references = ref([]);

// 处理发送消息
const handleSendMessageMock = async (message) => {
  if (!currentSession.value) return;

  // 添加新的对话轮次，包含引用内容
  curNewRound.value = chatStorage.addMessageRound(props.sessionId, message);
  if (curNewRound.value) {
    currentSession.value.messages = [...currentSession.value.messages, curNewRound.value];
  }

  // TODO: 这里添加调用AI接口的逻辑
  const aiResponse = '这是一个模拟的AI回复，请实现实际的AI调用逻辑。';

  // 更新AI回复
  chatStorage.updateAIResponse(props.sessionId, curNewRound.value.roundId, aiResponse);
  const round = currentSession.value.messages.find(msg => msg.roundId === curNewRound.value.roundId);
  if (round) {
    round.aiMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    };
  }

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  console.debug('发送消息:', currentSession.value);
};

// 删除消息
const deleteMessage = async (roundId) => {
  if (confirm('确定要删除这轮对话吗？')) {
    // 删除消息
    chatStorage.deleteMessageRound(props.sessionId, roundId);
    currentSession.value.messages = currentSession.value.messages.filter(msg => msg.roundId !== roundId);

    isLoading.value = false;

    // 获取最新的会话数据
    const sessions = chatStorage.getSessions();
    const session = sessions.find(s => s.id === props.sessionId);

    if (session) {
      // 获取分页后的消息
      const messages = chatStorage.getSessionMessages(props.sessionId, currentSession.value.messages[0]?.roundId);
      currentSession.value = {
        ...session,
        messages: messages
      };

      // 更新是否有更多消息的状态
      const totalMessages = chatStorage.getSessionMessageCount(props.sessionId);
      hasMoreMessages.value = totalMessages > currentSession.value.messages.length;

      // 等待DOM更新后调整滚动位置
      await nextTick();
    }
  }
};

// 监听会话变化
watch(
  () => props.sessionId,
  async () => {
    await initSession();
  }
);

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    const container = messagesContainer.value;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    container.scrollTop = scrollHeight - clientHeight;
  }
};

// 监听会话变化，只在新消息时自动滚动到底部
watch(
  () => currentSession.value?.messages,
  (newMessages, oldMessages) => {
    if (!newMessages || !oldMessages) return;

    // 判断是否为新消息（消息列表长度增加且最后一条消息不同）
    const isNewMessage = newMessages.length > oldMessages.length &&
      newMessages[newMessages.length - 1]?.roundId !== oldMessages[oldMessages.length - 1]?.roundId;

    if (isNewMessage) {
      nextTick(() => scrollToBottom());
    }
  },
  { deep: true }
);

onMounted(async () => {
  // 初始化会话
  await initSession();
});
// 清空消息
const clearMessages = async () => {
  if (!currentSession.value) return;

  // 清空当前会话的消息
  chatStorage.clearSessionMessages(currentSession.value.id);
  currentSession.value.messages = [];
  hasMoreMessages.value = false;
  isLoading.value = false;

  // 等待DOM更新后调整滚动位置
  await nextTick();
};

// 添加停止响应的处理函数
const handleStopResponse = () => {
  // 添加AI响应消息
  chatStorage.updateAIResponse(currentSession.value.id, curNewRound.value.roundId, curFullResponse.value);
  const round = currentSession.value.messages.find(msg => msg.roundId === curNewRound.value.roundId);
  if (round) {
    round.aiMessage = {
      content: curFullResponse.value,
      timestamp: new Date().toISOString()
    };
  }
  // 调用 AI 服务的停止方法
  aiService.stopResponse();
  // 清空流式内容
  streamingContent.value = '';
  curFullResponse.value = '';
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
  height: 100%;
  position: relative;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 8px;
  min-height: 100%;
}

.message-round {
  display: flex;
  flex-direction: column;
  gap: 12px;
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