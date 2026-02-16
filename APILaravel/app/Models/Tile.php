<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tile extends Model
{
    protected $fillable = [
        'name',
        'game_id',
        'game_user_id',
        'position_q',
        'position_r',
        'development_level',
        'fortification_level',
        'militarisation_level',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function gameUser()
    {
        return $this->belongsTo(GameUser::class);
    }
}
