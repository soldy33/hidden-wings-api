const HOST    = "sky-scrapper.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Chybi parametr q" });

  const r = await fetch(
    `https://${HOST}/api/v1/flights/searchAirport?query=${encodeURIComponent(q)}&locale=en-US`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );

  const data = await r.json();
  const results = (data?.data || []).slice(0, 5).map(d => ({
    skyId:    d.skyId,
    entityId: d.entityId,
    name:     d.presentation?.title,
    subtitle: d.presentation?.subtitle,
  }));

  return res.json(results);
}
