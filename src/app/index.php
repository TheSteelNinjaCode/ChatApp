<div class="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Sidebar -->
    <div id="sidebar" class="w-80 border-r bg-white/80 backdrop-blur-sm">
        <div class="p-4 border-b border-slate-200">
            <div class="flex items-center justify-between mb-4">
                <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ChatApp</h1>
                <div class="flex items-center gap-2">
                    <button id="toggleDark" class="h-8 w-8 rounded hover:bg-slate-200 flex items-center justify-center">
                        <svg id="sunIcon" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m8-8h1M3 12H2m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l.707.707M6.343 6.343l.707.707M12 8a4 4 0 110 8 4 4 0 010-8z" />
                        </svg>
                        <svg id="moonIcon" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 0010 9.79z" />
                        </svg>
                    </button>
                    <button class="h-8 w-8 rounded hover:bg-slate-200 flex items-center justify-center">
                        ⚙️
                    </button>
                </div>
            </div>
            <div class="relative">
                <input placeholder="Search conversations..." class="pl-10 w-full py-2 rounded border border-slate-200 bg-slate-50" />
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M15 11a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </div>
        </div>
        <div id="chatList" class="p-2 space-y-2 overflow-y-auto h-[calc(100vh-256px)]"></div>
        <div class="p-4 border-t border-slate-200">
            <button class="w-full py-2 rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center justify-center gap-2">
                ➕ New Chat
            </button>
        </div>
    </div>

    <!-- Main Chat Area -->
    <!-- <div id="mainChat" class="flex-1 flex flex-col"></div> -->
    <div class="flex-1 flex flex-col">
        <template pp-for="mainChat in mainChats">
            <div id="mainChat" class="flex-1 flex flex-col bg-white/80 backdrop-blur-sm">
                <div class="p-4 border-b border-slate-200">
                    <div class="flex items-center">
                        <img src="mainChat.participants[0].avatar" alt="mainChat.participants[0].name" class="h-10 w-10 rounded-full mr-2" />
                        <div>
                            <h2 class="text-lg font-semibold">{{ mainChat.name }}</h2>
                            <p class="text-sm text-slate-500">{{ mainChat.lastMessage }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</div>

<script>
    // Chat data
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
    const [chats, setChats] = pphp.state([{
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
        }
    ]);

    let selectedChat = chats[0]
    let isDark = false

    // DOM refs
    const chatListEl = document.getElementById('chatList')
    const mainChatEl = document.getElementById('mainChat')
    const sidebarEl = document.getElementById('sidebar')
    const toggleDarkBtn = document.getElementById('toggleDark')
    const sunIcon = document.getElementById('sunIcon')
    const moonIcon = document.getElementById('moonIcon')

    const [mainChats, setMainChats] = pphp.state(chats);

    function formatTime(date) {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    export function getStatusColor(status) {
        return status === "online" ? "bg-green-500" : status === "away" ? "bg-yellow-500" : "bg-gray-400"
    }

    export function renderChatList() {
        chatListEl.innerHTML = ""
        chats.forEach(chat => {
            const isSelected = selectedChat && selectedChat.id === chat.id
            const lastMsg = chat.messages[chat.messages.length - 1]?.content || "No messages yet"
            const badge = chat.unreadCount > 0 ? `<span class="ml-auto bg-blue-500 text-white text-xs px-2 rounded">${chat.unreadCount}</span>` : ""
            const group = chat.type === "group" ? `<p class="text-xs text-slate-400">${chat.participants.length} members</p>` : ""
            chatListEl.innerHTML += `
      <div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-100'}"
           onclick="selectChat('${chat.id}')">
        <div class="relative">
          <img src="${chat.avatar || chat.participants[0].avatar}" class="h-12 w-12 rounded-full" />
          ${chat.type === "private" ? `<div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(chat.participants[0].status)}"></div>` : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center">
            <h3 class="font-semibold truncate">${chat.name}</h3>
            ${badge}
          </div>
          <p class="text-sm text-slate-500 truncate">${lastMsg}</p>
          ${group}
        </div>
      </div>`
        })
    }

    export function selectChat(chatId) {
        selectedChat = chats.find(c => c.id === chatId)
        renderChatList()
        renderMainChat()
    }

    function renderMainChat() {
        if (!selectedChat) {
            mainChatEl.innerHTML = `<div class="flex-1 flex items-center justify-center"><h3 class="text-xl">Select a conversation to start chatting</h3></div>`
            return
        }
        const header = selectedChat.type === "private" ?
            `${selectedChat.participants[0].status}${selectedChat.participants[0].status==="offline"?" "+(selectedChat.participants[0].lastSeen||""):""}` :
            `${selectedChat.participants.length} members`
        const messages = selectedChat.messages.map(msg => {
            const isMe = msg.senderId === "me"
            const user = selectedChat.participants.find(p => p.id === msg.senderId)
            return `<div class="flex gap-3 ${isMe?'justify-end':'justify-start'}">
        ${!isMe? `<img src="${user?.avatar||'https://placehold.co/40'}" class="h-8 w-8 rounded-full" />`:""}
        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${isMe?'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md':'bg-white text-slate-900 rounded-bl-md border border-slate-200'}">
          <p class="text-sm">${msg.content}</p>
          <p class="text-xs mt-1 ${isMe?'text-blue-100':'text-slate-500'}">${formatTime(msg.timestamp)}</p>
        </div>
      </div>`
        }).join("")
        mainChatEl.innerHTML = `
      <div class="p-4 border-b bg-white/80">
        <div class="flex items-center gap-3">
          <img src="${selectedChat.avatar || selectedChat.participants[0].avatar}" class="h-10 w-10 rounded-full" />
          <div>
            <h2 class="font-semibold">${selectedChat.name}</h2>
            <p class="text-sm text-slate-500">${header}</p>
          </div>
        </div>
      </div>
      <div id="chatMessages" class="flex-1 p-4 overflow-y-auto space-y-4">${messages}</div>
      <div class="p-4 border-t bg-white/80">
        <div class="flex items-center gap-3">
          <input id="msgInput" type="text" placeholder="Type a message..." class="flex-1 py-2 px-4 rounded-full border bg-slate-50" onkeydown="if(event.key==='Enter') sendMessage()"/>
          <button onclick="sendMessage()" class="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center">➡️</button>
        </div>
      </div>`
        scrollToBottom()
    }

    export function sendMessage() {
        const input = document.getElementById('msgInput')
        const text = input.value.trim()
        if (!text) return
        selectedChat.messages.push({
            id: Date.now() + "",
            senderId: "me",
            content: text,
            timestamp: new Date()
        })
        input.value = ""
        renderMainChat()
    }

    export function scrollToBottom() {
        setTimeout(() => {
            const chatMessages = document.getElementById('chatMessages')
            chatMessages?.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: "smooth"
            })
        }, 50)
    }

    toggleDarkBtn.onclick = () => {
        isDark = !isDark
        document.documentElement.classList.toggle('dark', isDark)
        sidebarEl.classList.toggle('bg-slate-900/80', isDark)
        mainChatEl.classList.toggle('bg-slate-900/80', isDark)
        sunIcon.classList.toggle('hidden', !isDark)
        moonIcon.classList.toggle('hidden', isDark)
        renderChatList()
        renderMainChat()
    }

    renderChatList()
    // renderMainChat()
</script>