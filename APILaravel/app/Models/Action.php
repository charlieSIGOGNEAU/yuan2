<?php

namespace App\Models;

use App\Models\Game;
use App\Models\GameUser;
use Illuminate\Database\Eloquent\Model;

class Action extends Model
{
    protected $fillable = [
        'game_id',
        'game_user_id',
        'turn',
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
