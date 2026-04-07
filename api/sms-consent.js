const MASTER_BASE = process.env.AIRTABLE_BASE || "appllUwfOZTW3wVUn";
const MASTER_TABLE = process.env.AIRTABLE_TABLE || "tblTVz2Ompr72Q3jQ";
const MASTER_TOKEN = process.env.AIRTABLE_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name, phone } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: "Name and phone are required" });
  if (!/^\+1\d{10}$/.test(phone)) return res.status(400).json({ error: "Invalid phone format" });

  try {
    const airtableRes = await fetch(`https://api.airtable.com/v0/${MASTER_BASE}/${MASTER_TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MASTER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          fldq735K70z3rBUvJ: name.trim(),
          fld8EZD5HqPnIHgBA: phone,
          fldi0gYYFqIQbaXJY: new Date().toISOString(),
          fldYNBtMl92lhatWe: "Active",
        },
      }),
    });
    const data = await airtableRes.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
