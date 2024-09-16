import express from "express";
import {validateApiKey} from "./middleware/auth.js";
import {messageLui} from "../assistant/lui-assistant.js";
import {getOpenAiClient} from "../commons/functions/openai-functions.js";

const router = express.Router();
router.use(validateApiKey);

router.post("/message", async (req, res) => {
    try {
        const API_KEY = req.header("Authorization");
        const {message, thread, manychatId, assistant} = req.body;
        await checkParams(req, res);

        const openAiClient = await getOpenAiClient(API_KEY, assistant);
        const result = await messageLui(openAiClient, message, thread, assistant, manychatId);
        return res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Internal server error"});
    }
});

const checkParams = async (req, res) => {
    const {message, thread, manychatId, assistant} = req.body;
    if (!message || !thread || !manychatId || !assistant) {
        return res.status(400).json({error: "Missing required parameters"});
    }
};
export {router};
