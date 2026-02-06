<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Game;
use App\Models\GameUser;
use App\Models\Clan;
use App\Models\Tile;
use App\Models\Action;
use App\Models\Bidding;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Nettoyage PostgreSQL (plus simple et puissant)
        // TRUNCATE avec CASCADE nettoie tout et RESTART IDENTITY remet les compteurs à 1
        DB::statement('TRUNCATE TABLE users, games, game_users, clans, tiles, actions, biddings RESTART IDENTITY CASCADE;');

        $this->command->info("Création des utilisateurs...");

        $users = [
            ['email' => 'user1@mail.com', 'language' => 'fr'],
            ['email' => 'user2@mail.com', 'language' => 'fr'],
            ['email' => 'user3@mail.com', 'language' => 'fr'],
            ['email' => 'user4@mail.com', 'language' => 'en'],
            ['email' => 'user5@mail.com', 'language' => 'fr'],
            ['email' => 'user6@mail.com', 'language' => 'fr'],
        ];

        foreach ($users as $index => $userData) {
            User::create([
                'name'     => 'User ' . ($index + 1),
                'email'    => $userData['email'],
                'password' => Hash::make($userData['email']),
                'provider' => 'email',
                'language' => $userData['language'],
            ]);
        }

        $this->command->comment("Seed terminée !");
    }
}