const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).send('User already exists');
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword, phoneNumber });
  await user.save();
  res.status(201).send('User created');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  console.log("kfkfkf",user);
  if (!user) return res.status(400).send('Invalid credentials');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).send('Invalid credentials');
  const token = jwt.sign({ id: user._id }, 'secretkey');
  res.json({ token, userId: user._id, name:user.name });
});


const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '193955188076-7tlu9loipvdh9tnnli2sr4afl0o73sr3.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
  console.log(req.body)
  const { tokenId } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email });
      await user.save();
    }
    console.log(user);
    const token = jwt.sign({ id: user._id }, 'secretkey');
    res.json({ token, userId: user._id , name:user.name});
  } catch (err) {
    res.status(400).send('Google Login failed');
  }
});
module.exports = router;