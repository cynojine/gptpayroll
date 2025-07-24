
import React, { useState, useRef, useEffect } from 'react';
import { Card } from './common/Card';
import { generateSqlStream, generatePolicyAnswerStream } from '../services/geminiService';
import { ChatMessage, ChatRole } from '../types';
import { PolicyIcon } from './icons/IconComponents';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import { LoadingSpinner } from './common/LoadingSpinner';

type AssistantTab = 'ask' | 'sql';

const ChatBubble: React.FC<{ message: ChatMessage; isSqlMode: boolean; }> = ({ message, isSqlMode }) => {
    const isUser = message.role === ChatRole.USER;
    const isModel = message.role === ChatRole.MODEL;
    const bubbleStyles = isUser ? 'bg-blue-600 self-end' : 'bg-slate-700 self-start';
    const containerStyles = isUser ? 'justify-end' : 'justify-start';

    if (message.role === ChatRole.ERROR) {
        return <div className="text-red-400 text-center py-2">{message.text}</div>;
    }

    const cleanedText = isSqlMode ? message.text.replace(/^```sql\n|```$/g, '') : message.text;

    return (
        <div className={`flex w-full ${containerStyles}`}>
            <div className={`max-w-xl lg:max-w-3xl px-4 py-3 rounded-lg shadow-md ${bubbleStyles}`}>
                {isModel && isSqlMode ? (
                    <pre className="whitespace-pre-wrap break-words">
                        <code className="text-sm font-mono text-emerald-300">{cleanedText}</code>
                    </pre>
                ) : (
                    <p className="whitespace-pre-wrap">{cleanedText}</p>
                )}
            </div>
        </div>
    );
};

export const PolicyAssistant: React.FC = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<AssistantTab>('ask');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [policyContext, setPolicyContext] = useState<string | null>(null);
    const [contextLoading, setContextLoading] = useState(true);
    const [contextError, setContextError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const isSqlMode = activeTab === 'sql';

    useEffect(() => {
        const loadPolicyContext = async () => {
            try {
                setContextLoading(true);
                setContextError(null);
                const text = await api.getPoliciesAsText();
                setPolicyContext(text);
            } catch (err) {
                console.error("Failed to load policy context:", err);
                setContextError("Could not load company policies. The assistant may not provide accurate answers.");
            } finally {
                setContextLoading(false);
            }
        };
        loadPolicyContext();
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleTabChange = (tab: AssistantTab) => {
        setActiveTab(tab);
        setHistory([]);
        setPrompt('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: ChatRole.USER, text: prompt };
        let newHistory = [...history, userMessage];
        
        if (isSqlMode) {
            setHistory(newHistory);
        } else {
             // For policy questions, we don't need to show past conversation history to the model
             newHistory = [userMessage];
             setHistory(prev => [...prev, userMessage]);
        }
        
        setPrompt('');
        setIsLoading(true);

        try {
            const stream = isSqlMode 
                ? generateSqlStream(newHistory) 
                : generatePolicyAnswerStream(prompt, policyContext || '');
            
            let fullResponse = '';
            setHistory(prev => [...prev, { role: ChatRole.MODEL, text: '' }]);

            for await (const chunk of stream) {
                fullResponse += chunk;
                setHistory(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === ChatRole.MODEL) {
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
    
    const [error, setError] = useState<string|null>(null);

    const renderContent = () => {
        if(contextLoading) return <LoadingSpinner text="Loading AI Assistant..." />;
        
        return (
            <>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                     {contextError && <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-lg p-3 text-center mb-4">{contextError}</div>}
                    {history.length === 0 && (
                        <div className="text-center text-slate-400 p-8">
                            <p>{isSqlMode ? "Describe the database table or query you need." : "Ask a question about company policies."}</p>
                            <p className="text-sm mt-2">{isSqlMode ? 'e.g., "Create a table for users with an ID, name, and email."' : 'e.g., "How many sick leave days do we get per year?"'}</p>
                        </div>
                    )}
                    {history.map((msg, index) => (
                        <ChatBubble key={index} message={msg} isSqlMode={isSqlMode} />
                    ))}
                    {isLoading && history[history.length - 1]?.role !== ChatRole.MODEL && (
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
                        placeholder={isSqlMode ? "Describe your SQL needs..." : "Ask your policy question..."}
                        className="flex-1 bg-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isLoading || contextLoading}
                    />
                    <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition"
                        disabled={isLoading || contextLoading || !prompt.trim()}
                    >
                        {isLoading ? 'Generating...' : 'Send'}
                    </button>
                </form>
            </>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
                <div className="flex items-center">
                    <PolicyIcon className="w-8 h-8 mr-3 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white">AI Policy Assistant</h2>
                </div>
                 {profile?.role === 'admin' && (
                    <div className="flex space-x-1 bg-slate-700/50 p-1 rounded-lg">
                        <button onClick={() => handleTabChange('ask')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'ask' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>Ask a Question</button>
                        <button onClick={() => handleTabChange('sql')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'sql' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>Generate SQL</button>
                    </div>
                )}
            </div>
           {renderContent()}
        </Card>
    );
};
