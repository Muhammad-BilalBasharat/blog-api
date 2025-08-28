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

// only admin can delete subscriber
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;  
    const subscriber = await Newsletter.findByIdAndDelete(id);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Subscriber deleted successfully",
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
  deleteSubscriber,
};