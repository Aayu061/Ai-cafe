import { getFirebaseAdminDb, isFirebaseAdminConfigured } from "../config/firebase-admin";
import { INITIAL_PRODUCTS, INITIAL_INGREDIENTS } from "./seed-data";

async function seedCatalog() {
  console.log("==================================================");
  console.log("🌱 AI CAFÉ — FIRESTORE CATALOG SEED SCRIPT");
  console.log("==================================================");

  if (!isFirebaseAdminConfigured()) {
    console.error(
      "❌ [Seed Error]: Firebase Admin SDK credentials are NOT configured."
    );
    console.error(
      "Please set FIREBASE_SERVICE_ACCOUNT_KEY (or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY) in backend/.env before running seed."
    );
    process.exit(1);
  }

  const db = getFirebaseAdminDb();

  console.log(`\n📦 Seeding ${INITIAL_PRODUCTS.length} products into 'products' collection...`);
  const productsCol = db.collection("products");

  for (const product of INITIAL_PRODUCTS) {
    const docRef = productsCol.doc(product.id);
    await docRef.set(product, { merge: true });
    console.log(`  ✓ Upserted product: ${product.name} (${product.id}) - ₹${product.basePrice}`);
  }

  console.log(`\n🧪 Seeding ${INITIAL_INGREDIENTS.length} ingredients into 'ingredients' collection...`);
  const ingredientsCol = db.collection("ingredients");

  for (const ingredient of INITIAL_INGREDIENTS) {
    const docRef = ingredientsCol.doc(ingredient.id);
    await docRef.set(ingredient, { merge: true });
    console.log(
      `  ✓ Upserted ingredient [${ingredient.type}]: ${ingredient.name} (${ingredient.id}) - Δ₹${ingredient.priceDelta}`
    );
  }

  console.log("\n==================================================");
  console.log("✨ CATALOG SEED COMPLETED SUCCESSFULLY");
  console.log(`   Total Products:    ${INITIAL_PRODUCTS.length}`);
  console.log(`   Total Ingredients: ${INITIAL_INGREDIENTS.length}`);
  console.log("==================================================");
}

seedCatalog()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Unhandled seed error:", err);
    process.exit(1);
  });
