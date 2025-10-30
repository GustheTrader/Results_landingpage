# Design System Documentation

## Overview

This project uses a **Neumorphic Design System** built with Tailwind CSS v3. The design system features soft, elevated UI elements with subtle shadows that create a modern, tactile interface.

## 🎨 Color Palette

All colors are defined using HSL values for consistent theming support.

### Neutral Colors (Light Mode)
- **Background**: `hsl(0 0% 88%)` - Light gray background
- **Foreground**: `hsl(0 0% 25%)` - Dark gray text
- **Muted**: `hsl(0 0% 82%)` - Muted backgrounds
- **Border**: `hsl(0 0% 82%)` - Border color

### Semantic Colors
- **Primary**: `hsl(0 0% 65%)` - Primary action color
- **Secondary**: `hsl(0 0% 75%)` - Secondary elements
- **Accent**: `hsl(0 0% 70%)` - Accent highlights
- **Success**: `hsl(150 45% 50%)` - Success states
- **Destructive**: `hsl(0 65% 55%)` - Error/destructive states

### Dark Mode Support
The design system includes a comprehensive dark mode theme with adjusted colors for better contrast and visibility.

## 🎭 Neumorphic Effects

### Shadow System
The neumorphic effect is achieved through carefully crafted shadows:

```css
/* Standard neumorphic shadow */
--shadow-neumorphic: 8px 8px 16px hsl(0 0% 75%), -8px -8px 16px hsl(0 0% 100%);

/* Inset shadow for pressed states */
--shadow-neumorphic-inset: inset 6px 6px 12px hsl(0 0% 75%), inset -6px -6px 12px hsl(0 0% 100%);

/* Small shadow for subtle elements */
--shadow-neumorphic-sm: 4px 4px 8px hsl(0 0% 78%), -4px -4px 8px hsl(0 0% 98%);

/* Large shadow for prominent elements */
--shadow-neumorphic-lg: 12px 12px 24px hsl(0 0% 72%), -12px -12px 24px hsl(0 0% 100%);
```

### Using Shadows in Tailwind
```html
<!-- Apply neumorphic shadow -->
<div class="shadow-neumorphic">Content</div>

<!-- Hover effect with larger shadow -->
<div class="shadow-neumorphic hover:shadow-neumorphic-lg transition-smooth">Content</div>
```

## 🧩 Component Classes

### Cards

#### Neumorphic Card
```html
<div class="card-neumorphic p-6">
  <!-- Card content -->
</div>
```

#### Glass Card (Glassmorphism variant)
```html
<div class="glass-card p-6">
  <!-- Card content with blur backdrop -->
</div>
```

### Buttons

```html
<!-- Primary button -->
<button class="btn-primary">Click me</button>

<!-- Secondary button -->
<button class="btn-secondary">Cancel</button>

<!-- Success button -->
<button class="btn-success">Confirm</button>

<!-- Destructive button -->
<button class="btn-destructive">Delete</button>
```

### Input Fields

```html
<input
  type="text"
  placeholder="Enter text..."
  class="input-neumorphic"
/>
```

### Badges

```html
<!-- Success badge -->
<span class="badge-success">Active</span>

<!-- Destructive badge -->
<span class="badge-destructive">Error</span>

<!-- Muted badge -->
<span class="badge-muted">Pending</span>
```

## ✨ Animations

### Available Animations

1. **Background Shift** - Subtle background movement
```html
<div class="animate-bg-shift">Content</div>
```

2. **Text Glow** - Pulsing brightness effect
```html
<h1 class="animate-text-glow">Glowing Text</h1>
```

3. **Slide Up** - Entrance animation
```html
<div class="animate-slide-up">Content slides in</div>
```

4. **Fade In** - Simple fade entrance
```html
<div class="animate-fade-in">Content fades in</div>
```

5. **Scale In** - Scale and fade entrance
```html
<div class="animate-scale-in">Content scales in</div>
```

### Reveal on Scroll
Use the `reveal` class with JavaScript to trigger animations on scroll:

```html
<div class="reveal">
  <!-- Content animates when scrolled into view -->
</div>
```

```javascript
// Add this to your JavaScript
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
});

reveals.forEach(reveal => observer.observe(reveal));
```

## 🎯 Utility Classes

