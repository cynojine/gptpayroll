
import React, { useState, useRef, useEffect } from 'react';
import { Card } from './common/Card';
import { generateSqlStream } from '../services/geminiService';
import { ChatMessage, ChatRole } from '../types';
import { PolicyIcon } from './icons/IconComponents';

export const PolicyAssistant: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: ChatRole.USER, text: prompt };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setPrompt('');
        setIsLoading(true);

        try {
            const stream = generateSqlStream(newHistory);
            let fullResponse = '';
            
            setHistory(prev => [...prev, { role: ChatRole.MODEL, text: '' }]);

            for await (const chunk of stream) {
                fullResponse += chunk;
                setHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === ChatRole.MODEL) {
                        const updatedHistory = [...prev.slice(0, -1)];
                        updatedHistory.push({ ...lastMessage, text: fullResponse });
                        return updatedHistory;
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error(error);
            setHistory(prev => [...prev, { role: ChatRole.ERROR, text: 'An error occurred. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
        const isUser = message.role === ChatRole.USER;
        const isModel = message.role === ChatRole.MODEL;
        const bubbleStyles = isUser
            ? 'bg-blue-600 self-end'
            : 'bg-slate-700 self-start';
        const containerStyles = isUser ? 'justify-end' : 'justify-start';

        if(message.role === ChatRole.ERROR) {
            return <div className="text-red-400 text-center py-2">{message.text}</div>
        }

        // Clean up markdown code block for display
        const cleanedText = message.text.replace(/^```sql\n|```$/g, '');

        return (
            <div className={`flex w-full ${containerStyles}`}>
                <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg shadow-md ${bubbleStyles}`}>
                   {isModel ? (
                       <pre className="whitespace-pre-wrap break-words">
                           <code className="text-sm font-mono text-emerald-300">{cleanedText}</code>
                       </pre>
                   ) : (
                       <p>{message.text}</p>
                   )}
                </div>
            </div>
        );
    };

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center mb-4">
                <PolicyIcon className="w-8 h-8 mr-3 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">AI SQL Generator</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                {history.length === 0 && (
                    <div className="text-center text-slate-400 p-8">
                        <p>Describe the database table or query you need.</p>
                        <p className="text-sm mt-2">e.g., "Create a table for users with an ID, name, email, and a created_at timestamp."</p>
                    </div>
                )}
                {history.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isLoading && history[history.length -1]?.role !== ChatRole.MODEL && (
                     <div className="flex justify-start">
                        <div className="bg-slate-700 px-4 py-3 rounded-lg shadow-md flex items-center space-x-2">
                           <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></span>
                           <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></span>
                           <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="mt-auto flex items-center space-x-2 border-t border-slate-700 pt-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your SQL needs..."
                    className="flex-1 bg-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition"
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </form>
        </Card>
    );
};
