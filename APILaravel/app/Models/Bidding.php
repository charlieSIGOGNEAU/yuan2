<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bidding extends Model
{
    protected $fillable = [
        'game_id',
        'game_user_id',
        'turn',
        'chao',
        'victory',
        'clan_id',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function gameUser()
    {
        return $this->belongsTo(GameUser::class);
    }

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }
}
