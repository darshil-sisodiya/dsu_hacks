const AuthService = require('../services/authService');
const User = require('../models/User');

class AuthController {
  static async signup(req, res) {
    try {
      const { name, email, password } = req.body;
      
      // Check if user already exists
      const userExists = await AuthService.findUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      // Create user
      const user = await AuthService.createUser({
        name,
        email,
        password
      });
      
      if (user) {
        const token = AuthService.generateToken(user._id);
        
        // Success log for registration
        console.log(`success ${user.name} with ${user.email} registered`);
        
        res.status(201).json({
          message: 'User created successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          },
          token
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error during signup' });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await AuthService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate token
      const token = AuthService.generateToken(user._id);
      console.log(`login success ${user.name} with ${user.email}`);
      
      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }

  static async getProfile(req, res) {
    try {
      res.json({
        user: req.user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = AuthController;
