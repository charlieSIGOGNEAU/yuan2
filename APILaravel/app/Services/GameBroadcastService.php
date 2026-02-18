<?php

namespace App\Services;

use App\Models\Game;
use App\Models\GameUser;
use App\Http\Resources\GameResource;
use App\Events\UserBroadcast;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class GameBroadcastService
{
    public function gamebroadcastGameDetails(Game $game): void
    {
        $game->refresh()->load(['tiles', 'clans', 'gameUsers', 'actions', 'biddings']);

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

    public function userBroadcastGameDetails(User $user, Game $game): void
    {
        $game->refresh()->load(['tiles', 'clans', 'gameUsers', 'actions', 'biddings']);

        UserBroadcast::dispatch($user->id, [
            'type' => 'game_details',
            'game' => new GameResource($game),
            'my_game_user_id' => $game->gameUsers->firstWhere('user_id', $user->id)->id
        ]);
    }

    public function gameBroadcastReadyToPlay(Game $game): void
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
    
    public function userBroadcastReadyToPlay(User $user, Game $game): void
    {
        UserBroadcast::dispatch($user->id, [
                'type'                  => 'ready_to_play',
                'game_id'               => $game->id,
                'already_confirmation'  => (bool)$user->player_ready,
                'waiting_players_count' => $game->waiting_players_count,
                'custom_code'           => $game->custom_code,
            ]);
    }

    public function gameBroadcastWaitingForPlayers(Game $game): void
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
    public function userBroadcastWaitingForPlayers(User $user, Game $game): void
    {
        $gameUsers = $game->gameUsers()->where('abandoned', false)->get();
        $waitingCount = $gameUsers->count();

        UserBroadcast::dispatch($user->id, [
            'i_am_creator'          => $gameUser->user_id === $game->creator_id,
            'type'                  => 'waiting_for_players',
            'game_id'               => $game->id,
            'waiting_players_count' => $waitingCount,
            'custom_code'           => $game->custom_code,
        ]);

    }



    public function userBroadcastPlayerDestroyed(Game $game, int $userId): void
    {
        UserBroadcast::dispatch($userId, [
            'type' => 'player_destroyed',
            'game_id' => $game->id,
        ]);
    }
    
    public function userBroadcastWaitingForOthers(User $user, Game $game): void
    {
        UserBroadcast::dispatch($user->id, [
            'type' => 'waiting_for_others',
            'game_id' => $game->id,
            'message' => 'En attente des autres joueurs...'
        ]);
    }

    public function userBroadcastGameWon(GameUser $gameUser): void
    {
        UserBroadcast::dispatch($gameUser->user_id, [
            'type' => 'game_won',
            'game_id' => $gameUser->game_id,
            'game_user_id' => $gameUser->id,
            'message' => 'Félicitations ! Vous avez gagné la partie par abandon des autres joueurs'
        ]);
        
    }

    public function userBroadcastGameDestroyed(User $user): void
    {
        UserBroadcast::dispatch($user->id, [
            'type' => 'game_destroyed',
        ]);
    }

    public function userBroadcastPlayerAbandoned(Game $game, GameUser $oneGameUser): void
    {
        $gameUsers = $game->gameUsers()->where('abandoned', false)->get();
        $gameUsers->each(function ($gameUser) use ($oneGameUser) {
            UserBroadcast::dispatch($gameUser->user_id, [
                'type' => 'player_abandoned',
                'game_user_id' => $oneGameUser->id,
            ]);
        });
    }
}