import pool from './db/connection.js';

async function verifyTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n✅ Database tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    const expectedTables = ['users', 'albums', 'tracks', 'reviews', 'ratings', 'comments'];
    const foundTables = result.rows.map(r => r.table_name);
    const missing = expectedTables.filter(t => !foundTables.includes(t));
    
    if (missing.length === 0) {
      console.log('\n✅ All required tables exist!');
    } else {
      console.log('\n⚠ Missing tables:', missing.join(', '));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyTables();

