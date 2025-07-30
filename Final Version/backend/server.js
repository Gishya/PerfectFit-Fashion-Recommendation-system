const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const winston = require('winston');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');


// Create  uploads file
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(uploadDir));

// winston Logger setup   
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

 
// MongoDB Connect
mongoose.connect('mongodb://127.0.0.1:27017/userdb', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => logger.error('MongoDB connection error:', err));
  
  

// Use this JWT secret / Middleware in both signing and verification
const JWT_SECRET = 'your_jwt_secret65ase';
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).send('Unauthorized');

  jwt.verify(token, JWT_SECRET, (err, user) => {  
    if (err) return res.status(403).send('Forbidden');
    req.user = user;
    next();
  });
};





// Updated user schema with only the required fields
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },  // Added address field
  contact: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

 

//  file uploads Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});



// Register route
 
app.post('/api/register', async (req, res) => {
  const { fullName, address, contact, email, password } = req.body;

  logger.info('Received data for registration', {
    fullName,
    address,
    contact,
    email,
  });

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Email is already registered', { email });
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      fullName,
      address,
      contact,
      email,
      password: hashedPassword,
    });

    // Save the new user
    await newUser.save();

    logger.info('User registered successfully', { fullName, email });
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    logger.error('Error saving user', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'An error occurred', error: error.message });
  }
});



 

// Player Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
      }
    });
  } catch (error) {
    logger.error('Login error:', { message: error.message });
    res.status(500).json({ message: 'Login failed' });
  }
});

 
 

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
