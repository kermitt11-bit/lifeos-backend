import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import daily from "./routes/daily.js";
import recovery from "./routes/recovery.js";
import food from "./routes/food.js";
import fitness from "./routes/fitness.js";
import environment from "./routes/environment.js";
import progression from "./routes/progression.js";
import next from "./routes/next.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/daily", daily);
app.use("/api/recovery", recovery);
app.use("/api/food", food);
app.use("/api/fitness", fitness);
app.use("/api/environment", environment);
app.use("/api/progression", progression);
app.use("/api/next", next);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Life OS running at http://localhost:${port}`);
});
