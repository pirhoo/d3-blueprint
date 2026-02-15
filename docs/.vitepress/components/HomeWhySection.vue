<template>
  <div class="why-section">
    <div class="why-section__header">
      <p class="why-section__eyebrow">The sweet spot</p>
      <h2 class="why-section__title">Why another D3 library?</h2>
      <p class="why-section__subtitle">
        All the power of D3, none of the boilerplate.
      </p>
    </div>

    <div class="why-section__grid">
      <div class="why-section__card why-section__card--raw-d3">
        <div class="why-section__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <h3>Raw D3</h3>
        <p class="why-section__description">
          ull control, but every chart is a one-off script. No reuse, no structure, lots of repeated setup code.
        </p>
        <ul class="why-section__traits">
          <li class="why-section__trait why-section__trait--pro">Total flexibility</li>
          <li class="why-section__trait why-section__trait--con">No structure</li>
          <li class="why-section__trait why-section__trait--con">Copy-paste heavy</li>
        </ul>
      </div>

      <div class="why-section__card why-section__card--high-level">
        <div class="why-section__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <h3>High-level libraries</h3>
        <p class="why-section__description">
          Quick to start, but you hit walls fast. Custom behavior means fighting the abstraction or ejecting entirely.
        </p>
        <ul class="why-section__traits">
          <li class="why-section__trait why-section__trait--pro">Quick prototyping</li>
          <li class="why-section__trait why-section__trait--con">Limited customization</li>
          <li class="why-section__trait why-section__trait--con">Abstraction lock-in</li>
        </ul>
      </div>

      <div class="why-section__card why-section__card--highlight why-section__card--d3-blueprint">
        <div class="why-section__border-glow"></div>
        <div class="why-section__card-inner">
          <span class="why-section__badge">Best of both</span>
          <div class="why-section__icon why-section__icon--brand">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3>d3-blueprint</h3>
          <p class="why-section__description">
            Structure without abstraction. You still write D3 code, but layers, configs, and lifecycle hooks make it composable and reusable.
          </p>
          <ul class="why-section__traits">
            <li class="why-section__trait why-section__trait--pro">Full D3 access</li>
            <li class="why-section__trait why-section__trait--pro">Composable layers</li>
            <li class="why-section__trait why-section__trait--pro">Reusable by design</li>
          </ul>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
.why-section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 64px 0 48px;

  &__header {
    text-align: center;
    margin-bottom: 40px;
  }

  &__eyebrow {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--vp-c-brand-1);
    margin: 0 0 8px;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 12px;
    padding: 0;
    color: var(--vp-c-text-1);
    letter-spacing: -0.02em;
    border: none;

    @media (min-width: 640px) {
      font-size: 32px;
    }
  }

  &__subtitle {
    font-size: 16px;
    margin: 0 auto;
    color: var(--vp-c-text-2);
    max-width: 560px;
    line-height: 1.6;
  }

  &__grid {
    gap: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    @media (min-width: 768px) {
      gap: 20px;
      flex-direction: row;
    }
  }

  &__card {
    padding: 28px 24px;
    border-radius: 12px;
    background: var(--vp-c-bg-soft);
    border: 1px solid var(--vp-c-divider);
    transition: border-color 0.25s, box-shadow 0.25s;
    text-align: center;

    h3 {
      font-size: 17px;
      font-weight: 600;
      margin: 12px 0 8px;
      color: var(--vp-c-text-1);
    }

    p {
      font-size: 14px;
      margin: 0 0 16px;
      color: var(--vp-c-text-2);
      line-height: 1.6;
    }

    &--highlight {
      position: relative;
      padding: 2px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(
        135deg,
        var(--vp-c-brand-1),
        var(--vp-c-brand-2, var(--vp-c-brand-1)),
        var(--vp-c-brand-3, var(--vp-c-brand-1)),
        var(--vp-c-brand-1)
      );
      background-size: 300% 300%;
      animation: gradient-shift 6s ease infinite;
      box-shadow:
        0 0 24px rgba(104, 120, 232, 0.15),
        0 0 48px rgba(134, 114, 255, 0.08);

      &:hover {
        border-color: transparent;
        box-shadow:
          0 0 32px rgba(104, 120, 232, 0.25),
          0 0 64px rgba(134, 114, 255, 0.12);
      }

      @media (min-width: 768px) {
        transform: scale(1.02);
      }
    }

    &--raw-d3 {
      order: 0;
    }

    &--high-level {
      order: 20;
    }
    
    &--d3-blueprint {
      order: 30;

      @media (min-width: 768px) {
        order: 10;
      }
    }
  }

  &__card-inner {
    padding: 28px 24px;
    border-radius: 12px;
    background: var(--vp-c-bg);
    height: 100%;
    position: relative;
  }

  &__border-glow {
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      var(--vp-c-brand-1),
      var(--vp-c-brand-2, var(--vp-c-brand-1)),
      transparent 60%
    );
    opacity: 0.08;
    pointer-events: none;
    z-index: 0;
    filter: blur(20px);
  }

  &__badge {
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 100px;
    background: var(--vp-c-brand-1);
    color: #fff;
    z-index: 2;

    @media (min-width: 768px) {
      left: 24px;
      transform: none;
    }
  }

  &__description {
    text-wrap: balance;
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--vp-c-bg-soft);
    color: var(--vp-c-text-2);

    &--brand {
      background: var(--vp-c-brand-soft);
      color: var(--vp-c-brand-1);
    }

    @media (max-width: 767px) {
      display: none;
    }
  }

  &__traits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: inline-flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }

  &__trait {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--vp-c-text-2);

    &::before {
      content: '';
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &--pro::before {
      background: rgba(16, 185, 129, 0.12);
      box-shadow: inset 0 0 0 1.5px rgba(16, 185, 129, 0.5);
    }

    &--con::before {
      background: rgba(239, 68, 68, 0.08);
      box-shadow: inset 0 0 0 1.5px rgba(239, 68, 68, 0.35);
    }
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
