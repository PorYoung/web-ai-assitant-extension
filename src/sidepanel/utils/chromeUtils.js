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

/**
 * 发送消息到content script
 * @param {number} tabId - 标签页ID
 * @param {object} message - 消息内容
 * @param {number} [timeout=5000] - 超时时间（毫秒）
 * @returns {Promise} - 返回Promise对象
 */
export const sendTabMessage = (tabId, message, timeout = 5000) => {
    return chromeApiCall(
        (callback) => chrome.tabs.sendMessage(tabId, message, callback),
        timeout
    );
};

/**
 * 发送消息到background script
 * @param {object} message - 消息内容
 * @param {number} [timeout=5000] - 超时时间（毫秒）
 * @returns {Promise} - 返回Promise对象
 */
export const sendRuntimeMessage = (message, timeout = 5000) => {
    return chromeApiCall(
        (callback) => chrome.runtime.sendMessage(message, callback),
        timeout
    );
};