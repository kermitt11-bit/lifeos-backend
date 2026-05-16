import { Router } from "express";
import { nextAction } from "../services/recommender.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(nextAction());
});

export default router;
