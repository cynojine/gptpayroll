
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ChatRole } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API will not be available.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const systemInstruction = `You are an expert SQL developer AI. Your task is to translate natural language descriptions into clean, accurate, and well-formatted SQL code. Generate only the SQL code based on the user's request. Wrap the SQL code in a markdown code block with the language set to 'sql'. Do not provide any explanations or text outside of the code block.`;

export async function* generateSqlStream(history: ChatMessage[]): AsyncGenerator<string> {
    if (!process.env.API_KEY) {
        yield "API Key not configured. Please contact your administrator.";
        return;
    }

    try {
        const contents = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        yield "Sorry, I encountered an error while processing your request. Please try again later.";
    }
}
