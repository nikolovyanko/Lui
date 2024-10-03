import OpenAI from "openai";

let aiClients = new Map();

const getOpenAiClient = async (apiKey, assistantId) => {
    if (!aiClients.has(assistantId)) {
        aiClients.set(assistantId, new OpenAI({apiKey: apiKey}));
    }

    return aiClients.get(assistantId);
};

const createThread = async (openaiClient) => {
    const newThread = await openaiClient.beta.threads.create();
    console.log(`Created thread: ${newThread.id}`);
    return newThread.id;
};

const sendMessage = async (openaiClient, thread, message) => {
    await openaiClient.beta.threads.messages.create(thread, {
        role: "user",
        content: message,
    });
};

const createRun = async (openaiClient, thread, assistantId) => {
    return openaiClient.beta.threads.runs.create(thread, {
        assistant_id: assistantId,
    });
};

const retrieveRun = async (openaiClient, thread, runId) => {
    return openaiClient.beta.threads.runs.retrieve(thread, runId);
};

const getMessage = async (openaiClient, thread, run) => {
    const messages = await openaiClient.beta.threads.messages.list(
        thread,
        run.id,
    );
    return messages.data[0].content[0].text.value;
};

const deleteThread = async (openaiClient, thread) => {
    await openaiClient.beta.threads.del(thread);
    console.log(`Thread deleted: ${thread}`);
    return `Thread ${thread} deleted`;
};

const submitToolsCall = async (
    openaiClient,
    thread,
    run,
    toolId,
    outputMessage,
) => {
    while (run.status !== "completed") {
        if (run.status === "requires_action") {
            await openaiClient.beta.threads.runs.submitToolOutputs(
                thread,
                run.id,
                {
                    tool_outputs: [
                        {
                            tool_call_id: toolId,
                            output: outputMessage,
                        },
                    ],
                },
            );
        }
        run = await retrieveRun(thread, run.id);
    }
};

export {
    createThread,
    sendMessage,
    createRun,
    retrieveRun,
    getMessage,
    deleteThread,
    submitToolsCall,
    getOpenAiClient,
};