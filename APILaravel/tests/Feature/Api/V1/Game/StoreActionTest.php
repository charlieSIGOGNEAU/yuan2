<?php

namespace Tests\Feature\Api\V1\Game;

use App\Models\User;
use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPUnit\Framework\Attributes\Test;

/**
 * - (ActionRequest) petit test incomplet centre sur les verrification des droit de l'utilisateur qui demande de jouer une action
 * - (ActionRequest) action envoyer avec un tour en retard
 */

class StoreActionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->token = JWTAuth::fromUser($this->user);
    }

    /**
     * le joueur apartien a la game de l'action qu'il entreprend
     */
    #[Test]
    public function player_belongs_to_the_game()
    {
        $game = Game::factory()->create(['simultaneous_play_turn' => 2]);
        $gameUser = $game->gameUsers()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $this->token])
            ->postJson("/api/v1/games/{$game->id}/actions", [
                'game_user_id' => $gameUser->id,
                'game_id' => $game->id,
                'turn' => 2,
                'position_q' => 1,
                'position_r' => 1,
                'development_level' => 1,
                'fortification_level' => 2,
                'militarisation_level' => 3
            ]);

        $response->assertStatus(200)
                 ->assertJsonPath('success', true);
        
        $this->assertDatabaseHas('actions', [
            'game_user_id' => $gameUser->id,
            'turn' => 2
        ]);
    }

    /**
     * le joueur n'apartien pas a la game de l'action qu'il entreprend
     */
    #[Test]
    public function player_does_not_belong_to_the_game()
    {
        $game1 = Game::factory()->create(['simultaneous_play_turn' => 2]);
        $game2 = Game::factory()->create(['simultaneous_play_turn' => 2]);
        $gameUser = $game2->gameUsers()->create([
            'user_id' => $this->user->id,
        ]);
        
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $this->token])
            ->postJson("/api/v1/games/{$game1->id}/actions", [
                'game_user_id' => $gameUser->id,
                'game_id' => $game1->id,
                'turn' => 2,
                'position_q' => 1,
                'position_r' => 1,
                'development_level' => 1,
                'fortification_level' => 2,
                'militarisation_level' => 3
            ]);

        $response->assertStatus(403);
    }

    /**
     * le joueur n'apartien pas a la game de l'action qu'il entreprend
     */
    #[Test]
    public function action_send_with_a_late_turn()
    {
        $game = Game::factory()->create(['simultaneous_play_turn' => 3]);
        $gameUser = $game->gameUsers()->create([
            'user_id' => $this->user->id,
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $this->token])
            ->postJson("/api/v1/games/{$game->id}/actions", [
                'game_user_id' => $gameUser->id,
                'game_id' => $game->id,
                'turn' => 2,
                'position_q' => 1,
                'position_r' => 1,
                'development_level' => 1,
                'fortification_level' => 2,
                'militarisation_level' => 3
            ]);

        $response->assertStatus(403);
    }
}