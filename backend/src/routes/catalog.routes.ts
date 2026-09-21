import { Router } from "express";
import {
  getProducts,
  getProductById,
  getIngredients,
  validateDrink,
} from "../controllers/catalog.controller";

const router = Router();

// Products Catalog Endpoints
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// Ingredients Catalog Endpoint
router.get("/ingredients", getIngredients);

// Server-Authoritative Drink Validation & Pricing Endpoint
router.post("/drinks/validate", validateDrink);

export const catalogRoutes = router;
export default catalogRoutes;
