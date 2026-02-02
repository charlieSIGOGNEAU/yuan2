<?php

namespace App\Enums;

enum GameStatus: int
{
    case WAITING_FOR_PLAYERS = 0;
    case WAITING_FOR_CONFIRMATION_PLAYERS = 1;
    case INSTALLATION_PHASE = 2;
    case INITIAL_PLACEMENT = 3;
    case BIDDING_PHASE = 4;
    case STARTING_SPOT_SELECTION = 5;
    case SIMULTANEOUS_PLAY = 6;
    case COMPLETED = 7;
    case ABANDONED = 8;
    case END_DISPUTE = 9;
}
