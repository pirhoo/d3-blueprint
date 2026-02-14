<template>
  <div class="why-section">
    <h2 class="why-section__title">Why another D3 library?</h2>
    <p class="why-section__subtitle">D3 is powerful but low-level. Most wrappers trade flexibility for convenience. d3-blueprint keeps you close to D3 while removing the boilerplate.</p>
    <div class="why-section__grid">
      <div class="why-section__card">
        <h3>Raw D3</h3>
        <p>Full control, but every chart is a one-off script. No reuse, no structure, lots of repeated setup code.</p>
      </div>
      <div class="why-section__card">
        <h3>High-level libraries</h3>
        <p>Quick to start, but you hit walls fast. Custom behavior means fighting the abstraction or ejecting entirely.</p>
      </div>
      <div class="why-section__card why-section__card--highlight">
        <div class="why-section__glow"></div>
        <h3>d3-blueprint</h3>
        <p>Structure without abstraction. You still write D3 code, but layers, configs, and lifecycle hooks make it composable and reusable.</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.why-section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 0 32px;

  &__title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 0;
    padding-bottom: 0;
    color: var(--vp-c-text-1);
  }

  &__subtitle {
    font-size: 16px;
    text-align: center;
    margin: 0;
    margin-bottom: 24px;
    color: var(--vp-c-text-2);
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  &__card {
    padding: 24px;
    border-radius: 12px;
    background: var(--vp-c-bg-soft);
    border: 1px solid transparent;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--vp-c-text-1);
    }

    p {
      font-size: 14px;
      margin: 0;
      color: var(--vp-c-text-2);
      line-height: 1.6;
    }

    &--highlight {
      position: relative;
      border-color: var(--vp-c-brand-1);
      overflow: hidden;

      h3,
      p {
        position: relative;
        z-index: 1;
      }

      &::after {
        content: '';
        position: absolute;
        inset: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(
          circle at 50% 50%,
          var(--vp-c-brand-1) 0%,
          transparent 70%
        );
        opacity: 0.06;
        pointer-events: none;
        z-index: 0;
      }
    }
  }

  &__glow {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      var(--vp-c-brand-1),
      var(--vp-c-brand-2, var(--vp-c-brand-1)),
      transparent 60%
    );
    opacity: 0.12;
    pointer-events: none;
    z-index: 0;
  }
}
</style>
