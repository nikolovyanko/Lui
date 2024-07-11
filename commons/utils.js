import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import fs from 'fs';

// const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;


// Add lead to Airtable
// export const createLead  = async (name, phone) => {
//     const url = "https://api.airtable.com/v0/appM1yx0NobvowCAg/Accelerator%20Leads";
//     const headers = {
//         "Authorization": `Bearer ${AIRTABLE_API_KEY}`,
//         "Content-Type": "application/json"
//     };
//     const data = { "records": [{ "fields": { "Name": name, "Phone": phone } }] };
//     try {
//         const response = await axios.post(url, data, { headers });
//         if (response.status === 200) {
//             console.log("Lead created successfully.");
//             return response.data;
//         }
//     } catch (error) {
//         console.error(`Failed to create lead: ${error.response.data}`);
//     }
// }

// Create or load assistant
const createAssistant = async (client) => {

    try {

        // Check if the assistant already exists
        const existingAssistants = await client.beta.assistants.list();
        console.log("Existing assistants:", existingAssistants);
        // const existingAssistant = existingAssistants.data.find(
        //     (assistant) => assistant.name === "LegalGuide AI"
        // );

        // if (existingAssistant) {
        //     console.log("Assistant already exists:", existingAssistant);
        //     return existingAssistant; // Return the existing assistant if found
        // }

        // // If not found, create a new assistant
        // const assistant = await openai.beta.assistants.create({
        //     name: "LegalGuide AI",
        //     instructions:
        //         "LegalGuide AI is your intelligent legal companion, designed to assist you in navigating the complex world of laws and regulations effortlessly.",
        //     model: "gpt-3.5-turbo",
        //     tools: [{ type: "code_interpreter" }],
        //     file_ids: [file.id],
        // });

        // console.log("New assistant created:", assistant);
        // return assistant;
    } catch (error) {
        console.error("Error creating assistant:", error);
    }
}


const STATUS_CODES = {
    COMPLETED: "completed",
    ERROR: "error",
    TIMEOUT: "timeout",
    REQUIRES_ACTION: "requires_action"
};

export { createAssistant, STATUS_CODES };