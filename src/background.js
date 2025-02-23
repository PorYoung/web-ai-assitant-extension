// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 切换侧边栏状态
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.sidePanel.open({ windowId: tab.windowId });
});