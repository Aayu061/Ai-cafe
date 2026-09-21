import { app } from "./app";
import { env } from "./config/env";
import { isFirebaseAdminConfigured } from "./config/firebase-admin";

const PORT = env.PORT;
const HOST = "0.0.0.0"; // Bind to 0.0.0.0 for containerized / Render environments

const server = app.listen(PORT, HOST, () => {
  console.log("==================================================");
  console.log("☕ AI CAFÉ BACKEND SERVICE STARTED");
  console.log("==================================================");
  console.log(`📡 URL:                 http://${HOST}:${PORT}`);
  console.log(`🌍 Environment:         ${env.NODE_ENV}`);
  console.log(`🎯 Firebase Project:    ${env.FIREBASE_PROJECT_ID}`);
  console.log(
    `🔒 Firebase Admin:      ${
      isFirebaseAdminConfigured() ? "CONFIGURED (Active)" : "NOT CONFIGURED (Protected ops will fail)"
    }`
  );
  console.log(`🌐 Allowed Frontend:    ${env.FRONTEND_URL}`);
  console.log("==================================================");
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("👋 HTTP server closed. Process exiting.");
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error("⚠️ Forceful shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
