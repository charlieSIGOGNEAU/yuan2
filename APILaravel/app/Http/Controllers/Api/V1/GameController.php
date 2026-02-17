<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Actions\Games\JoinOrCreateGame;
use App\Actions\Games\CreateCustomGame;
use App\Actions\Games\JoinCustomGame;
use App\Actions\Games\LaunchCustomGame;
use App\Http\Requests\LaunchCustomGameRequest;
use App\Actions\Games\IAmReady;
use App\Actions\Games\GiveUpGame;
use App\Actions\Games\ForceEndTurnAction;
use App\Actions\Games\StartGameAfterDelay;
use App\Enums\Actions\Games\StartGameAfterDelayResult;
use App\Services\GameBroadcastService;
use App\Models\Game;
use App\Http\Requests\GameMemberRequest;
use App\Http\Requests\JoinGameRequest;
use App\Http\Requests\confirmationGameDetailRequest;
use App\Enums\GameStatus;

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

            case 'yes waiting for other players':
                // donc le brodcaste juste endessous est fait
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

    public function joinCustomGame(JoinGameRequest $request, JoinCustomGame $joinCustomGame, GameBroadcastService $gameBroadcastService)
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
    
    public function launchCustomGame(LaunchCustomGameRequest $request, LaunchCustomGame $launchCustomGame, GameBroadcastService $gameBroadcastService)
    {
        $user = $request->user();
        $game = $request->game;
        \Log::info('GAME', [$game]);
        \Log::info('USER', [$user]);

        if ($user->id !== $game->creator_id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the creator can launch the game',
            ], 200);
        }

        if ($game->game_status !== GameStatus::WAITING_FOR_PLAYERS) {
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

    public function startGameAfterDelay(GameMemberRequest $request, StartGameAfterDelay $startGameAfterDelay, GameBroadcastService $gameBroadcastService)
    {
        $game = $request->game;
        
        if ($game->game_status !== GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
            return response()->json([
                'success' => false,
                'message' => 'Game not in waiting_for_confirmation_players',
            ], 200);
        }

        $result = $startGameAfterDelay($game);
        $status = $result['status'];
        $userIdToDestroed = $result['userIdToDestroed'] ?? [];

        foreach ($userIdToDestroed as $userId) {
            $gameBroadcastService->userBroadcastPlayerDestroyed($game, $userId);
        }

        if ($status === StartGameAfterDelayResult::GAME_READY_INSTALLATION_PHASE) {
            $gameBroadcastService->gameBroadcastGameDetails($game);
        } elseif ($status === StartGameAfterDelayResult::MISSING_PLAYER) {
            $gameBroadcastService->gameBroadcastWaitingForPlayers($game);
        }

        $message = match ($status) {
            StartGameAfterDelayResult::GAME_READY_INSTALLATION_PHASE => 'game ready installation_phase',
            StartGameAfterDelayResult::MISSING_PLAYER => 'missing player, waiting for player',
            StartGameAfterDelayResult::WAITING_FOR_PLAYERS => 'waiting for players',
            StartGameAfterDelayResult::GAME_DESTROYED => 'game destroyed',
            StartGameAfterDelayResult::INVALID_STATUS => 'invalid status',
            StartGameAfterDelayResult::UNEXPIRED_TIMEOUT => 'unexpired timeout',
            default => 'unknown status',
        };

        return response()->json([
            'success' => in_array($status, [
                StartGameAfterDelayResult::GAME_READY_INSTALLATION_PHASE, 
                StartGameAfterDelayResult::MISSING_PLAYER
            ]),            
            'message' => $message,
        ], 200);
    }

    // abandon de la partie uniquement avant qu'elle ai commencé
    public function giveUpGame(GameMemberRequest $request, GiveUpGame $giveUpGame, GameBroadcastService $gameBroadcastService)
    {
        $game = $request->game;
        $gameUser = $request->gameUser;

        $result = $giveUpGame($game, $gameUser);
        $message = $result['message'];

        switch ($message) {
            case 'player give up':
                if ($game->game_status === GameStatus::WAITING_FOR_PLAYERS) {
                    $gameBroadcastService->gameBroadcastWaitingForPlayers($game);
                } else {
                    $gameBroadcastService->gameBroadcastReadyToPlay($game);
                }
                return response()->json(['success' => true, 'message' => 'Player give up']);

            case 'player give up and game ready installation_phase':
                $gameBroadcastService->gameBroadcastGameDetails($game);
                return response()->json(['success' => true, 'message' => $message]);

            case 'player give up and game waiting for players':
                $gameBroadcastService->gameBroadcastWaitingForPlayers($game);
                return response()->json(['success' => true, 'message' => $message]);

            default:
                return response()->json(['success' => false, 'message' => $message]);
        }
    }

    //   def confirm_game_details_reception a implementer

    public function forceEndTurn(confirmationGameDetailRequest $request, ForceEndTurnAction $forceEndTurnAction, GameBroadcastService $gameBroadcastService)
    {
        $game = $request->game;
        // in confirmationGameDetailRequest
        // if ($request->missing('simultaneous_play_turn')) {
        //     return response()->json(['success' => false, 'message' => 'Paramètre manquant'], 400);
        // }

        $turnParam = $request->integer('simultaneous_play_turn');

        if ($game->simultaneous_play_turn !== $turnParam) {
            return response()->json(['success' => false, 'message' => 'Le tour a déjà évolué'], 200);
        }

        if ($game->updated_at->gt(now()->subSeconds($game->turn_duration))) {
            return response()->json(['success' => false, 'message' => "Le temps n'est pas encore écoulé"], 200);
        }

        $result = $forceEndTurnAction($game, $turnParam);
        if ($result === 'forced_success') {
            $gameBroadcastService->gameBroadcastGameDetails($game);
            return response()->json(['success' => true, 'message' => $result]);
        }

        return response()->json(['success' => false, 'message' => $result]);
    }

    public function reconnect(Request $request, GameBroadcastService $broadcastService)
    {
        $user = $request->user();

        // On cherche le gameUser actif (non abandonné)
        $gameUser = $user->gameUsers()
            ->where('abandoned', false)
            ->first();

        if (!$gameUser) {
            return response()->json(['message' => 'No active game found'], 200);
        }

        $game = $gameUser->game;
        $status = $game->game_status;

        // Déclenchement manuel du broadcast selon l'état (ton switch Rails)
        if ($status === GameStatus::WAITING_FOR_PLAYERS) {
            $broadcastService->userBroadcastWaitingForPlayers($user, $game);
        } 
        elseif ($status === GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
            $broadcastService->userBroadcastReadyToPlay($user, $game);
        } 
        else {
            // Pour toutes les phases de jeu actives
            $broadcastService->userBroadcastGameDetails($user, $game);
        }

        return response()->json(['status' => 'sync_triggered']);
    }
}