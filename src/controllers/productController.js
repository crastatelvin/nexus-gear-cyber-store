const { getDb } = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const db = await getDb();
    const { category, search } = req.query;
    
    let query = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const products = await db.all(query, params);
    
    const parsedProducts = products.map(p => ({
      ...p,
      specs: p.specs ? JSON.parse(p.specs) : {}
    }));

    res.json(parsedProducts);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const db = await getDb();
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      ...product,
      specs: product.specs ? JSON.parse(product.specs) : {}
    });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
};
