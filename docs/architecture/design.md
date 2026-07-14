# PDF Sage Design System

## Color Palette

### Primary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--gray-900` | `#111827` | Primary text, buttons, dark backgrounds |
| `--gray-800` | `#1F2937` | Hover states, secondary dark |
| `--gray-700` | `#374151` | Tertiary text |
| `--gray-600` | `#4B5563` | Secondary text |
| `--gray-500` | `#6B7280` | Muted text |
| `--gray-400` | `#9CA3AF` | Placeholder text, icons |
| `--gray-300` | `#D1D5DB` | Borders, dividers |
| `--gray-200` | `#E5E7EB` | Light borders, hover bg |
| `--gray-100` | `#F3F4F6` | Subtle backgrounds |
| `--gray-50` | `#F9FAFB` | Page background |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#22C55E` | Success states, positive indicators |
| `--error` | `#EF4444` | Error states, destructive actions |
| `--warning` | `#F59E0B` | Warning states, caution |

## Typography

### Font Family

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Type Scale

| Name | Size | Line Height | Letter Spacing | Weight |
|------|------|-------------|----------------|--------|
| `display-xl` | 4rem (64px) | 1 | -0.04em | 600 |
| `display-lg` | 3rem (48px) | 1.05 | -0.03em | 600 |
| `display-md` | 2rem (32px) | 1.1 | -0.02em | 600 |
| `display-sm` | 1.5rem (24px) | 1.2 | -0.02em | 600 |
| `body-xl` | 1.25rem (20px) | 1.6 | -0.01em | 400 |
| `body-lg` | 1.125rem (18px) | 1.6 | -0.01em | 400 |
| `body-md` | 1rem (16px) | 1.6 | 0 | 400 |
| `body-sm` | 0.875rem (14px) | 1.5 | 0 | 400 |
| `label` | 0.75rem (12px) | 1 | 0.1em | 500 |

## Spacing

Base unit: 4px

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Small elements, badges |
| `--radius-md` | 12px | Buttons, inputs |
| `--radius-lg` | 16px | Cards, modals |
| `--radius-xl` | 24px | Large cards, containers |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-soft` | `0 2px 8px -2px rgba(0,0,0,0.05), 0 4px 16px -4px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-medium` | `0 4px 12px -4px rgba(0,0,0,0.08), 0 8px 24px -8px rgba(0,0,0,0.08)` | Cards, dropdowns |
| `shadow-large` | `0 8px 24px -8px rgba(0,0,0,0.1), 0 16px 48px -16px rgba(0,0,0,0.1)` | Modals, popovers |

## Animations

### Timing Functions

- **Ease out:** `cubic-bezier(0.4, 0, 0.2, 1)` - Elements entering
- **Ease in:** `cubic-bezier(0.4, 0, 1, 1)` - Elements exiting
- **Ease in-out:** `cubic-bezier(0.4, 0, 0.2, 1)` - State changes

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Hover states, micro-interactions |
| `--duration-normal` | 200ms | Button clicks, toggles |
| `--duration-slow` | 300ms | Page transitions, modals |
| `--duration-slower` | 500ms | Complex animations |

### Keyframes

```css
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
```

## Component Patterns

### Buttons

- **Primary:** `bg-gray-900 text-white` → hover: `bg-gray-800`
- **Secondary:** `bg-white text-gray-900 border border-gray-200` → hover: `bg-gray-50`
- **Ghost:** `bg-transparent text-gray-600` → hover: `bg-gray-100`
- **Danger:** `bg-red-600 text-white` → hover: `bg-red-700`

### Cards

- Base: `bg-white rounded-2xl border border-gray-100`
- Hover: Add `shadow-lg`, `-translate-y-0.5`, `border-gray-200`

### Inputs

- Base: `bg-gray-50 border border-gray-200 rounded-xl`
- Focus: `ring-2 ring-gray-900 ring-offset-2`

## Layout

### Max Width

- Content: `max-w-[1200px]`
- Narrow: `max-w-2xl` (672px)
- Wide: `max-w-4xl` (896px)

### Grid

- Dashboard: Sidebar (240px) + Main content
- Landing: 2-column hero, 3-column features

## Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Base | 0 | Default |
| Dropdown | 10 | Dropdowns, popovers |
| Sticky | 20 | Sticky headers |
| Modal Backdrop | 30 | Modal overlays |
| Modal | 40 | Modal content |
| Toast | 50 | Toast notifications |
| Tooltip | 60 | Tooltips |

## Accessibility

- Focus visible: `outline: 2px solid #111827; outline-offset: 2px`
- Minimum touch target: 44px × 44px
- Color contrast: ≥4.5:1 for body text, ≥3:1 for large text
- Reduced motion: All animations respect `prefers-reduced-motion`
