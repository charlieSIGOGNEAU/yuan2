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
        Schema::create('actions', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('game_user_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            
            $table->integer('turn')->nullable();
            $table->integer('position_q')->nullable();
            $table->integer('position_r')->nullable();
            $table->integer('development_level')->nullable();
            $table->integer('fortification_level')->nullable();
            $table->integer('militarisation_level')->nullable();
            
            $table->timestamps();

            $table->unique(['game_id', 'turn', 'game_user_id'], 'index_actions_unique_game_turn_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actions');
    }
};