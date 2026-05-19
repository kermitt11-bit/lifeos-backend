/* Optional OpenAI client. Returns null when no key is configured.
   Used by: Food, Workout, Reviews, Reset. */
import { state } from "./store.js";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export function aiEnabled() {
  return Boolean(state.openaiKey.value);
}

export async function ask({ system, user, json = false, model = "gpt-4o-mini" }) {
  const key = state.openaiKey.value;
  if (!key) throw new Error("ChatGPT isn't connected. Add an OpenAI key in Settings → Integrations.");
  const body = {
    model,
    temperature: 0.7,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (json) body.response_format = { type: "json_object" };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${t.slice(0, 160)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  if (json) {
    try { return JSON.parse(text); }
    catch { return { raw: text }; }
  }
  return text;
}
