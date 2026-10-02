import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());

app.use("/", routes);

// central error handler: every controller's catch block lands here via next(err)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ detail: "Request body is not valid JSON" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ detail: "Invalid id" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ detail: "That record already exists" });
  }

  console.error(err);
  res.status(500).json({ detail: "Something went wrong on the server" });
});

export default app;
