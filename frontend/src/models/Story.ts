import mongoose from "mongoose";

const StorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    content: {
      type: String, // Rich text content
      required: [true, "Content is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      default: "Writing Tips",
    },
    type: {
      type: String,
      enum: ["Story", "Blog"],
      default: "Story",
    },
    coverImage: {
      type: String,
      default: "",
    },
    reads: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Story || mongoose.model("Story", StorySchema);
