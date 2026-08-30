async function checkAllRoutes() {
  const routes = [
    { url: 'http://localhost:3000/api/data/overview', method: 'GET' },
    { url: 'http://localhost:3000/api/agent/briefing', method: 'GET' },
    { url: 'http://localhost:3000/api/agent/briefing', method: 'POST', body: { period: 'Q3', audience: 'Founders' } },
    { url: 'http://localhost:3000/api/agent/query', method: 'POST', body: { query: 'How is our energy pipeline looking?' } },
    { url: 'http://localhost:3000/api/monday/test', method: 'POST', body: { apiKey: 'test_key' } },
  ];

  for (const r of routes) {
    try {
      const res = await fetch(r.url, {
        method: r.method,
        headers: { 'Content-Type': 'application/json' },
        body: r.body ? JSON.stringify(r.body) : undefined,
      });
      const data = await res.json();
      console.log(`[${r.method}] ${r.url} -> Status: ${res.status} | Success: ${data.success !== undefined ? data.success : true}`);
    } catch (e: any) {
      console.error(`[${r.method}] ${r.url} -> Error: ${e.message}`);
    }
  }
}

checkAllRoutes();
