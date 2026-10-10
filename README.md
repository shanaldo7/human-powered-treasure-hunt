# 🏴‍☠️ HUMAN-POWERED TREASURE HUNT

> **"AI creates the clues. You find them in the real world."**

An AI-powered real-world treasure hunt application built with Gemini and Google Maps.

---

## 🌟 OVERVIEW & PRODUCT CONCEPT

Most AI applications attempt to keep you staring at your screen. **Human-Powered Treasure Hunt** does the exact opposite: it uses AI to generate physical exploration challenges that require you to physically step outside, explore local landmarks, navigate using Google Maps, and discover real-world clues.

### The Real-World Treasure Hunt Loop:
1. **Choose Location**: Select your current location or search for any park, plaza, or city area.
2. **Gemini Creates Hunt**: Gemini generates a structured, safe, multi-stop treasure hunt tailored to your theme and duration.
3. **Follow Clues via Google Maps**: Open destination directions in Google Maps to reach each stop.
4. **Physically Explore**: Put your phone away, observe your surroundings, and locate the physical feature described in the clue.
5. **Report Observation**: Tell Gemini what you discovered.
6. **Adaptive AI Feedback**: Gemini validates your finding and adapts the next clue.
7. **Uncover Final Treasure**: Complete all stops to unlock the final treasure message!

---

## 🏗️ ARCHITECTURE

```text
               ┌────────────────────────────────┐
               │  HUMAN-POWERED TREASURE HUNT   │
               │      React SPA Frontend        │
               └──────────────┬─────────────────┘
                              │
                              ↓ (Browser localStorage Persistence)
               ┌────────────────────────────────┐
               │        EXPRESS BACKEND         │
               │       Node.js / TypeScript     │
               └──────────────┬─────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
   ┌─────────────────┐┌───────────────┐┌──────────────────┐
   │  Gemini Flash   ││ SerpApi Web   ││ Real Google Maps │
   │ Structured Hunt ││ Research      ││ Platform         │
   │ & Clues         ││ (Fallback)    ││ Directions       │
   └─────────────────┘└───────────────┘└──────────────────┘
```

- **Frontend**: React + TypeScript + Vite + Tailwind CSS (Mobile-First Active Hunt UI).
- **Backend**: Express Node.js server (`server.ts`).
- **AI Engine**: Google Gemini (`gemini-3.8-flash`) for hunt generation, adaptive clue evaluation, and Hunt Guide assistance.
- **Web Research**: SerpApi (Optional fallback tool for factual landmark grounding).
- **Navigation**: Real Google Maps directions links.
- **Persistence**: Browser `localStorage` (Zero external database server required).

---

## 🚀 LOCAL DEVELOPMENT & SETUP

### 1. Installation

```bash
git clone https://github.com/your-username/human-powered-treasure-hunt.git
cd human-powered-treasure-hunt
npm install
```

### 2. Environment Variables (`.env`)

Create a `.env` file in the root directory:

```env
# AI Brain (Required)
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-3.8-flash"

# Optional Web Research Fallback
SERPAPI_KEY=""

# Server Port
PORT=3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🛡️ SAFETY & COMPLIANCE RULES

1. **Strict Safety Protocol**: All generated hunt stops are restricted to open, safe, public spaces (public parks, plazas, sidewalks, civic gardens, monuments, pedestrian squares, permitted public trails).
2. **Never Allowed**: Private property, construction zones, railway tracks, dangerous roads, abandoned buildings, restricted areas, or approaching strangers/wildlife.
3. **API Key Security**: `GEMINI_API_KEY` and `SERPAPI_KEY` are maintained server-side in `.env` and are NEVER exposed to client JavaScript or localStorage.

---

## ☁️ GOOGLE CLOUD RUN DEPLOYMENT

The Express backend in `server.ts` is ready for one-click deployment to **Google Cloud Run**:

```bash
gcloud run deploy human-powered-treasure-hunt \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your_key_here",GEMINI_MODEL="gemini-3.8-flash"
```

All persistent hunt state resides in the user's browser `localStorage`, making the Cloud Run instance completely stateless, lightweight, and scalable.

---

## 📄 LICENSE

Apache 2.0 License.
