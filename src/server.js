import app from "./app.js";
import { connectDB } from "./config/database.js";
import { env } from "./config/env.js";

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Resolve API running on http://localhost:${env.PORT}`);
  });
});
