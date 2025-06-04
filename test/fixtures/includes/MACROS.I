; Test include file - MACROS.I
; This file contains test macros and constants

; Test constants
DEBUG_MODE      equ     1
SCREEN_WIDTH    equ     320
SCREEN_HEIGHT   equ     240

; Test macro
CLEAR_REGISTER  macro   \reg
                clr.l   \reg
                endm

; Another constant
MAX_SPRITES     equ     64
