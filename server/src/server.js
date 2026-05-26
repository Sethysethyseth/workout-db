require("dotenv").config();
const app = require("./app");
const { assertSafeForBoot } = require("./lib/dbHostGuard");

assertSafeForBoot(process.env.DATABASE_URL, process.env.NODE_ENV);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});