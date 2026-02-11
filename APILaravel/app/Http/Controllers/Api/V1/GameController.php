<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Actions\Games\JoinOrCreateGame;
use App\Actions\Games\CreateCustomGame;
use App\Actions\Games\JoinCustomGame;
use App\Actions\Games\LaunchCustomGame;
use App\Services\GameBroadcastService;
use App\Models\Game;
use App\Http\Requests\GameMemberRequest;

class GameController extends Controller
{
    public function quickGame(Request $request, JoinOrCreateGame $joinOrCreateGame, GameBroadcastService $gameBroadcastService)
    {
        $result = $joinOrCreateGame($request->user());

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

    public function createCustomGame(Request $request, CreateCustomGame $createCustomGame, GameBroadcastService $gameBroadcastService)
    {
        try {
            if (!$result = $createCustomGame($request->user())){
                throw new \Exception('Erreur lors de la création ou de l\'accès à la partie');
            }
            $message = $result['message'];
            $game = $result['game'];
            $gameUser = $result['game_user'];
            $customCode = $game->custom_code;
            $waitingPlayersCount = $game->waiting_players_count;
            
            switch ($message) {
                case 'ongoing game':
                    $gameBroadcastService->userBroadcastGameDetails($request->user(), $game);
                    return response()->json([
                        'success' => false,
                        'message' => 'You are already in a game',
                        'game_id' => $game->id,
                        'game_user_id' => $gameUser->id,
                        'custom_code' => $customCode,
                        'waiting_players_count' => $waitingPlayersCount
                    ], 200);
                
                case 'new game':
                    $gameBroadcastService->gameBroadcastWaitingForPlayers($game);
                    return response()->json([
                        'success' => true,
                        'game_id' => $game->id,
                        'game_user_id' => $gameUser->id,
                        'custom_code' => $customCode,
                        'waiting_players_count' => $waitingPlayersCount
                    ], 200);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function joinCustomGame(Request $request, JoinCustomGame $joinCustomGame, GameBroadcastService $gameBroadcastService)
    {
        $result = $joinCustomGame($request->user(), $request->custom_code);
        $message = $result['message'];

        switch ($message) {
            case 'ongoing game':
                $gameBroadcastService->gameBroadcastGameDetails($result['game']);
                return response()->json([
                    'success' => false,
                    'message' => 'You are already in a game',
                ], 200);
            
            case 'game not found':
                return response()->json([
                    'success' => false,
                    'message' => 'Game not found',
                ], 200);
            case 'joined game and waiting for other players':
            case 'joined game and game ready installation_phase':
                $gameBroadcastService->gameBroadcastWaitingForPlayers($result['game']);
                return response()->json([
                    'success' => true,
                    'game_id' => $result['game']->id,
                ], 200);            
            default:
                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 200);    
        }
    }
    
    public function launchCustomGame(GameMemberRequest $request, LaunchCustomGame $launchCustomGame, GameBroadcastService $gameBroadcastService)
    {
        $validated = $request->validate([
            'game_duration' => 'nullable|integer|min:30|max:600',
        ]);

        $user = $request->user();
        $game = Game::find($request->game_id); 

        if ($user->id !== $game->creator_id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the creator can launch the game',
            ], 200);
        }

        if ($game->game_status !== 'waiting_for_players') {
            return response()->json([
                'success' => false,
                'message' => 'Game not in waiting_for_players',
            ], 200);
        }

        $duration = $validated['game_duration'] ?? 120;
        $result = $launchCustomGame($game, $duration);

        if ($result['message'] !== 'go ready to play') {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 200);
        }

        $game->gameUsers()
            ->where('user_id', $user->id)
            ->update(['player_ready' => true]);

        $gameBroadcastService->gameBroadcastReadyToPlay($game);
        
        return response()->json([
            'success' => true,
            'game_id' => $game->id,
        ], 200);
    }

    public function iAmReady(GameMemberRequest $request, IAmReady $iAmReady, GameBroadcastService $gameBroadcastService)
    {
        $gameUser = $request->gameUser;
        $game = $request->game;
        
        $result = $iAmReady($gameUser, $game);
        $message = $result['message'];

        switch ($message) {
            case 'player ready and game full':
                $gameBroadcastService->gameBroadcastGameDetails($game);
                return response()->json([
                    'success' => true,
                    'message' => $message,
                ], 200);
            case 'player ready and game not full':
                $gameBroadcastService->gameBroadcastReadyToPlay($game);
                return response()->json([
                    'success' => true,
                    'message' => $message,
                ], 200);
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Game not in waiting_for_confirmation_players',
                ], 422);
        }
    }

    public function submitVictory(GameMemberRequest $request, SubmitVictory $submitVictory)
    {
        $validated = $request->validate([
            'rankings' => 'required|array',
        ]);

        $user = $request->user();
        $gameUser = $request->gameUser;
        $game = $request->game;

        $result = $submitVictory($game, $user, $validated['rankings']);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    public function startGameAfterDelay(Request $request, StartGameAfterDelay $startGameAfterDelay, GameBroadcastService $gameBroadcastService)
    {
        $validated = $request->validate([
            'game_id' => 'required|integer|exists:games,id',
        ]);

        $user = $request->user();
        $gameUser = $user->gameUsers()->where('game_id', $validated['game_id'])->first();

        if (!$gameUser) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a participant in this game.'
            ], 403);
        }
        
        $game = $gameUser->game;

        if ($game->game_status !== GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
            return response()->json([
                'success' => false,
                'message' => 'Game not in waiting_for_confirmation_players',
            ], 200);
        }

        $result = $startGameAfterDelay($game);
        $message = $result['message'];

        switch ($message) {
            case 'game ready installation_phase':
                $gameBroadcastService->gameBroadcastGameDetails($game);
                return response()->json([
                    'success' => true,
                    'message' => $message,
                ], 200);
            case 'missing player, waiting for player':
                $gameBroadcastService->gameBroadcastWaitingForPlayers($game);
                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 200);
            case 'game destroyed':
                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 200);
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Game not in waiting_for_confirmation_players',
                ], 422);
        }

    }
}