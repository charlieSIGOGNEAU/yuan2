<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Action extends Model
{
    protected $fillable = [
        'game_id',
        'game_user_id',
        'turn',
        'development_level',
        'fortification_level',
        'militarisation_level',
    ];
}
