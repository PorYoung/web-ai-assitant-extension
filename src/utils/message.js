import { notification } from './notification';

const message = {
  success(message) {
    notification.success(message, {
      duration: 3000
    });
  },

  error(message) {
    notification.error(message, {
      duration: 5000
    });
  },

  warning(message) {
    notification.warning(message, {
      duration: 4000
    });
  },

  info(message) {
    notification.info(message, {
      duration: 3000
    });
  }
};

export default message;