import mongoose from "mongoose";

const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    content: {
      type: String, // Can be HTML or JSON from Editor
      required: [true, "Book content is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      default: 99, // ₹99 as per plan
    },
    coverImage: {
      type: String,
      default: "",
    },
    genre: {
      type: String,
      default: "Fiction",
    },
    language: {
      type: String,
      default: "English",
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    stats: {
      views: { type: Number, default: 0 },
      reads: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model("Book", BookSchema);
