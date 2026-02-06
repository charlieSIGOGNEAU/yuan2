<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public $data;
    public $userId;

    public function __construct($userId, $data)
    {
        $this->userId = $userId;
        $this->data = $data;
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('user_' . $this->userId);
    }

    public function broadcastAs(): string
    {
        // Nom de l'événement pour le front-end
        return 'message';
    }
}
