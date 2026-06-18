const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect); // All order actions require authentication

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderDetails);

// Admin-only endpoints
router.get('/admin/all', adminOnly, orderController.getAllOrders);
router.patch('/admin/:id', adminOnly, orderController.updateOrderStatus);

module.exports = router;
