<script setup lang="ts">
defineProps<{
  count: number;
  activeIndex: number;
  labels: string[];
}>();

defineEmits<{
  select: [index: number];
}>();
</script>

<template>
  <div class="dots">
    <button
      v-for="i in count"
      :key="i"
      class="dots__item"
      :class="{ 'dots__item--active': i - 1 === activeIndex }"
      :aria-label="`Go to ${labels[i - 1]}`"
      @click="$emit('select', i - 1)"
    />
  </div>
</template>

<style scoped lang="scss">
.dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;

  @media (min-width: 768px) {
    display: none;
  }

  &__item {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    border: none;
    padding: 0;
    cursor: pointer;
    background: var(--vp-c-divider);
    transition: background 0.2s;

    &--active {
      background: var(--vp-c-brand-1);
    }
  }
}
</style>
