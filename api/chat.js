module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  let body = req.body ?? {};
  if (typeof body === "string") body = JSON.parse(body);

  const { message, history = [], type } = body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  const OPENAI_KEY = process.env.OPENAI_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: "Missing API key" });

  if (type === "translate") {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Translate this cleaning business message from Portuguese to professional American English. Return only the translated text, nothing else.",
            },
            { role: "user", content: message },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: err });
      }

      const data = await r.json();
      const translation = data.choices?.[0]?.message?.content || "";
      return res.status(200).json({ translation });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  const messages = [
    {
      role: "system",
      content:
        "Você é o assistente do Tipflow, app de gestão para empresas de limpeza nos EUA.\n" +
        "Detecta o idioma e responde no mesmo idioma (PT, EN ou ES).\n" +
        "Responda em 2-3 frases mostrando como o Tipflow resolve o problema específico.\n" +
        "Use emojis. Mostre valor real e específico.\n" +
        "GPS/equipe → check-in em tempo real. Dinheiro → controle de pagamentos.\n" +
        "WhatsApp → agenda automática. Inglês → gera mensagem em inglês na hora.\n" +
        "Nunca fale de assuntos fora de gestão de limpeza.",
    },
    ...history.slice(-6).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content),
    })),
    { role: "user", content: message },
  ];

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 150, temperature: 0.7 }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
