import mongoose from "mongoose";
import { createApp } from "./app";
import { env } from "./config/env";

async function bootstrap(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
