const mongoose=require('mongoose')
const dotenv=require('dotenv').config()


const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_STRING);
  
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      process.exit(1); // exit app if DB fails
    }
  };
  
  module.exports = connectDB;