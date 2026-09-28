# AI CAFÉ — Phase 7.2 Architecture & Concierge Intelligence
## AI Barista: Café Concierge Intelligence

### 1. Objective
Phase 7.2 elevates the AI Barista from a recommendation bot into a sophisticated, authentic **AI Café Concierge / Waiter / Barista**. The concierge operates as a knowledgeable café server who understands customer cravings, mood, budget, real menu catalog, pairings, comparisons, multi-turn contexts, and pronoun references without forcing every message into custom drink creation recommendations.

The concierge maintains strict server-side authority:
- The LLM is **NOT** the source of truth.
- Products, pricing, availability, recipes, pairings, and combos originate strictly from the server catalog and database.
- The LLM performs language understanding, intent inference, structured action planning, and natural explanations grounded in real catalog data.

---

### 2. Existing Architecture (Phases 1–7.1)
Prior to Phase 7.2, the application included:
- **Phase 1**: Cinematic Canvas Hero (192 frames, GSAP ScrollTrigger).
- **Phase 2**: Firebase Authentication for customers (Email/Password + Google).
- **Phase 3**: Node.js/Express TypeScript backend with Firebase Admin SDK.
- **Phase 4**: Product Catalog, Drink Builder, server-authoritative Drink DNA, and configuration pricing.
- **Phase 5**: AI Barista V1 (Gemini integration, mock provider, recommendation endpoint).
- **Phase 6**: AI Intelligence V2 (deterministic intent engine, multi-turn preferences, basic pairings, budget foundations).
- **Phase 7 & 7.1**: Hierarchical RBAC and Authentication Separation across 4 distinct account domains (`CUSTOMER`, `STAFF`, `ADMIN`, `SUPER ADMIN`) with dedicated login portals (`/login`, `/staff-login`, `/admin-login`, `/super-admin-login`).

---

### 3. New AI Concierge Architecture
Phase 7.2 establishes a disciplined multi-stage execution pipeline:

```
[ User Message ]
       │
       ▼
[ Natural Language Understanding & Mood Detection ]
       │
       ▼
[ Context & Reference Resolution ("that one", "make it large", "less sweet") ]
       │
       ▼
[ Multi-Turn Preference Accumulation (Temperature, Sweetness, Strength, Milk, Budget) ]
       │
       ▼
[ Controlled Server Tool Dispatch (Catalog, Builder, Pairings, Customer) ]
       │
       ▼
[ Real Catalog & Server-Authoritative Database ]
       │
       ▼
[ Validated Result & Real Pricing Verification ]
       │
       ▼
[ AI Grounded Explanation ("Why This?") ]
       │
       ▼
[ Structured Response Mode UI (GREETING, CATALOG_QUERY, BUDGET_COMBO, etc.) ]
```

---

### 4. Semantic Natural Language Understanding
The concierge resolves semantic paraphrases to authoritative catalog queries rather than relying on brittle keyword matching.

#### Price Paraphrase Resolutions:
- *"expensive coffee in your cafe"* $\to$ `findMostExpensive(category: "coffee")` $\to$ Mocha Cream (₹220)
- *"which coffee costs the most?"* $\to$ `findMostExpensive(category: "coffee")` $\to$ Mocha Cream (₹220)
- *"what's your priciest coffee?"* $\to$ `findMostExpensive(category: "coffee")` $\to$ Mocha Cream (₹220)
- *"show me the fanciest coffee"* $\to$ `findMostExpensive(category: "coffee")` $\to$ Mocha Cream (₹220)
- *"which coffee has the highest price?"* $\to$ `findMostExpensive(category: "coffee")` $\to$ Mocha Cream (₹220)
- *"what is your premium coffee?"* $\to$ `findMostExpensive(category: "coffee")` $\to$ Mocha Cream (₹220)
- *"give me the cheapest coffee"* $\to$ `findCheapest(category: "coffee")` $\to$ Caramel Cold Brew (₹180)

#### Budget Paraphrase Resolutions:
- *"I only have ₹200"* $\to$ budget: ₹200
- *"keep it under 200"* $\to$ budget: ₹200
- *"what can I get for 200?"* $\to$ budget: ₹200
- *"I've got two hundred rupees"* $\to$ word-form budget: ₹200
- *"something affordable around ₹250"* $\to$ budget: ₹250

---

### 5. Response Modes
The system classifies every response into an appropriate mode and avoids forcing factual queries into recommendation cards:

