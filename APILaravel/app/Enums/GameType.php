<?php

namespace App\Enums;

enum GameType: int
{
    case QUICK_GAME = 0;
    case CUSTOM_GAME = 1;

    public function jsonSerialize(): string
    {
        return strtolower($this->name);
    }
}