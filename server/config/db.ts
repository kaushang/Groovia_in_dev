import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  mongoose
    .connect(process.env.MONGO_URI as string)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
};

export default connectDB;
