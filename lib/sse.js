export function openSSE(res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  let alive = true;
  const heartbeat = setInterval(() => {
    if (alive) res.write(`: ping\n\n`);
  }, 15000);
  res.on('close', () => { alive = false; clearInterval(heartbeat); });
  return {
    send(event, data) {
      if (!alive) return;
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    close() {
      if (!alive) return;
      alive = false;
      clearInterval(heartbeat);
      res.end();
    },
    isAlive() { return alive; },
  };
}
