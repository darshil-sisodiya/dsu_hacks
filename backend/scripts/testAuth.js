const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Reuse the app's User model
const User = require('../src/models/User');

(async () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  const unique = Date.now();
  const user = { name: 'Test User', email: `test${unique}@example.com`, password: 'secret123' };

  try {
    console.log('1) Health check...');
    const health = await axios.get(`${baseURL}/health`);
    console.log('Health:', health.data);

    console.log('\n2) Signup...');
    const signupRes = await axios.post(`${baseURL}/api/auth/signup`, user);
    console.log('Signup user:', signupRes.data.user);

    console.log('\n3) Login...');
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, { email: user.email, password: user.password });
    console.log('Login user:', loginRes.data.user);
    const token = loginRes.data.token;
    console.log('JWT token:', token);

    console.log('\n4) Get /me with token...');
    const meRes = await axios.get(`${baseURL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Me:', meRes.data.user);

    console.log('\n5) Fetch hashed password from DB...');
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const dbUser = await User.findOne({ email: user.email }).lean();
    if (dbUser) {
      console.log('Stored hashed password:', dbUser.password);
    } else {
      console.log('User not found when querying DB');
    }
    await mongoose.connection.close();

    console.log('\nAll good!');
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(1);
  }
})();
