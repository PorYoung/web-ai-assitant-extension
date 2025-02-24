// 引用内容处理器接口
class ReferenceHandler {
    async handle(reference) {
        throw new Error('Method not implemented');
    }
}

// 文本类型引用处理器
class TextReferenceHandler extends ReferenceHandler {
    async handle(reference) {
        return `======\n引用. ${reference.content}\n======\n\n`;
    }
}

// 网页类型引用处理器
class PageReferenceHandler extends ReferenceHandler {
    async handle(reference) {
        try {
            let pageContent = '';

            // 尝试通过tabId获取页面内容
            if (reference.tabId) {
                try {
                    const response = await chrome.tabs.sendMessage(reference.tabId, { type: 'getPageContent' });
                    pageContent = response.content;
                } catch (error) {
                    console.warn('通过tabId获取页面内容失败:', error);
                }
            }

            // 如果通过tabId获取失败且有url，尝试通过url获取页面内容
            if (!pageContent && reference.url) {
                try {
                    const response = await chrome.runtime.sendMessage({
                        type: 'fetchUrl',
                        url: reference.url
                    });

                    if (response.success) {
                        const text = response.data;
                        // 简单处理HTML内容，提取文本
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = text;
                        try {
                            pageContent = this.extractPageContent(tempDiv);
                        } catch (e) {
                            pageContent = tempDiv.innerText || '';
                            console.warn('提取页面内容失败:', e);
                        }
                    } else {
                        console.warn('通过background获取页面内容失败:', response.error);
                    }
                } catch (error) {
                    console.warn('通过url获取页面内容失败:', error);
                }
            }

            if (!pageContent) {
                return '';
            }

            return `======\n引用网页. ${reference.title}\n网页链接：${reference.url}\n网页内容：${pageContent}\n======\n\n`;
        } catch (error) {
            console.error('处理网页引用失败:', error);
            return '';
        }
    }

    // 提取页面主要内容的函数
    extractPageContent(document) {
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
        const body = document.body || document.querySelector('body') || document;

        // 移除脚本标签
        const scripts = body.getElementsByTagName('script');
        while (scripts[0]) {
            scripts[0].parentNode.removeChild(scripts[0]);
        }

        // 移除样式标签
        const styles = body.getElementsByTagName('style');
        while (styles[0]) {
            styles[0].parentNode.removeChild(styles[0]);
        }

        // 移除隐藏元素
        const hiddenElements = body.querySelectorAll('[hidden], [style*="display: none"], [style*="visibility: hidden"]');
        hiddenElements.forEach(el => el.remove());

        // 获取处理后的文本内容
        const content = body.innerText;

        // 移除多余的空白字符
        return content
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }
}

// 引用处理器工厂
class ReferenceHandlerFactory {
    static handlers = {
        text: new TextReferenceHandler(),
        page: new PageReferenceHandler()
    };

    static getHandler(type) {
        return this.handlers[type] || null;
    }
}

// 引用服务
export class ReferenceService {
    async processReferences(references = []) {
        if (references.length === 0) {
            return [];
        }

        const referenceContexts = [];
        let textTypeRefContexts = "### 你需要基于用户提供的引用内容回答用户的问题，用户引用的内容如下：\n\n";
        let textTypeRefContextsNum = 0;
        let pageTypeRefContexts = "### 你需要基于用户提供的引用网页回答用户的问题，用户引用的网页内容如下：\n\n";
        let pageTypeRefContextsNum = 0;

        for (const ref of references) {
            const handler = ReferenceHandlerFactory.getHandler(ref.type);
            if (!handler) continue;

            const content = await handler.handle(ref);
            if (!content) continue;

            if (ref.type === 'text') {
                textTypeRefContextsNum++;
                textTypeRefContexts += content;
            } else if (ref.type === 'page') {
                pageTypeRefContextsNum++;
                pageTypeRefContexts += content;
            }
        }

        if (textTypeRefContextsNum > 0 || pageTypeRefContextsNum > 0) {
            referenceContexts.push({
                role: 'system',
                content: (textTypeRefContextsNum > 0 ? textTypeRefContexts : '') +
                    (pageTypeRefContextsNum > 0 ? pageTypeRefContexts : '')
            });
        }

        return referenceContexts;
    }
}

export const referenceService = new ReferenceService();