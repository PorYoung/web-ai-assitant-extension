// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getPageContent') {
    try {
      // 获取页面主要内容
      const content = extractPageContent();
      sendResponse({ content });
    } catch (error) {
      console.error('获取页面内容时出错:', error);
      sendResponse({ error: error.message });
    }
  }
  return true; // 保持消息通道开放，以支持异步响应
});

// 提取页面主要内容的函数
function extractPageContent() {
  // 获取页面标题
  const title = document.title;

  // 获取页面主要内容
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
  const body = document.body;
  
  // 创建一个副本以进行内容处理
  const clone = body.cloneNode(true);
  
  // 移除脚本标签
  const scripts = clone.getElementsByTagName('script');
  while (scripts[0]) {
    scripts[0].parentNode.removeChild(scripts[0]);
  }

  // 移除样式标签
  const styles = clone.getElementsByTagName('style');
  while (styles[0]) {
    styles[0].parentNode.removeChild(styles[0]);
  }

  // 移除隐藏元素
  const hiddenElements = clone.querySelectorAll('[hidden], [style*="display: none"], [style*="visibility: hidden"]');
  hiddenElements.forEach(el => el.remove());

  // 获取处理后的文本内容
  const content = clone.innerText;

  // 移除多余的空白字符
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}