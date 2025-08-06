import mongoose from 'mongoose'; 
import { MONGO_URI } from './envConfig.js';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: Successfully`);
  } catch (error) {
    console.error('Database connection error:', error);
   
  }
};

export default connectDB;