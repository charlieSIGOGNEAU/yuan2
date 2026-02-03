<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// pour l'unicité conditionnelle
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();

            $table->integer('game_status')->default(0);
            $table->integer('game_type')->default(0);

            $table->integer('player_count')->nullable();
            $table->string('clan_names')->nullable();

            $table->integer('biddings_turn')->default(1);
            $table->integer('turn_duration')->default(120);
            $table->integer('simultaneous_play_turn')->default(0);

            $table->integer('waiting_players_count')->default(0);

            $table->foreignId('creator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('custom_code')->nullable()->unique();

            $table->timestamps();

            $table->index('submitted_by_user_id');
        });

        // unicité conditionnelle (équivalent Rails)
        DB::statement("
            CREATE UNIQUE INDEX index_unique_waiting_quick_game
            ON games (game_type, game_status)
            WHERE game_status = 0 AND game_type = 0
        ");
    }

    /**
     * Reverse the migrations.
     */
    // suppression de l'index et de la table manuellement a cause de la contrainte d'unicite
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS index_unique_waiting_quick_game');
        Schema::dropIfExists('games');
    }
};
