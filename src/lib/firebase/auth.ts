import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { app } from "./client";

export const auth: Auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default auth;
