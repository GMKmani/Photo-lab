const mongoose = require('mongoose');
const express = require('express');
const Order = require('../models/Order');
const router = express.Router();
const jwt = require('jsonwebtoken');


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
};

router.post('/', async (req, res) => {
  console.log('Received order creation request:', req.body);
  try {
    const {
      userId,
      customerName,
      productType,
      quantity,
      price,
      status,
      orderDate,
      deliveryDate,
      mobile,
      address,
      city
    } = req.body;

    const newOrder = new Order({
      userId,
      customerName,
      productType,
      quantity,
      price,
      status,
      orderDate,
      deliveryDate,
      mobile,
      address,
      city
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId', authenticateToken,async (req, res) => {
   const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  const orders = await Order.find({ userId });
  res.json(orders);
});

router.put('/:id', authenticateToken, async (req, res) => {
  const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.get('/summaryByDate/:userId',authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fromDate, toDate } = req.query;

    console.log('Received request for summaryByDate:', { userId, fromDate, toDate });
    const orders = await Order.find({
      userId,
      orderDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    });

    const productCounts = orders.reduce((acc, order) => {
      const normalizedType = order.productType.toLowerCase(); // Normalize to lowercase
      acc[normalizedType] = (acc[normalizedType] || 0) + order.quantity;
      return acc;
    }, {});

    const orderedProductTypes = ['photo frames', 'photos', 'albums', 'one side printing'];
    const orderedCounts = orderedProductTypes.map((type) => productCounts[type] || 0);

    const chartData = {
      labels: orderedProductTypes.map((type) => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          label: 'Product Counts',
          data: orderedCounts,
          backgroundColor: ['#731F00', '#004D4D', '#204D00', '#003366'],
        },
      ],
    };

    res.json({ chartData });
  } catch (error) {
    console.error('Error fetching summary by date:', error);
    res.status(500).json({ error: 'Failed to fetch summary by date' });
  }
});

router.get('/summary/:userId', async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId });
  const totalIncome = orders.reduce((acc, order) => acc + order.price, 0);
  const totalOrders = orders.length;
  const productCounts = orders.reduce((acc, order) => {
    const normalizedType = order.productType.toLowerCase(); // Normalize to lowercase
    acc[normalizedType] = (acc[normalizedType] || 0) + order.quantity;
    return acc;
  }, {});

    const orderedProductTypes = ['photo frames', 'photos', 'albums', 'one side printing'];
    const orderedCounts = orderedProductTypes.map((type) => productCounts[type] || 0);

    const chartData = {
      labels: orderedProductTypes.map((type) => type.charAt(0).toUpperCase() + type.slice(1)), // Capitalize labels
      datasets: [
        {
          label: 'Product Counts',
          data: orderedCounts, // Counts in the specified order
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'], // Colors for each product type
        },
      ],
    }
    console.log('Ordered Product Types:', orderedProductTypes);
    console.log('Ordered Counts:', orderedCounts);
    console.log('Chart Data:', chartData);

    console.log(chartData)

  res.json({ totalIncome, totalOrders, chartData});
});

router.delete('/:id',authenticateToken, async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/ordersByDate',authenticateToken, async (req, res) => {
  console.log('Received request for ordersByDate');
  console.log('Query parameters:', req.query);
  const { fromDate, toDate } = req.query;

  try {
    const start = new Date(fromDate);
    const end = new Date(toDate);

    const orders = await Order.find({
      orderDate: { $gte: start, $lte: end }
    });

    res.json(orders);
    console.log('Orders fetched successfully:', orders.length);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});



module.exports = router;
