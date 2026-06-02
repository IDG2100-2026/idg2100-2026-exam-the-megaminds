import express from "express";
import userController from "../controllers/users.js";
import adminController from "../controllers/admin.js";
import userValidate from "../validators/user.validate.js";
import gameController from "../controllers/game.js";
import gameValidate from "../validators/game.validate.js";
import tournamentController from "../controllers/tournaments.js";
import tournamentValidate from "../validators/tournament.validate.js";
import commentController from "../controllers/comments.js";
import commentValidate from "../validators/comment.validate.js";
import leaderboardController from "../controllers/leaderboard.js";
import platformController from "../controllers/platform.js";
import matchmakingController from "../controllers/matchmaking.js";
import matchmakingValidate from "../validators/matchmaking.validate.js";
import { validate } from "../validators/validate.js";
import { identifyUser, requireRegistered, requireAdmin, requireEmailVerified } from "../middleware/auth.js";
import { handleAvatarUpload, handleTrophyUpload } from "../middleware/upload.js";
import { rateLimit } from "../middleware/rateLimit.js";

const apiRouter = express.Router();

apiRouter.use(express.json());

apiRouter.use(identifyUser);

apiRouter.use(rateLimit);

apiRouter.post("/login", userController.login);
apiRouter.post("/refresh", userController.refresh);
apiRouter.post("/logout", userController.logout);
apiRouter.get("/users/me", userController.getMe);
apiRouter.get("/verify-email", userController.verifyEmail);
apiRouter.post("/resend-verification", userController.resendVerification);
apiRouter.post("/forgot-password", userController.forgotPassword);
apiRouter.post("/reset-password", userController.resetPassword);

apiRouter.get("/ws-token", requireRegistered, userController.getWsToken);

apiRouter.get("/users", userController.getAllUsers);
apiRouter.get("/users/:userId", userValidate.validateUserId(), validate, userController.getUserById);
apiRouter.get("/users/:userId/games", userValidate.validateUserId(), validate, userController.getUserGames);

apiRouter.post("/users", userValidate.validateUserCreate(), validate, userController.createUser);
apiRouter.patch("/users/:userId", requireRegistered, userValidate.validateUserUpdate(), validate, userController.updateUser);
apiRouter.post("/users/:userId/avatar", requireRegistered, userValidate.validateUserId(), validate, handleAvatarUpload, userController.uploadUserAvatar);
apiRouter.delete("/users/:userId", requireAdmin, userValidate.validateUserId(), validate, userController.deleteUser);

apiRouter.get("/games", gameController.getAllGames);
apiRouter.get("/games/:gameId", gameValidate.validateGameId(), validate, gameController.getGameById);
apiRouter.get("/games/:gameId/comments", gameValidate.validateGameId(), validate, gameController.getGameComments);

apiRouter.post("/games", requireRegistered, requireEmailVerified, gameValidate.validateGameCreate(), validate, gameController.createGame);
apiRouter.post("/games/:gameId/join", requireRegistered, requireEmailVerified, gameValidate.validateGameId(), validate, gameController.joinGame);
apiRouter.post("/games/:gameId/comments", requireRegistered, gameValidate.validateGameId(), commentValidate.validateCommentCreate(), validate, gameController.createGameComment);
apiRouter.delete("/games/:gameId", requireAdmin, gameValidate.validateGameId(), validate, gameController.deleteGame);

apiRouter.patch("/games/:gameId/status", requireRegistered, gameValidate.validateGameStatusUpdate(), validate, gameController.updateGame);
apiRouter.patch("/games/:gameId/result", requireRegistered, gameValidate.validateGameResult(), validate, gameController.recordGameResult);

