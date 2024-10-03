import express from "express";
import {validateApiKey} from "./middleware/auth.js";
import {messageLui} from "../assistant/lui-assistant.js";
import {getOpenAiClient, deleteThread} from "../commons/functions/openai-functions.js";

const router = express.Router();
router.use(validateApiKey);

const formatResponse = (responseMessage) => {
    const regex = /【.*?†.*?】/g;
    return responseMessage.replace(regex, "");
};

router.delete("/threadDel", async (req, res) => {
    try {
        const OPEN_AI_KEY = req.header("Open-AI-Key");
        const {thread, assistant} = req.body;
        const openAiClient = await getOpenAiClient(OPEN_AI_KEY, assistant);

        const responseMessage = await deleteThread(openAiClient, thread);
        return res.json({message: responseMessage});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal server error"});
    }
});

router.post("/message", async (req, res) => {
    try {
        const OPEN_AI_KEY = req.header("Open-AI-Key");
        const {
            message,
            thread: requestThread,
            manychatId,
            assistant,
            logUrl,
        } = req.body;
        await checkParams(req, res);

        const openAiClient = await getOpenAiClient(OPEN_AI_KEY, assistant);
        const {thread, responseMessage} = await messageLui(
            openAiClient,
            message,
            requestThread,
            assistant,
            manychatId,
            logUrl,
        );
        const response = formatResponse(responseMessage);
        return res.json({responseMessage: response, thread});
    } catch (error) {
        console.error(error);
        return res.status(500).json({error: "Internal server error"});
    }
});

const checkParams = async (req, res) => {
    const {message, assistant, logUrl} = req.body;
    if (!message || !assistant || !logUrl) {
        return res.status(400).json({error: "Missing required parameters"});
    }
};
export {router};