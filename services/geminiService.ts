

import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ChatRole } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini API will not be available.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const sqlSystemInstruction = `You are an expert SQL developer AI. Your task is to translate natural language descriptions into clean, accurate, and well-formatted SQL code. Generate only the SQL code based on the user's request. Wrap the SQL code in a markdown code block with the language set to 'sql'. Do not provide any explanations or text outside of the code block.`;

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
                systemInstruction: sqlSystemInstruction,
            },
        });

        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error calling Gemini API for SQL generation:", error);
        yield "Sorry, I encountered an error while processing your request. Please try again later.";
    }
}


export async function* generatePolicyAnswerStream(question: string, policyContext: string): AsyncGenerator<string> {
    if (!process.env.API_KEY) {
        yield "API Key not configured. Please contact your administrator.";
        return;
    }
    
    const policySystemInstruction = `You are an HR Policy Assistant for a company. Your primary and ONLY role is to answer employee questions based *strictly* on the provided company policy documents. Do not use any external knowledge or make assumptions. If the answer to a question cannot be found in the provided policy text, you MUST respond with "I'm sorry, I could not find an answer to that question in the provided company policies." Do not attempt to answer anyway.

Here are the company policies:
---
${policyContext}
---
`;

    try {
         const responseStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: [{role: 'user', parts: [{text: question}]}],
            config: {
                systemInstruction: policySystemInstruction,
            },
        });

        for await (const chunk of responseStream) {
            yield chunk.text;
        }

    } catch (error) {
        console.error("Error calling Gemini API for policy assistance:", error);
        yield "Sorry, I encountered an error while processing your request. Please check the console for details.";
    }
}