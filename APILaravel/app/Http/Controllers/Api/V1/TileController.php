<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tile;
use App\Models\Game;
use App\Http\Requests\GameMemberRequest;
use App\Services\GameBroadcastService;
use App\Enums\GameStatus; // Assure-toi d'avoir cet Enum
use Illuminate\Http\Request;
use App\Actions\Tiles\PlaceTileAction;

class TileController extends Controller
{
    public function place(GameMemberRequest $request, Game $game, Tile $tile, PlaceTileAction $placeTileAction, GameBroadcastService $broadcastService) {
        $gameUser = $request->gameUser;

        if ($tile->game_user_id !== $gameUser->id) {
            return response()->json(['success' => false, 'error' => 'Interdit'], 403);
        }

        $placeTileAction($game, $tile, $request->all(), $request->boolean('is_last_tile'));

        $broadcastService->gameBroadcastGameDetails($game);

        return response()->json(['success' => true, 'tile' => $tile->fresh()]);
    }
}