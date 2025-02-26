<template>
  <Teleport to="body">
    <TransitionGroup
      name="confirm"
      tag="div"
      class="confirm-container"
    >
      <div
        v-for="dialog in dialogs"
        :key="dialog.id"
        class="confirm-dialog"
        :class="dialog.position"
      >
        <div class="confirm-content">
          <div class="confirm-header">
            <h4 class="confirm-title">{{ dialog.title }}</h4>
            <button class="confirm-close" @click="handleCancel(dialog.id)">
              ×
            </button>
          </div>
          <div class="confirm-body">
            {{ dialog.message }}
          </div>
          <div class="confirm-footer">
            <button
              class="confirm-button confirm-cancel"
              @click="handleCancel(dialog.id)"
            >
              {{ dialog.cancelText }}
            </button>
            <button
              class="confirm-button confirm-confirm"
              @click="handleConfirm(dialog.id)"
            >
              {{ dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const dialogs = ref([]);

const props = defineProps({
  position: {
    type: String,
    default: 'center',
    validator: (value) => [
      'center',
      'top',
      'bottom'
    ].includes(value)
  }
});

const confirm = (options) => {
  return new Promise((resolve, reject) => {
    const dialog = {
      id: Date.now(),
      title: options.title || '确认',
      message: options.message || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      position: options.position || props.position,
      resolve,
      reject
    };

    dialogs.value.push(dialog);
  });
};

const handleConfirm = (id) => {
  const index = dialogs.value.findIndex(d => d.id === id);
  if (index !== -1) {
    const dialog = dialogs.value[index];
    dialog.resolve(true);
    dialogs.value.splice(index, 1);
  }
};

const handleCancel = (id) => {
  const index = dialogs.value.findIndex(d => d.id === id);
  if (index !== -1) {
    const dialog = dialogs.value[index];
    dialog.reject(false);
    dialogs.value.splice(index, 1);
  }
};

defineExpose({
  confirm
});
</script>

<style scoped>
.confirm-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.confirm-dialog {
  position: fixed;
  background: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  width: 420px;
  padding: 20px;
}

.confirm-dialog.center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.confirm-dialog.top {
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
}

.confirm-dialog.bottom {
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
}

.confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.confirm-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.confirm-close {
  padding: 0;
  border: none;
  background: none;
  color: #909399;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s;
}

.confirm-close:hover {
  color: #606266;
}

.confirm-body {
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 20px;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-cancel {
  border: 1px solid #dcdfe6;
  background: white;
  color: #606266;
}

.confirm-cancel:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.confirm-confirm {
  border: 1px solid #409eff;
  background: #409eff;
  color: white;
}

.confirm-confirm:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

/* 过渡动画 */
.confirm-enter-active,
.confirm-leave-active {
  transition: all 0.3s ease-out;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>