| Response Mode | Trigger Example | Rendered UI Presentation |
| :--- | :--- | :--- |
| `GREETING` | "Hi", "Hello", "Good morning" | Warm concierge greeting & open inquiry |
| `CONVERSATION` | "Who are you?", "What can you do?" | Concierge background & capabilities |
| `CATALOG_QUERY` | "Which coffee costs the most?", "Cheapest coffee" | Authentic catalog product cards with badge, price, availability |
| `RECOMMENDATION` | "I want something cold", "Recommend a drink" | Recommendation cards with Drink DNA & customization options |
| `COMPARISON` | "Compare Vanilla Latte and Caramel Cold Brew" | Side-by-side contrast with sensory highlights and price difference |
| `DETAILS` | "Tell me about Matcha Cloud" | Detailed product highlight with taste notes and ingredients |
| `PAIRING` | "What snack goes with my coffee?" | Curated artisan pastry, cookie, cake, and savory pairings |
| `CUSTOMIZATION` | "Make it strong", "Less sweet", "Make it large" | Adjusted recipe card with direct Drink Studio handoff |
| `BUDGET_COMBO` | "Coffee and something sweet under ₹300", "Café moment" | Complete Café Moment card (Drink + Snack + Total Price $\le$ Budget) |

---

### 6. Controlled Server Tool Architecture
All tools execute strictly on the backend. The LLM has zero direct database or Firestore access.

```ts
// barista-tools.service.ts
export class BaristaToolsService {
  // Catalog Tools
  searchProducts(query: string, category?: string): Promise<ProductDoc[]>;
  getProduct(idOrSlug: string): Promise<ProductDoc | null>;
  findCheapest(category?: string): Promise<ProductDoc | null>;
  findMostExpensive(category?: string): Promise<ProductDoc | null>;
  findWithinBudget(maxBudget: number, category?: string): Promise<ProductDoc[]>;
  findByCategory(category: string): Promise<ProductDoc[]>;
  findByIngredient(ingredient: string): Promise<ProductDoc[]>;
  compareProducts(idA: string, idB: string): Promise<BaristaComparisonItem | null>;
  findPairings(idOrSlug: string): Promise<BaristaPairingItem[]>;
  checkAvailability(idOrSlug: string): Promise<{ available: boolean; product: ProductDoc | null; alternatives: ProductDoc[] }>;
  buildCafeMomentCombo(drinkIdOrSlug?: string, maxBudget?: number, categoryPreference?: string): Promise<CafeMomentCombo | null>;

  // Builder Tools
  validateDrinkConfiguration(config: DrinkConfiguration): Promise<DrinkValidationResult>;
  calculateDrinkPrice(config: DrinkConfiguration): Promise<{ basePrice: number; customizationTotal: number; finalPrice: number }>;
  resolveDrinkConfiguration(product: ProductDoc, prefs: BaristaPreferences, context?: SafeCatalogContext): DrinkConfiguration;

  // Customer Tools (Authenticated Customer Only)
  getOwnTasteProfile(userId?: string): Promise<Record<string, unknown> | null>;
  getOwnFavorites(userId?: string): Promise<ProductDoc[]>;
  getOwnSavedCreations(userId?: string): Promise<unknown[]>;
  getOwnRecentOrders(userId?: string): Promise<unknown[]>;

  // Future Cart Interfaces (Phase 8 Preparation)
  getCart(userId: string): Promise<CustomerCartStub>;
  addToCart(userId: string, item: { productId: string; configuration: DrinkConfiguration; quantity?: number }): Promise<CustomerCartStub>;
  removeFromCart(userId: string, itemId: string): Promise<CustomerCartStub>;
  updateCartItem(userId: string, itemId: string, updates: { quantity?: number }): Promise<CustomerCartStub>;
}
```

---

### 7. Multi-Turn Preference State
The conversation accumulates preferences naturally across turns without dropping existing constraints unless modified:
- `temperature`: `"hot"` | `"cold"` | `"blended"`
- `sweetness`: `0 - 100`
- `strength`: `0 - 100` (caffeine / boldness)
- `creaminess`: `0 - 100`
- `chill`: `0 - 100`
- `richness`: `0 - 100`
- `flavor` & `flavorPreferences`: `string[]` (e.g. caramel, vanilla, chocolate)
- `flavorAvoidances`: `string[]`
- `milk`: `string` (e.g. oat-milk, almond-milk, whole-milk)
- `category`: `string`
- `budget`: `number` (max budget in INR)

#### Lightweight Café Mood States (No medical or psychological claims):
- `REFRESH`: Heat, thirst, cooling desires $\to$ cold drinks, citrus/mint/fruit accents.
- `FOCUS`: Work, study, concentration $\to$ smooth, bold coffee, moderate sweetness.
- `CHILL`: Unwind, relax, casual afternoon $\to$ balanced matcha, tea, light smoothies.
- `COMFORT`: Cozy, rainy day, warm hug $\to$ hot steamed drinks, vanilla, cinnamon.
- `INDULGE`: Treat myself, sweet tooth, dessert cravings $\to$ rich mochas, frappes, whipped cream.
- `ENERGIZE`: Wake me up, tired, early morning $\to$ high caffeine, espresso, bold cold brew.
- `EXPLORE`: Something new, surprise me, unique $\to$ specialty creations, seasonal spotlights.

---

