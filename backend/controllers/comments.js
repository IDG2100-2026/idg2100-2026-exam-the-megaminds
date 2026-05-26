// Handles request/response for comment routes — calls the service layer and sends back JSON
import commentService from "../services/comments.service.js";

export async function getAllComments(req, res) {
    const comments = await commentService.getAllComments(req.query);
    res.status(200).json({ success: true, data: comments });
}

export async function getCommentById(req, res) {
    const comment = await commentService.getCommentById(req.params.cid);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.status(200).json({ success: true, data: comment });
}

export async function updateComment(req, res) {
    const updComment = await commentService.updateComment(req.params.cid, req.validData);
    if (!updComment) return res.status(404).json({ message: "Comment not found" });
    res.status(200).json({ success: true, data: updComment });
}

export async function deleteComment(req, res) {
    const delComment = await commentService.deleteComment(req.params.cid);
    if (!delComment) return res.status(404).json({ message: "Comment not found" });
    res.status(200).json({ success: true, message: "Comment deleted successfully" });
}

export default { getAllComments, getCommentById, updateComment, deleteComment };
