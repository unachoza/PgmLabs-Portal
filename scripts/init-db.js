const { runMigrations } = require("../src/db");

runMigrations();
console.log("Database schema initialized.");
