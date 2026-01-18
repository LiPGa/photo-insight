# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Setup

Set environment variables in `.env.local`:

```bash
# Gemini API Key (required) - must use VITE_ prefix for browser access
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Mock mode - skip API calls and return mock data for local testing (optional)
VITE_MOCK_API=true

# Supabase (optional - for user auth and data persistence)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary (optional - for image upload/CDN)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

**Important:**
1. **Must use `VITE_` prefix**: Only env vars starting with `VITE_` are exposed to browser code by Vite
2. **Create `.env.local` file**: In project root (git-ignored)
3. **Restart dev server**: After changing `.env.local`, restart `npm run dev`
4. **Use mock mode locally**: Set `VITE_MOCK_API=true` to save API quota during development

## Architecture

This is a React 19 + TypeScript photography progress tracking app ("PhotoInsight") built with Vite. It uses the Gemini AI API for photo analysis and critique.

### Core Flow

1. **Photo Upload** (`EvaluationView.tsx`): Users upload photos via drag-drop or file input. EXIF metadata is extracted using `exifr` library.

2. **Image Processing** (`services/imageCompression.ts`): Images are compressed client-side to ~2.5MB target before upload. Large images (>5MB) are resized to max 2048px dimension.

3. **Image Storage** (`services/cloudinaryService.ts`): Compressed images are uploaded to Cloudinary CDN, returning a persistent URL.

4. **AI Analysis** (`services/geminiService.ts`): Photos are sent to Gemini API (`gemini-3-flash-preview` model) for aesthetic evaluation. The service returns:
   - Scores (composition, light, color, technical, expression, overall) on a **10-point scale**
   - Analysis (diagnosis, improvement suggestions, story interpretation)
   - Social media content (Instagram caption and hashtags)
   - Suggested titles and tags

5. **Data Persistence**:
   - Guest users: Photos stored in React state (lost on refresh), 5 analyses/day limit
   - Logged-in users: Photos synced to Supabase (`photo_entries` table), 20 analyses/day limit

### Project Structure

```
├── App.tsx                      # Main app (~80 lines, routing + top-level state)
├── constants.tsx                # All constants and config
├── types.ts                     # TypeScript type definitions
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── ScoreMeter.tsx       # Score progress bar
│   │   └── Histogram.tsx        # Image luminance histogram
│   ├── layout/                  # Layout components
│   │   ├── Sidebar.tsx          # Side/bottom navigation
│   │   └── UserStatusBar.tsx    # Top-right user status
│   ├── evaluation/              # Evaluation page components
│   │   ├── EvaluationView.tsx   # Main evaluation container
│   │   ├── UploadArea.tsx       # Image upload zone
│   │   ├── AnalyzingOverlay.tsx # AI analyzing animation
│   │   ├── TechnicalPanel.tsx   # EXIF + creator notes panel
│   │   └── ResultPanel.tsx      # Analysis result display
│   ├── archives/                # Archives page components
│   │   ├── ArchivesView.tsx     # Main archives container
│   │   ├── TimelineList.tsx     # Timeline photo list
│   │   └── PhotoDetail.tsx      # Single photo detail view
│   ├── AuthModal.tsx            # Login/signup modal
│   └── ShareCardModal.tsx       # Share card generator modal
├── hooks/
│   ├── useDailyUsage.ts         # Daily usage limit logic (5 guest / 20 user)
│   ├── useImageCache.ts         # Duplicate image detection via hash
│   ├── usePhotoAnalysis.ts      # Photo analysis state + AI thinking animation
│   └── useThumbnail.ts          # Thumbnail generation
├── contexts/
│   └── AuthContext.tsx          # Supabase auth context
└── services/
    ├── geminiService.ts         # AI photo analysis (with mock mode)
    ├── supabase.ts              # Supabase client + type definitions
    ├── dataService.ts           # CRUD for photo_entries, usage_stats, user_settings
    ├── cloudinaryService.ts     # Image upload to Cloudinary CDN
    └── imageCompression.ts      # Client-side image optimization
```

### Services

- `services/geminiService.ts`: AI photo analysis with mock mode support. Uses schema-bound responses for reliable JSON parsing.
- `services/cloudinaryService.ts`: Image upload to Cloudinary CDN with thumbnail/optimized URL generation.
- `services/imageCompression.ts`: Canvas-based image compression with quality reduction loop until target size reached.
- `services/supabase.ts`: Supabase client and database type definitions.
- `services/dataService.ts`: CRUD operations for `photo_entries`, `usage_stats`, `user_settings` tables.

### Authentication

- `contexts/AuthContext.tsx`: Provides `useAuth()` hook with Supabase auth (email/password + Google OAuth)
- `components/AuthModal.tsx`: Login/signup modal UI

### Key Types (`types.ts`)

- `PhotoEntry`: Complete photo record with metadata, scores, and analysis
- `DetailedScores`: Numeric ratings (0-10) for composition, light, color, technical, expression, overall
- `DetailedAnalysis`: AI-generated text feedback including diagnosis, improvement, storyNote, moodNote, overallSuggestion
- `NavTab`: Navigation states (EVALUATION, PATH)

### UI Structure

- Two main views controlled by `NavTab`: Evaluation (photo upload/analysis) and Path (archives/timeline)
- Left sidebar navigation with Zap (evaluation) and Activity (archives) icons
- Responsive design with mobile bottom navigation
- Styling: Tailwind CSS via CDN, IBM Plex Mono for monospace elements, dark theme with Leica red (#D40000) accent

### React 19 Patterns

- **Lazy Loading**: `EvaluationView` and `ArchivesView` are lazy-loaded with `React.lazy()` + Suspense
- **useTransition**: Used for non-blocking tab switches between views
- **Memoization**: Components wrapped with `memo()` to prevent unnecessary re-renders

### Scoring Philosophy

The AI uses a strict 10-point grading system:
- 4.0–6.0: Typical casual/snapshot photos
- 7.0+: Requires clear compositional intent
- 8.5+: Reserved for strong visual impact and mature expression
