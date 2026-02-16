<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clan extends Model
{
    protected $fillable = [
        'game_id',
        'color',
        'name',
        'start_q',
        'start_r',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function gameUsers()
    {
        return $this->hasMany(GameUser::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'game_users');
    }
}
