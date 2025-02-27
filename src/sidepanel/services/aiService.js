import { ChatOpenAI } from "@langchain/openai";

class AIService {
    constructor() {
        this.llm = null;
        this.currentConfig = null;
        this.abortController = null;
    }

    // 初始化或更新模型配置
    initializeModel(config) {
        if (!config) {
            throw new Error('模型配置不能为空');
        }

        config.parameters = config.parameters || {};

        // 检查配置是否有变化
        if (this.currentConfig &&
            this.currentConfig.apiUrl === config.apiUrl &&
            this.currentConfig.apiKey === config.apiKey &&
            this.currentConfig.modelName === config.modelName &&
            JSON.stringify(this.currentConfig.parameters) === JSON.stringify(config.parameters)) {
            return; // 配置没有变化，无需重新初始化
        }

        this.currentConfig = config;

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
            }
        });
    }

    async streamResponse(messages, onToken) {
        if (!this.llm) {
            throw new Error('请先初始化模型配置');
        }

        // 创建新的AbortController
        this.abortController = new AbortController();

        try {
            const response = await this.llm.stream(messages, {
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