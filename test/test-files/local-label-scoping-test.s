; Test file for local label scoping implementation
; Local labels (starting with .) should only be visible within their global label scope

start:
    move.l #1000, d0
.loop:
    add.l #1, d0
    cmp.l #2000, d0
    blt .loop       ; Reference to .loop in start scope
    jsr subroutine
    rts

subroutine:
    move.l #5000, d1
.loop:              ; Different .loop in subroutine scope
    sub.l #1, d1
    cmp.l #4000, d1
    bgt .loop       ; Reference to .loop in subroutine scope
    rts

another_routine:
    move.l #100, d2
.local_label:
    add.l #10, d2
    bra .local_label    ; Reference to .local_label in another_routine scope
    rts

; This should NOT find .loop from start or subroutine scopes if scoping works correctly
test_invalid_scope:
    move.l #0, d3
    ; bra .loop     ; This would be invalid - no .loop in this scope
    rts
