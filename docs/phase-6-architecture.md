# AI CAFÉ — Phase 6: Experience & Intelligence V2 Architecture

## Overview
Phase 6 elevates the AI Café platform from a standard recommendation interface into a production-grade, intent-aware intelligent café system. It achieves this by introducing a deterministic catalog query engine, real multi-turn preference memory, repetition avoidance, and an authentic, zero-fake boot loading sequence.

---

## 1. Core Principles

1. **Catalog is the Sole Source of Truth**:
   - The AI (Gemini or Mock) never invents products, prices, stock availability, or configuration rules.
   - All deterministic queries (`cheapest`, `most_expensive`, `budget`, `compare`, `details`, `availability`, `pairing`) query the catalog first.
   - The AI layer is solely responsible for natural language intent interpretation, sensory nuance extraction, and conversational explanation.

2. **Server-Authoritative Pricing & Validation**:
   - All pricing is calculated and validated server-side in Indian Rupees (`₹`).
   - Drink DNA (5-axis vector: Sweetness, Strength, Creaminess, Chill, Richness) is computed deterministically from recipe ingredients.
   - AI recommendations hand off directly to the Drink Studio (`/builder?preset=...`) with server-validated configurations.

3. **Authentic Boot Sequence**:
   - Zero synthetic percentage increments, artificial timeouts, or fake loading animations.
   - Boot progression is tied 1:1 to real browser and network lifecycle promises:
     - Font face decoding (`document.fonts.ready`)
     - Hero canvas poster decode (`/asset/caramel-cold-brew/frame-0001.webp`)
     - Catalog and ingredient preloading
     - AI Barista `/health` ping
     - Firebase authentication state listener resolution
   - Non-critical hero frames continue downloading asynchronously in the background.

---

## 2. Intent Engine Architecture

### Pipeline Flow:
```
USER MESSAGE + CONVERSATION HISTORY
                ↓
    INTENT CLASSIFIER (Fast Deterministic Regex & Pattern Matching)
                ↓
    ENTITY & PREFERENCE EXTRACTOR (AI Provider / Structured Extraction)
                ↓
    MULTI-TURN PREFERENCE EVOLVER (Accumulates state across turns)
                ↓
    DETERMINISTIC CATALOG QUERY (findCheapest, compareProducts, findPairings, etc.)
                ↓
    RECIPE CONFIGURATION & DRINK DNA ENGINE (catalogService.validateDrinkConfiguration)
                ↓
    AI CONVERSATIONAL EXPLANATION (Grounded solely on validated catalog data)
                ↓
    STRUCTURED JSON RESPONSE (intent, message, recommendations, comparison, pairings)
                ↓
    CLIENT UI (Dynamic comparison cards, pairing blocks, Drink Studio handoff)
```

### Supported Intents:
| Intent | Description | Example Query | Deterministic Resolver |
|---|---|---|---|
| `cheapest` | Finds lowest priced drink in category/menu | *"What is the cheapest coffee?"* | `catalogService.findCheapest()` |
| `most_expensive` | Finds highest priced premium drink | *"What is the most expensive drink?"* | `catalogService.findMostExpensive()` |
| `budget` | Filters drinks strictly under natural language amount | *"What can I get under ₹200?"* | `catalogService.findWithinBudget()` |
| `compare` | Side-by-side spec & sensory comparison | *"Compare Vanilla Latte and Caramel Cold Brew"* | `catalogService.compareProducts()` |
| `details` | Retrieves full taste profile, description, & specs | *"Tell me about Matcha Cloud"* | `catalogService.getProductByIdOrSlug()` |
| `availability` | Lists in-stock menu items | *"What drinks are available?"* | `catalogService.findAvailable()` |
| `pairing` | Curated artisan bakery and food pairings | *"What snack goes with cold brew?"* | `catalogService.findPairings()` |
| `ingredient` | Queries drinks containing specific ingredients | *"What has caramel?"* | `catalogService.findByIngredient()` |
| `category` | Queries drinks by category | *"Show me coffees"* | `catalogService.findByCategory()` |
| `random` | Curated surprise with repetition avoidance | *"Surprise me with something random"* | Penalizes `recentProductIds` |
| `customize` | Fine-tunes sweetness, ice, milk, or toppings | *"Make it less sweet with oat milk"* | Updates cumulative state |
| `recommend` | Multi-dimensional sensory taste matching | *"I need a creamy drink for late focus"* | `rankProducts` + Drink DNA |

---

## 3. Conversation Memory & Preference Evolution

State model:
```typescript
interface BaristaPreferences {
  temperature?: "hot" | "cold" | "blended";
  sweetness?: number; // 0 - 100
  strength?: number;  // 0 - 100
  creaminess?: number;
  chill?: number;
  richness?: number;
  flavor?: string;
  flavorPreferences?: string[];
  flavorAvoidances?: string[];
  milk?: string;
  milkPreference?: string;
  category?: string;
  budget?: number;
}
```

- Multi-turn interactions accumulate preferences:
  - Turn 1: *"I want something cold"* -> `{ temperature: "cold" }`
  - Turn 2: *"Make it strong"* -> `{ temperature: "cold", strength: 80 }`
  - Turn 3: *"Less sweet"* -> `{ temperature: "cold", strength: 80, sweetness: 30 }`
  - Turn 4: *"Add caramel"* -> `{ temperature: "cold", strength: 80, sweetness: 30, flavor: "caramel" }`

---

## 4. Repetition Avoidance Engine

- Within each session, recommended product IDs are tracked in `recentProductIds: string[]`.
- In `BaristaService.rankProducts()`, recently recommended items receive a severe score penalty (`score -= 35`) unless the customer explicitly requests the item by name.
- For `random` / "Surprise Me" queries, fresh items are selected first, preventing identical recommendations on successive turns.

---

## 5. Security & Rate Limiting

- `express-rate-limit`: 10 requests per minute per IP on `/api/barista/recommend` to protect Gemini API quotas and server bandwidth.
- API keys (`GEMINI_API_KEY`) and Firebase Admin credentials remain strictly server-side.
- In production, missing AI configuration produces an explicit 503 error (`AI_BARISTA_NOT_CONFIGURED`) rather than silently swapping to mock data.
