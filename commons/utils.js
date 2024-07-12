const loadAssistantById = async (client) => {
  try {
    const assistantId = process.env.ASSISTANT_ID;
    // Retrieve the list of assistants
    const response = await client.beta.assistants.list();
    const assistants = response.data;

    // Find the assistant with the specified ID
    const assistant = assistants.find(
      (assistant) => assistant.id === assistantId
    );

    if (assistant) {
      return assistant;
    } else {
      console.log("Assistant not found");
      return null;
    }
  } catch (error) {
    console.error("Error finding assistant:", error);
    throw error;
  }
};

export { loadAssistantById };
