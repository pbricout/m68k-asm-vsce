; Test file for include path hover functionality
; Move cursor over the path portions to test hover

    include fixtures\path\file.i
    incbin  fixtures\path\file.bin
    include "fixtures/quoted/path/file.inc"
    incbin  'fixtures/single-quoted/path/data.bin'    
; Regular assembly code that uses included constants
start:
    move.w  #SCREEN_WIDTH,d0    ; From fixtures\path\file.i
    move.w  #SCREEN_HEIGHT,d1   ; From fixtures\path\file.i
    move.w  #SPRITE_SIZE,d2     ; From fixtures/quoted/path/file.inc
    
    ; Test some operations with the constants
    add.w   d0,d1               ; Add width to height
    cmp.w   #MAX_OBJECTS,d2     ; Compare with max objects
    
    rts
