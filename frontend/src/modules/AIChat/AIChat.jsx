import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store';

const AIChat = () => {
    const { isChatOpen, toggleChat } = useStore();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'This is the TeraScope emergency assistant. **If this is a life-threatening emergency, stop using this app and call local emergency services immediately (e.g., 911, 112).** How can I assist you?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsTyping(true);

        // Mock AI response logic (in production, this calls the Gemini backend)
        setTimeout(() => {
            let reply = "I am processing your request. Based on current satellite data, structural damage is significant in your sector. Stay connected to official channels.";

            if (userMsg.toLowerCase().includes('sos') || userMsg.toLowerCase().includes('help') || userMsg.toLowerCase().includes('trapped')) {
                reply = "**[EMERGENCY PROTOCOL ACTIVATED]** Keep your battery conserved. Do not use elevators. If trapped, tap rhythmically on pipes or walls. Can you provide your exact location or nearest intersection?";
            } else if (userMsg.toLowerCase().includes('shelter')) {
                reply = "The nearest verified safe shelter is **Mercy District Community Center (1.2km North)**. The route via Highway 9 Overpass is currently HIGH RISK. Take the secondary route via Oak Street.";
            }

            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isChatOpen && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-6 right-6 z-[500] bg-plasma text-white w-14 h-14 rounded-full flex items-center justify-center shadow-glow hover:scale-105 transition-transform"
                >
                    <MessageSquare className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isChatOpen && (
                <div className="fixed bottom-6 right-6 z-[600] w-80 md:w-96 h-[32rem] bg-graphite border border-gray-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-void/50 backdrop-blur-md">
                        <h2 className="font-sora font-bold text-sm text-ghost flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-plasma" />
                            TeraScope Assistant
                        </h2>
                        <button onClick={toggleChat} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Emergency Banner */}
                    <div className="bg-alert-red/10 border-b border-alert-red/20 p-2 text-center flex items-center justify-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-alert-red" />
                        <span className="text-[10px] font-mono text-alert-red uppercase tracking-wider font-bold">Not for dispatch</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm font-sora ${msg.role === 'user'
                                        ? 'bg-plasma text-white rounded-br-none'
                                        : 'bg-void text-gray-300 border border-gray-800 rounded-bl-none'
                                    }`}>
                                    {/* Basic markdown bold support for mock response */}
                                    <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-void text-gray-300 border border-gray-800 rounded-2xl rounded-bl-none p-3 text-sm flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <div className="p-4 border-t border-gray-800 bg-void/50">
                        <div className="relative">
                            <textarea
                                rows="1"
                                placeholder="Type your message..."
                                className="w-full bg-graphite border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-sm text-ghost font-sora placeholder-gray-500 focus:outline-none focus:border-plasma transition-colors resize-none custom-scrollbar"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{ minHeight: '44px', maxHeight: '120px' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-plasma disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-[9px] font-mono text-center text-gray-600 mt-2">
                            Gemini AI • May contain errors
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChat;
