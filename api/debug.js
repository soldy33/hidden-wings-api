const HOST    = "sky-scrapper.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const params = new URLSearchParams({
    originSkyId:         "BKK",
    destinationSkyId:    "PRG",
    originEntityId:      "95673349",
    destinationEntityId: "95673502",
    cabinClass:          "economy",
    adults:              "1",
    sortBy:              "price_low",
    currency:            "THB",
    market:              "en-US",
    countryCode:         "TH",
    date:                "2026-05-10",
  });

  // Krok 1: první request - získej sessionId
  const r1 = await fetch(
    `https://${HOST}/api/v1/flights/searchFlights?${params}`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );
  const d1 = await r1.json();
  const sessionId = d1?.data?.flightsSessionId;

  if (!sessionId) {
    return res.json({ error: "Neni sessionId", d1 });
  }

  // Krok 2: polling se sessionId
  await new Promise(r => setTimeout(r, 2000));

  const params2 = new URLSearchParams({
    sessionId,
    currency: "THB",
    market:   "en-US",
    countryCode: "TH",
  });

  const r2 = await fetch(
    `https://${HOST}/api/v1/flights/getFlightDetails?${params2}`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );

  const text2 = await r2.text();
  return res.json({ sessionId, status: r2.status, raw: text2.slice(0, 3000) });
}
