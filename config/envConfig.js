import dotenv from "dotenv";
import path from "path";

const env = process.env.ENV_MODE || "development";
let envFile = ".env";

if (env === "production") {
  envFile = ".env.production";
} else if (env === "development") {
  envFile = ".env.local";
}

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const {
PORT,
MONGO_URI,
CLIENT_URL,
EMAIL_USER,
EMAIL_APP_PASSWORD,
JWT_ACCESS_SECRET,
JWT_REFRESH_SECRET,
ACCESS_TOKEN_EXPIRY,
REFRESH_TOKEN_EXPIRY,
CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET,
NODE_ENV,
} = process.env;


