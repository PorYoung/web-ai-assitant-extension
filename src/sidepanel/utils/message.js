import { ElMessage } from 'element-plus';

const message = {
  success(message) {
    ElMessage({
      message,
      type: 'success',
      duration: 3000
    });
  },

  error(message) {
    ElMessage({
      message,
      type: 'error',
      duration: 5000
    });
  },

  warning(message) {
    ElMessage({
      message,
      type: 'warning',
      duration: 4000
    });
  },

  info(message) {
    ElMessage({
      message,
      type: 'info',
      duration: 3000
    });
  }
};

export default message;