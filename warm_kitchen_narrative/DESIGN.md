---
name: Warm Kitchen Narrative
colors:
  surface: '#fdfae7'
  surface-dim: '#dddbc8'
  surface-bright: '#fdfae7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f4e1'
  surface-container: '#f1eedb'
  surface-container-high: '#ece9d6'
  surface-container-highest: '#e6e3d0'
  on-surface: '#1c1c11'
  on-surface-variant: '#55423e'
  inverse-surface: '#313124'
  inverse-on-surface: '#f4f1de'
  outline: '#88726d'
  outline-variant: '#dbc1ba'
  surface-tint: '#9a442d'
  primary: '#9a442d'
  on-primary: '#ffffff'
  primary-container: '#e07a5f'
  on-primary-container: '#5b1604'
  inverse-primary: '#ffb4a1'
  secondary: '#386753'
  on-secondary: '#ffffff'
  secondary-container: '#b8ebd1'
  on-secondary-container: '#3d6c57'
  tertiary: '#765a28'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3915a'
  on-tertiary-container: '#402b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a1'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#7c2e19'
  secondary-fixed: '#bbeed4'
  secondary-fixed-dim: '#9fd1b8'
  on-secondary-fixed: '#002115'
  on-secondary-fixed-variant: '#1f4f3c'
  tertiary-fixed: '#ffdeab'
  tertiary-fixed-dim: '#e6c185'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5c4212'
  background: '#fdfae7'
  on-background: '#1c1c11'
  surface-variant: '#e6e3d0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

The design system is centered around the concept of a "Modern Hearth"—a digital space that feels as warm, inviting, and tactile as a well-loved kitchen. It targets home cooks who value both culinary inspiration and organized efficiency. The emotional response is one of calm confidence, achieved through a "Soft Minimalist" aesthetic that avoids clinical whites in favor of appetizing, organic tones.

The style leverages generous whitespace (utilizing the Oatmeal Sand base) and high-contrast typography to ensure legibility while cooking. Visual interest is driven by a balanced mix of professional structure and friendly, rounded elements, creating a "boutique cookbook" feel translated into a functional interface.

## Colors

The palette is grounded in an organic, earthy spectrum. The primary background (Oatmeal Sand) acts as a warm neutral canvas, reducing eye strain compared to pure white. 

- **Accent Terracotta** is reserved for primary calls to action and critical highlights, providing a savory, high-energy focal point.
- **Fresh Sage Green** handles success states, healthy tags, and "safe" actions like saving or completing a step.
- **Ochre Gold** is used for progress indicators and ratings, evoking a sense of quality and "saffron-infused" warmth.
- **Deep Slate Blue** provides the necessary weight for headers and navigation panels, ensuring a grounded hierarchy.
- **Rust Orange** is strictly for urgency or warnings to maintain a clear distinction from the softer Terracotta.

## Typography

The typography system utilizes **Plus Jakarta Sans** exclusively to maintain a cohesive, contemporary geometric feel. The hierarchy is intentionally dramatic; large, bold displays in Deep Slate Blue are used for recipe titles to mimic editorial layouts.

Body text uses a slightly increased line-height to ensure ingredients and instructions are readable from a distance (e.g., when a phone is on a kitchen counter). Labels utilize a semi-bold weight and slight letter spacing to differentiate them from instructional body copy.

## Layout & Spacing

This design system employs a **Fluid Grid** with fixed maximum containers for desktop viewing. The spacing rhythm is based on a 4px baseline, but defaults to 16px (md) and 24px (lg) for most component spacing to maintain the "airy" kitchen feel.

- **Mobile:** Single column with 16px side margins. Cards span the full width minus margins.
- **Tablet:** 8-column grid with 20px gutters. Sidebar navigation may become a persistent element.
- **Desktop:** 12-column grid. Content is centered in a 1200px container to prevent line-lengths from becoming unreadable.

Structural elements should prioritize vertical rhythm to make long recipe pages feel organized and digestible.

## Elevation & Depth

To maintain the soft, warm aesthetic, this design system avoids harsh black shadows. Depth is created through **Tonal Layers** and **Soft Ambient Shadows**.

- **Level 0 (Base):** Oatmeal Sand (#F4F1DE).
- **Level 1 (Cards/Panels):** Pure White (#FFFFFF) with a very soft, large-radius shadow tinted with the primary terracotta color at 5% opacity.
- **Level 2 (Floating/Modals):** Pure White with a more pronounced shadow (12% opacity) and a thin 1px border in a slightly darker shade of the background to define edges without adding visual weight.

Depth is used sparingly to highlight interactive recipe cards or active "Cooking Mode" panels.

## Shapes

The shape language is defined by the "ROUND_SIXTEEN" philosophy, emphasizing safety, friendliness, and a tactile quality. 

All primary containers, buttons, and input fields utilize a 16px (1rem) corner radius. This significant rounding creates a "squishy" and approachable UI. Image containers (such as recipe photos) should always match this radius. Smaller elements like tags or "chips" may use full pill-rounding to distinguish them as interactive tokens.

## Components

### Buttons
- **Primary:** Terracotta (#E07A5F) background with White text. 16px radius. No border.
- **Secondary:** Transparent background with Sage Green (#81B29A) 2px border and text.
- **Tertiary:** Deep Slate Blue (#3D405B) text only, for less frequent actions.

### Recipe Cards
Cards should be White with a 16px radius and Level 1 elevation. Images should occupy the top half, with a subtle 8px padding between the image edge and the card border for a "framed" look.

### Input Fields
Inputs use a lightened version of the Oatmeal Sand background or White, with a 1px border in Sage Green when focused. The 16px radius is maintained.

### Chips & Tags
Used for dietary labels (Vegan, Gluten-Free). These should use the Ochre Gold (#F2CC8F) at 20% opacity for the background, with High-Contrast Charcoal text for maximum legibility.

### Progress Bars
Utilize the Ochre Gold (#F2CC8F) for the "fill" and a muted version of the Slate Blue for the track, providing a clear visual indicator of recipe completion or prep timing.