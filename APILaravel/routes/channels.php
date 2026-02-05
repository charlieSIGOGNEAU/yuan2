<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user_{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
}, ['guards' => ['api']]);
