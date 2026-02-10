<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GameUser;
use App\Http\Resources\GameResource;

namespace App\Services;

use App\Models\Game;
use App\Events\UserBroadcast;
use App\Http\Resources\GameResource;

class GameBroadcastService
{
    public function broadcastGameDetails(Game $game)
    {
        // On charge les relations manquantes directement sur l'objet existant
        // C'est l'équivalent du "with" mais pour un objet déjà créé.
        $game->load(['tiles', 'clans', 'gameUsers', 'actions', 'biddings']);

        foreach ($game->gameUsers as $gameUser) {
            if ($gameUser->abandoned) {
                continue;
            }

            UserBroadcast::dispatch($gameUser->user_id, [
                'type' => 'game_details',
                'game' => new GameResource($game),
                'my_game_user_id' => $gameUser->id
            ]);
        }
    }

    public function gameBroadcastReadyToPlay(Game $game)
    {
        $gameUsers = $game->gameUsers()->where('abandoned', false)->get();
        
        foreach ($gameUsers as $gameUser) {
            UserBroadcast::dispatch($gameUser->user_id, [
                'type'                  => 'ready_to_play',
                'game_id'               => $game->id,
                'already_confirmation'  => (bool)$gameUser->player_ready,
                'waiting_players_count' => $game->waiting_players_count,
                'custom_code'           => $game->custom_code,
            ]);
        }
    }

    public function gameBroadcastWaitingForPlayers(Game $game)
    {
        $gameUsers = $game->gameUsers()->where('abandoned', false)->get();
        $waitingCount = $gameUsers->count();

        foreach ($gameUsers as $gameUser) {
            UserBroadcast::dispatch($gameUser->user_id, [
                'i_am_creator'          => $gameUser->user_id === $game->creator_id,
                'type'                  => 'waiting_for_players',
                'game_id'               => $game->id,
                'waiting_players_count' => $waitingCount,
                'custom_code'           => $game->custom_code,
            ]);
        }
    }

    public function userBroadcastGameDetails(User $user, Game $game)
    {
        $game->load(['tiles', 'clans', 'gameUsers', 'actions', 'biddings']);

        UserBroadcast::dispatch($user->id, [
            'type' => 'game_details',
            'game' => new GameResource($game),
            'my_game_user_id' => $game->gameUsers->firstWhere('user_id', $user->id)->id
        ]);
    }


     
}