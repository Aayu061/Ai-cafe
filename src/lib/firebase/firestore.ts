import { getFirestore, Firestore } from "firebase/firestore";
import { app } from "./client";

export const db: Firestore = getFirestore(app);

export default db;
