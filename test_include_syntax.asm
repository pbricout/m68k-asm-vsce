; Test file for include syntax highlighting
    include ASM_LIBS\MACROS.I
    include "ASM_LIBS\MACROS.I"  
    include 'ASM_LIBS\MACROS.I'
    include SYSTEM.INC
    include "SYSTEM.INC"
    include path/to/file.asm

; Other directives for comparison
    section CODE
    macro TEST
    endm
