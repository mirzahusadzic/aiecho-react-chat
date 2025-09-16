// Load and preprocess JSON
export async function loadChatJSON(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();

    // Extract chunks safely
    const chunks = data?.chunkedPrompt?.chunks || [];

    // Prune any chunks with errors
    const validChunks = chunks.filter(chunk => !chunk.errorMessage);

    if (validChunks.length === 0) {
      console.warn("No valid chat chunks found in the JSON file.");
    }

    return validChunks;
  } catch (e) {
    console.error("Error loading JSON:", e);
    return [];
  }
}
