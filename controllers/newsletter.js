import Newsletter from '../models/newsletter.js';

const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    const existingSubscriber = await Newsletter.findOne({ email: email });
    
    if (existingSubscriber) {
      return res.status(400).json({ 
        success: false,
        message: "Email already subscribed to newsletter" 
      });
    }
    const newSubscriber = await Newsletter.create({ email: email });
    await newSubscriber.save();
    
    res.status(200).json({
      success: true,
      message: "Newsletter subscribed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find({}).select('email createdAt');
    
    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export {
  subscribe,
  getAllSubscribers,

};