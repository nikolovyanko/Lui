export const validateApiKey = (req, res, next) => {
    const API_KEY = req.header("Authorization");
    const mySecret = process.env["API_KEY"];
    if (!API_KEY || mySecret !== API_KEY) {
        res.status(401).json({error: "Unauthorized!"});
    }
    next();
};