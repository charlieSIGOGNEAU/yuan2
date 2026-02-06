<?php

namespace App\Models;

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
        'created_at',
        'updated_at',
    ];
}
