const { getDb } = require('../config/db');

exports.createOrder = async (req, res) => {
  let db;
  try {
    db = await getDb();
    const { shipping_address, items } = req.body;
    const userId = req.user.id;

    if (!shipping_address || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Shipping address and cart items are required' });
    }

    // Begin a transaction to ensure all db changes succeed or roll back together
    await db.run('BEGIN TRANSACTION');

    let totalAmount = 0;
    const orderItemsToInsert = [];

    // Verify product availability and calculate final prices
    for (const item of items) {
      const product = await db.get('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (!product) {
        await db.run('ROLLBACK');
        return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        await db.run('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      }

      const itemCost = product.price * item.quantity;
      totalAmount += itemCost;

      orderItemsToInsert.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
        newStock: product.stock - item.quantity
      });
    }

    // Insert Order row
    const orderResult = await db.run(
      'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
      [userId, totalAmount, shipping_address, 'pending']
    );
    const orderId = orderResult.lastID;

    // Insert items and adjust store inventory levels
    for (const item of orderItemsToInsert) {
      await db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.priceAtPurchase]
      );

      await db.run(
        'UPDATE products SET stock = ? WHERE id = ?',
        [item.newStock, item.productId]
      );
    }

    await db.run('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      totalAmount
    });
  } catch (err) {
    console.error('Error creating order:', err);
    if (db) {
      try {
        await db.run('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }
    res.status(500).json({ error: 'Order processing failed' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;

    // Retrieve order list, latest first
    const orders = await db.all(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Fetch details for each order
    for (const order of orders) {
      const items = await db.all(
        `SELECT oi.*, p.name as product_name, p.image_url 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access control: only owner or admin can inspect order details
    if (order.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const items = await db.all(
      `SELECT oi.*, p.name as product_name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );
    order.items = items;

    res.json(order);
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
};

// Admin Operations
exports.getAllOrders = async (req, res) => {
  try {
    const db = await getDb();

    // Fetch all system orders with user info
    const orders = await db.all(
      `SELECT o.*, u.username, u.email 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC`
    );

    for (const order of orders) {
      const items = await db.all(
        `SELECT oi.*, p.name as product_name, p.image_url 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    const orderId = req.params.id;

    const validStatuses = ['pending', 'paid', 'shipped', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await db.run(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    res.json({ message: 'Order status updated successfully', orderId, status });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};
