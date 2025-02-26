<template>
  <Teleport to="body">
    <TransitionGroup
      name="notification"
      tag="div"
      class="notification-container"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="[
          `notification-${notification.type}`,
          notification.position
        ]"
        @mouseenter="clearTimer(notification)"
        @mouseleave="startTimer(notification)"
      >
        <div class="notification-icon" v-if="notification.type">
          <span v-if="notification.type === 'info'">ℹ️</span>
          <span v-else-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else-if="notification.type === 'error'">❌</span>
        </div>
        <div class="notification-content">
          <h4 v-if="notification.title" class="notification-title">{{ notification.title }}</h4>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button class="notification-close" @click="close(notification.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const notifications = ref([]);
const timers = new Map();

const props = defineProps({
  duration: {
    type: Number,
    default: 4500
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => [
      'top-right',
      'top-left',
      'bottom-right',
      'bottom-left'
    ].includes(value)
  }
});

const notify = (options) => {
  const notification = {
    id: Date.now(),
    title: options.title || '',
    message: options.message || '',
    type: options.type || 'info',
    duration: options.duration ?? props.duration,
    position: options.position || props.position
  };

  notifications.value.push(notification);
  startTimer(notification);

  return notification.id;
};

const close = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    clearTimer({ id });
    notifications.value.splice(index, 1);
  }
};

const startTimer = (notification) => {
  if (notification.duration > 0) {
    const timer = setTimeout(() => {
      close(notification.id);
    }, notification.duration);
    timers.set(notification.id, timer);
  }
};

const clearTimer = (notification) => {
  const timer = timers.get(notification.id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(notification.id);
  }
};

onUnmounted(() => {
  timers.forEach(timer => clearTimeout(timer));
});

defineExpose({
  notify,
  close
});
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  width: 100%;
  height: 0;
}

.notification {
  position: fixed;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  border-radius: 4px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  margin-bottom: 16px;
  width: 330px;
  transition: all 0.3s;
}

.notification-top-right {
  top: 20px;
  right: 20px;
}

.notification-top-left {
  top: 20px;
  left: 20px;
}

.notification-bottom-right {
  bottom: 20px;
  right: 20px;
}

.notification-bottom-left {
  bottom: 20px;
  left: 20px;
}

.notification-icon {
  margin-right: 12px;
  font-size: 20px;
}

.notification-content {
  flex: 1;
  margin-right: 12px;
}

.notification-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.notification-message {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

.notification-close {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 0;
  border: none;
  background: none;
  color: #909399;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #606266;
}

.notification-info {
  border-left: 4px solid #909399;
}

.notification-success {
  border-left: 4px solid #67C23A;
}

.notification-warning {
  border-left: 4px solid #E6A23C;
}

.notification-error {
  border-left: 4px solid #F56C6C;
}

/* 过渡动画 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease-out;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>