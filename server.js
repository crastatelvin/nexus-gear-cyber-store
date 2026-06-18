require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('Initializing database...');
    await initDb();
    console.log('Database initialized.');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
