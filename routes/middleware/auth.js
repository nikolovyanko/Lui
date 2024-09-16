export const validateApiKey = (req, res, next) => {
    const API_KEY = req.header("Authorization");
    const ASSISTANT_ID = req.header("Assistant-Id");

    if (!API_KEY || !ASSISTANT_ID) {
        res.status(401).json({ error: "Unauthorized!" });
    }
    next();
};