import express from "express";
import { loadAssistantById, STATUS_CODES } from "../commons/utils.js";
import OpenAI from "openai";

const openaiClient = new OpenAI();
const router = express.Router();

// Load assistant by ID from ENV
const aiAssistant = await loadAssistantById(openaiClient);

// Start conversation
router.get("/start", async (req, res) => {
  const thread = await openaiClient.beta.threads.create();
  console.log("New conversation started with thread ID:", thread.id);
  res.json({ thread_id: thread.id });
});

// Chat
router.post("/chat", async (req, res) => {
  const { thread_id, message } = req.body;
  if (!thread_id) {
    console.log("Error: Missing thread_id in /chat");
    return res.status(400).json({ error: "Missing thread_id" });
  }
  console.log(
    "Received message for thread ID:",
    thread_id,
    "Message:",
    message
  );

  const gptResponse = await openaiClient.beta.threads.messages.create(
    thread_id,
    {
      role: "user",
      content: message,
    }
  );

  const run = await openaiClient.beta.threads.runs.create(thread_id, {
    assistant_id: aiAssistant.id,
  });

  console.log("Run started with ID:", run.id);
  res.json({ run_id: run.id });
});

// Check status of run
router.post("/check", async (req, res) => {
  const { ERROR, COMPLETED, TIMEOUT, REQUIRES_ACTION } = STATUS_CODES;
  const { thread_id, run_id } = req.body;
  if (!thread_id || !run_id) {
    console.log("Error: Missing thread_id or run_id in /check");
    return res.json({ response: ERROR });
  }

  const futureTime = new Date().getTime() + 7000; // 7 seconds in the future\
  const timeNow = new Date().getTime();
  while (timeNow < futureTime) {
    const run = await openaiClient.beta.threads.runs.retrieve(
      thread_id,
      run_id
    );
    const status = run.status;
    console.log("Run status:", status);

    //
    if (status === COMPLETED) {
      const messages = await openaiClient.beta.threads.messages.list(
        thread_id,
        run_id
      );

      const response = await messages.data[0].content[0].text.value;

      return res.json({ response: response });
    }

    res.json({ response: COMPLETED });
  }

  console.log("Run timed out");
  res.json({ response: TIMEOUT });
});

export { router };
