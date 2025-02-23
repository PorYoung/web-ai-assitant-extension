import { ChatOpenAI } from "@langchain/openai";

class AIService {
    constructor() {
        this.llm = null;
        this.currentConfig = null;
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

        try {
            const response = await this.llm.stream(messages);
            let fullResponse = "";

            for await (const token of response) {
                fullResponse += token.content;
                if (onToken) {
                    onToken(fullResponse);
                }
            }

            return fullResponse;
        } catch (error) {
            console.error('AI响应错误:', error);
            throw error;
        }
    }
}

export const aiService = new AIService();