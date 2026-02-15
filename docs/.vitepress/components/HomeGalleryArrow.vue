<script setup lang="ts">
defineProps<{
  direction: 'left' | 'right';
}>();

defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    class="arrow"
    :class="`arrow--${direction}`"
    :aria-label="`Scroll ${direction}`"
    @click="$emit('click')"
  >
    <svg v-if="direction === 'left'" width="20" height="20" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else width="20" height="20" viewBox="0 0 16 16" fill="none">
      <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</template>

<style scoped lang="scss">
.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);

  &--left {
    left: -20px;
  }

  &--right {
    right: -20px;
  }

  @media (min-width: 768px) {
    display: none;
  }
}
</style>
