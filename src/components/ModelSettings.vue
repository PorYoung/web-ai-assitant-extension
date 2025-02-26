<template>
    <div class="model-settings-overlay" v-if="modelSettingsVisible" @click="closeSettings">
        <div class="model-settings-dialog" @click.stop>
            <div class="dialog-header">
                <h2>模型配置</h2>
                <button class="close-button" @click="closeSettings">×</button>
            </div>
            <div class="dialog-content">
                <div class="model-list">
                    <div v-for="(model, index) in modelConfigs" :key="index" class="model-item">
                        <div class="model-header" @click="toggleModel(index)" :class="{ 'expanded': expandedModels[index] }">
                            <div class="model-title">
                                <span class="expand-icon">{{ expandedModels[index] ? '▼' : '▶' }}</span>
                                <h3>{{ model.name || `模型 #${index + 1}` }}</h3>
                            </div>
                            <button class="delete-button" @click.stop="deleteModel(index)">删除</button>
                        </div>
                        <div class="model-form" v-show="expandedModels[index]">
                            <div class="form-group">
                                <label>名称</label>
                                <input type="text" v-model="model.name" placeholder="给这个模型配置起个名字">
                            </div>
                            <div class="form-group">
                                <label>API 地址</label>
                                <input type="text" v-model="model.apiUrl" placeholder="模型服务的API地址">
                            </div>
                            <div class="form-group">
                                <label>API Key</label>
                                <input type="password" v-model="model.apiKey" placeholder="API密钥">
                            </div>
                            <div class="form-group">
                                <label>模型名称</label>
                                <input type="text" v-model="model.modelName" placeholder="如：gpt-3.5-turbo">
                            </div>
                            <div class="form-group">
                                <label>系统提示词</label>
                                <textarea v-model="model.systemPrompt" placeholder="模型的系统提示词"></textarea>
                            </div>
                            <div class="form-group parameters">
                                <label>参数设置</label>
                                <div class="parameter-inputs">
                                    <div class="parameter-item">
                                        <label>Temperature</label>
                                        <input type="number" v-model.number="model.parameters.temperature" min="0" max="2" step="0.1">
                                    </div>
                                    <div class="parameter-item">
                                        <label>Top P</label>
                                        <input type="number" v-model.number="model.parameters.topP" min="0" max="1" step="0.1">
                                    </div>
                                    <div class="parameter-item">
                                        <label>Max Tokens</label>
                                        <input type="number" v-model.number="model.parameters.maxTokens" min="1">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="add-model-button" @click="addNewModel">+ 添加新模型</button>
            </div>
            <div class="dialog-footer">
                <button class="save-button" @click="saveSettings">保存设置</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
    modelSettingsVisible: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['update:modelSettingsVisible', 'save']);

const modelConfigs = ref([]);
const expandedModels = ref([]);

// 初始化默认配置
const defaultConfig = {
    name: '',
    apiUrl: '',
    apiKey: '',
    modelName: '',
    systemPrompt: '',
    parameters: {
        temperature: 0.6,
        maxTokens: 16384,
        topP: 0.8
    }
};

// 从localStorage加载配置
onMounted(() => {
    const savedConfigs = localStorage.getItem('modelConfigs');
    if (savedConfigs) {
        modelConfigs.value = JSON.parse(savedConfigs);
        // 初始化展开状态数组
        expandedModels.value = new Array(modelConfigs.value.length).fill(false);
    }
});

// 切换模型展开状态
const toggleModel = (index) => {
    expandedModels.value[index] = !expandedModels.value[index];
};

// 添加新模型配置
const addNewModel = () => {
    modelConfigs.value.push({ ...defaultConfig });
    expandedModels.value.push(true); // 新添加的模型默认展开
};

// 删除模型配置
const deleteModel = (index) => {
    modelConfigs.value.splice(index, 1);
    expandedModels.value.splice(index, 1);
};

// 保存设置
const saveSettings = () => {
    localStorage.setItem('modelConfigs', JSON.stringify(modelConfigs.value));
    emit('save', modelConfigs.value);
    closeSettings();
};

// 关闭设置弹窗
const closeSettings = () => {
    emit('update:modelSettingsVisible', false);
};
</script>

<style scoped>
.model-settings-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.model-settings-dialog {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.dialog-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dialog-header h2 {
    margin: 0;
    font-size: 18px;
    color: #202124;
}

.close-button {
    background: none;
    border: none;
    font-size: 24px;
    color: #5f6368;
    cursor: pointer;
    padding: 4px;
}

.dialog-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.model-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.model-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    transition: box-shadow 0.3s ease;
}

.model-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.2s ease;
}

.model-header:hover {
    background-color: #f8f9fa;
}

.model-header.expanded {
    border-bottom: 1px solid #e0e0e0;
    border-radius: 8px 8px 0 0;
    background-color: #f8f9fa;
}

.model-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.expand-icon {
    color: #5f6368;
    font-size: 12px;
    transition: transform 0.2s ease;
}

.model-header.expanded .expand-icon {
    transform: rotate(0deg);
}

.model-header h3 {
    margin: 0;
    font-size: 16px;
    color: #202124;
}

.delete-button {
    background: none;
    border: none;
    color: #d93025;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    transition: background-color 0.2s ease;
}

.delete-button:hover {
    background: rgba(217, 48, 37, 0.1);
}

.model-form {
    padding: 16px;
    background: #fff;
    border-radius: 0 0 8px 8px;
}

.form-group {
    margin-bottom: 16px;
    box-sizing: border-box;
    width: 100%;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #202124;
    font-size: 14px;
    font-weight: 500;
}

input,
textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 14px;
    color: #202124;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-sizing: border-box;
}

input:focus,
textarea:focus {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

textarea {
    min-height: 80px;
    resize: vertical;
}

.parameters {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
}

.parameter-inputs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
}

.parameter-item label {
    font-size: 12px;
    color: #5f6368;
}

.add-model-button {
    width: 100%;
    padding: 12px;
    background: #f8f9fa;
    border: 1px dashed #e0e0e0;
    border-radius: 8px;
    color: #1a73e8;
    cursor: pointer;
    margin-top: 16px;
    transition: all 0.2s ease;
    font-weight: 500;
}

.add-model-button:hover {
    background: #f1f3f4;
    border-color: #1a73e8;
}

.dialog-footer {
    padding: 16px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
}

.save-button {
    background: #1a73e8;
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s ease;
}

.save-button:hover {
    background: #1557b0;
}
</style>