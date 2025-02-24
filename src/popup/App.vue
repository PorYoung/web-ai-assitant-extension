<template>
  <div class="app">
    <div class="main-content">
      <div class="header">
        <button class="menu-btn" @click="toggleDrawer">
          <span class="menu-icon">☰</span>
        </button>
        <h2 class="title">Web AI Assistant</h2>
      </div>
      <ChatWindow :sessionId="currentSessionId" />
    </div>
    <div class="drawer-overlay" v-if="isDrawerOpen" @click="closeDrawer"></div>
    <div class="drawer" :class="{ 'drawer-open': isDrawerOpen }">
      <div class="drawer-header">
        <h2 class="drawer-title">会话列表</h2>
        <button class="close-btn" @click="closeDrawer">
          <span class="close-icon">×</span>
        </button>
      </div>
      <SessionList ref="sessionList" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ChatWindow from '../sidepanel/components/ChatWindow.vue';
import SessionList from '../sidepanel/components/SessionList.vue';

const sessionList = ref(null);
const currentSessionId = computed(() => sessionList.value?.currentSessionId || '');
const isDrawerOpen = ref(false);

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

const closeDrawer = () => {
  isDrawerOpen.value = false;
};
</script>

<style>
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  overflow: hidden;
  position: relative;
  background-color: #f8f9fa;
}

.main-content {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
}

.header {
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  height: 42px;
  box-sizing: border-box;
}

.menu-btn {
  background: none;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #5f6368;
  margin-right: 8px;
}

.menu-btn:hover {
  background-color: rgba(26, 115, 232, 0.08);
  color: #1a73e8;
}

.menu-icon {
  font-size: 20px;
  display: flex;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1a73e8;
  flex: 1;
  text-align: center;
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 3;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
}

.drawer {
  position: fixed;
  top: 0;
  left: -320px;
  width: 320px;
  height: 100vh;
  background-color: #ffffff;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 4;
  display: flex;
  flex-direction: column;
}

.drawer-open {
  left: 0;
}

.drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
}

.drawer-title {
  margin: 0;
  font-size: 18px;
  color: #202124;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #5f6368;
  font-size: 24px;
  line-height: 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: #202124;
}

.close-icon {
  display: block;
  height: 24px;
  width: 24px;
  line-height: 24px;
}
</style>