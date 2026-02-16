<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user_{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
}, ['guards' => ['api']]);

// use App\Models\Game;
// use App\Models\User;
// use App\Services\GameBroadcastService;
// use App\Services\Games\GameService;
// use App\Enums\GameStatus;
// use Illuminate\Support\Facades\Log;

// Broadcast::channel('user_{id}', function ($user, $id) {
//     if ((int) $user->id === (int) $id) {
        
//         // On récupère le gameUser actif (équivalent de ongoing_game)
//         $gameUser = $user->gameUsers()
//             ->where('abandoned', false)
//             ->first();

//         if ($gameUser) {
//             // On utilise dispatch(...)->afterResponse() pour ne pas bloquer 
//             // la réponse d'autorisation du WebSocket.
//             dispatch(function () use ($user, $gameUser) {
//                 sleep(2);
//                 $game = $gameUser->game;
//                 $service = app(GameBroadcastService::class);
//                 $status = $game->game_status;
//                 Log::info($game);
//                 Log::info($user);

//                 // On recrée ton switch Rails
//                 if ($status === GameStatus::WAITING_FOR_PLAYERS) {
//                     $service->userBroadcastWaitingForPlayers($user, $game);
//                     Log::info('Message informatif 1');
//                 } 
//                 elseif ($status === GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
//                     $service->userBroadcastReadyToPlay($user, $game);
//                     Log::info('Message informatif 2');
//                 } 
//                 else {
//                     // Pour toutes les phases de jeu (installation, bidding, etc.)
//                     $service->userBroadcastGameDetails($user, $game);
//                     Log::info('Message informatif 3');
//                 }
//             })->afterResponse();
//         }

//         return true;
//     }
//     return false;
// }, ['guards' => ['api']]);