### 8. Contextual Reference Resolution
The concierge resolves pronouns and relative references using conversational context:
- *"that one"* / *"make that large"* $\to$ references `activeProductId` (the current drink under discussion).
- *"the second one"* $\to$ references index 1 from previous recommendations.
- *"not that one"* / *"give me another"* $\to$ tags current product as rejected, adds to avoidance set, and returns an alternative option.
- *"same but with oat milk"* $\to$ retains all attributes of the active drink while switching milk to oat milk.

---

### 9. Catalog Integration & Grounded Data
The catalog service is the single authoritative source of truth:
- No invented drinks, prices, or ingredients.
- Authoritative base pricing and ingredient add-on pricing are verified server-side.
- Factual queries return `catalogProducts` directly from `CatalogService`.

---

### 10. Pairing System & "Complete My Café Moment"
Pairings are sourced directly from catalog metadata (`product.pairings`):
- Default pairings map to artisan kitchen items: Almond Croissant (₹130), Sea Salt Caramel Biscotti (₹95), Dark Chocolate Truffle (₹160), Belgian Waffle Bites (₹130), etc.
- **Complete My Café Moment**: Drink (authoritative price) + Snack (authoritative price) $\le$ max budget.
- Total price is calculated dynamically by the server, ensuring the combination never exceeds customer budget.

---

### 11. Budget Intelligence
Budget reasoning operates with strict mathematical enforcement:
- Single drink queries under budget filter catalog items where `basePrice <= budget`.
- Combo queries calculate `drink.basePrice + snack.price <= budget`.
- When custom sizing is applied (e.g. "make it large"), the server validation engine recomputes final prices authoritatively.

---

### 12. Non-Random "Surprise Me"
"Surprise Me" is not implemented as arbitrary randomness:
- Filters out recently recommended products (`recentProductIds`).
- Filters out explicitly rejected products (`rejectedProductIds`).
- Applies active taste preferences and mood context (`EXPLORE`).
- Selects an unexpected yet appropriate handcrafted drink from available catalog items.

---

### 13. Availability Awareness
Before any product is presented:
- `baristaToolsService.checkAvailability(productId)` is verified.
- If unavailable, the product is not recommended as in stock.
- The concierge transparently explains that the item is currently unavailable and offers fresh alternatives from the real catalog.

---

### 14. Builder Handoff
Validated configurations hand off seamlessly to the Drink Studio:
- Links directly to `/builder?preset=${product.id}` with validated presets.
- Customers can transition from conversational concierge guidance to manual tactile customization.

---

### 15. Security & Privacy
- **Zero Credential Exposure**: No Firebase service-account keys or Gemini API keys are exposed to the client.
- **Cross-Customer Data Isolation**: Customer tools (`getOwnFavorites`, `getOwnTasteProfile`, `getOwnRecentOrders`) strictly require the authenticated Firebase UID of the requesting user. Guest users receive an empty profile with no data leaks.
- **Role Isolation**: RBAC boundaries from Phase 7.1 remain completely intact. The AI concierge has no capability to read administrative logs, update inventory, or elevate account roles.

---

### 16. Testing & Quality Assurance
The verification suite includes **104 automated tests** with 100% pass rate:
- **Price Tests (61–67)**: Semantic variations of most expensive, priciest, fanciest, cheapest.
- **Budget Tests (68–72)**: Digit-based and word-form budget parsing with real catalog filtering.
- **Temperature Tests (73–75)**: Cold, hot, and hot weather context mapping.
- **Mood Tests (76–80)**: Energize, focus, comfort, indulge, explore without medical claims.
- **Pairing Tests (81–84)**: Real food pairings and Complete Café Moment budget combos.
- **Context & Modifiers (85–89)**: Strength, sweetness, flavor, size, and temperature modifiers.
- **References (90–94)**: "Give me another", "not that one", "something similar", "the second one".
- **Surprise (95–97)**: Contextual, non-random curated surprises.
- **Security & Data Integrity (98–100)**: Price integrity, availability enforcement, user data isolation.
- **Multi-Turn Flows (101–104)**: Comprehensive 4-turn dialog flows (A, B, C, D).
- **Regression Tests (1–60)**: All Phase 1–7.1 tests pass without regression.

---

### 17. Performance & UX
- Real-time concierge status indicators without artificial delays.
- Server response times $\le 50\text{ms}$ on deterministic queries; fast AI streaming when provider is active.
- Fully responsive mode-aware UI rendering on mobile, tablet, and desktop.

---

### 18. Known Limitations
- Payment gateway integration (Razorpay / Stripe) is intentionally deferred to Phase 8.
- Cart items are stored in server-side session memory stubs in preparation for Phase 8 checkout.

---

### 19. Future Phase 8 Integration
Phase 7.2 lays the concrete foundation for Phase 8 Order Fulfillment & Checkout:
- `baristaToolsService.addToCart()` is ready to connect with the Phase 8 cart state.
- Cafe Moment combos can be converted directly into order lines with server-authoritative totals.
