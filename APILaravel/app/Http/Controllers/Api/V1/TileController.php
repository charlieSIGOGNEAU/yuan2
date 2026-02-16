<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tile;
use App\Models\Game;
use App\Http\Requests\GameMemberRequest;
use App\Services\GameBroadcastService;
use App\Enums\GameStatus; // Assure-toi d'avoir cet Enum
use Illuminate\Http\Request;

class TileController extends Controller
{
    public function place(GameMemberRequest $request, Game $game, Tile $tile, GameBroadcastService $gameBroadcastService)
    {
        return response()->json(['ok' => true]);
        // 1. Récupération des objets déjà injectés/validés par le Request
        $game = $request->game;
        $gameUser = $request->gameUser;

        // 2. Vérifier que la tile appartient bien au joueur actuel
        // (Équivalent de tile.game_user_id != game_user.id)
        if ($tile->game_user_id !== $gameUser->id) {
            return response()->json([
                'success' => false, 
                'error' => 'Cette tile ne vous appartient pas'
            ], 403);
        }

        // 3. Mettre à jour la tile
        // Laravel utilise update() comme Rails
        $tile->update([
            'name'       => $request->name,
            'rotation'   => $request->rotation,
            'position_q' => $request->position_q,
            'position_r' => $request->position_r,
        ]);

        // 4. Vérifier si c'est la dernière tuile (is_last_tile)
        if ($request->boolean('is_last_tile')) {
            $this->checkAndAdvanceToInitialPlacement($game);
        }

        // 5. Broadcast (Comme tu as ton service, on l'utilise)
        $gameBroadcastService->gameBroadcastGameDetails($game);

        return response()->json([
            'success' => true,
            'tile' => $tile
        ]);
    }

    private function checkAndAdvanceToInitialPlacement(Game $game)
    {
        // Vérifier si toutes les tuiles du jeu ont un nom rempli
        $allTilesNamed = $game->tiles()->whereNull('name')->count() === 0;

        if ($allTilesNamed) {
            $game->update([
                'game_status' => GameStatus::INITIAL_PLACEMENT
            ]);
            
            // Log équivalent à Rails.logger.info
            \Log::info("Partie {$game->id} passée en phase initial_placement");
        }
    }
}