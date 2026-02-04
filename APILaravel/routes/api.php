<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
// N'oublie pas d'importer tes futurs contrôleurs de jeu ici

Route::group(['prefix' => 'v1'], function () {

    // --- Routes d'authentification (Publiques) ---
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/login_email', [AuthController::class, 'login']); // Souvent la même méthode
    Route::post('auth/signup', [AuthController::class, 'signup']);
    Route::post('auth/google_login', [AuthController::class, 'googleLogin']);

    // Health check (équivalent Rails /up)
    Route::get('up', function () {
        return response()->json(['status' => 'OK'], 200);
    });

    // --- Routes protégées (Middleware JWT) ---
    Route::group(['middleware' => 'auth:api'], function () {

        // Profil & Compte
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/change_name', [AuthController::class, 'changeName']);
        Route::post('auth/change_password', [AuthController::class, 'changePassword']);
        Route::delete('auth/delete_account', [AuthController::class, 'deleteAccount']);
        
        // Utilisateur (Settings) - Ton "patch 'user'" devient :
        Route::patch('user', [UserController::class, 'update']);

        // --- Logique de Jeu (GameController) ---
        // Route::prefix('games')->group(function () {
        //     Route::post('quick_game', [GameController::class, 'quick_game']);
        //     Route::post('creat_custom_game', [GameController::class, 'creat_custom_game']);
        //     Route::post('join_game_custom', [GameController::class, 'join_game_custom']);
        //     Route::post('launch_custom_game', [GameController::class, 'launch_custom_game']);
        //     Route::post('startGameAfterTimeout', [GameController::class, 'startGameAfterTimeout']);
        //     Route::post('i_am_ready', [GameController::class, 'i_am_ready']);
        //     Route::post('startGameAfterDelay', [GameController::class, 'startGameAfterDelay']);
        //     Route::post('give_up_game', [GameController::class, 'give_up_game']);
        //     Route::post('confirm_game_details_reception', [GameController::class, 'confirm_game_details_reception']);

        //     // Routes avec ID de jeu (équivalent member do / resources)
        //     Route::group(['prefix' => '{game}'], function () {
        //         Route::post('submit_victory', [GameController::class, 'submit_victory']);
        //         Route::post('force_end_turn', [GameController::class, 'force_end_turn']);
                
        //         // Nesting (Tuiles, Clans, Bidding)
        //         Route::post('tiles/{tile}/place', [TileController::class, 'place']);
        //         Route::post('clans', [ClanController::class, 'store']);
        //         Route::post('bidding', [BiddingController::class, 'store']);
        //         Route::post('actions', [ActionController::class, 'store']);
                
        //         Route::post('game_users/{game_user}/abandon', [GameUserController::class, 'abandon']);
        //     });
        // });
    });
});