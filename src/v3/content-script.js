// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getPageContent') {
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