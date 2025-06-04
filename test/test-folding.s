; Test file for M68K assembly folding functionality
; This file tests various folding patterns including the new conditional directives

; #region Test Region 1
    move.l  d0, d1
    add.l   d2, d3
; #endregion

; Test macro folding
mymacro macro
    move.l  \1, d0
    rts
endm

; Test ifnd (if not defined) conditional assembly
ifnd MYCONST
MYCONST     equ     $1000
    move.l  #MYCONST, a0
    lea     table(pc), a1
    move.l  (a0), d0
endc

; Test ifd (if defined) conditional assembly  
ifd DEBUG
    ; Debug code block
    move.l  #$DEADBEEF, d7
    trap    #0
    nop
endc

; Another ifnd example
ifnd BUFFER_SIZE
BUFFER_SIZE equ     256
buffer      ds.b    BUFFER_SIZE
endc

; Test ifdef (if defined) - alternative form
ifdef ENHANCED_MODE
    ; Enhanced features
    move.l  #$FF00FF, d1
    bsr     enhanced_routine
endc

; Test ifndef (if not defined) - alternative form  
ifndef SIMPLE_MODE
    ; Complex processing
    movem.l d0-d7/a0-a6, -(sp)
    bsr     complex_algorithm
    movem.l (sp)+, d0-d7/a0-a6
endc

/* Multi-line comment block
   This should also fold properly
   across multiple lines */

; Nested conditional example
ifnd PLATFORM
    ifd AMIGA
        move.l  4.w, a6         ; ExecBase
        jsr     -132(a6)        ; Forbid()
    endc
endc

; #region Another Region
    bsr     subroutine
    rts
; #endregion
