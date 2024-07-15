import express from "express";
import OpenAI from "openai";

const router = express.Router();
let aiClients = new Map();

// let aiAssistant = await loadAssistantById(openaiClient);

// Start conversation
router.get("/start", async (req, res) => {
  const API_KEY = req.header("Authorization");
  const ASSISTANT_ID = req.header("Assistant-Id");

  if (!API_KEY || !ASSISTANT_ID) {
    res.status(401).json({ error: "Unauthorized!" });
  }

  const openAiClient = await
    getOpenAiClient(API_KEY, ASSISTANT_ID);

  const thread = await
    openAiClient.beta.threads.create();

  res.json({ thread_id: thread.id });
});

// Chat
router.post("/chat", async (req, res) => {
  const API_KEY = req.header("Authorization");
  const assistantId = req.header("Assistant-Id");
  const { thread_id, message} = req.body;

  if (!API_KEY ) {
    return res.status(401).json({ error: "Unauthorized!" });
  }

  if (!thread_id || !message || !assistantId) {
    console.error("Error: Missing thread_id, message or assistantId in /chat");
    return res.status(400).json({ error: "Missing thread_id" });
  }

  try {
    const openaiClient = await getOpenAiClient(API_KEY, assistantId);

    await openaiClient.beta.threads.messages
      .create(
        thread_id,
        {
          role: "user",
          content: message,
        }
      );

    const run = await openaiClient.beta.threads.runs
      .create(thread_id, {
        assistant_id: assistantId,
      });

    res.json({ run_id: run.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check status of run
router.post("/check", async (req, res) => {
  const API_KEY = req.header("Authorization");
  const assistantId = req.header("Assistant-Id");
  const { thread_id, run_id } = req.body;

  if (!API_KEY) {
    return res.status(401).json({ error: "Unauthorized!" });
  }

  if (!thread_id || !run_id || !assistantId) {
    console.error("Error: Missing thread_id or run_id in /check");
    return res.json({ response: STATUS_CODES.ERROR });
  }

  try {
    const openaiClient = await getOpenAiClient(API_KEY, assistantId);
    const futureTime = new Date().getTime() + 7000; // 7 seconds in the future
    while (new Date().getTime() < futureTime) {
      const run = await openaiClient.beta.threads.runs.retrieve(
        thread_id,
        run_id
      );
      const status = run.status;

      if (status === STATUS_CODES.COMPLETED) {
        const messages = await openaiClient.beta.threads.messages.list(
          thread_id,
          run_id
        );
        const regex = /【.*source】/g;
        const responseMessage = await messages.data[0].content[0].text.value;
        const response = responseMessage.replace(regex, '');

        return res.json({ response: response });
      }

    }
  } catch (error) {
    console.error(error);
    res.json({ response: STATUS_CODES.ERROR });
  }

  console.error("Run timed out");
  res.json({ response: STATUS_CODES.TIMEOUT });
});

const STATUS_CODES = {
  COMPLETED: "completed",
  ERROR: "error",
  TIMEOUT: "timeout",
  REQUIRES_ACTION: "requires_action",
};

const getOpenAiClient = async (apiKey, assistantId) => {
  if (!aiClients.has(assistantId)) {
    aiClients.set(assistantId, new OpenAI({ apiKey: apiKey }));
  }

  return aiClients.get(assistantId);
}

export { router };
