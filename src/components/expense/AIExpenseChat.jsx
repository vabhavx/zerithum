import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Send, Loader2, Bot, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function AIExpenseChat({ open, onOpenChange, expenses = [], metrics = {} }) {
  const [conversations, setConversations] = useState([]);
  const [currentConv, setCurrentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && !currentConv && !initializing) {
      initConversation();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    setInitializing(true);
    try {
      // 1. Create Conversation
      const conv = await base44.agents.createConversation({
        agent_name: "expense_advisor",
        metadata: { name: "Expense Advisory Session" }
      });
      setCurrentConv(conv);
      setMessages(conv.messages || []);

      // 2. Subscribe to updates
      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages);
      });

      // 3. Inject Context (Hidden from user view if possible, or just system context)
      // Since we can't hide messages easily in this UI without filtering, we'll send a system prompt
      // acting as "initial context".
      if (expenses.length > 0) {
        const topMerchant = Object.entries(
          expenses.reduce((acc, curr) => {
            acc[curr.merchant] = (acc[curr.merchant] || 0) + curr.amount;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0];

        const contextMsg = `
Current Financial Context for this User:
- Total Spend: $${metrics.total?.toFixed(2) || "0.00"}
- Tax Deductible Amount: $${metrics.deductible?.toFixed(2) || "0.00"}
- Total Transactions: ${expenses.length}
- Top Merchant: ${topMerchant ? `${topMerchant[0]} ($${topMerchant[1].toFixed(2)})` : "None"}
- Recent 5 Transactions:
${expenses.slice(0, 5).map(e => `  - ${e.expense_date}: ${e.merchant} ($${e.amount}) - ${e.category}`).join("\n")}

Please use this context to answer user questions accurately.
        `.trim();

        await base44.agents.addMessage(conv, {
          role: "system",
          content: contextMsg
        });
      }

      setInitializing(false);
      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to init conversation:", error);
      setInitializing(false);
    }
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || !currentConv) return;

    // Check if previous message is still processing (optimistic UI)
    if (sending) return;

    const userMessage = text.trim();
    setInput("");
    setSending(true);

    try {
      await base44.agents.addMessage(currentConv, {
        role: "user",
        content: userMessage
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const quickActions = [
    { label: "Analyze my spending", prompt: "Analyze my recent spending patterns and give me 3 insights." },
    { label: "Find tax deductions", prompt: "Which of my recent expenses are tax deductible and how much can I save?" },
    { label: "Budget advice", prompt: "Based on my spending, what is one area I can cut costs?" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-modern rounded-2xl border max-w-2xl h-[650px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-white/5 bg-zinc-900/50">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zteal-400/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-zteal-400" />
            </div>
            AI Expense Advisor
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-zinc-950/50">
          {initializing ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Connecting to Advisor...</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.filter(m => m.role !== 'system').length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center px-8">
                  <Bot className="w-12 h-12 text-white/10 mb-4" />
                  <p className="text-white/60 mb-6">
                    I have access to your {expenses.length} recent expenses effectively totalling ${metrics.total?.toFixed(0)}.
                    Ask me anything!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickActions.map((action, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(action.prompt)}
                        className="rounded-full border-zteal-400/20 text-zteal-400 hover:bg-zteal-400/10 text-xs h-8"
                      >
                        <Zap className="w-3 h-3 mr-1.5" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-zteal-400/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-zteal-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm
                      ${msg.role === 'user'
                        ? 'bg-zteal-500 text-white rounded-tr-sm'
                        : 'bg-white/5 text-white/90 rounded-tl-sm border border-white/5'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div className="text-sm prose prose-invert prose-sm max-w-none [&>p]:m-0 [&>p+p]:mt-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-zteal-400/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-zteal-400" />
                  </div>
                  <div className="bg-white/5 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-zinc-900 border-t border-white/5">
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for advice..."
              className="bg-zinc-950 border-white/10 text-white placeholder:text-white/30 pr-12 h-11"
              disabled={sending || initializing}
              autoFocus
            />
            <Button
              onClick={() => handleSend()}
              disabled={sending || !input.trim() || initializing}
              size="icon"
              className="absolute right-1 top-1 h-9 w-9 bg-zteal-400 hover:bg-zteal-500 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-white/20 text-center mt-2">
            AI can make mistakes. Verify important financial details.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}