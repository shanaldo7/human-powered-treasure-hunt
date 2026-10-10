# 🏴‍☠️ Human-Powered AI: Treasure Hunt

> **"AI creates the clues. You find them in the real world."**
> 
> *AI-powered real-world treasure hunts with live research, Google Maps navigation, and Google Lens-assisted discovery.*

---
##working link:https://human-powered-treasure-hunt.ai.studio/
## 🌟 Overview & Product Concept

Most AI applications attempt to keep users staring at screens. **UNT — Human-Powered AI: Treasure Hunt** does the exact opposite: it turns digital intelligence into real-world physical exploration.

Using live web research (SerpApi), open geographical data (OpenStreetMap Overpass API), cultural heritage archives (Wikipedia/Wikidata), Google Maps navigation, and Google Lens visual recognition, the platform creates safe, authentic, and historically grounded physical exploration quests in any city or neighborhood.

### The Real-World Discovery Loop:
1. **Target Area & Genre**: Choose your neighborhood and discovery mode (Hidden History, Architecture, Local Stories & Folklore, Food & Street Eats, Markets & Street Life, etc.).
2. **Multi-Source Discovery Engine**: Researches verified real places using OpenStreetMap, Wikipedia archives, and live Google Search/News via SerpApi.
3. **Structured Physical Clues**: Generates multi-stop walking routes with pedestrian-safe checkpoints, difficulty adjustments, and progressive hints.
4. **Google Maps Navigation**: Direct walking routes and on-site Google Maps previews.
5. **Google Lens Visual Recognition**: Users inspect carvings, statues, cornerstones, plaques, or signs using Google Lens on mobile, then report back their findings.
6. **Gemini Archival Verification**: The backend cross-references the user's on-site findings with archival evidence to determine what matches, what remains uncertain, and how the route adapts.
7. **Adaptive Progress & Final Report**: Personal field journal, branching discovery story routes, and an offline field kit stored locally.

---

## 🏗️ Architecture & Implemented Integrations

```text
┌─────────────────────────────────────────────────────────────┐
│                      REACT SPA FRONTEND                     │
│    Active Hunt UI • Google Lens Bridge • Discovery Radar    │
└──────────────────────────────┬──────────────────────────────┘
                               │
               (Browser LocalStorage Field Journal)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    EXPRESS BACKEND (Node.js)                │
│             /api/discovery • /api/generate-hunt             │
│             /api/lens/verify • /api/next-clue               │
└──────┬───────────────────────┼───────────────────────┬──────┘
       │                       │                       │
┌──────▼───────┐        ┌──────▼───────┐        ┌──────▼───────┐
│ Gemini Flash │        │  Multi-Source│        │ Google Maps  │
│  Model API   │        │   Engine     │        │  Platform    │
│  Auto-Detect │        │ • Overpass   │        │ • Embed Maps │
│ • Clue Craft │        │ • Wikipedia  │        │ • Walking    │
│ • Lens Check │        │ • SerpApi    │        │   Routes     │
└──────────────┘        └──────────────┘        └──────────────┘
```

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons, Motion.
- **Backend**: Express on Node.js (`server.ts`) with typed API proxying.
- **AI Brain**: `@google/genai` TypeScript SDK with model auto-discovery and retry fallbacks.
- **Visual Intelligence**: Google Lens mobile app deep-linking (`intent://lens.google.com/...`) and web fallbacks (`lens.google.com`), cross-verified via Gemini on the backend.
- **Data Adapters**: Modular Overpass API (OSM), Wikipedia MediaWiki API, and SerpApi integration with normalized data models and source attribution.
- **Zero Mandatory External DB**: Browser `localStorage` holds active hunts, completed field journals, and offline kits.

---

## 📋 Prerequisites

- **Node.js**: Version 18+ or 20+
- **npm** or **bun**: Package manager
- **Gemini API Key**: Google AI Studio Gemini API Key
- **SerpApi Key** *(Optional)*: For live Google Search & Google News factual candidate retrieval
- **Google Maps API Key** *(Optional)*: For interactive map embed preview (standard Google Maps directions links work without a key)

---

## 🚀 Installation & Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/human-powered-treasure-hunt.git
cd human-powered-treasure-hunt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

```env
# Google Gemini API Key (Required for AI generation and validation)
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Optional Model Override (Defaults to auto-discovered flash model)
GEMINI_MODEL="gemini-3.8-flash"

# Optional Live Web Research (SerpApi)
SERPAPI_KEY="your_serpapi_key_here"

# Optional Google Maps Embed Key
GOOGLE_MAPS_API_KEY="your_maps_api_key_here"
VITE_GOOGLE_MAPS_API_KEY="your_maps_api_key_here"

# Server Port
PORT=3000
```

### 4. Start the Application

```bash
# Starts Express backend and Vite frontend on http://localhost:3000
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Validation

Run the comprehensive acceptance and integration test suite:

```bash
npm test
```

This verifies:
- Multi-location and multi-genre live research
- Overpass OpenStreetMap and Wikipedia Archive data adapters
- Knowledge graph generation and timeline reconstruction
- Evidence conflict detection
- Google Lens intent resolution and verification logic
- Local storage journal persistence and corruption resilience
- Weather integration and extreme conditions rerouting

Run the TypeScript type check and linter:

```bash
npm run lint
```

Build production bundle:

```bash
npm run build
```

---

## ☁️ Deployment Guidance

### Production Build & Run
```bash
npm run build
npm start
```

### Google Cloud Run Deployment
The application is pre-configured for containerized deployment:

```bash
gcloud run deploy unt-treasure-hunt \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_key",PORT="3000"
```

---

## 🛡️ Safety & Data Guidelines

1. **Pedestrian Safety**: All destination coordinates and clues prioritize public sidewalks, parks, plazas, and pedestrian walkways.
2. **No Secret Leakage**: API keys and tokens are stored on the server side and never committed to version control.
3. **Graceful Degradation**: If an external API (like SerpApi or Maps embed) is unconfigured or rate-limited, the system falls back to open geographic datasets and standard web navigation links.

---

## 📄 License

Apache 2.0 License.
