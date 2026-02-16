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
        Schema::create('tiles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->integer('position_q')->nullable();
            $table->integer('position_r')->nullable();
            $table->integer('rotation')->nullable();
            $table->foreignId('game_user_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->integer('turn')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tiles');
    }
};
