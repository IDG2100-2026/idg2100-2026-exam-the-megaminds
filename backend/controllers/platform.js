// Handles request/response for platform routes — calls the service layer and sends back JSON
import platformService from "../services/platform.service.js";

// GET /api/platform/activity
// Public – anonymous and registered users can both see platform activity
export async function getPlatformActivity(req, res) {
    const activity = await platformService.getPlatformActivity();
    res.status(200).json({ success: true, data: activity });
}

export default { getPlatformActivity };
