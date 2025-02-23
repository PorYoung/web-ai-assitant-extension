<template>
    <div class="message" :class="messageType">
        <div class="message-meta">
            <template v-if="messageType === 'user'">
                <button class="delete-message-btn" @click="$emit('delete')" title="删除这轮对话">
                    ×
                </button>
                <span class="message-time">{{ formattedTime }}</span>
            </template>
            <template v-else>
                <span class="message-time">{{ formattedTime }}</span>
                <button class="delete-message-btn" @click="$emit('delete')" title="删除这轮对话">
                    ×
                </button>
            </template>
        </div>
        <div class="message-bubble">
            <div class="message-content">
                <p v-html="marked.parse(content)"></p>
            </div>
            <div v-if="references && references.length > 0" class="message-references">
                <button class="reference-button" @click="toggleReferencePanel">
                    <span class="reference-icon">#</span>
                    <span>{{ references.length }} 条引用</span>
                </button>
                <div class="reference-panel" :class="{ 'expanded': isExpanded }">
                    <div v-for="ref in references" :key="ref.url" class="reference-item">
                        <div class="reference-title">{{ ref.title }}</div>
                        <div class="reference-url">{{ ref.url }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { marked } from 'marked';

const props = defineProps({
    messageType: {
        type: String,
        required: true,
        validator: (value) => ['user', 'assistant'].includes(value)
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    },
    references: {
        type: Array,
        default: () => []
    }
});

defineEmits(['delete']);

const isExpanded = ref(false);

const toggleReferencePanel = () => {
    isExpanded.value = !isExpanded.value;
};

const formattedTime = computed(() => {
    const date = new Date(props.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
        return timeStr;
    } else if (isYesterday) {
        return `昨天 ${timeStr}`;
    } else {
        return `${date.toLocaleDateString('zh-CN')} ${timeStr}`;
    }
});
</script>

<style scoped>
.message {
    display: flex;
    flex-direction: column;
    max-width: 100%;
    padding: 0 4px;
    animation: fadeIn 0.3s ease-out;
    gap: 4px;
}

.message.user {
    align-self: flex-end;
}

.message.user .message-meta {
    align-self: flex-end;
}

.message-bubble {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.message-content {
    padding: 14px 18px;
    border-radius: 12px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
    overflow-x: auto;
}

.message-references {
    position: relative;
}

.reference-button {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: rgba(26, 115, 232, 0.08);
    border: 1px solid rgba(26, 115, 232, 0.15);
    border-radius: 16px;
    font-size: 0.9em;
    color: #1a73e8;
    cursor: pointer;
    transition: all 0.2s ease;
}

.reference-button:hover {
    background: rgba(26, 115, 232, 0.15);
    border-color: rgba(26, 115, 232, 0.3);
}

.reference-button .reference-icon {
    margin-right: 4px;
    font-size: 0.9em;
}

.reference-panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: #ffffff;
    border-radius: 8px;
    padding: 0;
    font-size: 0.9em;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.05);
    z-index: 1;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.reference-panel.expanded {
    max-height: 300px;
    opacity: 1;
    padding: 12px;
}

.reference-item {
    padding: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.reference-item:last-child {
    border-bottom: none;
}

.reference-title {
    font-weight: 500;
    margin-bottom: 4px;
}

.reference-url {
    font-size: 0.85em;
    color: #5f6368;
    word-break: break-all;
}

.message.user .message-content {
    background: linear-gradient(135deg, #1a73e8, #1557b0);
    color: white;
}

.message.assistant .message-content {
    background-color: #f8f9fa;
    color: #202124;
}

.message-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    opacity: 0.7;
    padding: 0 4px;
}

.message-time {
    color: #5f6368;
}

.message.user .message-time {
    color: #1a73e8;
}

.delete-message-btn {
    background: none;
    border: none;
    color: #5f6368;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s, background-color 0.2s;
}

.message:hover .delete-message-btn {
    opacity: 1;
}

.delete-message-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>