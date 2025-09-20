# Wheel of Prizes Setup

## Installation

Run this command to install the required library:

```bash
npm install react-wheel-of-prizes
```

## What's Changed

1. **New Wheel Component**: Created `components/wheel-of-prizes.tsx` that uses the `react-wheel-of-prizes` library
2. **Same Design**: Maintained all your original styling, colors, and Arabic text
3. **Same Sounds**: Kept all the audio effects (spinning, winning, losing sounds)
4. **Same Effects**: Preserved confetti, fireworks, and celebration animations
5. **Backend Integration**: Still calls your backend API to get the actual result

## How It Works

1. User clicks the spin button
2. The `react-wheel-of-prizes` library handles the wheel animation
3. When the wheel stops, it calls `onSpin(prize)` with the wheel's result
4. The parent component calls the backend API to get the actual result
5. The backend result is shown in the popup (which may be different from the wheel result)

## Key Features

- ✅ Uses `react-wheel-of-prizes` library for reliable wheel mechanics
- ✅ Maintains your original design and styling
- ✅ Keeps all sound effects and animations
- ✅ Integrates with your backend API
- ✅ Supports Arabic text and RTL layout
- ✅ Same celebration effects (confetti, fireworks, etc.)

## Usage

The component is already integrated into your main page. Just install the library and it will work!

```tsx
<WheelOfPrizesComponent onSpin={handleSpin} disabled={!user || user.credits <= 0} />
```

## Note

The wheel will show one result, but the backend API determines the actual prize. This is normal behavior - the wheel is for visual effect, while the backend ensures fair and accurate prize distribution.
