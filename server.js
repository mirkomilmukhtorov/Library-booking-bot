import express from "express";
const app = express();

app.get("/", (req, res) => {
  const now = new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
  res.send(`✅ Library Booking Bot alive at ${now}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Keep-alive server running on port ${PORT}`));