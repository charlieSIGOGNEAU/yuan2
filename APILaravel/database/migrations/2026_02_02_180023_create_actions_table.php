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
            $table->foreignId('game_user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->string('action');
            $table->integer('turn');
            $table->timestamps();

            $table->unique(['game_user_id', 'turn', 'action']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actions');
    }
};
