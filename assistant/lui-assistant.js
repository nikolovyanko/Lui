import {CustomError} from "../commons/err/customError.js";
import {getTodayDateInUK, getWhatsappDetails, runAssistant, FUNCTIONS} from "../commons/functions/shared-functions.js";

const messageLui = async (openAiClient,message, thread, assistant, manychatId) => {
    try {
        return await runAssistant(
            openAiClient,
            message,
            thread,
            manychatId,
            assistant,
            handleToolCalls
            );
    } catch (error) {
        console.error(`Error in lui-assistant : ${error.message}`, error);
        throw new CustomError(`Error in lui-assistant : ${error.message}`, error);
    }
};


const handleToolCalls = async (openAiClient, thread, run, manychatId) => {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    //Iterate over the tool calls to identify different functions
    for (const toolCall of toolCalls) {
        const toolType = toolCall.type;
        const toolId = toolCall.id;

        if (toolType === "function") {
            const functionName = toolCall.function.name;
            const functionArgs = toolCall.function.arguments;

            switch (functionName) {
                case FUNCTIONS.GET_TODAY_DATE:
                    return await getTodayDateInUK(openAiClient, thread, run, toolId);
                case FUNCTIONS.GET_WHATSAPP_DETAILS:
                    return await getWhatsappDetails(openAiClient, thread, run, toolId, manychatId);
                default:
                    break;
            }
        }
    }
};

export {messageLui};