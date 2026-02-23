<?php

namespace App\Actions\Games;

use App\Models\Game;
use App\Models\GameUser;
use App\Enums\GameStatus;
use App\Enums\GameType;
use Illuminate\Support\Facades\DB;

class LaunchCustomGame
{
    public function __invoke(Game $game, GameUser $gameUser, int $duration): array
    {
        return DB::transaction(function () use ($game, $gameUser, $duration) {
            $customGameId = $game->id;
            $quickGame = Game::where('game_status', GameStatus::WAITING_FOR_PLAYERS)->where('game_type', GameType::QUICK_GAME)->first();
            if ($quickGame !== null) {
                $gameMinId = min($customGameId, $quickGame->id);

                // Je lock les 2 games pour éviter les "race conditions", par ID croissant par convention, afin d'éviter un potentiel "deadlock" futur
                if ($gameMinId === $customGameId) {
                    Game::where('id', $customGameId)->lockForUpdate()->first();
                    $quickGame = Game::where('id', $quickGame->id)->lockForUpdate()->first();
                } else {
                    $quickGame = Game::where('id', $quickGame->id)->lockForUpdate()->first();
                    Game::where('id', $customGameId)->lockForUpdate()->first();
                }
            } else {
                Game::where('id', $customGameId)->lockForUpdate()->first();
            }
            $game->refresh();
            if ($game->game_status !== GameStatus::WAITING_FOR_PLAYERS) {
                return ['game' => $game, 'message' => 'part already launched'];
            }
            if ($quickGame !== null) {
                $this->reassignPlayers($game, $quickGame);
            }
            $game->update([
                'game_status' => GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS,
                'player_count' => $game->gameUsers()->count(),
                'waiting_players_count' => $game->gameUsers()->count(),
                'turn_duration' => max($duration, 20),
            ]);
            $gameUser->update(['player_ready' => true]);
            return ['game' => $game, 'message' => 'go ready to play'];
        });
    }

    // toujours dans la transaction
    private function reassignPlayers(Game $game, Game $quickGame) {
        $placeAvailable = Game::MAX_PLAYERS - $game->waiting_players_count;
        if ($placeAvailable > 0) {
            $numPlayersToMove = min($placeAvailable, $quickGame->waiting_players_count);
            $quickGame->decrement('waiting_players_count', $numPlayersToMove);
            // pas d'incrementation  car apres on doit faire 'waiting_players_count' => $game->gameUsers()->count(),
            
            // je récupère les IDs des joueurs à déplacer
            $playerIdsToMove = $quickGame->gameUsers()
                ->limit($numPlayersToMove)
                ->pluck('id');

            // je fait les updates en une requete
            $quickGame->gameUsers()->whereIn('id', $playerIdsToMove)->update([
                'game_id' => $game->id
            ]);
        }
    }
}
        