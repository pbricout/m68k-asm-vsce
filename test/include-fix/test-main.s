; Test main assembly file
; This file includes the MACROS.I file

        include ASM_LIBS\MACROS.I

start:
        move.w  #SCREEN_WIDTH,d0    ; Use constant from include
        move.w  #SCREEN_HEIGHT,d1   ; Use another constant from include
        
        CLEAR_REGISTER d2           ; Use macro from include
        
        cmp.w   #MAX_SPRITES,d3     ; Use another constant
        
        rts

end
