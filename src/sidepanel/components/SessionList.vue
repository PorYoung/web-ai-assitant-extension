<template>
  <div class="session-list">
    <div class="sessions">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ active: currentSessionId === session.id }"
        @click="selectSession(session.id)"
      >
        <div class="session-title">{{ session.title }}</div>
        <button class="delete-btn" @click.stop="deleteSession(session.id)">
          <span class="delete-icon">×</span>
        </button>
      </div>
    </div>
    <button class="floating-new-btn" @click="createNewSession">
      <span class="plus-icon">+</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { chatStorage } from '../utils/storage';

const sessions = ref([]);
const currentSessionId = ref('');

// 加载会话列表
const loadSessions = () => {
  sessions.value = chatStorage.getSessions();
  if (sessions.value.length > 0 && !currentSessionId.value) {
    currentSessionId.value = sessions.value[0].id;
  }
};

// 创建新会话
const createNewSession = () => {
  const newSession = chatStorage.createSession();
  loadSessions();
  currentSessionId.value = newSession.id;
};

// 删除会话
const deleteSession = (sessionId) => {
  if (confirm('确定要删除这个会话吗？')) {
    chatStorage.deleteSession(sessionId);
    loadSessions();
    if (currentSessionId.value === sessionId) {
      currentSessionId.value = sessions.value[0]?.id || '';
    }
  }
};

// 选择会话
const selectSession = (sessionId) => {
  currentSessionId.value = sessionId;
};

onMounted(() => {
  loadSessions();
});

// 导出给父组件使用的属性和方法
defineExpose({
  currentSessionId,
  loadSessions
});
</script>

<style scoped>
.session-list {
  width: 100%;
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sessions {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  margin: 4px 0;
  border-radius: 12px;
  cursor: pointer;
  background-color: white;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.session-item:hover {
  background-color: #f1f3f4;
  border-color: rgba(0, 0, 0, 0.08);
}

.session-item.active {
  background-color: #e8f0fe;
  border-color: #1a73e8;
}

.session-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #202124;
  font-size: 14px;
}

.delete-btn {
  background: none;
  border: none;
  color: #5f6368;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: rgba(26, 115, 232, 0.08);
  color: #1a73e8;
}

.delete-icon {
  font-size: 18px;
}

.floating-new-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #1a73e8;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(26, 115, 232, 0.25);
  transition: all 0.2s ease;
}

.floating-new-btn:hover {
  background-color: #1557b0;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(26, 115, 232, 0.3);
}

.plus-icon {
  font-size: 24px;
}
</style>