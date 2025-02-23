// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToReferences',
    title: '引用当前页面问AI',
    contexts: ['page']
  });
});

// 存储引用列表的数据结构
let referencesList = [];

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToReferences') {
    const reference = {
      type: "page",
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString()
    };

    // 将引用添加到列表中
    referencesList.push(reference);

    // 通知侧边栏更新引用列表
    chrome.runtime.sendMessage({
      type: 'addReference',
      reference: reference
    });
  }
});

// 处理来自侧边栏的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getReferences') {
    // 返回当前引用列表
    sendResponse(referencesList);
  } else if (message.type === 'removeReference') {
    // 从列表中移除指定引用
    referencesList = referencesList.filter(ref => ref.url !== message.url);
    sendResponse(referencesList);
  }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 切换侧边栏状态
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.sidePanel.open({ windowId: tab.windowId });
});