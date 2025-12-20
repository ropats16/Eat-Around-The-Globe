# 🌍 Eat Around The Globe - Discover World Cuisines

A beautiful, interactive 3D globe application for discovering and exploring food recommendations from around the world. Built with Next.js, Mapbox GL JS, and Google Places API. **Inspired by Marc Lou's DataFast globe.**

## ✨ Features

- **Interactive 3D Globe**: Realistic satellite globe with Mapbox GL JS
- **Auto-Rotating**: Smooth globe rotation with atmospheric effects
- **Google Places Integration**: Search and add food places with real data
- **Real-time Filtering**: Filter by category, dietary restrictions, and price range
- **Clean White UI**: Polished white cards with shadows, matching Marc Lou's design
- **PWA Support**: Install as a native app on any device
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Detail Panels**: Rich information about each food place
- **Activity Feed**: See recently added discoveries (bottom left)
- **Share Functionality**: Share your favorite finds

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- **Mapbox account** (free tier works!)
- **Google Maps API key** with Places API enabled

### Installation

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   Create a `.env.local` file in the root directory:

   ```bash
   cp .env.local.example .env.local
   ```

   Add your API keys:

   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_api_key_here
   ```

3. **Get Mapbox Access Token (for globe):**

   - Go to [Mapbox Account](https://account.mapbox.com/)
   - Sign up for free account
   - Copy your default public token
   - Add to `.env.local`

4. **Get Google Maps API Key (for search):**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable these APIs:
     - Places API
     - Maps JavaScript API
   - Create credentials (API Key)
   - Copy the key to your `.env.local`

5. **Run the development server:**

   ```bash
   pnpm dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Adding Food Places

1. Click the search bar at the top
2. Type the name of a restaurant or food place
3. Select from the autocomplete suggestions
4. The place will be automatically added to the globe with details from Google Places

### Exploring

- **Drag** the globe to rotate
- **Scroll** to zoom in/out
- **Click** on food markers to see details
- **Click** on activity feed items to center the globe

### Filtering

1. Open the sidebar filters
2. Select categories (Street Food, Fine Dining, etc.)
3. Select dietary restrictions (Vegan, Halal, etc.)
4. The globe updates in real-time

## 🏗️ Project Structure

```
eat-around-the-globe/
├── app/
│   ├── layout.tsx          # Root layout with PWA config
│   ├── page.tsx             # Main page component
│   └── globals.css          # Global styles
├── components/
│   ├── Globe.tsx            # 3D globe visualization
│   ├── Starfield.tsx        # Animated background
│   ├── Sidebar.tsx          # Stats and filters
│   ├── ActivityFeed.tsx     # Recent discoveries
│   ├── SearchBar.tsx        # Google Places search
│   ├── DetailPanel.tsx      # Food place details
│   └── LoadingScreen.tsx    # Initial loading
├── lib/
│   ├── types.ts             # TypeScript definitions
│   ├── store.ts             # Zustand state management
│   └── google-places.ts     # Google Places API integration
└── public/
    └── manifest.json        # PWA manifest
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Globe**: Mapbox GL JS (satellite + globe projection)
- **Animations**: Framer Motion
- **State**: Zustand
- **Search**: Google Places API
- **PWA**: @ducanh2912/next-pwa
- **Icons**: Lucide React

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 🎨 Design Inspiration

This project is heavily inspired by **Marc Lou's DataFast** real-time analytics globe. The UI closely matches his clean white card design, satellite globe view, and overall aesthetic. Check out his work:

- [DataFast](https://datafa.st/) - Marc Lou's analytics tool
- [Marc Lou on X](https://x.com/marc_louvion)

### Key Design Elements Borrowed:

- White card UI with subtle shadows
- "REAL-TIME/LIVE" badge styling
- Bottom-left activity feed layout
- Clean typography and spacing
- Satellite globe with auto-rotation

Built with Next.js, Mapbox GL JS, and React.

### Sources:

- [This Founder Hit $11K MRR by Answering One Question Google Analytics Won't | by RipeLemons | Oct, 2025 | Medium](https://ripelemons.medium.com/this-founder-hit-6k-mrr-in-11-months-his-secret-he-stopped-tracking-pageviews-026177b2e68c)
- [Globe and Atmosphere | Mapbox GL JS | Mapbox](https://docs.mapbox.com/mapbox-gl-js/guides/globe/)
- [Create a rotating globe | Mapbox GL JS | Mapbox](https://docs.mapbox.com/mapbox-gl-js/example/globe-spin/)
