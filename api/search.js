const SERP_KEY = process.env.SERP_API_KEY;

// SerpAPI bere přímo IATA kódy — žádné entityId nepotřebujeme
const KNOWN_AIRPORTS = [
  "BKK","HKT","PRG","VIE","IST","FRA","LHR","CDG","AMS",
  "FCO","BCN","WAW","BUD","MUC","CTU","KMG","CAN","MCT",
  "TBS","ALA","JED","XIY","PEK"
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { from, to, date, cabin = "economy" } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({ error: "Chybi parametry: from, to, date" });
  }

  if (!KNOWN_AIRPORTS.includes(from) || !KNOWN_AIRPORTS.includes(to)) {
    return res.status(400).json({ error: `Nezname letiste: ${from} nebo ${to}` });
  }

  const cabinMap = { economy: "1", business: "2", first: "3" };
  const cabinClass = cabinMap[cabin] || "1";

  try {
    const params = new URLSearchParams({
      engine:        "google_flights",
      departure_id:  from,
      arrival_id:    to,
      outbound_date: date,
      currency:      "THB",
      hl:            "en",
      travel_class:  cabinClass,
      adults:        "1",
      type:          "2",
      api_key:       SERP_KEY,
    });

    const r = await fetch(`https://serpapi.com/search?${params}`);
    const data = await r.json();

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    const flights = [
      ...(data.best_flights || []),
      ...(data.other_flights || []),
    ];

    if (flights.length === 0) {
      return res.json({ found: false, price: null, from, to, cabin });
    }

    const best = flights[0];
    const leg  = best.flights?.[0];

    return res.json({
      found:    true,
      price:    Math.round(best.price),
      airline:  leg?.airline || "Unknown",
      duration: best.total_duration ? `${Math.floor(best.total_duration/60)}h ${best.total_duration%60}m` : "N/A",
      stops:    (best.flights?.length || 1) - 1,
      cabin:    cabin === "business" ? "Business" : "Economy",
      from, to,
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
