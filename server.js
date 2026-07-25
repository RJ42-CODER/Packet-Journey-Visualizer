require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  }),
);

app.use(express.json());
app.use(express.static('.'));

app.post("/api/explain", async (req, res) => {
  const { station, domain } = req.body;

  const prompt = `You're explaining networking concepts to someone learning cybersecurity for the first time.
In 2-3 short sentences, explain what happens at this stage of a web request for the domain "${domain}": "${station}".
Be concrete and specific, not generic. No markdown, no headers, plain text only.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No explanantion available. ";

    res.json({ explanation: text.trim() });
  } catch (error) {
    console.error("GEMINI API error:", error);
    res.status(
      500,
      json({
        explanation: "Something went wrong generating tgus explanation.",
      }),
    );
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