### Container
```html
<div class="container-app">
  <!-- Centered container with responsive padding -->
</div>
```

### Section Padding
```html
<section class="section-padding">
  <!-- Responsive vertical padding -->
</section>
```

### Text Gradient
```html
<h1 class="text-gradient">Gradient Text</h1>
```

### Animated Gradient Background
```html
<div class="gradient-animated p-8">
  <!-- Flowing gradient background -->
</div>
```

### Metric Glow Effect
```html
<div class="metric-glow p-6">
  <!-- Glows on hover -->
</div>
```

### Loading Skeleton
```html
<div class="skeleton h-20 w-full"></div>
```

### Divider
```html
<div class="divider my-8"></div>
```

### Scrollbar Hide
```html
<div class="overflow-x-auto scrollbar-hide">
  <!-- Scrollable content with hidden scrollbar -->
</div>
```

## 🎬 Transitions

### Smooth Transition
```html
<div class="transition-smooth hover:shadow-neumorphic-lg">
  <!-- Smooth transitions on all properties -->
</div>
```

Custom transition timing:
```css
--transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## 📐 Border Radius

The design system uses a large default radius for a softer look:

```css
--radius: 1.5rem; /* 24px */
```

Responsive border radius:
- `rounded-lg` → Uses `var(--radius)` (1.5rem)
- `rounded-md` → `var(--radius) - 0.25rem` (1.25rem)
- `rounded-sm` → `var(--radius) - 0.5rem` (1rem)

## 🔤 Typography

### Headings
All headings are automatically styled with responsive sizes:

```html
<h1>Large Heading</h1> <!-- 2.25rem → 3rem → 3.75rem -->
<h2>Medium Heading</h2> <!-- 1.875rem → 2.25rem → 3rem -->
<h3>Small Heading</h3> <!-- 1.5rem → 1.875rem -->
<h4>XS Heading</h4> <!-- 1.25rem → 1.5rem -->
```

### Font Family
```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
```

### Text Balance
For better typography on headings:
```html
<h1 class="text-balance">Balanced Text Layout</h1>
```

## 🌓 Dark Mode

Toggle dark mode by adding the `dark` class to the `<html>` element:

```javascript
// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

All colors automatically adjust to dark mode variants.

## 🛠 Build Process

### Development
```bash
# Watch CSS changes in development
npm run watch:css

# Start dev server with CSS build
npm run dev
```

### Production
```bash
# Build minified CSS
npm run build:css

# Build for production
npm run build
```

## 📋 Best Practices

1. **Use semantic colors** - Use `bg-primary`, `text-success` instead of direct color values
2. **Leverage neumorphic shadows** - Apply `shadow-neumorphic` for the signature soft UI look
3. **Animations** - Use built-in animations for consistent motion design
4. **Responsive design** - All components are mobile-first and responsive
5. **Accessibility** - Focus states are automatically styled with ring indicators
6. **Performance** - CSS is minified and optimized for production

## 🎨 Customization

To customize the design system, edit `/src/globals.css`:

```css
:root {
  /* Update colors */
  --primary: 220 70% 60%; /* New primary color */

  /* Update radius */
  --radius: 1rem; /* Smaller border radius */

  /* Update shadows */
  --shadow-neumorphic: 6px 6px 12px ...; /* Subtler shadow */
}
```

Then rebuild:
```bash
npm run build:css
```

## 📦 File Structure

```
/
├── src/
│   └── globals.css          # Design system source
├── public/static/
│   └── style.css            # Compiled CSS (output)
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── DESIGN_SYSTEM.md         # This file
```

## 🚀 Quick Start Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link href="/static/style.css" rel="stylesheet">
</head>
<body>
  <div class="container-app section-padding">
    <h1 class="text-gradient mb-6">Welcome</h1>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="card-neumorphic p-6">
        <h3 class="mb-3">Card Title</h3>
        <p class="text-muted-foreground">Card content goes here.</p>
      </div>

      <div class="glass-card p-6 metric-glow">
        <h3 class="mb-3">Interactive Card</h3>
        <button class="btn-primary mt-4">Click me</button>
      </div>
    </div>
  </div>
</body>
</html>
```

---

**Design System Version:** 1.0.0
**Tailwind CSS Version:** 3.x
**Last Updated:** 2025-10-30
