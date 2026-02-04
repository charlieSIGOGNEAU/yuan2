<?php

namespace App\Traits;

trait HasLanguageValidation
{
    public function validateLanguage($lang)
    {
        $supported = ['fr', 'en', 'zh', 'ja', 'ko', 'de', 'es', 'pt', 'ru', 'it'];
        $lang = strtolower($lang);
        return in_array($lang, $supported) ? $lang : 'en';
    }
}