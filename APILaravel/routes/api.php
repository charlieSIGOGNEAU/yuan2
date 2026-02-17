<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:api']]);
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\GameController;
use App\Http\Controllers\Api\V1\TileController;
use App\Http\Controllers\Api\V1\ClanController;
use App\Http\Controllers\Api\V1\BiddingController;

Route::get('test', function() {
    return response()->json(['message' => 'L\'API fonctionne !']);
});

Route::group(['prefix' => 'v1'], function () {

    // --- Routes d'authentification (Publiques) ---
    Route::post('auth/login_email', [AuthController::class, 'loginEmail']); // Souvent la même méthode
    Route::post('auth/signup', [AuthController::class, 'signup']);
    Route::post('auth/google_login', [AuthController::class, 'googleLogin']);

    // Health check (équivalent Rails /up)
    Route::get('up', function () {
        return response()->json(['status' => 'OK'], 200);
    });

    // --- Routes protégées (Middleware JWT) ---
    Route::group(['middleware' => 'auth:api'], function () {

        // Profil & Compte
        // Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/change_name', [AuthController::class, 'changeName']);
        Route::post('auth/change_password', [AuthController::class, 'changePassword']);
        Route::delete('auth/delete_account', [AuthController::class, 'deleteAccount']);
        
        // Utilisateur (Settings) - Ton "patch 'user'" devient :
        Route::patch('user', [UserController::class, 'update']);

        // --- Logique de Jeu (GameController) ---
        Route::prefix('games')->group(function () {
            Route::post('reconnect', [GameController::class, 'reconnect']);

            Route::post('quick_game', [GameController::class, 'quickGame']);
            Route::post('creat_custom_game', [GameController::class, 'createCustomGame']);
            Route::post('join_game_custom', [GameController::class, 'joinCustomGame']);
            Route::post('launch_custom_game', [GameController::class, 'launchCustomGame']);
        //     Route::post('startGameAfterTimeout', [GameController::class, 'startGameAfterTimeout']);
            Route::post('i_am_ready', [GameController::class, 'iAmReady']);
        //     Route::post('startGameAfterDelay', [GameController::class, 'startGameAfterDelay']);
        //     Route::post('give_up_game', [GameController::class, 'give_up_game']);
        //     Route::post('confirm_game_details_reception', [GameController::class, 'confirm_game_details_reception']);

        //     // Routes avec ID de jeu (équivalent member do / resources)
            Route::group(['prefix' => '{game}'], function () {
            Route::post('submit_victory', [GameController::class, 'submitVictory']);
            Route::post('force_end_turn', [GameController::class, 'forceEndTurn']);
                
        //         // Nesting (Tuiles, Clans, Bidding)
            Route::post('tiles/{tile}/place', [TileController::class, 'place']);
            Route::post('clans', [ClanController::class, 'store']);
            Route::post('bidding', [BiddingController::class, 'store']);
        //         Route::post('actions', [ActionController::class, 'store']);
                
        //         Route::post('game_users/{game_user}/abandon', [GameUserController::class, 'abandon']);
            });
        });
    });
});