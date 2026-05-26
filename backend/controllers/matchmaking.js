// Handles request/response for matchmaking routes — calls the service layer and sends back JSON
import matchmakingService from "../services/matchmaking.service.js";

export async function joinQueue(req, res) {
    const { userId, rules } = req.validData;
    const result = await matchmakingService.joinQueue(userId, rules);
    res.status(result.matched ? 201 : 200).json({ success: true, data: result });
}

// anonymous queue join — no userId required, no ELO matching
export async function joinAnonQueue(req, res) {
    const result = await matchmakingService.joinAnonQueue(req.validData.rules);
    res.status(result.matched ? 201 : 200).json({ success: true, data: result });
}

export async function leaveQueue(req, res) {
    const result = matchmakingService.leaveQueue(parseInt(req.params.uid, 10));
    res.status(200).json({ success: true, data: result });
}

export async function getQueue(req, res) {
    const queue = mmService.getQueue();
    res.status(200).json({ success: true, data: queue });
}

export default { joinQueue, joinAnonQueue, leaveQueue, getQueue };
