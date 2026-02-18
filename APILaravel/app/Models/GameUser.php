<?php

namespace App\Models;

use App\Models\Game;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class GameUser extends Model
{
    protected $fillable = [
        'game_id',
        'user_id',
        'role',
        'status',
        'score',
        'turn_order',
        'player_ready',
        'clan_id',
        'abandoned',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function actions()
    {
        return $this->hasMany(Action::class);
    }

    public function biddings()
    {
        return $this->hasMany(Bidding::class);
    }

    public function tiles()
    {
        return $this->hasMany(Tile::class);
    }

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }
}
