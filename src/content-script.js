// 创建侧边栏容器
function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.id = 'web-ai-assistant-sidebar';

  // 使用CSS变量定义主题色和样式
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --sidebar-width: 30vw;
      --sidebar-bg-color: rgba(255, 255, 255, 0.95);
      --sidebar-shadow: -2px 0 8px rgba(0,0,0,0.1);
      --theme-color: #1a73e8;
      --resize-line-width: 4px;
    }
  `;
  document.head.appendChild(style);

  sidebar.style.cssText = `
    width: var(--sidebar-width);
    height: 100vh;
    background: var(--sidebar-bg-color);
    box-shadow: var(--sidebar-shadow);
    z-index: 2147483646;
    transition: transform 0.3s ease;
    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    transform: translateX(100%);
  `;

  // 创建拖动区域容器
  const resizeContainer = document.createElement('div');
  resizeContainer.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: 8px;
    height: 100%;
    cursor: col-resize;
    background: transparent;
    z-index: 2147483647;
  `;

  // 创建拖动指示线
  const resizeLine = document.createElement('div');
  resizeLine.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: var(--resize-line-width);
    height: 100%;
    background-color: var(--theme-color);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  `;

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  // 添加拖拽事件监听
  resizeContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'));
    resizeLine.style.opacity = '1';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = startX - e.clientX;
    const newWidth = Math.min(Math.max(startWidth + (deltaX / window.innerWidth * 100), 20), 80);
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}vw`);
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;
    resizeLine.style.opacity = '0';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  // 添加hover效果
  resizeContainer.addEventListener('mouseenter', () => {
    if (!isDragging) {
      resizeLine.style.opacity = '1';
    }
  });

  resizeContainer.addEventListener('mouseleave', () => {
    if (!isDragging) {
      resizeLine.style.opacity = '0';
    }
  });

  const iframe = document.createElement('iframe');
  // 从Chrome Storage中获取自定义URL，添加错误处理
  try {
    chrome.storage.sync.get(['sidebarUrl'], function(result) {
      if (chrome.runtime.lastError) {
        console.warn('获取自定义URL失败:', chrome.runtime.lastError);
        iframe.src = chrome.runtime.getURL('popup.html');
        return;
      }
      // 如果是设置页面，则始终加载popup.html
      if (result.sidebarUrl && !window.location.href.includes('chrome-extension://')) {
        iframe.src = result.sidebarUrl;
      } else {
        iframe.src = chrome.runtime.getURL('popup.html');
      }
    });
  } catch (error) {
    console.error('访问storage时出错:', error);
    iframe.src = chrome.runtime.getURL('popup.html');
  }
  iframe.style.cssText = `
    flex: 1;
    border: none;
    background: transparent;
  `;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin allow-popups allow-modals');

  sidebar.appendChild(resizeContainer);
  sidebar.appendChild(resizeLine);
  sidebar.appendChild(iframe);
  return sidebar;
}

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'toggleSidebar') {
    let sidebar = document.getElementById('web-ai-assistant-sidebar');

    // 如果侧边栏不存在，则创建它
    if (!sidebar) {
      sidebar = createSidebar();
      document.body.appendChild(sidebar);
      document.documentElement.style.transition = 'width 0.3s ease';
    }

    // 获取当前transform值并判断侧边栏是否打开
    const computedStyle = window.getComputedStyle(sidebar);
    const transform = computedStyle.getPropertyValue('transform');
    const isOpen = transform === 'matrix(1, 0, 0, 1, 0, 0)' || transform === 'none';

    // 切换侧边栏状态
    sidebar.style.transform = isOpen ? 'translateX(100%)' : 'translateX(0)';
    document.documentElement.style.width = isOpen ? '100%' : 'calc(100% - var(--sidebar-width))';

    sendResponse({ success: true });
  } else if (request.type === 'getPageContent') {
    try {
      const content = extractPageContent();
      sendResponse({ content });
    } catch (error) {
      console.error('获取页面内容时出错:', error);
      sendResponse({ error: error.message });
    }
  }
  return true; // 保持消息通道开放，以支持异步响应
});

// 创建悬浮按钮
function createFloatingButton(x, y) {
  const button = document.createElement('button');
  button.textContent = 'AI';
  button.style.cssText = `
    position: absolute;
    left: ${x + 16}px;
    top: ${y + 16}px;
    transform: translate(-50%, 0);
    background-color: rgba(233,233,233, 0.75);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    color: black;
    border: none;
    border-radius: 4px;
    padding: 4px 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    z-index: 2147483647;
    pointer-events: auto;
    transition: all 0.2s ease-in-out;
  `;

  // 添加hover效果
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translate(-50%, 0) scale(1.05)';
    button.style.backgroundColor = 'rgba(233,233,233, 1)';
    button.style.boxShadow = '0 4px 12px rgba(26, 115, 232, 0.3)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translate(-50%, 0) scale(1)';
    button.style.backgroundColor = 'rgba(233,233,233, 0.75)';
    button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  });

  return button;
}

// 获取选中文本
function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

// 处理选中文本事件
let currentButton = null;
let selectionTimeout = null;
let hasClicked = false;

document.addEventListener('mouseup', (event) => {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  selectionTimeout = setTimeout(() => {
    if (currentButton) {
      currentButton.remove();
      currentButton = null;
    }

    const selectedText = getSelectedText();
    if (!selectedText || hasClicked) {
      hasClicked = false;
      return;
    }

    const coords = {
      x: event.pageX,
      y: event.pageY
    };

    if (!coords) return;

    currentButton = createFloatingButton(coords.x, coords.y);
    document.body.appendChild(currentButton);

    currentButton.addEventListener('click', () => {
      hasClicked = true;
      currentButton.remove();
      currentButton = null;
      chrome.runtime.sendMessage({
        type: 'addSelectReference',
        selectedText: selectedText,
        url: window.location.href
      });
    });
  }, 200);
});

// 点击页面其他地方时移除按钮
document.addEventListener('click', (event) => {
  if (currentButton && event.target !== currentButton) {
    currentButton.remove();
    currentButton = null;
  }
});

// 提取页面主要内容的函数
function extractPageContent() {
  const title = document.title;

  // 1. 尝试获取文章主体内容
  const article = document.querySelector('article');
  if (article) {
    return article.innerText;
  }

  // 2. 尝试获取主要内容区域
  const main = document.querySelector('main');
  if (main) {
    return main.innerText;
  }

  // 3. 如果没有特定的内容区域标签，获取body中的文本内容
  const clone = document.body.cloneNode(true);

  // 移除脚本和样式标签
  ['script', 'style'].forEach(tag => {
    const elements = clone.getElementsByTagName(tag);
    while (elements[0]) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  });

  // 移除隐藏元素
  const hiddenElements = clone.querySelectorAll('[hidden], [style*="display: none"], [style*="visibility: hidden"]');
  hiddenElements.forEach(el => el.remove());

  // 获取处理后的文本内容并清理
  return clone.innerText
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}