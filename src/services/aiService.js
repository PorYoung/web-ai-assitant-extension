import { ChatOpenAI } from "@langchain/openai";
import { notification } from '@/utils/notification';

class AIService {
    constructor() {
        this.llm = null;
        this.currentConfig = null;
        this.abortController = null;
    }

    // 初始化或更新模型配置
    initializeModel(config) {
        if (!config) {
            notification.error('模型配置不能为空');
            throw new Error('模型配置不能为空');
        }

        config.parameters = config.parameters || {};

        this.currentConfig = config;

        try {
            this.llm = new ChatOpenAI({
                streaming: true,
                temperature: config.parameters.temperature,
                modelName: config.modelName,
                apiKey: config.apiKey,
                modelKwargs: {
                    ...config.parameters || {},
                },
                configuration: {
                    baseURL: config.apiUrl,
                },
                maxRetries: 0,
            });
        } catch (error) {
            notification.error(`AI模型初始化失败: ${error.message}`);
            throw error;
        }
    }

    async streamResponse(messages, onToken) {
        if (!this.llm) {
            notification.error('请先初始化模型配置');
            throw new Error('请先初始化模型配置');
        }

        // 提取并合并所有系统提示词
        const systemMessages = messages.filter(msg => msg.role === 'system');
        const nonSystemMessages = messages.filter(msg => msg.role !== 'system');

        // 合并系统提示词
        const combinedSystemPrompt = [
            ...(this.currentConfig.systemPrompt ? [{ role: 'system', content: this.currentConfig.systemPrompt }] : []),
            ...systemMessages
        ];

        // 如果有系统提示词，将其作为第一条消息
        const allMessages = [
            ...(combinedSystemPrompt.length > 0 ? [{
                role: 'system',
                content: combinedSystemPrompt.map(msg => msg.content).join('\n\n')
            }] : []),
            ...nonSystemMessages
        ];

        // 创建新的AbortController
        this.abortController = new AbortController();

        try {
            const response = await this.llm.stream(allMessages, {
                signal: this.abortController.signal
            });
            let fullResponse = "";

            for await (const token of response) {
                if (this.abortController.signal.aborted) {
                    break;
                }
                fullResponse += token.content;
                if (onToken) {
                    onToken(fullResponse);
                }
            }

            return fullResponse;
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }
            console.error('AI响应错误:', error);
            notification.error(`AI响应出错: ${error.message}`);
            throw error;
        } finally {
            this.abortController = null;
        }
    }

    stopResponse() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}

export const aiService = new AIService();