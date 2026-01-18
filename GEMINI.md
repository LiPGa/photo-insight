# GEMINI.md

This file provides guidance to the Gemini AI assistant when working with the code in this repository.

## Project Overview

This is a React 19 + TypeScript photography progress tracking app ("PhotoInsight") built with Vite. It uses the Gemini AI API for photo analysis and critique.

The application allows users to upload photos, receive an AI-powered analysis of their work, and track their progress over time. The analysis includes scores on a 10-point scale for various photographic elements, as well as qualitative feedback and suggestions for improvement.

### Core Technologies

*   **Frontend:** React 19, TypeScript, Vite
*   **AI:** Google Gemini API (`gemini-3-flash-preview` model)
*   **Styling:** Tailwind CSS (via CDN)
*   **Authentication:** Supabase (Email/Password + Google OAuth)
*   **Database:** Supabase (PostgreSQL)

### Architecture

The application is structured into two main views:

*   **Evaluation View:** Handles photo uploads, EXIF data extraction, and displays the AI-powered analysis results.
*   **Archives View:** A timeline of all analyzed photos, with a detail view for each entry.

State management is handled through a combination of React's built-in hooks (`useState`, `useEffect`, `useTransition`) and custom hooks for specific concerns like photo analysis (`usePhotoAnalysis`), daily usage limits (`useDailyUsage`), and image caching (`useImageCache`).

User authentication is managed through a `AuthContext` that provides a `useAuth` hook for accessing user and session data.

Data persistence for logged-in users is handled by a `dataService` that performs CRUD operations on the Supabase database. Guest users' data is stored in the component state and is lost on refresh.

## Building and Running

### Development Commands

```bash
# Install dependencies
npm install

# Start the development server on http://localhost:3000
npm run dev

# Build the application for production
npm run build

# Preview the production build
npm run preview
```

### Environment Setup

Set environment variables in a `.env.local` file in the project root:

```bash
# Gemini API Key (Required)
GEMINI_API_KEY=your_api_key_here

# Mock Mode - Skips the API call and returns mock data for local testing (Optional)
VITE_MOCK_API=true

# Supabase - For user authentication and data persistence (Optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** For local development, it is recommended to set `VITE_MOCK_API=true` to conserve your API quota.

## Development Conventions

### Coding Style

*   The codebase follows standard TypeScript and React conventions.
*   Functional components with hooks are used throughout the application.
*   The project uses lazy loading for the main view components (`EvaluationView` and `ArchivesView`) to improve initial load times.
*   Memoization is used for some components to prevent unnecessary re-renders.
*   The project uses a custom hook `usePhotoAnalysis` to manage the state of the photo analysis process.

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
│   ├── useDailyUsage.ts         # Daily usage limit logic
│   ├── useImageCache.ts         # Duplicate image detection
│   └── usePhotoAnalysis.ts      # Photo analysis state
├── contexts/
│   └── AuthContext.tsx          # Supabase auth context
└── services/
    ├── geminiService.ts         # AI photo analysis
    ├── supabase.ts              # Supabase client
    └── dataService.ts           # Database CRUD operations
```
