import express from "express";
import {validateApiKey} from "./middleware/auth.js";
import {messageLui} from "../assistant/lui-assistant.js";
import {getOpenAiClient, deleteThread} from "../commons/functions/openai-functions.js";
import axios from "axios";

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
        return res.status(500).json({erorMessage: error.message});
    }
});

router.post("/message", async (req, res) => {
    try {
        const OPEN_AI_KEY = req.header("Open-AI-Key");
        const {
            message,
            thread: requestThread,
            manychatId,
            assistant
        } = req.body;
        await checkParams(req, res);

        const openAiClient = await getOpenAiClient(OPEN_AI_KEY, assistant);
        const {thread, responseMessage} = await messageLui(
            openAiClient,
            message,
            requestThread,
            assistant,
            manychatId,
        );
        const response = formatResponse(responseMessage);

        await handleReroutesToManychat(manychatId, response, thread);

        return res.json({responseMessage: response, thread});
    } catch (error) {
        console.error(error);
        return res.status(500).json({erorMessage: error.message});
    }
});

const handleReroutesToManychat = async (manyChatId, response, thread) => {
    try {
        if(response === "stop") {
            const respCallClearAutomation = await axios.post(process.env.MANYCHAT_SEND_FLOW, {
                subscriber_id: manyChatId,
                flow_ns: "content20241002114159_768282",
            },{
                headers: {
                    'Authorization': 'Bearer 1636011:9f79d2357e8eefbbcff6eb8f8beed7e9'
                }
            });
            console.log(`${respCallClearAutomation} response from call CLEAR Automation`)
        }
        else {
            const respSettingFields = await axios.post(process.env.MANYCHAT_SET_FIELDS, {
                subscriber_id: manyChatId,
                fields: [
                    {
                        field_id: 11806649,
                        field_value: response
                    },
                    {
                        field_id: 11836366,
                        field_value: thread
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`
                }
            });
            console.log(`${respSettingFields}: response from Setting custom fields`)

            //Call the FLO_Respond ManyChat Automation
            const respCallAutomation = await axios.post(process.env.MANYCHAT_SEND_FLOW, {
                subscriber_id: manyChatId,
                flow_ns: "content20240925160028_519449",
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`
                }
            });
            console.log(`${respCallAutomation}: response from Flo_Respond automation`)
        }
    }catch (error) {
        console.error(`Error in handleReroutesToManychat Calling Lui clean Automation `, error);
        await axios.post(process.env.MANYCHAT_SEND_FLOW, {
            subscriber_id: manyChatId,
            flow_ns: "content20241218104803_568908",
        },{
            headers: {
                'Authorization': 'Bearer 1636011:9f79d2357e8eefbbcff6eb8f8beed7e9'
            }
        });
    }
};

const checkParams = async (req, res) => {
    const {message, assistant} = req.body;
    if (!message || !assistant) {
        return res.status(400).json({error: "Missing required parameters"});
    }
};
export {router};