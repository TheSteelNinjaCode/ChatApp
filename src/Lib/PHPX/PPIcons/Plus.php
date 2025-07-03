<?php

namespace Lib\PHPX\PPIcons;

use Lib\PHPX\PHPX;

class Plus extends PHPX
{
    public ?string $class = '';

    public function __construct(array $props = [])
    {
        parent::__construct($props);
    }

    public function render(): string
    {
        $attributes = $this->getAttributes();
        $class = $this->getMergeClasses($this->class);

        return <<<HTML
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="{$class}" {$attributes}><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
        HTML;
    }
}
