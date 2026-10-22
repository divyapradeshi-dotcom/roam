# Roam Design System

Roam is a warm, calm travel-stay brand. Its visual language pairs bold, direct typography with soft surfaces, generous rounded corners, and a sunny yellow action color.

This document is the project-wide reference for product UI. Shared Tailwind theme tokens live in [`src/global.css`](./src/global.css); prefer those tokens over new one-off hex values.

## Brand

- **Name:** roam
- **Tagline:** Find unforgettable stays for every kind of trip.
- **Personality:** welcoming, optimistic, clear, and relaxed.
- **Primary action:** bright yellow with dark text.
- **Supporting accent:** lavender for selected filters and soft informational highlights.

## Color tokens

Use the named tokens below in NativeWind classes, for example `bg-roam-primary`, `text-roam-ink`, and `border-roam-border`.

| Token | Value | Use |
| --- | --- | --- |
| `roam-primary` | `#FFC629` | Primary buttons, active navigation, key actions |
| `roam-lavender` | `#C9B4FF` | Selected filters and secondary highlights |
| `roam-ink` | `#0B0B1A` | Primary text and high-contrast surfaces |
| `roam-muted` | `#68728B` | Secondary text, captions, supporting information |
| `roam-placeholder` | `#98A4C2` | Placeholder and soft brand copy |
| `roam-surface` | `#FFFFFF` | Cards, sheets, modals |
| `roam-surface-muted` | `#F4F5F7` | Secondary surface and inactive controls |
| `roam-app-background` | `#F1F4F8` | Screen background |
| `roam-field` | `#F8F9FB` | Input backgrounds |
| `roam-border` | `#E5E7EB` | Dividers, outlines, and card borders |
| `roam-focus` | `#A98BFF` | Focused input outline and focus accents |
| `roam-policy` | `#F2EDFF` | Policy and informational cards |
| `roam-success-background` | `#DDF4E9` | Success alert surface |
| `roam-success-text` | `#176B4B` | Success alert text and icon |
| `roam-error-background` | `#FFE3EA` | Error alert surface |
| `roam-error-text` | `#C62C4B` | Error alert text and icon |
| `roam-glass` | `rgb(255 255 255 / 70%)` | Translucent surfaces over content |

Google's multicolor `G` is a provider brand mark, not a Roam color token. Keep external brand marks in their official colors.

## Typography

Use a geometric sans-serif style. Prefer the Manrope family when it is loaded by the app; otherwise use the platform sans-serif. Keep text readable and hierarchy obvious.

| Role | Suggested size | Weight | Typical use |
| --- | --- | --- | --- |
| Display | 36–56 px | Bold / extra bold | Brand wordmark and major page heading |
| Heading | 24–32 px | Bold | Stay titles and section headings |
| Body | 14–16 px | Regular | Descriptions and form content |
| Caption | 12–14 px | Regular / medium | Locations, metadata, helper text |
| Label | 12–14 px | Semibold / bold | Buttons, chips, and compact controls |

- Use tight line-height for display and heading text; use more relaxed line-height for body copy.
- Avoid long all-caps text. Reserve uppercase tracking for small eyebrow labels.
- Use `roam-ink` for primary text and `roam-muted` for secondary text.

## Layout and shape

- Design mobile-first; allow content to scroll rather than squeezing dense content into one viewport.
- Keep page gutters around 12–16 px and card padding around 16 px.
- The shared theme defines `rounded-card` (24 px) and `rounded-control` (16 px).
- Use full pill radii for chips and primary pill buttons.
- Separate sections with consistent spacing and clear grouping.
- Prefer white cards over the pale app background; use borders sparingly to distinguish surfaces.

## Components

### Buttons

- **Primary:** `roam-primary` background, `roam-ink` label, bold text, pill shape.
- **Secondary:** white background, `roam-border` outline, dark label.
- Keep labels short and action-oriented. Include a clear pressed/disabled state in interactive implementations.

### Inputs

- Use `roam-field` background with a `roam-border` outline and rounded-control corners.
- Use `roam-muted` for labels and helper text, and `roam-placeholder` for placeholder text.
- A focused input uses `roam-focus` for its outline; do not rely on color alone to communicate focus.

### Filter chips

- Unselected: `roam-surface-muted` surface, subtle border, dark label.
- Selected: `roam-lavender` surface and dark label.
- Keep chip height and horizontal padding consistent within a group.

### Cards and listings

- Use a white, rounded card with a subtle border.
- Prioritize the property image, title, location, rating, key amenities, and price.
- Use `roam-policy` for informational policy cards; keep information and actions clearly separated.

### Navigation and icon buttons

- Use consistent icon size, hit area, and alignment.
- Highlight the active destination with `roam-primary`.
- Use translucent `roam-glass` only when content remains legible beneath it.

### Alerts and badges

- Success uses `roam-success-background` and `roam-success-text`.
- Errors use `roam-error-background` and `roam-error-text`.
- Badges should be short, compact, and visually subordinate to the content they describe.

## Accessibility

- Maintain strong text/background contrast, especially on yellow and lavender surfaces.
- Do not use color as the only indicator of state; pair it with text, icons, or shape changes.
- Provide accessible labels and adequate touch targets for interactive controls.
- Respect system font scaling and safe areas.

## NativeWind examples

```tsx
<View className="flex-1 bg-roam-app-background p-page">
  <View className="rounded-card border border-roam-border bg-roam-surface p-card">
    <Text className="text-roam-ink">Find your next stay</Text>
    <Text className="text-roam-muted">A little more room to roam.</Text>
    <Pressable className="rounded-full bg-roam-primary px-5 py-3">
      <Text className="font-bold text-roam-ink">Explore stays</Text>
    </Pressable>
  </View>
</View>
```

The design board screen at [`src/app/index.tsx`](./src/app/index.tsx) demonstrates the palette and component patterns. Update this guide and the shared theme together when the visual system changes.
