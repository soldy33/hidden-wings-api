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

  const r = await fetch(
    `https://${HOST}/api/v1/flights/searchFlights?${params}`,
    { headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": API_KEY } }
  );

  const text = await r.text();
  return res.json({ status: r.status, raw: text.slice(0, 2000) });
}
