import { Comment } from "../models/comments.js";

export async function getAllComments({ sort = "createdAt", order = "desc", limit = 10, page = 1, search }) {
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {

        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        query.text = { $regex: escaped, $options: "i" };
    }
    return Comment.find(query)
        .sort({ [sort]: order === "asc" ? 1 : -1 })
        .limit(Number(limit))
        .skip(Number(skip));
}

export async function getCommentById(commentId) {
    return Comment.findOne({ commentId: commentId });
}

export async function updateComment(commentId, data) {
    return Comment.findOneAndUpdate({ commentId: commentId }, data, { returnDocument: "after" });
}

export async function deleteComment(commentId) {
    return Comment.findOneAndDelete({ commentId: commentId });
}

export default { getAllComments, getCommentById, updateComment, deleteComment };
