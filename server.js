import express from "express";
const app = express();

app.get("/", (req, res) => {
  const now = new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
  res.status(200).send(`✅ Library Booking Bot alive at ${now}`);
});

app.get("/ping", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Keep-alive server running on port ${PORT}`);
});