import {
    runAssistant,
    logFeedback,
    FUNCTIONS,
} from "../commons/functions/shared-functions.js";

const messageLui = async (
    openAiClient,
    message,
    thread,
    assistant,
    manychatId,
    logUrl,
) => {
    try {
        return await runAssistant(
            openAiClient,
            message,
            thread,
            manychatId,
            assistant,
            handleToolCalls,
            logUrl,
        );
    } catch (error) {
        console.error(`Error in lui-assistant : ${error.message}`, error);
        throw new Error(
            `Error in lui-assistant : ${error.message}`,
            error,
        );
    }
};

const handleToolCalls = async (
    openAiClient,
    thread,
    run,
    manychatId,
    logUrl,
) => {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    //Iterate over the tool calls to identify different functions
    console.log("Tool calls:", toolCalls);
    for (const toolCall of toolCalls) {
        const toolType = toolCall.type;
        const toolId = toolCall.id;

        if (toolType === "function") {
            const functionName = toolCall.function.name;
            const functionArgs = toolCall.function.arguments;

            switch (functionName) {
                case FUNCTIONS.FEEDBACK:
                    return await logFeedback(
                        thread,
                        functionArgs,
                        manychatId,
                        logUrl,
                    );
                default:
                    break;
            }
        }
    }
};

export {messageLui};