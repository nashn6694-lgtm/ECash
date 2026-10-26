const express = require("express");

const app = express();
app.use(express.json({ limit: "10kb" }));

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  throw new Error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.");
}

app.post("/api/notify-registration", async (req, res) => {
  const { email, phone, registeredAt } = req.body || {};

  if (!email || !phone || !registeredAt) {
    return res.status(400).json({ ok: false, error: "Missing registration fields." });
  }

  const when = new Date(registeredAt);
  if (Number.isNaN(when.getTime())) {
    return res.status(400).json({ ok: false, error: "Invalid registration time." });
  }

  const message = [
    "🔔 New User Registration",
    "",
    `📧 Email: ${email}`,
    `📱 Phone: ${phone}`,
    `🕐 Time: ${when.toLocaleString("en-GB", { timeZone: "Africa/Harare" })} EAT`
  ].join("\n");

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message
        })
      }
    );

    const result = await telegramResponse.json();

    if (!telegramResponse.ok || !result.ok) {
      console.error("Telegram API error:", result);
      return res.status(502).json({ ok: false, error: "Telegram notification failed." });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Notification error:", error);
    return res.status(502).json({ ok: false, error: "Notification service unavailable." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Notification server listening on port ${port}`);
});
