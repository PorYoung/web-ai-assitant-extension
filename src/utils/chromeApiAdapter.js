/**
 * Chrome API适配层
 * 用于处理Chrome浏览器V2和V3版本的API差异
 */

/**
 * 封装Chrome API的异步调用
 * @param {Function} apiCall - 执行Chrome API调用的函数
 * @param {number} [timeout=5000] - 超时时间（毫秒）
 * @returns {Promise} - 返回Promise对象
 */
export const chromeApiCall = (apiCall, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('操作超时'));
        }, timeout);

        try {
            apiCall((response) => {
                clearTimeout(timeoutId);
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(response);
            });
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
};

// 检测Chrome浏览器版本
const isV3 = typeof chrome.runtime.getManifest === 'function' &&
    chrome.runtime.getManifest().manifest_version === 3;

/**
 * 统一的错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} context - 错误发生的上下文
 */
const handleError = (error, context) => {
    console.error(`Chrome API错误 [${context}]:`, error);
    if (chrome.runtime.lastError) {
        console.error('Chrome运行时错误:', chrome.runtime.lastError);
    }
};

/**
 * 打开侧边栏
 * @param {number} windowId - 窗口ID
 * @returns {Promise<void>}
 */
export const openSidebar = async (windowId) => {
    try {
        if (isV3 && chrome.sidePanel) {
            await chrome.sidePanel.open({ windowId });
        } else {
            // V2版本通过消息传递来打开侧边栏
            await chrome.tabs.sendMessage(windowId, { type: 'toggleSidebar' });
        }
    } catch (error) {
        handleError(error, 'openSidebar');
    }
};

/**
 * 设置扩展图标
 * @param {Object} details - 图标设置详情
 * @returns {Promise<void>}
 */
export const setIcon = async (details) => {
    try {
        if (isV3) {
            await chrome.action.setIcon(details);
        } else {
            await chrome.browserAction.setIcon(details);
        }
    } catch (error) {
        handleError(error, 'setIcon');
    }
};

/**
 * 获取当前标签页
 * @returns {Promise<chrome.tabs.Tab>}
 */
export const getCurrentTab = async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    } catch (error) {
        handleError(error, 'getCurrentTab');
        return null;
    }
};

/**
 * 发送消息到标签页
 * @param {number} tabId - 标签页ID
 * @param {any} message - 消息内容
 * @returns {Promise<any>}
 */
export const sendMessageToTab = async (tabId, message, timeout = 5000) => {
    try {
        if (isV3) {
            return await chrome.tabs.sendMessage(tabId, message);
        } else {
            return await chromeApiCall(
                (callback) => chrome.tabs.sendMessage(tabId, message, callback),
                timeout
            );
        }
    } catch (error) {
        handleError(error, 'sendMessageToTab');
        return null;
    }
};

/**
 * 创建或更新上下文菜单
 * @param {Object} properties - 菜单项属性
 * @returns {Promise<void>}
 */
export const createContextMenu = async (properties) => {
    try {
        await chrome.contextMenus.create(properties);
    } catch (error) {
        handleError(error, 'createContextMenu');
    }
};

/**
 * 存储数据
 * @param {Object} items - 要存储的数据
 * @returns {Promise<void>}
 */
export const storageSet = async (items) => {
    try {
        await chrome.storage.sync.set(items);
    } catch (error) {
        handleError(error, 'storageSet');
    }
};

/**
 * 获取存储的数据
 * @param {string|Array<string>|Object} keys - 要获取的键
 * @returns {Promise<Object>}
 */
export const storageGet = async (keys) => {
    try {
        return await chrome.storage.sync.get(keys);
    } catch (error) {
        handleError(error, 'storageGet');
        return {};
    }
};

/**
 * 发送消息到background script
 * @param {object} message - 消息内容
 * @param {number} [timeout=5000] - 超时时间（毫秒）
 * @returns {Promise<any>}
 */
export const sendRuntimeMessage = async (message, timeout = 5000) => {
    try {
        if (isV3) {
            return await chrome.runtime.sendMessage(message);
        } else {
            return await chromeApiCall(
                (callback) => chrome.runtime.sendMessage(message, callback),
                timeout
            );
        }
    } catch (error) {
        handleError(error, 'sendRuntimeMessage');
        return null;
    }
};