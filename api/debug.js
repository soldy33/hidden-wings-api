const HOST    = "sky-scrapper.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Krok 1: získej sessionId
  const params = new URLSearchParams({
    originSkyId:         "BKK",
    destinationSkyId:    "SIN",
    originEntityId:      "95673349",
    destinationEntityId: "95673320",
    cabinClass:          "economy",
    adults:              "1",
    sortBy:              "price_low",
    currency:            "THB",
    market:              "en-US",
    countryCode:         "TH",
    date:                "2026-05-10",
  });

  const r1 = await fetch(
    `https://${HOST}/api/v1/flights/searchFlights?${params}`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );
  const d1 = await r1.json();
  const sessionId = d1?.data?.flightsSessionId;
  const itineraries = d1?.data?.itineraries || [];

  // Někdy přijdou výsledky hned v prvním requestu
  if (itineraries.length > 0) {
    const best = itineraries[0];
    return res.json({
      found: true,
      price: best?.price?.raw,
      airline: best?.legs?.[0]?.carriers?.marketing?.[0]?.name,
      sessionId,
    });
  }

  if (!sessionId) return res.json({ error: "Neni sessionId", d1 });

  // Krok 2: polling
  await new Promise(r => setTimeout(r, 3000));

  const params2 = new URLSearchParams({
    sessionId,
    currency:    "THB",
    market:      "en-US",
    countryCode: "TH",
  });

  const r2 = await fetch(
    `https://${HOST}/api/v1/flights/searchFlightsSkyScraperV2?${params2}`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );

  const d2 = await r2.json();
  const it2 = d2?.data?.itineraries || [];

  if (it2.length > 0) {
    const best = it2[0];
    return res.json({
      found: true,
      price: best?.price?.raw,
      airline: best?.legs?.[0]?.carriers?.marketing?.[0]?.name,
    });
  }

  return res.json({ found: false, sessionId, context: d2?.data?.context });
}
