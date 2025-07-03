<div class="grid place-items-center w-screen h-screen">
    <div class="space-y-2">
        <ul id="messages" class="max-h-96 overflow-y-scroll p-4 list-disc space-y-2">
            <!-- Messages will be appended here -->
        </ul>
        <form id="messageForm" class="flex flex-col gap-2">
            <label id="userId">User ID</label>
            <input class="border rounded-lg p-3" type="text" id="recipientInput" placeholder="Recipient ID..." />
            <div>
                <input class="border rounded-lg p-3" type="text" id="messageInput" placeholder="Type a message..." />
                <button type="submit" class="p-3 border bg-blue-500 rounded-lg text-white">Send</button>
            </div>
        </form>
    </div>
</div>

<script>
    let userId = null; // Variable to store the client's ID

    ws.onopen = function(event) {
        console.log("Connected to the WebSocket server");
    };

    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "init":
                    userId = data.senderId.toString(); // Ensuring userId is a string
                    console.log(`User ID set to ${userId}`);
                    document.getElementById('userId').textContent = `User ID: ${userId}`;
                    break;
                case "broadcast":
                    displayMessage(data.message, 'received', data.senderId);
                    break;
                case "private":
                    if (data.recipientId && data.recipientId.toString() === userId) {
                        displayMessage(data.message, 'received', data.senderId);
                    }
                    break;
                default:
                    console.log("Unhandled message type.");
            }
        } catch (e) {
            console.error("Error parsing JSON data:", e.message);
            displayMessage(event.data, 'received', "Error");
        }
    };

    function displayMessage(message, type, senderId = "System") {
        const messages = document.getElementById('messages');
        const messageElement = document.createElement('li');
        let textContent = type === 'received' ? `From ${senderId}: ${message}` : `You: ${message}`;
        messageElement.textContent = textContent;
        messageElement.className = type === 'sent' ? 'bg-green-500 text-white p-2 rounded-lg' : 'bg-blue-500 text-white p-2   rounded-lg';
        messages.appendChild(messageElement);

        messages.scrollTop = messages.scrollHeight; // Scroll to the bottom of the messages
    }

    document.getElementById('messageForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const recipientInput = document.getElementById('recipientInput').value.trim();
        const messageInput = document.getElementById('messageInput').value.trim();

        if (!messageInput) return; // Prevent sending empty messages

        const messageType = recipientInput ? 'private' : 'broadcast';
        const messagePayload = JSON.stringify({
            recipientId: recipientInput,
            message: messageInput,
            type: messageType
        });

        ws.send(messagePayload);
        displayMessage(messageInput, 'sent');
        document.getElementById('messageInput').value = ''; // Clear input field after sending
    });
</script>