---
layout: home

hero:
  name: d3-blueprint
  text: Build reusable D3 Charts
  tagline: A modern micro-framework to compose reusable D3 charts with TypeScript
  image:
    src: /images/hero.svg
    alt: d3-blueprint logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/

features:
  - title: Composable Layers
    icon: 🏗️
    details: Each layer owns its D3 data-join lifecycle (enter, merge, exit, and transitions). Combine layers freely to build complex visualizations from simple building blocks.
    link: /guide/layers
  - title: Reactive Config
    icon: ⚙️
    details: Define typed config properties with getter/setter transforms and default values. Change a config, call draw(), and watch everything update.
    link: /guide/config
  - title: Plugin System
    icon: 🧩
    details: Encapsulate cross-cutting behavior like tooltips, crosshairs, and responsive resize into reusable plugins that hook into the chart lifecycle automatically.
    link: /examples/plugins
  - title: Nested Attachments
    icon: 🖇️
    details: Compose charts from smaller charts. Attach reusable sub-components like axes or legends that draw in sync with the parent.
    link: /guide/attachments
  - title: Built-in Transitions
    icon: 🎥
    details: Layers support transition events out of the box. Animate enter, merge, and exit phases with d3-transition with no manual wiring needed.
    link: /guide/layers
  - title: Tiny & Dependency-Free
    icon: 🛀
    details: Only peer-depends on d3-selection and d3-transition. Bring your own scales, shapes, and layouts with no monolithic D3 bundle required.
    link: /guide/getting-started
---

<HomeWhySection />

<HomeGallery />

<style>
html:root {
  --vp-home-hero-image-background-image: linear-gradient(-45deg, var(--vp-c-brand-1) 50%, var(--vp-c-brand-2) 50%);
  --vp-home-hero-image-filter: blur(44px);
}

.image-bg {
  opacity: 0.25;
}

@media (min-width: 640px) {
  html:root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  html:root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>
