import express from 'express';
import {createAssistant, STATUS_CODES } from '../commons/utils.js';
import OpenAI from "openai";


const openaiClient = new OpenAI();

const router = express.Router();

// const openaiClient = new OpenAI({
//   apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
// });

// Load assistant ID from file or create a new one
const assistant_id = createAssistant(openaiClient);
console.log("Assistant created with ID:", assistant_id);

// Start conversation
router.get('/start', async (req, res) => {
  const thread = await openaiClient.beta.threads.create();
  console.log("New conversation started with thread ID:", thread.id);
  res.json({ "thread_id": thread.id });
});

// Chat
router.post('/chat', async (req, res) => {
  const { thread_id, message } = req.body;
  if (!thread_id) {
    console.log("Error: Missing thread_id in /chat");
    return res.status(400).json({ "error": "Missing thread_id" });
  }
  console.log("Received message for thread ID:", thread_id, "Message:", message);

  await openaiClient.beta.threads.messages.create(thread_id, "user", message);
  const run = await openaiClient.beta.threads.runs.create(thread_id, assistant_id);
  console.log("Run started with ID:", run.id);
  res.json({ "run_id": run.id });
});

// Check status of run
router.post('/check', async (req, res) => {
  ({ ERROR, COMPLETED, TIMEOUT, REQUIRES_ACTION } = STATUS_CODES);
  const { thread_id, run_id } = req.body;
  if (!thread_id || !run_id) {
    console.log("Error: Missing thread_id or run_id in /check");
    return res.json({ "response": ERROR });
  }

  //delay the execution of the code by 7 seconds
  setTimeout(async () => {
    const run = await openaiClient.beta.threads.runs.retrieve(thread_id, run_id);
    const status = run.status;
    console.log("Run status:", status);

    // 
    if (status === COMPLETED) {
      const messages = await openaiClient.beta.threads.runs.listMessages(thread_id, run_id);
      messageContent = messages.data[0].message.content;

      const response = messages.data[0].message.content;
      console.log("Response:", response);
      return res.json({ "response": response });
    }

    res.json({ "response": COMPLETED });
  }, 7000);

  console.log("Run timed out");
  res.json({ "response": TIMEOUT });
});

export {router};