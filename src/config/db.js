const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbConnection = null;

async function getDb() {
  if (!dbConnection) {
    dbConnection = await open({
      filename: path.join(__dirname, '../../database.sqlite'),
      driver: sqlite3.Database
    });
    // Enable foreign key support in SQLite
    await dbConnection.exec('PRAGMA foreign_keys = ON');
  }
  return dbConnection;
}

async function initDb() {
  const db = await getDb();

  // 1. Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Create Products Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL,
      specs TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Create Orders Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      shipping_address TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 4. Create Order Items Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_purchase REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    )
  `);

  // Seed Products if table is empty
  const count = await db.get('SELECT COUNT(*) as count FROM products');
  if (count.count === 0) {
    const seedProducts = [
      {
        name: 'Aegis HUD Glasses',
        description: 'Augmented reality eyewear with real-time translation, night-vision overlay, and dynamic environment mapping.',
        price: 299.99,
        image_url: '/assets/products/aegis_hud.png',
        category: 'Wearables',
        stock: 25,
        specs: JSON.stringify({ "Battery Life": "18 Hours", "Display": "Holographic Micro-LED", "Lens": "Polarized Anti-Glare", "Weight": "45g" })
      },
      {
        name: 'NeuroLink Headset',
        description: 'Ultra-low latency neural interface headphones offering immersive spatial audio and direct biological audio syncing.',
        price: 499.99,
        image_url: '/assets/products/neurolink_headset.png',
        category: 'Audio',
        stock: 15,
        specs: JSON.stringify({ "Latency": "1.2ms", "Driver": "40mm Graphene", "Connectivity": "Bio-Sync & Bluetooth 5.4", "Active Noise Cancelling": "Up to 48dB" })
      },
      {
        name: 'Quantum Drive 2TB',
        description: 'Solid-state quantum drive utilizing sub-atomic storage arrays for instantaneous read/write speeds.',
        price: 189.99,
        image_url: '/assets/products/quantum_drive.png',
        category: 'Storage',
        stock: 40,
        specs: JSON.stringify({ "Capacity": "2 Terabytes", "Read Speed": "120 GB/s", "Write Speed": "95 GB/s", "Encryption": "AES-256 Quantum Resistant" })
      },
      {
        name: 'Chrono Core Smartwatch',
        description: 'Holographic interface watch with integrated biometric scanner, ambient temperature mapping, and cybernetic sync.',
        price: 349.99,
        image_url: '/assets/products/chrono_core.png',
        category: 'Wearables',
        stock: 30,
        specs: JSON.stringify({ "Display": "Holographic Projection", "Sensors": "ECG, SpO2, Neural Activity", "Waterproof": "Up to 50m", "Casing": "Titanium Alloy" })
      },
      {
        name: 'Vapor Keypad V2',
        description: 'Premium mechanical gaming keypad featuring hot-swappable magnetic switches, RGB backlighting, and a customizable OLED status screen.',
        price: 219.99,
        image_url: '/assets/products/vapor_keypad.png',
        category: 'Peripherals',
        stock: 20,
        specs: JSON.stringify({ "Switches": "Linear Magnetic Hall Effect", "Actuation": "0.1mm - 4.0mm adjustable", "Backlight": "Per-key RGB", "Connectivity": "Detachable USB-C" })
      },
      {
        name: 'Aero Pack One',
        description: 'Sleek, weatherproof modular backpack equipped with an integrated solar charging panel and magnetic Fidlock buckles.',
        price: 159.99,
        image_url: '/assets/products/aero_pack.png',
        category: 'Gear',
        stock: 50,
        specs: JSON.stringify({ "Volume": "25 Liters", "Material": "X-Pac Cordura Nylon", "Solar Output": "15W USB-C", "Laptop Compartment": "Up to 16-inch" })
      }
    ];

    for (const prod of seedProducts) {
      await db.run(
        `INSERT INTO products (name, description, price, image_url, category, stock, specs)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [prod.name, prod.description, prod.price, prod.image_url, prod.category, prod.stock, prod.specs]
      );
    }
    console.log('Database seeded successfully with products.');
  }
}

module.exports = { getDb, initDb };
