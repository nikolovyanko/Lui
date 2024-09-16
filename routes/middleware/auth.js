export const validateApiKey = (req, res, next) => {
    const API_KEY = req.header("Authorization");

    if (!API_KEY) {
        res.status(401).json({ error: "Unauthorized!" });
    }
    next();
};