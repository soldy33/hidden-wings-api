const HOST    = "sky-scrapper.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY;

const AIRPORTS = {
  BKK: { skyId: "BKK", entityId: "95673827" },
  HKT: { skyId: "HKT", entityId: "95673538" },
  PRG: { skyId: "PRG", entityId: "27539733" },
  VIE: { skyId: "VIE", entityId: "27539548" },
  FRA: { skyId: "FRA", entityId: "27539561" },
  IST: { skyId: "IST", entityId: "27537542" },
  CTU: { skyId: "CTU", entityId: "27536621" },
  KMG: { skyId: "KMG", entityId: "27536603" },
  CAN: { skyId: "CAN", entityId: "27536590" },
  XIY: { skyId: "XIY", entityId: "27536649" },
  MCT: { skyId: "MCT", entityId: "27537090" },
  JED: { skyId: "JED", entityId: "27537166" },
  TBS: { skyId: "TBS", entityId: "27537401" },
  ALA: { skyId: "ALA", entityId: "27537739" },
  PEK: { skyId: "PEK", entityId: "27536392" },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { from, to, date, cabin = "economy" } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({ error: "Chybi parametry: from, to, date" });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: "RAPIDAPI_KEY neni nastaven" });
  }

  const origin = AIRPORTS[from];
  const dest   = AIRPORTS[to];

  if (!origin) return res.status(404).json({ error: `Nezname letiste: ${from}` });
  if (!dest)   return res.status(404).json({ error: `Nezname letiste: ${to}` });

  try {
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
      return res.status(flightRes.status).json({ error: `RapidAPI: ${err.slice(0, 300)}` });
    }

    const data = await flightRes.json();
    const itineraries = data?.data?.itineraries;

    if (!itineraries || itineraries.length === 0) {
      return res.json({ found: false, price: null, from, to, cabin });
    }

    const best = itineraries[0];
    const leg  = best?.legs?.[0];

    return res.json({
      found:    true,
      price:    Math.round(parseFloat(best?.price?.raw || 0)),
      airline:  leg?.carriers?.marketing?.[0]?.name || "Unknown",
      duration: formatMins(leg?.durationInMinutes),
      stops:    leg?.stopCount ?? 0,
      cabin:    cabin === "business" ? "Business" : "Economy",
      from, to,
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

function formatMins(m) {
  if (!m) return "N/A";
  return `${Math.floor(m/60)}h ${m%60}m`;
}
