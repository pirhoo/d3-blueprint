<script setup lang="ts">
defineProps<{
  slug: string;
  label: string;
}>();
</script>

<template>
  <a :href="`./examples/${slug}`" class="entry">
    <img
      class="entry__img entry__img--light"
      :src="`./thumbnails/${slug}.png`"
      :alt="label"
      loading="lazy"
    />
    <img
      class="entry__img entry__img--dark"
      :src="`./thumbnails/${slug}-dark.png`"
      :alt="label"
      loading="lazy"
    />
    <span class="entry__label">{{ label }}</span>
  </a>
</template>

<style scoped lang="scss">
.entry {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  display: block;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  transition: border-color 0.25s;
  border: 1px solid transparent;

  &:hover {
    border-color: var(--vp-c-brand-1);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;


    &--dark,
    &--light {
      display: none;
    }

    :root.dark &--dark {
      display: block;
    }

    :root:not(.dark) &--light {
      display: block;
    }
  }

  &__label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 6px 8px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    color: var(--vp-c-text-2);
    background: var(--vp-c-bg-soft);
  }
}
</style>
