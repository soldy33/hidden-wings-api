const HOST    = "sky-scrapper.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

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

  const r = await fetch(
    `https://${HOST}/api/v2/flights/searchFlights?${params}`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );

  const data = await r.json();
  const it = data?.data?.itineraries || [];

  if (it.length > 0) {
    return res.json({
      found: true,
      count: it.length,
      best: {
        price:   it[0]?.price?.raw,
        airline: it[0]?.legs?.[0]?.carriers?.marketing?.[0]?.name,
        stops:   it[0]?.legs?.[0]?.stopCount,
      }
    });
  }

  return res.json({ found: false, status: data?.status, message: data?.message, context: data?.data?.context });
}
