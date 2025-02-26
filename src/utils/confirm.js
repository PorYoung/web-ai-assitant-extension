import { createApp, h } from 'vue';
import Confirm from '../components/Confirm.vue';

let confirmInstance = null;

const createConfirm = () => {
  if (confirmInstance) {
    return confirmInstance;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);

  const app = createApp(Confirm);
  const instance = app.mount(container);
  confirmInstance = instance;

  return instance;
};

const confirm = (options = {}) => {
  const instance = createConfirm();
  return instance.confirm(options);
};

export { confirm };