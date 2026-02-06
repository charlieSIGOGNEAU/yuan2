<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\GameStatus;
use App\Enums\GameType;
use App\Models\GameUser;
use App\Models\Tile;
use App\Models\Clan;
use App\Models\Bidding;
use App\Models\User;

class Game extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'game_status',
        'game_type',
        'player_count',
        'clan_names',
        'biddings_turn',
        'turn_duration',
        'simultaneous_play_turn',
    ];
    public function users()
    {
        return $this->belongsToMany(User::class, 'game_users');
    }
    public function gameUsers()
    {
        return $this->hasMany(GameUser::class);
    }
    public function tiles()
    {
        return $this->hasMany(Tile::class);
    }
    public function clans()
    {
        return $this->hasMany(Clan::class);
    }
    public function biddings()
    {
        return $this->hasMany(Bidding::class);
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
    public function submittedByUser()
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }
}
