<?php

namespace Tests\Feature\Api\V1\Game;

use App\Models\User;
use App\Models\Game;
use App\Events\UserBroadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use App\Enums\GameStatus;

class QuickGameTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        // On intercepte les événements pour ne pas polluer les tests
        Event::fake();

        // On prépare un utilisateur et son badge pour TOUS les tests
        $this->user = User::factory()->create();
        $this->token = \PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth::fromUser($this->user);
    }


    #[Test]
    public function it_returns_ongoing_game_details_if_user_is_already_in_a_game()
    {
        $game = Game::factory()->create(['game_status' => 2]); 
        
        $game->gameUsers()->create([
            'user_id' => $this->user->id,
            'abandoned' => false
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $this->token])->postJson('/api/v1/games/quick_game');

        $response->assertStatus(200);
        $response->assertJsonPath('game_id', $game->id);
        
        $this->assertDatabaseCount('games', 1);

        Event::assertDispatched(UserBroadcast::class, function ($event) {
            return $event->userId === $this->user->id && 
                $event->data['type'] === 'game_details';
        });

    }

    #[Test]
    public function it_starts_the_game_when_the_last_player_joins()
    {
        $game = Game::factory()->create([
            'game_status' => 0, 
            'player_count' => 3,
            'waiting_players_count' => 2,
        ]);

        // 2 users
        $game->gameUsers()->create(['user_id' => User::factory()->create()->id]);
        $game->gameUsers()->create(['user_id' => User::factory()->create()->id]);

        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $this->token])->postJson('/api/v1/games/quick_game');

        $response->assertStatus(200);
        $game->refresh();
        $this->assertEquals(GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS, $game->game_status);
        $this->assertDatabaseHas('game_users', [
            'game_id' => $game->id,
            'user_id' => $this->user->id,
            'player_ready' => true
        ]);

        Event::assertDispatched(UserBroadcast::class, function ($event) {
            return $event->userId === $this->user->id && 
                $event->data['type'] === 'ready_to_play';
        });
    }

    #[Test]
    public function it_creates_a_new_game_if_none_is_available()
    {
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $this->token,])->postJson('/api/v1/games/quick_game');

        $response->assertStatus(200);

        $this->assertDatabaseCount('games', 1);
        $this->assertDatabaseHas('games', [
            'creator_id' => $this->user->id,
            'game_status' => 0, 
        ]);

        Event::assertDispatched(UserBroadcast::class, function ($event) {
            return $event->userId === $this->user->id && 
                $event->data['type'] === 'waiting_for_players';
        });
    }

    #[Test]
    public function it_joins_an_existing_game_if_available()
    {
        $creator = User::factory()->create();
        $game = Game::factory()->create([
            'creator_id' => $creator->id,
            'game_status' => 0,
            'game_type' => 0,
            'player_count' => 3,
            'waiting_players_count' => 1
        ]);

        $game->gameUsers()->create([
            'user_id' => $creator->id,
            'abandoned' => false
        ]);
        
        $response = $this->withHeaders(['Authorization' => 'Bearer ' . $this->token,])->postJson('/api/v1/games/quick_game');

        $response->assertStatus(200);

        $this->assertDatabaseCount('games', 1);
        
        $this->assertEquals(2, $game->refresh()->waiting_players_count);

        Event::assertDispatched(UserBroadcast::class, 2);

        Event::assertDispatched(UserBroadcast::class, function ($event) use ($creator) {
            return $event->userId === $creator->id && 
                $event->data['i_am_creator'] === true &&
                $event->data['type'] === 'waiting_for_players' &&
                $event->data['waiting_players_count'] === 2;
        });

        Event::assertDispatched(UserBroadcast::class, function ($event) {
            return $event->userId === $this->user->id && 
                $event->data['i_am_creator'] === false &&
                $event->data['type'] === 'waiting_for_players' &&
                $event->data['waiting_players_count'] === 2;
        });

        // pour afficher les brodcast pour debuger les tests :
        // Event::assertDispatched(UserBroadcast::class, function ($event) {
        //     dump([
        //         'DESTINATAIRE_ID' => $event->userId,
        //         'CONTENU_DATA' => $event->data
        //     ]);
            
        //     return true; // Permet au test de continuer sans bloquer
        // });
    }

}