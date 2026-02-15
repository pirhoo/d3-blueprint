<script setup lang="ts">
defineProps<{
  count: number;
  activeIndex: number;
  labels: string[];
}>();
</script>

<template>
  <p class="counter" :aria-label="`Slide ${activeIndex + 1} of ${count}: ${labels[activeIndex]}`">
    <span class="counter__current">{{ activeIndex + 1 }}</span>
    <span class="counter__sep">/</span>
    <span class="counter__total">{{ count }}</span>
  </p>
</template>

<style scoped lang="scss">
.counter {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 4px;
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-3);

  @media (min-width: 768px) {
    display: none;
  }

  &__current {
    font-weight: 600;
    color: var(--vp-c-text-1);
  }
}
</style>
