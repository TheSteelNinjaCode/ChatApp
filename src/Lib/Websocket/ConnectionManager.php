<?php

namespace Lib\Websocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class ConnectionManager implements MessageComponentInterface
{
    protected $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(ConnectionInterface $conn)
    {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})";

        $welcomeMessage = json_encode([
            'type' => 'init',
            'message' => 'Welcome to the WebSocket server!',
            'senderId' => $conn->resourceId
        ]);
        $conn->send($welcomeMessage);
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        echo "New message from {$from->resourceId}!\n";
        echo "Message received: {$msg}";

        $data = json_decode($msg, true);
        $recipientId = isset($data['recipientId']) ? (string) $data['recipientId'] : null;
        $message = $data['message'] ?? '';

        if (!is_null($recipientId) && $recipientId !== "") {
            // Send to a specific recipient
            foreach ($this->clients as $client) {
                if ((string) $client->resourceId === $recipientId) {
                    $client->send(json_encode([
                        'senderId' => $from->resourceId,
                        'recipientId' => $recipientId,
                        'message' => $message,
                        'type' => 'private'
                    ]));
                    // Reflect to sender
                    $from->send(json_encode([
                        'message' => $message,
                        'type' => 'ack',
                        'status' => 'sent'
                    ]));
                    return;
                }
            }
            // If recipient not found, send error to sender
            $from->send(json_encode([
                'type' => 'error',
                'message' => 'Recipient not found',
                'status' => 'error'
            ]));
        } else {
            // Broadcast message to all clients except the sender
            foreach ($this->clients as $client) {
                if ($from !== $client) {
                    $client->send(json_encode([
                        'senderId' => $from->resourceId,
                        'message' => $message,
                        'type' => 'broadcast'
                    ]));
                }
            }
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected";
    }

    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}";
        $conn->close();
    }
}
