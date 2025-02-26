<template>
  <div class="references-list" v-if="references.length > 0">
    <TransitionGroup name="reference-fade" tag="div" class="references-container">
      <div v-for="ref in references" :key="ref.url" class="reference-tag"
        :class="{ 'expanded': expandedRef === ref.url }" @click="toggleExpand(ref.url)">
        <div class="reference-content">
          <span class="reference-icon">#</span>
          <span class="reference-title">{{ ref.title || ref.content }}</span>
        </div>
        <button class="remove-reference" @click.stop="$emit('remove', ref.url)" title="移除引用">
          <span class="remove-icon">×</span>
        </button>
        <Transition name="expand">
          <div v-if="expandedRef === ref.url" class="reference-detail">
            <div class="reference-url"><a :href="ref.url">{{ ref.url }}</a></div>
            <div class="reference-description" v-if="ref.description">{{ ref.description }}</div>
          </div>
        </Transition>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  references: {
    type: Array,
    required: true,
    default: () => []
  }
});

defineEmits(['remove']);

const expandedRef = ref(null);

const toggleExpand = (url) => {
  expandedRef.value = expandedRef.value === url ? null : url;
};
</script>

<style scoped>
.references-list {
  margin-bottom: 12px;
}

.references-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px;
}

.reference-tag {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  background: rgba(26, 115, 232, 0.08);
  border: 1px solid rgba(26, 115, 232, 0.16);
  border-radius: 16px;
  padding: 4px 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.reference-tag:hover {
  background: rgba(26, 115, 232, 0.12);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(26, 115, 232, 0.08);
}

.reference-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reference-icon {
  color: #1a73e8;
  font-size: 14px;
  opacity: 0.7;
}

.reference-title {
  color: #1a73e8;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.remove-reference {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #1a73e8;
  cursor: pointer;
  margin-left: 6px;
  padding: 2px;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.remove-reference:hover {
  opacity: 1;
}

.remove-icon {
  font-size: 16px;
  line-height: 1;
}

/* 动画效果 */
.reference-fade-enter-active,
.reference-fade-leave-active {
  transition: all 0.3s ease;
}

.reference-fade-enter-from,
.reference-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.reference-fade-move {
  transition: transform 0.3s ease;
}

.reference-detail {
  width: 100%;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(26, 115, 232, 0.16);
  font-size: 13px;
  color: #5f6368;
  overflow: hidden;
}

.reference-url {
  color: #1a73e8;
  margin-bottom: 4px;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 2.8em;
}

.reference-description {
  color: #5f6368;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 4.2em;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
}

.reference-tag.expanded {
  background: rgba(26, 115, 232, 0.12);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.12);
}
</style>