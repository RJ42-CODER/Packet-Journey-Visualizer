require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 6, // one full trace = 6 station calls
  message: { explanation: "Too many requests — please wait a minute and try again." }
});

const app = express();

app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  }),
);

app.use(express.json());
app.use(express.static("."));

app.post("/api/explain",limiter, async (req, res) => {
  const { station, domain } = req.body;

  const prompt = `You're explaining networking concepts to someone learning cybersecurity for the first time.
In 2-3 short sentences, explain what happens at this stage of a web request for the domain "${domain}": "${station}".
Be concrete and specific, not generic. No markdown, no headers, plain text only.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data));

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No explanation available.";
    res.json({ explanation: text.trim() });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      explanation: "Something went wrong generating this explanation.",
    });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
