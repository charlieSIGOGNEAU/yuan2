<?php

namespace App\Actions\Games;

use App\Models\Game;
use App\Models\GameUser;
use App\Models\GameStatus;
use App\Models\GameType;
use Illuminate\Support\Facades\DB;

class GiveUpGame
{
    /**
     * Exécute la logique d'abandon de la partie mais uniquement avant qu'elle ai commencé
     */
    public function __invoke(Game $game, GameUser $gameUser): array
    {
        return DB::transaction(function () use ($game, $gameUser) {
            $game->lockForUpdate()->refresh();
            
            if ($game->game_status !== GameStatus::WAITING_FOR_PLAYERS && $game->game_status !== GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
                return ['message' => 'action not allowed at this stage'];
            }

            $deleted = GameUser::where('id', $gameUser->id)->delete();

            if (!$deleted) {
                return ['message' => 'already processed'];
            }

            $game->decrement('waiting_players_count');
            $game->refresh();

            if ($game->waiting_players_count === 0) {
                $game->delete();
                return ['message' => 'game destroyed'];
            }

            $readyCount = $game->gameUsers()->where('player_ready', true)->count();

            if ($readyCount === $game->waiting_players_count && $game->waiting_players_count >= 2) {
                $game->player_count = $game->waiting_players_count;
                $game->save();
                
                $game->startInstallationPhase(); 
                
                return ['message' => 'player give up and game ready installation_phase'];
            }

            if ($game->game_status === GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS && $readyCount < 2) {
                $game->game_status = GameStatus::WAITING_FOR_PLAYERS;
                $game->save();
                
                return ['message' => 'player give up and game waiting for players'];
            }

            return ['message' => 'player give up'];
        });
    }
}
