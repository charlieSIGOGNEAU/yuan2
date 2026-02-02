<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('game_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('clan_id')->nullable()->constrained('clans')->nullOnDelete();
            $table->boolean('player_ready')->default(false);
            $table->string('user_name')->nullable();
            $table->integer('rank')->nullable();
            $table->boolean('abandoned')->default(false);
            $table->boolean('is_creator_of_game')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'game_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_users');
    }
};
