import express from "express";
import cors from "cors";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function requireAuth(req, res, next) {
  const expected = process.env.API_TOKEN;
  if (!expected) return next();
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token !== expected) return res.status(401).json({ error: "unauthorized" });
  next();
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "lifeos-backend",
    supabase: Boolean(supabase),
    time: new Date().toISOString(),
  });
});

const collections = ["journal", "tasks", "habits", "goals", "moods"];

for (const name of collections) {
  app.get(`/${name}`, requireAuth, async (req, res) => {
    if (!supabase) return res.json({ items: [] });
    const { data, error } = await supabase
      .from(name)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ items: data });
  });

  app.post(`/${name}`, requireAuth, async (req, res) => {
    const body = req.body;
    if (!supabase) return res.status(202).json({ accepted: true, items: body?.items?.length ?? 0 });
    const rows = Array.isArray(body?.items) ? body.items : [body];
    const { data, error } = await supabase.from(name).upsert(rows).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ upserted: data?.length ?? 0 });
  });

  app.delete(`/${name}/:id`, requireAuth, async (req, res) => {
    if (!supabase) return res.json({ deleted: 0 });
    const { error } = await supabase.from(name).delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ deleted: 1 });
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`lifeos-backend listening on :${port}`);
});

export default app;
