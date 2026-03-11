const HOST    = "sky-scrapper.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY;

// Cache entityId aby se nevolalo searchAirport zbytečně
const cache = {};

async function resolveAirport(code) {
  if (cache[code]) return cache[code];

  const queries = {
    BKK: "Bangkok Suvarnabhumi",
    HKT: "Phuket",
    PRG: "Prague Vaclav",
    VIE: "Vienna",
    FRA: "Frankfurt",
    CTU: "Chengdu",
    KMG: "Kunming",
    CAN: "Guangzhou",
    XIY: "Xian",
    MCT: "Muscat",
    JED: "Jeddah",
    TBS: "Tbilisi",
    ALA: "Almaty",
    IST: "Istanbul",
    PEK: "Beijing",
  };

  const query = queries[code] || code;
  const res = await fetch(
    `https://${HOST}/api/v1/flights/searchAirport?query=${encodeURIComponent(query)}&locale=en-US`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );

  const data = await res.json();
  const match = data?.data?.find(d => d.skyId === code) || data?.data?.[0];
  if (!match) return null;

  cache[code] = { skyId: match.skyId, entityId: match.entityId };
  return cache[code];
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { from, to, date, cabin = "economy" } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({ error: "Chybí parametry: from, to, date" });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "RAPIDAPI_KEY není nastaven v environment variables" });
  }

  try {
    console.log(`🔍 ${from} → ${to} | ${cabin} | ${date}`);

    const [origin, dest] = await Promise.all([
      resolveAirport(from),
      resolveAirport(to),
    ]);

    if (!origin) return res.status(404).json({ error: `Letiště ${from} nenalezeno` });
    if (!dest)   return res.status(404).json({ error: `Letiště ${to} nenalezeno` });

    const params = new URLSearchParams({
      originSkyId:         origin.skyId,
      destinationSkyId:    dest.skyId,
      originEntityId:      origin.entityId,
      destinationEntityId: dest.entityId,
      cabinClass:          cabin,
      adults:              "1",
      sortBy:              "price_low",
      currency:            "THB",
      market:              "en-US",
      countryCode:         "TH",
      date,
    });

    const flightRes = await fetch(
      `https://${HOST}/api/v2/flights/searchFlightsComplete?${params}`,
      { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
    );

    if (!flightRes.ok) {
      const err = await flightRes.text();
      return res.status(flightRes.status).json({ error: `RapidAPI error: ${err.slice(0, 200)}` });
    }

    const data = await flightRes.json();
    const itineraries = data?.data?.itineraries;

    if (!itineraries || itineraries.length === 0) {
      return res.json({ found: false, price: null });
    }

    const best = itineraries[0];
    const leg  = best?.legs?.[0];

    return res.json({
      found:     true,
      price:     Math.round(parseFloat(best?.price?.raw || 0)),
      airline:   leg?.carriers?.marketing?.[0]?.name || "Unknown",
      duration:  formatMins(leg?.durationInMinutes),
      stops:     leg?.stopCount ?? 0,
      cabin:     cabin === "business" ? "Business" : "Economy",
    });

  } catch(e) {
    console.error("Error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}

function formatMins(m) {
  if (!m) return "N/A";
  return `${Math.floor(m/60)}h ${m%60}m`;
}
