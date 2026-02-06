<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\Request;
use App\Services\GameService;
use App\Services\GameBroadcastService;
class GameController extends Controller
{
    public function quickGame(Request $request, GameService $gameService, GameBroadcastService $gameBroadcastService)
    {
        $result = $gameService->findOrCreateWaitingGame($request->user());

        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création ou de l\'accès à la partie'
            ], 422);
        }

        $game = $result['game'];
        $message = $result['message'];
        $gameUser = $result['game_user'];

        switch ($message) {
            case 'ongoing game':
                $gameBroadcastService->broadcastGameDetails($game);
                break;

            case 'game ready installation_phase': 
                $gameUser->update(['player_ready' => true]);
                $gameBroadcastService->gameBroadcastReadyToPlay($game);
                break;

            case 'waiting for players':
            case 'new game':
                $gameBroadcastService->gameBroadcastWaitingForPlayers($game);
                break;
        }

        return response()->json([
            'success' => true,
            'game_id' => $game->id,
        ], 200);
    }
}