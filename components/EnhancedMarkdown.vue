<template>
  <div class="enhanced-markdown">
    <div v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  content: string
}>()

// Simple Markdown rendering
const renderedContent = computed(() => {
  return markdownToHtml(props.content)
})

// Convert Markdown to HTML
function markdownToHtml(markdown: string): string {
  let html = markdown
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>')
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="markdown-bold">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em class="markdown-italic">$1</em>')
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li class="markdown-li">$1</li>')
  html = html.replace(/^- (.*$)/gim, '<li class="markdown-li">$1</li>')
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li class="markdown-li markdown-numbered">$2</li>')
  
  // Wrap consecutive list items in ul/ol
  html = html.replace(/(<li class="markdown-li[^>]*>.*?<\/li>)(?:\s*<li class="markdown-li[^>]*>.*?<\/li>)*/gs, (match) => {
    const hasNumbered = match.includes('markdown-numbered')
    const tag = hasNumbered ? 'ol' : 'ul'
    return `<${tag} class="markdown-list">${match}</${tag}>`
  })
  
  // Paragraphs
  html = html.replace(/^(?!<[h1-6]|<ul|<ol|<li)(.*$)/gim, '<p class="markdown-p">$1</p>')
  
  // Clean up empty paragraphs
  html = html.replace(/<p class="markdown-p"><\/p>/g, '')
  
  return html
}
</script>

<style scoped>
.enhanced-markdown {
  line-height: 1.6;
  color: var(--text);
  background: transparent;
  border: none;
  box-shadow: none;
}

.enhanced-markdown :deep(.markdown-h1) {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem 0;
  color: var(--text-strong);
  line-height: 1.3;
}

.enhanced-markdown :deep(.markdown-h2) {
  font-size: 1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem 0;
  color: var(--text-strong);
  line-height: 1.3;
  border-left: 3px solid var(--blue-300);
  padding-left: 8px;
  background: transparent;
  padding-bottom: 4px;
}

.enhanced-markdown :deep(.markdown-h3) {
  font-size: 1rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem 0;
  color: var(--text-strong);
  line-height: 1.3;
}

.enhanced-markdown :deep(.markdown-p) {
  margin: var(--space-1) 0;
  line-height: 1.65;
  color: var(--text);
  font-size: 15px;
  animation: paragraphStagger 80ms var(--motion) ease-out;
}

.enhanced-markdown :deep(.markdown-p:nth-child(1)) { animation-delay: 0ms; }
.enhanced-markdown :deep(.markdown-p:nth-child(2)) { animation-delay: 80ms; }
.enhanced-markdown :deep(.markdown-p:nth-child(3)) { animation-delay: 160ms; }
.enhanced-markdown :deep(.markdown-p:nth-child(4)) { animation-delay: 240ms; }

@keyframes paragraphStagger {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.enhanced-markdown :deep(.markdown-bold) {
  font-weight: 600;
  color: var(--text);
}

.enhanced-markdown :deep(.markdown-italic) {
  font-style: italic;
  color: var(--text);
}

.enhanced-markdown :deep(.markdown-list) {
  margin: var(--space-1) 0;
  padding-left: var(--space-4);
  line-height: 1.65;
  font-size: 15px;
}

.enhanced-markdown :deep(.markdown-li) {
  margin: 0.25rem 0;
  line-height: 1.65;
  color: var(--text);
  font-size: 15px;
}

.enhanced-markdown :deep(.markdown-li strong) {
  font-weight: 500;
  color: var(--text-subtle);
}

.enhanced-markdown :deep(.markdown-list) {
  counter-reset: list-counter;
}

.enhanced-markdown :deep(.markdown-numbered) {
  list-style-type: decimal;
  counter-increment: list-counter;
}

.enhanced-markdown :deep(.markdown-list:not(.markdown-numbered)) {
  list-style-type: disc;
}

/* Nested list handling - prevent 1.1, 1.2 appearance */
.enhanced-markdown :deep(ol ol),
.enhanced-markdown :deep(ol ul) {
  margin-left: 1rem;
  margin-top: 0.25rem;
}

.enhanced-markdown :deep(ol ol li),
.enhanced-markdown :deep(ol ul li) {
  list-style-type: disc;
  margin: 0.2rem 0;
}

/* Blockquote styling - minimal, clean appearance */
.enhanced-markdown :deep(blockquote) {
  margin: 0.75rem 0;
  padding-left: 1rem;
  border-left: 2px solid var(--blue-200);
  color: var(--text);
  font-style: italic;
  background: none;
}

.enhanced-markdown :deep(blockquote p) {
  margin: 0;
  color: inherit;
}
</style>