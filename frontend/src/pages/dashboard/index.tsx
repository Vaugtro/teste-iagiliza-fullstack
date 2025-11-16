import { useState, useEffect } from 'react'; // Added useEffect
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom'; // Added
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  MessageSquare,
  User,
  LogOut,
  Plus,
  Send,
  Bot,
  Menu,
  X,
  LoaderCircle,
} from 'lucide-react';

import { api } from '@/lib/api';
import clsx from 'clsx';

// Types based on your API structure (assumed)
interface Bot {
  id: number;
  modelType: string;
}

interface Chat {
  id: number;
  createdAt: Date;
  botId: number;
  modelType: string;
}

interface Message {
  senderType: 'user' | 'bot';
  content: string;
  createdAt: Date;
}

const profileSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).optional(),
  email: z.email({ message: 'Please enter a valid email address.' }).optional(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long.' })
    .optional(),
});

const messageSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Message cannot be empty.' })
    .max(128, { message: 'Message cannot exceed 128 characters.' }),
});

export default function ChatDashboard() {
  const [currentView, setCurrentView] = useState('chat');
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isLoading, setIsLoading] = useState(false); // For profile/chat creation
  const [isChatLoading, setIsChatLoading] = useState(false); // For messages

  const navigate = useNavigate();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  });

  // Fetch user profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await api.me.get();
        form.reset({ name: user.sender.name, email: user.email });
      } catch (error: unknown) {
        console.error('Failed to load profile.', error);
        toast.error('Failed to load profile.');
      }
    };
    fetchProfile();
  }, [form]);

  // Fetch available bots on load
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const botList = await api.bot.getAll();
        setBots(botList);
      } catch ( error: unknown) {
        console.error('Failed to load bots.', error);
        toast.error('Failed to load bots.');
      }
    };
    fetchBots();
  }, []);

  // Fetch chats on load
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatList = await api.chat.getAll();

        const chats = chatList.map((chat: {id: number; createdAt: string, aiId:number, ai: {modelType: string}}) => ({
          ...chat,
          botId: chat.aiId,
          modelType: chat.ai.modelType,
          createdAt: chat.createdAt ? new Date(chat.createdAt) : undefined,
        }));

        setChats(chats);
        if (chatList.length > 0) {
          setActiveChat(chatList[0].id);
        }
      } catch (error: unknown) {
        console.error('Failed to load conversations.', error);
        toast.error('Failed to load conversations.');
      }
    };
    fetchChats();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    setMessages([]);
    setIsChatLoading(true);

    const fetchMessages = async () => {
      setIsChatLoading(true);
      try {

        console.log('Fetching messages for chat ID:', activeChat);
        const chat = await api.chat.message.getByChatId(
          activeChat,
        );

        console.log('Raw chat messages:', chat.messages);

        // Convert createdAt strings to Date objects
        chat.messages = chat.messages.map((msg: {createdAt: string}) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
        }));

        console.log(chat)

        setMessages(chat.messages);
      } catch (error: unknown) {
        console.error('Failed to load messages.', error);
        toast.error('Failed to load messages.');
        setMessages([]);
      } finally {
        setIsChatLoading(false);
      }
    };
    fetchMessages();
  }, [activeChat]);
  // --- API-driven Actions ---

  const handleLogout = () => {
    api.user.logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsLoading(true);
    try {
      const updatedUser = await api.me.update(values);
      form.reset(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      console.error('Failed to update profile.', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const onMessageSubmit = async (values: z.infer<typeof messageSchema>) => {
    if (!activeChat) return;

    const userMessage: Message = {
      senderType: 'user',
      content: values.content, // Use content from form values
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    messageForm.reset(); // Reset the form field
    setIsChatLoading(true);

    try {
      const botResponse = await api.chat.message.send({
        chatId: activeChat,
        content: values.content, // Use content from form values
      });

      botResponse.createdAt = botResponse.createdAt ? new Date(botResponse.createdAt) : undefined;
      setMessages((prev) => [...prev, botResponse]);
    } catch (error: unknown) {
      console.error('Failed to send message.', error);
      toast.error('Failed to send message.');
      setMessages((prev) =>
        prev.filter((msg) => msg.createdAt !== userMessage.createdAt),
      );
    } finally {
      setIsChatLoading(false);
    }
  };


  const handleCreateNewChat = async () => {
    if (!selectedBot) {
      toast.error('Please select a bot');
      return;
    }

    setIsLoading(true);
    try {
      const newConv = await api.chat.create({ aiId: selectedBot });
      
      setChats((prev) => [...prev, newConv]);
      setActiveChat(newConv.id);
      setMessages([]); // New chat is empty
      setIsNewChatOpen(false);
      setSelectedBot(null);
    } catch (error: unknown) {
      console.error('Failed to create new chat.', error);
      toast.error('Failed to create new chat.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeConvTitle = 
    chats.find((c) => c.id === activeChat)?.modelType + " - " + chats.find((c) => c.id === activeChat)?.createdAt.toLocaleString() || 'Chat';

  return (
    <div className="flex bg-gray-100 min-w-[400px] max-h-[80vh] rounded-lg shadow-lg overflow-hidden">
      <div
        className={`transition-all duration-300 bg-white border-r border-gray-200 flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Chat App</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Button
            variant="link"
            className="w-full justify-start text-white hover:text-neutral-200 hover:no-underline bg-indigo-600!"
            onClick={() => setCurrentView('chat')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
          <Button
            variant="link"
            className="w-full justify-start text-white hover:text-neutral-200 hover:no-underline bg-indigo-600!"
            onClick={() => setCurrentView('profile')}
          >
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>

          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">
                Conversations
              </h3>
              <Button
                size="sm"
                variant="link"
                className="h-8 w-8 p-0 bg-indigo-600! text-neutral-100"
                onClick={() => setIsNewChatOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {chats.map((conv) => (
                <Button
                  key={conv.id}
                  variant="link"
                  className="w-full justify-start text-left text-sm bg-indigo-600! text-neutral-100 hover:no-underline hover:bg-indigo-500!"
                  onClick={() => {
                    setActiveChat(conv.id);
                    setCurrentView('chat');
                  }}
                >
                  <Bot className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{conv.modelType + " - " + conv.createdAt.toLocaleString()}</span>
                </Button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-fuchsia-200 hover:text-fuchsia-400 hover:no-underline font-semibold"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* New Chat Modal */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Select a bot to start chatting with
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {bots.length > 0 ? (
              bots.map((bot) => (
                <Button
                  key={bot.id}
                  variant="link"
                  className={clsx("w-full justify-start h-auto py-2 bg-indigo-600! text-neutral-100 hover:no-underline hover:bg-indigo-500!", selectedBot === bot.id && 'bg-neutral-800! text-white!')}
                  onClick={() => setSelectedBot(bot.id)}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{bot.modelType}</span>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center">Loading bots...</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsNewChatOpen(false);
                setSelectedBot(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNewChat} 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Start Chat'}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-h-screen">
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4 bg-transparent! hover:bg-neutral-200 text-black hover:no-underline!"
          >
            {isSidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          <h3 className="text-lg font-semibold">
            {currentView === 'chat' ? activeConvTitle : 'Edit Profile'}
          </h3>
        </div>

        {/* Content Switcher */}
        {currentView === 'chat' ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isChatLoading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <LoaderCircle className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.createdAt?.toString() ?? index} // Use index as fallback key
                    className={`flex ${
                      msg.senderType === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Container for bubble + timestamp */}
                    <div
                      className={`flex flex-col ${
                        msg.senderType === 'user'
                          ? 'items-end'
                          : 'items-start'
                      }`}
                    >
                      {/* The bubble with arrow */}
                      <div
                        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                          msg.senderType === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none' // Arrow for user
                            : 'bg-gray-200 text-gray-800 rounded-bl-none' // Arrow for bot
                        }`}
                      >
                        {msg.content}
                      </div>
                      {/* Timestamp */}
                      {msg.createdAt && (
                        <span className="text-xs text-gray-500 mt-1">
                          {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
               {isChatLoading && messages.length > 0 && (
                 <div className="flex justify-start">
                    <LoaderCircle className="h-5 w-5 animate-spin text-gray-500" />
                 </div>
               )}
            </div>
            <div className="bg-white border-t border-gray-200 p-4">
              <Form {...messageForm}>
                <form
                  onSubmit={messageForm.handleSubmit(onMessageSubmit)}
                  className="flex items-center space-x-2"
                >
                  <FormField
                    control={messageForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Type your message... (max 128 chars)"
                            {...field}
                            disabled={!activeChat || isChatLoading}
                            onKeyDown={(e) => {
                              // Submit on Enter, but allow Shift+Enter for newline
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                messageForm.handleSubmit(onMessageSubmit)();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs absolute" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={!activeChat || isChatLoading}
                  >
                    {isChatLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </>) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your name and email address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onProfileSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                         <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}