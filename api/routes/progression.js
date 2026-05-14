import { Router } from "express";
import { progressionSnapshot } from "../services/progression.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(progressionSnapshot());
});

export default router;
