<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class GameFactory extends Factory
{
    protected $model = Game::class;

    public function definition(): array
    {
        return [
            'game_status' => 0, // Waiting
            'game_type' => 1,   // custom
            'player_count' => 3,
            'clan_names' => 'black_clan red_clan green_clan',
            'biddings_turn' => 1,
            'turn_duration' => 120,
            'simultaneous_play_turn' => 0,
            'waiting_players_count' => 1,
            'creator_id' => User::factory(),
            'custom_code' => Str::upper(Str::random(6)),
        ];
    }
}