/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Send, 
  Upload, 
  HelpCircle, 
  RefreshCw, 
  ChevronRight,
  BookOpen,
  User,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { chat, Message } from "./lib/gemini";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lastUploadedImage, setLastUploadedImage] = useState<string | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thinkingPhases = [
    "Analyzing handwritten symbols...",
    "Tracing logical connections...",
    "Checking first principles...",
    "Drafting Socratic guidance...",
    "Simplifying intuition..."
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      let i = 0;
      setThinkingPhase(thinkingPhases[0]);
      interval = setInterval(() => {
        i = (i + 1) % thinkingPhases.length;
        setThinkingPhase(thinkingPhases[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setLastUploadedImage(result);
        setIsUploading(false);
        // Senior Dev Touch: Auto-initiate analysis if image is uploaded
        handleSend("", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (customText?: string, overrideImage?: string | null) => {
    const textToSend = customText || input;
    const imageToUse = overrideImage !== undefined ? overrideImage : selectedImage;
    
    // If we have an image but no text, provide a default prompt
    const effectiveText = (!textToSend && imageToUse) ? "Help me solve this math problem step-by-step." : textToSend;

    if (!effectiveText && !imageToUse) return;

    const userParts: any[] = [];
    if (effectiveText) userParts.push({ text: effectiveText });
    if (imageToUse) {
      const base64Data = imageToUse.split(",")[1];
      const mimeType = imageToUse.split(";")[0].split(":")[1];
      userParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    const newUserMessage: Message = { role: "user", parts: userParts };
    const updatedMessages = [...messages, newUserMessage];
    
    setMessages(updatedMessages);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const responseText = await chat(updatedMessages);
      if (responseText) {
        setMessages(prev => [...prev, { role: "model", parts: [{ text: responseText }] }]);
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "model", parts: [{ text: "The complexity here is high—let me gather my thoughts. Could you try sending that again?" }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const askWhy = () => {
    handleSend("Why did we do that? Can you explain the intuition behind this step?");
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedImage(null);
    setLastUploadedImage(null);
    setInput("");
    setCurrentStep(1);
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-text-primary font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="h-14 md:h-16 px-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-dark-bg/80 backdrop-blur-md z-30 sticky top-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 bg-amber-200/10 rounded flex items-center justify-center">
            <span className="text-amber-200 font-display font-bold text-xl">S</span>
          </div>
          <span className="font-display font-medium text-lg md:text-xl tracking-tight">Socratic Tutor</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted uppercase tracking-widest">
          <button onClick={clearChat} className="hover:text-amber-200 cursor-pointer transition-colors p-2 md:p-0">
            <RefreshCw size={18} className="md:w-3.5 md:h-3.5" />
          </button>
          <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-slate-800 flex items-center justify-center hidden md:flex">
            <User size={16} className="text-slate-400" />
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel: Problem Context (Responsive: compact on mobile when chat starts) */}
        <section className={`
          flex-shrink-0 border-white/5 flex flex-col transition-all duration-300 ease-in-out
          ${messages.length === 0 ? "w-full md:w-[420px]" : "w-full md:w-80 lg:w-[420px]"}
          ${messages.length > 0 ? "h-auto max-h-48 md:max-h-none md:h-full overflow-hidden md:border-r" : "h-full md:border-r"}
          bg-dark-panel p-4 md:p-8 gap-4 md:gap-6
        `}>
          <div className={`${messages.length > 0 ? "hidden md:block" : "block"} space-y-1`}>
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60 font-semibold">Active Session</span>
            <h2 className="text-xl md:text-2xl font-display">{messages.length > 0 ? "Focus Area" : "Ready to Solve"}</h2>
          </div>

          {/* Problem Display / Image Area */}
          <div 
            onClick={() => !isLoading && !isUploading && fileInputRef.current?.click()}
            className={`
            relative rounded-xl border border-white/10 bg-dark-surface flex items-center justify-center overflow-hidden group shadow-2xl transition-all cursor-pointer hover:border-amber-200/30
            ${messages.length > 0 ? "aspect-video md:aspect-square" : "aspect-square"}
          `}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05),transparent)]"></div>
            
            {isUploading ? (
              <div className="z-20 text-center animate-pulse">
                <RefreshCw size={32} className="mx-auto mb-2 text-amber-200 animate-spin" />
                <p className="text-[10px] text-amber-200 uppercase tracking-widest">Uploading...</p>
              </div>
            ) : lastUploadedImage ? (
              <img src={lastUploadedImage} alt="Math problem" className="w-full h-full object-contain p-2 md:p-4 z-10" />
            ) : (
              <div className="z-10 text-center p-4 md:p-8 group-hover:scale-105 transition-transform">
                <Brain size={messages.length > 0 ? 32 : 48} className="mx-auto mb-3 md:mb-4 text-amber-200/20" />
                <p className="font-display text-lg md:text-xl mb-1 text-text-secondary">Scan to begin</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest hidden md:block">Patient guidance awaits</p>
              </div>
            )}
            
            {/* Scanner Effect - Active during analysis */}
            <motion.div 
              animate={{ 
                top: ["0%", "100%", "0%"],
                opacity: isLoading || isUploading ? 1 : 0 
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-[1px] bg-amber-200/40 shadow-[0_0_15px_rgba(251,191,36,0.5)] z-20 pointer-events-none"
            />
          </div>

          <div className={`${messages.length > 0 ? "hidden md:block" : "block"} space-y-4`}>
            <div className="p-4 rounded-lg bg-white/5 border border-white/5">
              <p className="text-xs leading-relaxed text-text-secondary italic">
                {messages.length === 0 
                  ? "Share a photo of your math challenge. We'll decompose it into logical intuitions together."
                  : "Currently exploring the first principles of this expression."}
              </p>
            </div>
            <div className="flex justify-between items-end border-t border-white/5 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Approach</p>
                <p className="text-sm font-display text-amber-200/80">Socratic</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Insight Progress</p>
                <p className="text-sm font-display">Step {currentStep} Identified</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Dialogue */}
        <section className="flex-1 flex flex-col bg-dark-bg min-w-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 border border-amber-200/20 rounded-full flex items-center justify-center text-amber-200 mb-6 md:mb-8 font-display font-medium text-3xl md:text-4xl">
                S
              </div>
              <h2 className="text-3xl md:text-4xl font-display mb-4">Step-by-step intuition.</h2>
              <p className="text-text-secondary max-w-sm mb-8 md:mb-12 font-sans text-base md:text-lg leading-relaxed">
                Upload a calculus or algebra problem. We'll solve it together, one logical question at a time.
              </p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 bg-white/5 border border-white/10 text-text-primary px-6 md:px-8 py-3 md:py-4 rounded-xl hover:bg-white/10 transition-all font-display text-base md:text-lg shadow-xl"
              >
                <Camera size={24} className="text-amber-200" />
                Upload Math Challenge
              </button>
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 md:space-y-12 scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 md:gap-6 max-w-3xl ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border border-amber-200/20 flex items-center justify-center font-display font-medium text-sm md:text-base ${m.role === "user" ? "text-slate-400 bg-white/5" : "text-amber-200"}`}>
                      {m.role === "user" ? "U" : "T"}
                    </div>
                    <div className="space-y-4 min-w-0 flex-1">
                      {m.parts.map((p, pi) => (
                        <div key={pi}>
                          {p.text && (
                            <div className="markdown-body">
                              <ReactMarkdown 
                                remarkPlugins={[remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                              >
                                {p.text}
                              </ReactMarkdown>
                            </div>
                          )}
                          {/* We hide the user image from chat if it's already in the left/top panel */}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex gap-4 md:gap-6">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border border-amber-200/10 flex items-center justify-center text-amber-200 animate-pulse">T</div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] text-amber-200/60 uppercase tracking-widest font-medium">
                      <RefreshCw size={10} className="animate-spin" /> {thinkingPhase}
                    </div>
                    <div className="space-y-2 py-1">
                      <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-white/5 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Interaction / Input */}
          <div className="p-4 md:p-8 border-t border-white/5 bg-dark-bg/50 backdrop-blur-md">
            {messages.length > 0 && messages[messages.length - 1].role === "model" && !isLoading && (
              <div className="mb-4 md:mb-6 flex flex-wrap gap-2 md:gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button 
                  onClick={askWhy}
                  className="px-4 md:px-5 py-2 md:py-3 rounded-full bg-amber-200/10 border border-amber-200/30 text-amber-200 text-xs md:text-sm hover:bg-amber-200/20 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <HelpCircle size={14} /> Wait, why?
                </button>
                <button 
                  onClick={() => handleSend("I'm ready for the next step.")}
                  className="px-4 md:px-5 py-2 md:py-3 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm hover:bg-white/10 transition-colors hover:border-amber-200/50 flex items-center gap-2 whitespace-nowrap"
                >
                  Next step <ChevronRight size={14} />
                </button>
              </div>
            )}

            <div className="relative flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-xl text-amber-200 hover:bg-white/10 transition-colors"
                title="Add photo"
              >
                <Camera size={20} />
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
                  placeholder="Ask a question..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 md:py-4 px-4 md:px-6 focus:outline-none focus:border-amber-200/40 text-slate-200 placeholder-slate-600 font-sans text-sm md:text-lg transition-all"
                />
              </div>
              <button 
                disabled={isLoading || (!input && !selectedImage)}
                onClick={() => handleSend()}
                className="bg-amber-200 text-slate-900 font-bold px-4 md:px-6 py-3 md:py-4 rounded-xl text-xs md:text-sm uppercase tracking-widest hover:bg-amber-300 disabled:opacity-30 transition-all flex items-center justify-center min-w-[80px]"
              >
                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : "Send"}
              </button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              accept="image/*" 
              onChange={handleImageUpload} 
            />

            {selectedImage && (
              <div className="mt-4 flex items-center gap-3 bg-amber-200/10 p-2 md:p-3 rounded-lg border border-amber-200/20 max-w-md">
                <div className="w-8 h-8 rounded border border-white/20 overflow-hidden">
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] md:text-xs text-amber-200 italic truncate">Image ready for analysis</span>
                <button onClick={() => setSelectedImage(null)} className="ml-auto text-text-muted hover:text-white p-1">
                  <RefreshCw size={12} />
                </button>
              </div>
            )}

            <p className="mt-4 text-[9px] md:text-[10px] text-center text-slate-600 uppercase tracking-[0.2em] font-sans md:tracking-[0.4em]">
              Precision is a byproduct of patience
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
