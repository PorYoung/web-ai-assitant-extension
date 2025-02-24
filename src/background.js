// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToReferences',
    title: '引用当前页面问AI',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: "sendSelectedText",
    title: "使用选中的文本询问AI",
    contexts: ["selection"]
  });
});

// 存储引用列表的数据结构
let referencesList = [];

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToReferences') {
    const reference = {
      type: "page",
      id: tab.id,
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString()
    };

    // 通知侧边栏更新引用列表
    chrome.runtime.sendMessage({
      type: 'addReference',
      reference: reference
    });
  } else if (info.menuItemId === 'sendSelectedText') {
    const selectedText = info.selectionText;
    chrome.runtime.sendMessage({
      type: 'addSelectReference',
      selectedText: selectedText,
      url: tab.url
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
  } else if (message.type === 'clearReferences') {
    // 清空引用列表
    referencesList = [];
    sendResponse(referencesList);
  } else if (message.type === 'fetchUrl') {
    // 处理URL请求
    fetch(message.url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('Fetch error:', error);
        // 如果是跨域错误，尝试不带headers重新请求
        if (error.message.includes('CORS')) {
          return fetch(message.url, { mode: 'no-cors' })
            .then(response => response.text())
            .then(data => {
              sendResponse({ success: true, data: data });
            })
            .catch(finalError => {
              sendResponse({ success: false, error: finalError.message });
            });
        }
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放以进行异步响应
  }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 切换侧边栏状态
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.sidePanel.open({ windowId: tab.windowId });
});