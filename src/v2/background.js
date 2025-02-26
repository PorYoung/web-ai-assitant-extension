// 监听扩展图标点击事件
chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { type: 'toggleSidebar' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
    }
  });
});

// 初始化上下文菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'aiAssistant',
    title: 'AI Assistant',
    contexts: ['selection']
  });
});

// 处理上下文菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'aiAssistant' && info.selectionText) {
    // 发送选中的文本到content script
    chrome.tabs.sendMessage(tab.id, {
      type: 'addSelectReference',
      selectedText: info.selectionText,
      url: tab.url
    });
  }
});

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'addSelectReference') {
    // 将消息转发到popup，添加错误处理
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error forwarding message:', chrome.runtime.lastError);
      }
      // 确保sendResponse被调用
      sendResponse({ success: true });
    });
    return true; // 保持消息通道开放
  }
  return false; // 对于其他类型的消息，关闭消息通道
});