apiRouter.get("/tournaments", tournamentController.getAllTournaments);
apiRouter.get("/tournaments/:tournamentId", tournamentValidate.validateTournamentId(), validate, tournamentController.getTournamentById);
apiRouter.get("/tournaments/:tournamentId/comments", tournamentValidate.validateTournamentId(), validate, tournamentController.getTournamentComments);
apiRouter.get("/tournaments/:tournamentId/standings", tournamentValidate.validateTournamentId(), validate, tournamentController.getStandings);
apiRouter.get("/tournaments/:tournamentId/games", tournamentValidate.validateTournamentId(), validate, tournamentController.getTournamentGames);
apiRouter.post("/tournaments/trophy-image", requireAdmin, handleTrophyUpload, tournamentController.uploadTrophyImage);

apiRouter.post("/tournaments", requireAdmin, tournamentValidate.validateTournamentCreate(), validate, tournamentController.createTournament);
apiRouter.post("/tournaments/:tournamentId/comments", requireRegistered, tournamentValidate.validateTournamentId(), commentValidate.validateCommentCreate(), validate, tournamentController.createTournamentComment);
apiRouter.post("/tournaments/:tournamentId/participants", requireRegistered, requireEmailVerified, tournamentValidate.validateTournamentJoin(), validate, tournamentController.joinTournament);
apiRouter.delete("/tournaments/:tournamentId/participants/:userId", requireRegistered, tournamentValidate.validateTournamentLeave(), validate, tournamentController.leaveTournament);
apiRouter.patch("/tournaments/:tournamentId", requireAdmin, tournamentValidate.validateTournamentId(), tournamentValidate.validateTournamentUpdate(), validate, tournamentController.updateTournament);
apiRouter.patch("/tournaments/:tournamentId/winner", requireAdmin, tournamentValidate.validateTournamentId(), tournamentValidate.validateTournamentWinner(), validate, tournamentController.awardWinner);

apiRouter.post("/tournaments/:tournamentId/rounds", requireAdmin, tournamentValidate.validateTournamentId(), validate, tournamentController.startTournament);
apiRouter.post("/tournaments/:tournamentId/rounds/next", requireAdmin, tournamentValidate.validateTournamentId(), validate, tournamentController.advanceTournament);
apiRouter.delete("/tournaments/:tournamentId", requireAdmin, tournamentValidate.validateTournamentId(), validate, tournamentController.deleteTournament);

apiRouter.get("/comments", requireAdmin, commentController.getAllComments);
apiRouter.get("/comments/:commentId", commentValidate.validateCommentId(), validate, commentController.getCommentById);
apiRouter.patch("/comments/:commentId", requireRegistered, commentValidate.validateCommentId(), commentValidate.validateCommentUpdate(), validate, commentController.updateComment);
apiRouter.delete("/comments/:commentId", requireAdmin, commentValidate.validateCommentId(), validate, commentController.deleteComment);

apiRouter.get("/leaderboard", leaderboardController.getLeaderboard);

apiRouter.post("/matchmaking/queue", requireRegistered, requireEmailVerified, matchmakingValidate.validateQueueJoin(), validate, matchmakingController.joinQueue);

apiRouter.post("/matchmaking/queue/anonymous", matchmakingValidate.validateAnonQueueJoin(), validate, matchmakingController.joinAnonQueue);

apiRouter.delete("/matchmaking/queue/:userId", requireRegistered, matchmakingController.leaveQueue);

apiRouter.get("/matchmaking/queue", requireAdmin, matchmakingController.getQueue);

apiRouter.get("/platform/activity", platformController.getPlatformActivity);

apiRouter.get("/admin/dashboard", requireAdmin, adminController.getDashboard);

apiRouter.patch("/users/:userId/ban", requireAdmin, userValidate.validateUserId(), validate, adminController.banUser);
apiRouter.patch("/users/:userId/unban", requireAdmin, userValidate.validateUserId(), validate, adminController.unbanUser);
apiRouter.patch("/users/:userId/role", requireAdmin, userValidate.validateUserId(), validate, adminController.setUserRole);

apiRouter.post("/errors", adminController.logError);
apiRouter.get("/errors", requireAdmin, adminController.getErrorLogs);

export default apiRouter;
