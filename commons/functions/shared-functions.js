import axios from "axios";
import {
    getMessage,
    submitToolsCall,
    sendMessage,
    createThread,
    createRun,
    retrieveRun,
} from "./openai-functions.js";

const FUNCTIONS = {
    GET_TODAY_DATE: "getTodaysDateInUK",
    GET_WHATSAPP_DETAILS: "getWhatsappDetails",
    LOG_ISSUE: "logIssue",
    FEEDBACK: "feedback",
};

const fetchTodayDateTime = async () => {
    const url = "https://worldtimeapi.org/api/timezone/Europe/London";
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
            const response = await axios.get(url);
            return response.data.datetime;
        } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                console.error(
                    "Failed to fetch date after multiple attempts",
                    error,
                );
                throw error;
            }
            console.log("Retrying request...");
        }
    }
};

const getTodayDateInUK = async (openAiClient, thread, run, toolId) => {
    try {
        const datetime = await fetchTodayDateTime();

        const outputString = `{ "today_date_time": "${datetime}" }`;
        await submitToolsCall(openAiClient, thread, run, toolId, outputString);

        const responseMessage = await getMessage(openAiClient, thread, run);

        return {
            thread,
            responseMessage,
        };
    } catch (error) {
        console.error(`Error in getTodayDateInUK:`, error);
        throw error;
    }
};

const getWhatsappDetails = async (
    openAiClient,
    thread,
    run,
    toolId,
    manychatId,
) => {
    try {
        const response = await axios.post(process.env.GET_WHATSAPP_ENDPOINT, {
            manychatId,
        });
        const {full_name, phone} = response.data;
        const outputString = `{ "full_name": "${full_name}", "phone": "${phone}" }`;

        await submitToolsCall(openAiClient, thread, run, toolId, outputString);
        const responseMessage = await getMessage(openAiClient, thread, run);

        return {
            thread,
            responseMessage,
        };
    } catch (error) {
        console.error(`Error in getWhatsappDetails:`, error);
        throw error;
    }
};

const logFeedback = async (thread, summary, manychatId) => {
    try {
        console.log("Logging feedback...");
        const {issue_summary, issue_resolution_summary} = JSON.parse(summary);

        await axios.post(process.env.MANYCHAT_SET_FIELDS, {
            subscriber_id: manychatId,
            fields: [
                {
                    field_id: 11836696,
                    field_value: issue_summary
                },
                {
                    field_id: 11836697,
                    field_value: issue_resolution_summary
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`
            }
        });

        //Call the Lui Feedback ManyChat Automation
        const respCallAutomation = await axios.post(process.env.MANYCHAT_SEND_FLOW, {
            subscriber_id: manychatId,
            flow_ns: "content20241002104726_572926",
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.MANYCHAT_API_KEY}`
            }
        });
        console.log(`${respCallAutomation}: response from Lui Feedback automation`)

        return {
            thread,
            responseMessage: "stop",
        };
    } catch (error) {
        console.error(`Error in logFeedback:`, error);
        throw error;
    }
};

const runAssistant = async (
    openAiClient,
    message,
    initialThread,
    manychatId,
    assistant,
    handleToolCalls
) => {
    let {thread, run} = await initThreadAndRun(
        openAiClient,
        initialThread,
        message,
        assistant,
    );
    // Poll for the run status until it is completed
    while (run.status !== "completed") {
        if (run.status === "failed") {
            throw new Error(
                `Error in Open-Ai Run with code: ${run.last_error.code} 
                and message: ${run.last_error.message}`,);
        }
        // Add a delay of 1.5 second
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await retrieveRun(openAiClient, thread, run.id);

        if (run.status === "requires_action") {
            return await handleToolCalls(
                openAiClient,
                thread,
                run,
                manychatId
            );
        }
        //Checking the status at the end of the loop to avoid unnecessary polling
        run = await retrieveRun(openAiClient, thread, run.id);
    }
    const responseMessage = await getMessage(openAiClient, thread, run);
    return {
        thread,
        responseMessage,
    };
};

const initThreadAndRun = async (openAiClient, thread, message, assistant) => {
    thread = thread ?? (await createThread(openAiClient));
    await sendMessage(openAiClient, thread, message);
    const run = await createRun(openAiClient, thread, assistant);
    return {thread, run};
};

export {
    getTodayDateInUK,
    getWhatsappDetails,
    runAssistant,
    logFeedback,
    FUNCTIONS,
};