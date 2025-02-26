import { createApp, h } from 'vue';
import Notification from '@/components/Notification.vue';

let notificationInstance = null;

const createNotification = () => {
    if (notificationInstance) {
        return notificationInstance;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);

    const app = createApp(Notification);
    const instance = app.mount(container);
    notificationInstance = instance;

    return instance;
};

const notification = {
    info(message, options = {}) {
        const instance = createNotification();
        return instance.notify({ message, type: 'info', ...options });
    },

    success(message, options = {}) {
        const instance = createNotification();
        return instance.notify({ message, type: 'success', ...options });
    },

    warning(message, options = {}) {
        const instance = createNotification();
        return instance.notify({ message, type: 'warning', ...options });
    },

    error(message, options = {}) {
        const instance = createNotification();
        return instance.notify({ message, type: 'error', ...options });
    },

    close(id) {
        if (notificationInstance) {
            notificationInstance.close(id);
        }
    }
};

export { notification };