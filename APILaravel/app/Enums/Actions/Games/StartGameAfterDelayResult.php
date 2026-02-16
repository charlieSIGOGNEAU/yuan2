<?php

namespace App\Enums\Actions\Games;

enum StartGameAfterDelayResult: string
{
    case INVALID_STATUS = 'invalid status';
    case UNEXPIRED_TIMEOUT = 'unexpired timeout';
    case GAME_DESTROYED = 'game destroyed';
    case MISSING_PLAYER = 'missing player';
    case GAME_READY_INSTALLATION_PHASE = 'game ready installation_phase';
}
