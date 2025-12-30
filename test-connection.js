const { Pool } = require('pg');

console.log('Attempting connection with:');
console.log('  Host: localhost');
console.log('  Port: 5432');
console.log('  User: echo_alpha');
console.log('  Database: echo_alpha');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'echo_alpha',
  password: 'echo_alpha_dev_password',
  database: 'echo_alpha',
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }

  client.query('SELECT current_user, current_database()', (err, res) => {
    release();
    if (err) {
      console.error('❌ Query failed:', err.message);
      pool.end();
      process.exit(1);
    }
    console.log('✅ Connection successful!');
    console.log('User:', res.rows[0].current_user);
    console.log('Database:', res.rows[0].current_database);
    pool.end();
  });
});
