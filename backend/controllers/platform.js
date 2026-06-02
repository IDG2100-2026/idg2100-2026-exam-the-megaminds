import platformService from "../services/platform.service.js";

export async function getPlatformActivity(req, res) {
    const activity = await platformService.getPlatformActivity();
    res.status(200).json({ success: true, data: activity });
}

export default { getPlatformActivity };
