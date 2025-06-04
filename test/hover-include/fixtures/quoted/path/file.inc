; Quoted path include file
; Contains graphics-related constants

SPRITE_SIZE     equ 16
TILE_SIZE       equ 8
COLOR_DEPTH     equ 4

graphics_init:
    move.w  #SPRITE_SIZE,d0
    rts