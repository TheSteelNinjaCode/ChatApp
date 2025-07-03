<?php

use Lib\PHPX\PPIcons\{Moon, Plus, Search, SendHorizontal, Settings};
?>

<div class="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Sidebar -->
    <div class="w-80 flex flex-col border-r border-slate-200 bg-white/80 backdrop-blur-sm">
        <!-- Top: Header & Search -->
        <div class="p-4 border-b border-slate-200">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ChatApp</h1>
                <div class="flex items-center gap-2">
                    <button class="h-8 w-8 rounded hover:bg-slate-200 flex items-center justify-center" onclick="toggleDark()">
                        <Moon class="size-5 {{ isDark ? 'text-yellow-400' : 'text-slate-500' }}" />
                    </button>
                    <button class="h-8 w-8 rounded hover:bg-slate-200 flex items-center justify-center">
                        <Settings class="size-5 text-slate-500" />
                    </button>
                </div>
            </div>
            <div class="relative">
                <input
                    type="search"
                    placeholder="Search conversations…"
                    class="pl-10 w-full py-2 rounded border border-slate-200 bg-slate-50"
                    pp-bind-value="search"
                    oninput="setSearch(this.value)" />
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            </div>
        </div>

        <!-- Middle: Conversations grow to fill -->
        <div class="flex-1 p-2 space-y-2 overflow-y-auto">
            <template pp-for="chat in filteredChats">
                <div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-100 {{ selectedChat.id === chat.id ? 'bg-blue-50 border border-blue-200' : '' }}" onclick="selectChat(chat)">
                    <div class="relative">
                        <img src="https://placehold.co/40" class="h-12 w-12 rounded-full" />
                        <div pp-if="chat.type === 'private'" class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white {{ getStatusColor(chat.participants[0]?.status) }}"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center">
                            <h3 class="font-semibold truncate">{{ chat.name }}</h3>
                            <span pp-if="chat.unreadCount > 0" class="ml-auto bg-blue-500 text-white text-xs px-2 rounded">{{ chat.unreadCount }}</span>
                        </div>
                        <p class="text-sm text-slate-500 truncate">{{ chat.messages[chat.messages.length-1]?.content || 'No messages yet' }}</p>
                        <p pp-if="chat.type === 'group'" class="text-xs text-slate-400">{{ chat.participants.length }} members</p>
                    </div>
                </div>
            </template>
        </div>

        <!-- Bottom: New Chat always stays same height -->
        <div class="p-4 border-t border-slate-200 bg-white/80">
            <button class="w-full h-[42px] px-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center justify-center gap-2">
                <Plus class="size-5" /> New Chat
            </button>
        </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col bg-white/80 backdrop-blur-sm">
        <!-- Header -->
        <div class="p-4 border-b border-slate-200">
            <div class="flex items-center gap-3">
                <img src="https://placehold.co/40" class="h-10 w-10 rounded-full" />
                <div>
                    <h2 class="font-semibold" pp-bind="selectedChat.name"></h2>
                    <p class="text-sm text-slate-500">{{ selectedChat.type === 'private' ? (selectedChat.participants[0]?.status + (selectedChat.participants[0]?.status === 'offline' ? ' ' + selectedChat.participants[0]?.lastSeen : '')) : selectedChat.participants.length + ' members' }}</p>
                </div>
            </div>
        </div>

        <!-- Messages (grows to fill) -->
        <div class="flex-1 p-4 overflow-y-auto space-y-4" id="chatMessages">
            <template pp-for="msg in selectedChat.messages">
                <div class="flex gap-3 {{ msg.senderId === 'me' ? 'justify-end' : 'justify-start' }}">
                    <img pp-if="msg.senderId !== 'me'"
                        pp-bind-src="selectedChat.participants.find(p => p.id === msg.senderId)?.avatar || 'https://placehold.co/40'"
                        class="h-8 w-8 rounded-full" />
                    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm {{ msg.senderId === 'me' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md' 
                            : 'bg-white text-slate-900 rounded-bl-md border border-slate-200' }}">
                        <p class="text-sm">{{ msg.content }}</p>
                        <p class="text-xs mt-1 {{ msg.senderId === 'me' ? 'text-blue-100' : 'text-slate-500' }}">
                            {{ formatTime(msg.timestamp) }}
                        </p>
                    </div>
                </div>
            </template>
        </div>

        <!-- Chat input always stays at bottom -->
        <div class="p-4 border-t border-slate-200 bg-white/80">
            <div class="flex items-center gap-3">
                <input oninput="setMessage(this.value)"
                    value="{{ message }}"
                    type="text"
                    placeholder="Type a message..."
                    class="flex-1 py-2 px-4 rounded-full border border-slate-200 bg-slate-50"
                    onkeypress="if(event.key === 'Enter') sendMessage()" />
                <button onclick="sendMessage()"
                    class="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center">
                    <SendHorizontal class="size-4" />
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    const [search, setSearch] = pphp.state('');
    const [chats, setChats] = pphp.state([]);
    const [filteredChats, setFiltered] = pphp.state([]);
    const [selectedChat, setSelectedChat] = pphp.state(null);
    const [message, setMessage] = pphp.state('');
    const [isDark, setIsDark] = pphp.state(false);

    const users = [{
            id: "1",
            name: "Alice Johnson",
            avatar: "https://placehold.co/40",
            status: "online"
        },
        {
            id: "2",
            name: "Bob Smith",
            avatar: "https://placehold.co/40",
            status: "away"
        },
        {
            id: "3",
            name: "Carol Davis",
            avatar: "https://placehold.co/40",
            status: "online"
        },
        {
            id: "4",
            name: "David Wilson",
            avatar: "https://placehold.co/40",
            status: "offline",
            lastSeen: "2 hours ago"
        }
    ]

    setChats([{
            id: "1",
            name: "Alice Johnson",
            type: "private",
            participants: [users[0]],
            unreadCount: 2,
            messages: [{
                    id: "1",
                    senderId: "1",
                    content: "Hey! How are you doing?",
                    timestamp: new Date(Date.now() - 300000)
                },
                {
                    id: "2",
                    senderId: "me",
                    content: "I'm doing great! Just working on some new projects.",
                    timestamp: new Date(Date.now() - 240000)
                },
                {
                    id: "3",
                    senderId: "1",
                    content: "That sounds exciting! What kind of projects?",
                    timestamp: new Date(Date.now() - 180000)
                }
            ]
        },
        {
            id: "2",
            name: "Design Team",
            type: "group",
            participants: [users[1], users[2], users[3]],
            unreadCount: 5,
            messages: [{
                    id: "4",
                    senderId: "2",
                    content: "The new mockups look amazing!",
                    timestamp: new Date(Date.now() - 120000)
                },
                {
                    id: "5",
                    senderId: "3",
                    content: "Thanks! I spent a lot of time on the color scheme.",
                    timestamp: new Date(Date.now() - 60000)
                },
            ]
        },
        {
            id: "3",
            name: "Bob Smith",
            type: "private",
            participants: [users[1]],
            unreadCount: 0,
            messages: [{
                    id: "6",
                    senderId: "2",
                    content: "Can we schedule a meeting for tomorrow?",
                    timestamp: new Date(Date.now() - 3600000)
                },
                {
                    id: "7",
                    senderId: "me",
                    content: "What time works for you?",
                    timestamp: new Date(Date.now() - 3540000)
                },
            ]
        },
        {
            id: "4",
            name: "David Wilson",
            type: "private",
            participants: [users[3]],
            unreadCount: 1,
            messages: [{
                    id: "8",
                    senderId: "4",
                    content: "Hey, are you there?",
                    timestamp: new Date(Date.now() - 120000)
                },
                {
                    id: "9",
                    senderId: "me",
                    content: "Yes, I'm here! What's up?",
                    timestamp: new Date(Date.now() - 60000)
                },
            ]
        }
    ]);

    setSelectedChat(chats[0]);

    export function selectChat(chat) {
        setSelectedChat(chats.find(c => c.id === chat.id) || null);
    }

    export function sendMessage() {
        const selectedChatValue = selectedChat.value;
        const messageValue = message.value;
        if (!messageValue.trim() || !selectedChatValue) return;
        const newMsg = {
            id: Date.now() + "",
            senderId: "me",
            content: messageValue,
            timestamp: new Date()
        };
        setSelectedChat({
            ...selectedChatValue,
            messages: [...selectedChatValue.messages, newMsg]
        });
        setChats(chats.value.map(chat =>
            chat.id === selectedChatValue.id ? {
                ...chat,
                messages: [...chat.messages, newMsg]
            } :
            chat
        ));
        setMessage('');
    }

    export function toggleDark() {
        setIsDark(!isDark.value);
        document.documentElement.classList.toggle('dark', isDark.value);
    }

    export function formatTime(date) {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    export function getStatusColor(status) {
        return status === "online" ? "bg-green-500" :
            status === "away" ? "bg-yellow-500" :
            "bg-gray-400";
    }

    pphp.effect(() => {
        const term = search.value.trim().toLowerCase()

        if (!term) {
            setFiltered(chats.value)
            return
        }

        setFiltered(
            chats.value.filter(chat =>
                chat.name.toLowerCase().includes(term) ||
                chat.participants.some(p =>
                    p.name.toLowerCase().includes(term)
                )
            )
        )
    }, [search, chats])

    pphp.effect(() => {
        console.log('Selected chat changed:', selectedChat)
        setTimeout(() => {
            document.getElementById('chatMessages')?.scrollTo({
                top: 99999,
                behavior: "smooth"
            });
        }, 50)

    }, [selectedChat])

    pphp.debugProps();
</script>