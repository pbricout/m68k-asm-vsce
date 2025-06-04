; Comprehensive M68K Assembly Folding Test
; This file tests all supported folding patterns in the extension

; =============================================================================
; #region Manual Folding Regions
; These regions can be manually folded using ; #region and ; #endregion
    move.l  #$12345678, d0
    add.l   d1, d0
; #endregion

; =============================================================================
; Test Section Folding
    section text
start:
    move.l  #test_data, a0
    bsr     process_data
    rts

    section data
test_data:
    dc.l    $DEADBEEF, $CAFEBABE
    dc.w    100, 200, 300

    section bss
buffer:
    ds.b    1024

; =============================================================================
; Test Macro Folding
clear_memory macro
    move.l  \1, a0          ; Load address
    move.l  \2, d0          ; Load count
.loop:
    clr.b   (a0)+          ; Clear and increment
    dbf     d0, .loop      ; Loop until done
endm

multiply_by_10 macro
    move.l  \1, d0         ; Load value
    lsl.l   #3, d0         ; Multiply by 8
    add.l   \1, d0         ; Add original (8+1=9)
    add.l   \1, d0         ; Add original again (9+1=10)
endm

; =============================================================================
; Test Conditional Assembly Directives - IFND/ENDC
ifnd VERSION
VERSION     equ     1
    ; Default version configuration
    move.l  #$00010000, version_info
    move.l  #basic_features, feature_set
endc

; Test Conditional Assembly Directives - IFD/ENDC
ifd DEBUG
    ; Debug mode enabled
    move.l  #debug_buffer, a1
    move.l  #$DEBUG001, (a1)+
    trap    #0                  ; Enter debugger
endc

; Test Conditional Assembly Directives - IFDEF/ENDC
ifdef ENHANCED_GRAPHICS
    ; Enhanced graphics mode
    move.l  #$FF8000, vram_base
    move.w  #320, screen_width
    move.w  #240, screen_height
    bsr     init_enhanced_graphics
endc

; Test Conditional Assembly Directives - IFNDEF/ENDC
ifndef SIMPLE_MODE
    ; Complex processing enabled
    movem.l d0-d7/a0-a6, -(sp)
    bsr     complex_algorithm
    bsr     advanced_features
    movem.l (sp)+, d0-d7/a0-a6
endc

; =============================================================================
; Test Nested Conditional Directives
ifnd PLATFORM_DEFINED
PLATFORM_DEFINED equ 1
    ifdef AMIGA_TARGET
        ; Amiga-specific code
        move.l  4.w, a6         ; ExecBase
        jsr     -132(a6)        ; Forbid()
        
        ifd KICKSTART_39
            ; Kickstart 3.0+ features
            jsr     -138(a6)    ; CacheClearU()
        endc
        
        jsr     -138(a6)        ; Permit()
    endc
    
    ifdef ATARI_TARGET
        ; Atari ST specific code
        move.w  #$2700, sr      ; Disable interrupts
        
        ifndef MINIMAL_BUILD
            ; Full Atari build
            move.l  #$FF8240, a0    ; Color palette
            move.w  #$0777, (a0)    ; White color
        endc
        
        move.w  #$2300, sr      ; Enable interrupts
    endc
endc

; =============================================================================
; Test Multi-line Comment Folding
/* This is a multi-line comment block
   that spans several lines and should
   be foldable as a single unit.
   
   It can contain various text including:
   - Instructions like MOVE.L D0, D1
   - Addresses like $FF8000
   - Documentation and notes
   
   End of comment block */

; =============================================================================
; Test Generic IF/ENDIF (from original grammar)
if COMPILE_TESTS
test_routine:
    move.l  #test_pattern, d0
    cmp.l   #$12345678, d0
    beq     test_passed
    bra     test_failed
test_passed:
    rts
test_failed:
    trap    #1
endif

; =============================================================================
; #region Final Test Section
; This region combines multiple folding types
final_test macro
    ifnd FINAL_TEST_DONE
        move.l  #completion_flag, a0
        st      (a0)                ; Set completion flag
        
        /* Final operations comment
           Multiple lines explaining
           the completion process */
           
        ifdef VERBOSE_MODE
            move.l  #message_buffer, a1
            move.b  #'D', (a1)+
            move.b  #'O', (a1)+
            move.b  #'N', (a1)+
            move.b  #'E', (a1)+
        endc
    endc
endm
; #endregion

; End of comprehensive folding test file
