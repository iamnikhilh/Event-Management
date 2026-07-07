const { Pool } = require("pg");
require("dotenv").config();

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });

(async () => {
  try {
    const client = await pool.connect();
    
    console.log("Seeding categories...");
    const result = await client.query(
      'INSERT INTO "categories" (name) VALUES ($1), ($2), ($3) ON CONFLICT DO NOTHING RETURNING *',
      ["Technology", "Music", "Sports"]
    );
    
    console.log("✅ Categories seeded:", result.rows.length, "new categories");
    result.rows.forEach(row => {
      console.log(`   - ${row.name} (ID: ${row.id})`);
    });

    // Get all categories
    const allCats = await client.query('SELECT id, name FROM "categories"');
    console.log("\nAll categories in database:");
    allCats.rows.forEach(row => {
      console.log(`   - ${row.name}: ${row.id}`);
    });
    
    client.release();
  } catch (err) {
    console.log("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
})();
