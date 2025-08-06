import nodemailer from "nodemailer";
import { EMAIL_USER,EMAIL_APP_PASSWORD } from "../config/envConfig.js";


export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,         // e.g., yourgmail@gmail.com
    pass: EMAIL_APP_PASSWORD, // Gmail App Password (16-char)
  },
});
