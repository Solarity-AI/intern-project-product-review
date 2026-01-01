# Product Review App - React Native / Expo

This folder contains the React Native version of the Product Review Application, designed to work with Expo for cross-platform iOS and Android development.

## 🚀 Quick Start

### 1. Create New Expo Project

```bash
npx create-expo-app ProductReviewApp
cd ProductReviewApp
```

### 2. Install Dependencies

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# UI Components
npx expo install expo-linear-gradient

# Icons (already included with Expo)
# @expo/vector-icons is pre-installed
```

### 3. Copy Files

Copy all files from this `src/native` folder to your Expo project:

```
ProductReviewApp/
├── App.tsx          (replace with native/App.tsx content)
├── components/
│   ├── AddReviewModal.tsx
│   ├── Button.tsx
│   ├── CategoryFilter.tsx
│   ├── ProductCard.tsx
│   ├── RatingBreakdown.tsx
│   ├── ReviewCard.tsx
│   ├── SearchBar.tsx
│   └── StarRating.tsx
├── constants/
│   ├── data.ts
│   └── theme.ts
├── hooks/
│   └── useColorScheme.ts
├── screens/
│   ├── ProductDetailsScreen.tsx
│   └── ProductListScreen.tsx
└── types/
    └── index.ts
```

### 4. Run the App

```bash
# Start Expo development server
npx expo start

# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR code with Expo Go app for physical device
```

## 📱 Features

- **Product List**: Browse products with search and category filters
- **Product Details**: View full product info with rating breakdown
- **Reviews System**: Read and write reviews with star ratings
- **Cross-Platform**: Works on iOS, Android, and Web

## 🎨 Design System

The app uses a warm, trustworthy color palette with amber accents:

- **Primary**: `#F59E0B` (Amber)
- **Background**: `#FDFBF8` (Warm off-white)
- **Foreground**: `#1C1917` (Deep warm gray)

All colors and spacing are defined in `constants/theme.ts` for easy customization.

## 📁 Project Structure

```
native/
├── App.tsx                 # App entry with navigation
├── types/
│   └── index.ts           # TypeScript interfaces
├── constants/
│   ├── theme.ts           # Colors, spacing, fonts
│   └── data.ts            # Mock product data
├── components/
│   ├── StarRating.tsx     # Interactive star rating
│   ├── Button.tsx         # Multi-variant button
│   ├── ProductCard.tsx    # Product display card
│   ├── ReviewCard.tsx     # Review display card
│   ├── CategoryFilter.tsx # Category chip filter
│   ├── SearchBar.tsx      # Search input
│   ├── AddReviewModal.tsx # Review submission modal
│   └── RatingBreakdown.tsx # Rating distribution bars
├── screens/
│   ├── ProductListScreen.tsx    # Home/products screen
│   └── ProductDetailsScreen.tsx # Product detail screen
└── hooks/
    └── useColorScheme.ts  # Theme hook
```

## 🔧 Customization

### Adding Dark Mode

Update `useColorScheme.ts`:

```typescript
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
};
```

### Connecting to Backend

Replace mock data in `constants/data.ts` with API calls:

```typescript
// Example with fetch
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch('YOUR_API_URL/products');
  return response.json();
};
```

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `@react-navigation/native` | Navigation container |
| `@react-navigation/native-stack` | Stack navigator |
| `expo-linear-gradient` | Gradient backgrounds |
| `@expo/vector-icons` | Ionicons for UI |

## 🌐 Web Support

This code also works on web with Expo. Run:

```bash
npx expo start --web
```

## 📄 License

MIT - Feel free to use in your projects!
