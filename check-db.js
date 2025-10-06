/* eslint-env node */

import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkConnection() {
  try {
    await client.connect();
    console.log("✅ Подключение успешно!");
    const res = await client.query("SELECT current_database(), current_user, version();");
    console.log("📊 Инфо о соединении:", res.rows[0]);
  } catch (err) {
    console.error("❌ Ошибка подключения:", err.message);
  } finally {
    await client.end();
  }
}

checkConnection();
