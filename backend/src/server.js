require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const ensureAdmin = require("./utils/ensureAdmin");
const runStartupMigrations = require("./utils/runStartupMigrations");

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  await connectDB();
  await runStartupMigrations();
  await ensureAdmin();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

process.on("unhandledRejection", (error) => {
  console.error(`Unhandled rejection: ${error.message}`);
  if (server) {
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
});
