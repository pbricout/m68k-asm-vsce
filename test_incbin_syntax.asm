; Test file for incbin syntax highlighting
    include ASM_LIBS\MACROS.I
    include "ASM_LIBS\MACROS.I"  
    include 'ASM_LIBS\MACROS.I'
    
    incbin DATA\GRAPHICS.BIN
    incbin "DATA\GRAPHICS.BIN"
    incbin 'DATA\GRAPHICS.BIN'
    incbin IMAGES/SPRITE.RAW
    
; Other directives for comparison
    section CODE
    macro TEST
    endm
