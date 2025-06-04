import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';

// Local label rules: A local label (starting with a dot) is only visible between two global labels. Only one instance of a local label can exist in a global label section. All language features (hover, go to definition, rename, etc.) must respect this scoping.

interface TimingInfo {
    cycles: string;
    readWrite: string;
}

interface TimingEntry {
    size?: string;
    src?: string;
    dest?: string;
    cycles: string;
    readWrite: string;
}

export class M68kHoverProvider implements vscode.HoverProvider {
    // Timing data tables
    private instructionTimings: { [key: string]: TimingEntry[] } = {
        'move': [
            // Long word
            { size: 'l', src: 'register_direct', dest: 'register_direct', cycles: '4', readWrite: '(1/0)' },
            { size: 'l', src: 'register_direct', dest: 'address_indirect', cycles: '12', readWrite: '(1/2)' },
            { size: 'l', src: 'register_direct', dest: 'address_displacement', cycles: '16', readWrite: '(1/2)' },
            { size: 'l', src: 'address_indirect', dest: 'register_direct', cycles: '12', readWrite: '(3/0)' },
            { size: 'l', src: 'address_displacement', dest: 'register_direct', cycles: '16', readWrite: '(4/0)' },
            { size: 'l', src: 'address_indirect', dest: 'address_indirect', cycles: '20', readWrite: '(3/2)' },
            // Word/Byte
            { size: 'w', src: 'register_direct', dest: 'register_direct', cycles: '4', readWrite: '(1/0)' },
            { size: 'w', src: 'register_direct', dest: 'address_indirect', cycles: '8', readWrite: '(1/1)' },
            { size: 'w', src: 'register_direct', dest: 'address_displacement', cycles: '12', readWrite: '(1/1)' },
            { size: 'w', src: 'address_indirect', dest: 'register_direct', cycles: '8', readWrite: '(2/0)' },
            { size: 'w', src: 'address_displacement', cycles: '12', readWrite: '(3/0)' },
            { size: 'w', src: 'address_indirect', dest: 'address_indirect', cycles: '12', readWrite: '(2/1)' }
        ],
        'add': [
            // Long word
            { size: 'l', src: 'register_direct', dest: 'register_direct', cycles: '8', readWrite: '(1/0)' },
            { size: 'l', src: 'address_indirect', dest: 'register_direct', cycles: '14', readWrite: '(3/0)' },
            { size: 'l', src: 'immediate', dest: 'register_direct', cycles: '16', readWrite: '(3/0)' },
            { size: 'l', src: 'register_direct', dest: 'address_indirect', cycles: '20', readWrite: '(2/2)' },
            // Word/Byte
            { size: 'w', src: 'register_direct', dest: 'register_direct', cycles: '4', readWrite: '(1/0)' },
            { size: 'w', src: 'address_indirect', dest: 'register_direct', cycles: '8', readWrite: '(2/0)' },
            { size: 'w', src: 'immediate', dest: 'register_direct', cycles: '8', readWrite: '(2/0)' },
            { size: 'w', src: 'register_direct', dest: 'address_indirect', cycles: '12', readWrite: '(1/1)' }
        ],
        'sub': [
            // Same timing as ADD
            { size: 'l', src: 'register_direct', dest: 'register_direct', cycles: '8', readWrite: '(1/0)' },
            { size: 'l', src: 'address_indirect', dest: 'register_direct', cycles: '14', readWrite: '(3/0)' },
            { size: 'l', src: 'immediate', dest: 'register_direct', cycles: '16', readWrite: '(3/0)' },
            { size: 'l', src: 'register_direct', dest: 'address_indirect', cycles: '20', readWrite: '(2/2)' },
            { size: 'w', src: 'register_direct', dest: 'register_direct', cycles: '4', readWrite: '(1/0)' },
            { size: 'w', src: 'address_indirect', dest: 'register_direct', cycles: '8', readWrite: '(2/0)' },
            { size: 'w', src: 'immediate', dest: 'register_direct', cycles: '8', readWrite: '(2/0)' },
            { size: 'w', src: 'register_direct', dest: 'address_indirect', cycles: '12', readWrite: '(1/1)' }
        ],
        'muls': [
            { cycles: '38-70', readWrite: '(1/0)', dest: 'register_direct' }
        ],
        'mulu': [
            { cycles: '38-70', readWrite: '(1/0)', dest: 'register_direct' }
        ],
        'divs': [
            { cycles: '158-162', readWrite: '(1/0)', dest: 'register_direct' }
        ],
        'divu': [
            { cycles: '140-144', readWrite: '(1/0)', dest: 'register_direct' }
        ],
        'jmp': [
            { src: 'address_indirect', cycles: '8', readWrite: '(2/0)' },
            { src: 'address_displacement', cycles: '10', readWrite: '(2/0)' },
            { src: 'absolute_long', cycles: '12', readWrite: '(3/0)' }
        ],
        'jsr': [
            { src: 'address_indirect', cycles: '16', readWrite: '(2/1)' },
            { src: 'address_displacement', cycles: '18', readWrite: '(2/1)' },
            { src: 'absolute_long', cycles: '20', readWrite: '(3/1)' }
        ],
        'bra': [
            { size: 'b', cycles: '10', readWrite: '(2/0)' },
            { size: 'w', cycles: '12', readWrite: '(3/0)' }
        ],
        'bsr': [
            { size: 'b', cycles: '18', readWrite: '(2/1)' },
            { size: 'w', cycles: '20', readWrite: '(3/1)' }
        ]
    };
    
    // Base timing modifications for addressing modes
    private addressingModeCycles: { [key: string]: number } = {
        'register_direct': 0,
        'address_register': 0,
        'address_indirect': 4,
        'address_displacement': 8,
        'address_postincrement': 4,
        'address_predecrement': 6,
        'immediate': 4,
        'pc_relative': 8,
        'absolute_short': 8,
        'absolute_long': 12
    };

    // Special timing cases
    private specialCases: { [key: string]: (context: any) => TimingInfo } = {
        'movem': (context) => {
            const registerCount = this.countRegisters(context.operands[0]);
            if (context.operands[1].includes('-(')) {
                // Memory to registers
                return {
                    cycles: `12+4n (n=${registerCount})`,
                    readWrite: `(3+${registerCount}/0)`
                };
            } else {
                // Registers to memory
                return {
                    cycles: `8+4n (n=${registerCount})`,
                    readWrite: `(2/${registerCount})`
                };
            }
        },
        'dbf': () => ({
            cycles: 'Taken: 10, Not taken: 14',
            readWrite: '(2/0)'
        })
    };

    private instructionDocs: { [key: string]: string } = {
        // Data Movement Instructions with timing
        'move': 'MOVE - Copy data from source to destination\nSyntax: MOVE.size source,destination\n\nTiming:\n- Byte/Word:\n  • Register to Register: 4(1/0) cycles\n  • Memory to Register: 8-12(2/0) cycles\n  • Register to Memory: 8-12(1/1) cycles\n  • Memory to Memory: 12-20(2/1) cycles\n- Long:\n  • Register to Register: 4(1/0) cycles\n  • Memory to Register: 12-16(3/0) cycles\n  • Register to Memory: 12-20(1/2) cycles\n  • Memory to Memory: 20-28(3/2) cycles',
        'movea': 'MOVEA - Move address to address register\nSyntax: MOVEA.size source,An\n\nTiming:\n- Word: 4-12(1-3/0) cycles\n- Long: 4-16(1-4/0) cycles\nAdd 4 cycles for memory indirect modes',
        'movem': 'MOVEM - Move multiple registers\nSyntax: MOVEM.size register_list,destination\n\nTiming:\n- Memory to Registers: 12+4n(3+n/0) cycles\n- Registers to Memory: 8+4n(2/n) cycles\nWhere n is the number of registers moved',
        'movep': 'MOVEP - Move peripheral data\nSyntax: MOVEP.size Dn,d(An) or MOVEP.size d(An),Dn\n\nTiming:\n- Word: 16(2/2) cycles\n- Long: 24(4/4) cycles',
        'moveq': 'MOVEQ - Move quick (8-bit immediate to 32-bit register)\nSyntax: MOVEQ #data,Dn\n\nTiming: 4(1/0) cycles',
        'lea': 'LEA - Load effective address\nSyntax: LEA source,An\n\nTiming: 4-12 cycles depending on addressing mode',
        'pea': 'PEA - Push effective address\nSyntax: PEA source\n\nTiming: 12-20 cycles depending on addressing mode',
        'swap': 'SWAP - Swap register halves\nSyntax: SWAP Dn\n\nTiming: 4(1/0) cycles',
        'exg': 'EXG - Exchange registers\nSyntax: EXG Rx,Ry\n\nTiming: 6(1/0) cycles',
        
        // Arithmetic Instructions with timing
        'add': 'ADD - Add binary\nSyntax: ADD.size source,destination\n\nTiming:\n- Byte/Word:\n  • Register to Register: 4(1/0) cycles\n  • Memory to Register: 8-14(2-3/0) cycles\n  • Register to Memory: 12-20(1/1) cycles\n- Long:\n  • Register to Register: 8(1/0) cycles\n  • Memory to Register: 12-18(2-3/0) cycles\n  • Register to Memory: 12-20(1/1) cycles',
        'adda': 'ADDA - Add address\nSyntax: ADDA.size source,An\n\nTiming:\n- Word: 8(1/0) + ea cycles\n- Long: 6(1/0) + ea cycles\nAdd 4-8 cycles for memory addressing modes',
        'addi': 'ADDI - Add immediate\nSyntax: ADDI.size #data,destination\n\nTiming:\n- Byte/Word to Register: 8(2/0) cycles\n- Byte/Word to Memory: 12-20(2/1) cycles\n- Long to Register: 16(3/0) cycles\n- Long to Memory: 20-28(3/1) cycles',
        'addq': 'ADDQ - Add quick (3-bit immediate)\nSyntax: ADDQ.size #data,destination\n\nTiming:\n- Data Register: 4(1/0) cycles\n- Memory: 8-12(1/1) cycles\n- Address Register: 8(1/0) cycles',
        'addx': 'ADDX - Add extended (with carry)\nSyntax: ADDX.size source,destination\n\nTiming:\n- Register to Register:\n  • Byte/Word: 4(1/0) cycles\n  • Long: 8(1/0) cycles\n- Memory to Memory:\n  • Byte/Word: 18(3/1) cycles\n  • Long: 30(5/2) cycles',
        
        // Multiply and Divide with detailed timing
        'muls': 'MULS - Multiply signed\nSyntax: MULS.w source,Dn\n\nTiming: 38+2n cycles where n is the number of 01 or 10 bit patterns in the source operand (including a leading zero)\nWorst case (source = $5555): 70 cycles\nBest case (source = $0000 or $FFFF): 38 cycles',
        'mulu': 'MULU - Multiply unsigned\nSyntax: MULU.w source,Dn\n\nTiming: 38+2n cycles where n is the number of 1s in the source operand\nWorst case (source = $FFFF): 70 cycles\nBest case (source = $0000): 38 cycles',
        'divs': 'DIVS - Divide signed\nSyntax: DIVS.w source,Dn\n\nTiming: 158(1/0) cycles average\nRange: 154-162 cycles\nAdd 4-8 cycles for memory addressing modes',
        'divu': 'DIVU - Divide unsigned\nSyntax: DIVU.w source,Dn\n\nTiming: 140(1/0) cycles average\nRange: 136-144 cycles\nAdd 4-8 cycles for memory addressing modes',
        
        // Shift and rotate with more precise timing
        'asl': 'ASL - Arithmetic shift left\nSyntax: ASL.size #count,Dn or ASL.size Dn,Dn\n\nTiming:\n- Register:\n  • Initial: 6(1/0) cycles\n  • Add 2 cycles per additional shift\n- Memory: 8(1/1) cycles for shift count of 1',
        'asr': 'ASR - Arithmetic shift right\nSyntax: ASR.size #count,Dn or ASR.size Dn,Dn\n\nTiming:\n- Register:\n  • Initial: 6(1/0) cycles\n  • Add 2 cycles per additional shift\n- Memory: 8(1/1) cycles for shift count of 1',
        'lsl': 'LSL - Logical shift left\nSyntax: LSL.size #count,Dn or LSL.size Dn,Dn\n\nTiming:\n- Register shifts: 6-8 cycles\n- Memory shifts: 8-12 cycles\nAdd 2 cycles per additional shift',
        'lsr': 'LSR - Logical shift right\nSyntax: LSR.size #count,Dn or LSR.size Dn,Dn\n\nTiming:\n- Register shifts: 6-8 cycles\n- Memory shifts: 8-12 cycles\nAdd 2 cycles per additional shift',
        'rol': 'ROL - Rotate left\nSyntax: ROL.size #count,Dn or ROL.size Dn,Dn\n\nTiming:\n- Register rotates: 6-8 cycles\n- Memory rotates: 8-12 cycles\nAdd 2 cycles per additional rotation',
        'ror': 'ROR - Rotate right\nSyntax: ROR.size #count,Dn or ROR.size Dn,Dn\n\nTiming:\n- Register rotates: 6-8 cycles\n- Memory rotates: 8-12 cycles\nAdd 2 cycles per additional rotation',
        'roxl': 'ROXL - Rotate left with extend\nSyntax: ROXL.size #count,Dn or ROXL.size Dn,Dn\n\nTiming:\n- Register rotates: 6-8 cycles\n- Memory rotates: 8-12 cycles\nAdd 2 cycles per additional rotation',
        'roxr': 'ROXR - Rotate right with extend\nSyntax: ROXR.size #count,Dn or ROXR.size Dn,Dn\n\nTiming:\n- Register rotates: 6-8 cycles\n- Memory rotates: 8-12 cycles\nAdd 2 cycles per additional rotation',
        
        // Compare Instructions with timing
        'cmp': 'CMP - Compare\nSyntax: CMP.size source,destination\n\nTiming:\n- Byte/Word:\n  • Register to Register: 4(1/0) cycles\n  • Memory to Register: 4-8(1-2/0) cycles\n- Long:\n  • Register to Register: 6(1/0) cycles\n  • Memory to Register: 6-12(1-3/0) cycles',
        'cmpa': 'CMPA - Compare address\nSyntax: CMPA.size source,An\n\nTiming:\n- Word: 6(1/0) + ea cycles\n- Long: 6(1/0) + ea cycles\nAdd 4-8 cycles for memory addressing modes',
        'cmpi': 'CMPI - Compare immediate\nSyntax: CMPI.size #data,destination\n\nTiming:\n- Byte/Word to Register: 8(2/0) cycles\n- Byte/Word to Memory: 12-16(2/0) cycles\n- Long to Register: 14(3/0) cycles\n- Long to Memory: 12-20(3/0) cycles',
        
        // Conditional Branch Instructions with precise timing
        'bra': 'BRA - Branch always\nSyntax: BRA label\n\nTiming:\n- Byte displacement: 10(2/0) cycles\n- Word displacement: 12(3/0) cycles',
        'bsr': 'BSR - Branch to subroutine\nSyntax: BSR label\n\nTiming:\n- Byte displacement: 18(2/1) cycles\n- Word displacement: 20(3/1) cycles',
        'bcc': 'BCC - Branch if carry clear\nSyntax: BCC label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bcs': 'BCS - Branch if carry set\nSyntax: BCS label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'beq': 'BEQ - Branch if equal\nSyntax: BEQ label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bne': 'BNE - Branch if not equal\nSyntax: BNE label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bge': 'BGE - Branch if greater or equal\nSyntax: BGE label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bgt': 'BGT - Branch if greater than\nSyntax: BGT label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'ble': 'BLE - Branch if less or equal\nSyntax: BLE label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'blt': 'BLT - Branch if less than\nSyntax: BLT label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bhi': 'BHI - Branch if higher\nSyntax: BHI label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bls': 'BLS - Branch if lower or same\nSyntax: BLS label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bpl': 'BPL - Branch if plus\nSyntax: BPL label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bmi': 'BMI - Branch if minus\nSyntax: BMI label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bvc': 'BVC - Branch if overflow clear\nSyntax: BVC label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        'bvs': 'BVS - Branch if overflow set\nSyntax: BVS label\n\nTiming:\n- Byte displacement:\n  • Branch taken: 10(2/0) cycles\n  • Branch not taken: 8(2/0) cycles\n- Word displacement:\n  • Branch taken: 12(3/0) cycles\n  • Branch not taken: 8(2/0) cycles',
        
        // Jump Instructions with timing
        'jmp': 'JMP - Jump\nSyntax: JMP destination\n\nTiming:\n- Register Indirect (An): 8(2/0) cycles\n- Absolute Short: 10(2/0) cycles\n- Absolute Long: 12(3/0) cycles\n- PC Relative: 10(2/0) cycles\n- Other modes: +2-6 cycles',
        'jsr': 'JSR - Jump to subroutine\nSyntax: JSR destination\n\nTiming:\n- Register Indirect (An): 16(2/1) cycles\n- Absolute Short: 18(2/1) cycles\n- Absolute Long: 20(3/1) cycles\n- PC Relative: 18(2/1) cycles\n- Other modes: +2-6 cycles',
        'rts': 'RTS - Return from subroutine\nSyntax: RTS\n\nTiming: 16(4/0) cycles',
        'rtr': 'RTR - Return and restore condition codes\nSyntax: RTR\n\nTiming: 20(5/0) cycles',
        'rte': 'RTE - Return from exception\nSyntax: RTE\n\nTiming: 20(5/0) cycles',
        
        // Bit Manipulation Instructions with timing
        'bset': 'BSET - Test bit and set\nSyntax: BSET #bit,destination or BSET Dn,destination\n\nTiming:\n- Dynamic (Dn):\n  • Register: 8(1/0) cycles\n  • Memory: 12(2/1) cycles\n- Static (immediate):\n  • Register: 12(2/0) cycles\n  • Memory: 16(3/1) cycles',
        'bclr': 'BCLR - Test bit and clear\nSyntax: BCLR #bit,destination or BCLR Dn,destination\n\nTiming:\n- Dynamic (Dn):\n  • Register: 8(1/0) cycles\n  • Memory: 12(2/1) cycles\n- Static (immediate):\n  • Register: 12(2/0) cycles\n  • Memory: 16(3/1) cycles',
        'bchg': 'BCHG - Test bit and change\nSyntax: BCHG #bit,destination or BCHG Dn,destination\n\nTiming:\n- Dynamic (Dn):\n  • Register: 8(1/0) cycles\n  • Memory: 12(2/1) cycles\n- Static (immediate):\n  • Register: 12(2/0) cycles\n  • Memory: 16(3/1) cycles',
        
        // System Control Instructions with timing
        'trap': 'TRAP - Trap\nSyntax: TRAP #vector\n\nTiming: 34(4/3) cycles',
        'trapv': 'TRAPV - Trap on overflow\nSyntax: TRAPV\n\nTiming:\n- Trap taken: 34(4/3) cycles\n- No trap: 4(1/0) cycles',
        'chk': 'CHK - Check register against bounds\nSyntax: CHK source,Dn\n\nTiming:\n- No trap: 10(2/0) cycles + ea\n- Trap taken: 40(4/3) cycles + ea',
        'stop': 'STOP - Load status register and stop\nSyntax: STOP #data\n\nTiming: 4(1/0) cycles + internal processing until interrupt',
        'reset': 'RESET - Reset external devices\nSyntax: RESET\n\nTiming: 132(1/0) cycles',
        'nop': 'NOP - No operation\nSyntax: NOP\n\nTiming: 4(1/0) cycles',
        'illegal': 'ILLEGAL - Illegal instruction\nSyntax: ILLEGAL\n\nTiming: 34(4/3) cycles',
    };
    
    private registerDocs: { [key: string]: string } = {
        'd0': 'D0 - Data register 0 (32-bit)',
        'd1': 'D1 - Data register 1 (32-bit)',
        'd2': 'D2 - Data register 2 (32-bit)',
        'd3': 'D3 - Data register 3 (32-bit)',
        'd4': 'D4 - Data register 4 (32-bit)',
        'd5': 'D5 - Data register 5 (32-bit)',
        'd6': 'D6 - Data register 6 (32-bit)',
        'd7': 'D7 - Data register 7 (32-bit)',
        'a0': 'A0 - Address register 0 (32-bit)',
        'a1': 'A1 - Address register 1 (32-bit)',
        'a2': 'A2 - Address register 2 (32-bit)',
        'a3': 'A3 - Address register 3 (32-bit)',
        'a4': 'A4 - Address register 4 (32-bit)',
        'a5': 'A5 - Address register 5 (32-bit)',
        'a6': 'A6 - Address register 6 (32-bit)',
        'a7': 'A7 - Address register 7 (Stack Pointer)',
        'sp': 'SP - Stack Pointer (A7)',
        'pc': 'PC - Program Counter',
        'sr': 'SR - Status Register (16-bit)',
        'ccr': 'CCR - Condition Code Register (lower 8 bits of SR)',
        'usp': 'USP - User Stack Pointer',
        'ssp': 'SSP - Supervisor Stack Pointer'
    };
    
    private directiveDocs: { [key: string]: string } = {
        'org': 'ORG - Set origin address\nSyntax: ORG address',
        'equ': 'EQU - Equate symbol to value\nSyntax: symbol EQU value',
        'dc': 'DC - Define constant\nSyntax: DC.size value1,value2,...',
        'ds': 'DS - Define storage\nSyntax: DS.size count',
        'dcb': 'DCB - Define constant block\nSyntax: DCB.size count,value',
        'even': 'EVEN - Align to even address\nSyntax: EVEN',
        'align': 'ALIGN - Align to boundary\nSyntax: ALIGN boundary',
        'include': 'INCLUDE - Include file\nSyntax: INCLUDE "filename"',
        'incbin': 'INCBIN - Include binary file\nSyntax: INCBIN "filename"',
        'macro': 'MACRO - Define macro\nSyntax: name MACRO parameters',
        'endm': 'ENDM - End macro definition\nSyntax: ENDM',
        'section': 'SECTION - Define section\nSyntax: SECTION "name",type',
        'text': 'TEXT - Code section\nSyntax: SECTION TEXT or .text',
        'data': 'DATA - Data section\nSyntax: SECTION DATA or .data',
        'bss': 'BSS - Uninitialized data section\nSyntax: SECTION BSS or .bss'
    };
    
    private parseInstructionSize(line: string): string | null {
        const sizeMatch = line.match(/\.(b|w|l)\b/i);
        return sizeMatch ? sizeMatch[1].toLowerCase() : null;
    }

    private parseAddressingMode(operand: string): string {
        // Enhanced addressing mode detection
        operand = operand.trim().toLowerCase();
        if (operand.match(/^d[0-7]$/)) return 'register_direct';
        if (operand.match(/^a[0-7]$/)) return 'address_register';
        if (operand.match(/^\(a[0-7]\)$/)) return 'address_indirect';
        if (operand.match(/^-?\d+\(a[0-7]\)$/)) return 'address_displacement';
        if (operand.match(/^\(a[0-7]\)\+$/)) return 'address_postincrement';
        if (operand.match(/^-\(a[0-7]\)$/)) return 'address_predecrement';
        if (operand.match(/^#/)) return 'immediate';
        if (operand.match(/^\(pc\)/)) return 'pc_relative';
        if (operand.match(/^\$[0-9a-f]{1,4}(\.[wl])?$/)) return 'absolute_short';
        if (operand.match(/^\$[0-9a-f]{5,8}$/)) return 'absolute_long';
        return 'other';
    }

    private countRegisters(registerList: string): number {
        // Count registers in MOVEM register list
        const matches = registerList.match(/d[0-7]|a[0-7]/gi);
        return matches ? matches.length : 0;
    }

    private calculateTiming(instruction: string, context: any): TimingInfo | undefined {
        // Handle special cases first
        if (this.specialCases[instruction]) {
            return this.specialCases[instruction](context);
        }

        // Get timing table for instruction
        const timings = this.instructionTimings[instruction];
        if (!timings) return undefined;

        // Find matching timing entry
        const matchingEntry = timings.find(entry => {
            if (entry.size && entry.size !== context.size) return false;
            if (entry.src && entry.src !== this.parseAddressingMode(context.operands[0])) return false;
            if (entry.dest && entry.dest !== this.parseAddressingMode(context.operands[1])) return false;
            return true;
        });

        if (!matchingEntry) return undefined;

        // Calculate additional cycles from addressing modes
        let additionalCycles = 0;
        if (context.operands[0]) {
            additionalCycles += this.addressingModeCycles[this.parseAddressingMode(context.operands[0])] || 0;
        }
        if (context.operands[1]) {
            additionalCycles += this.addressingModeCycles[this.parseAddressingMode(context.operands[1])] || 0;
        }

        // Parse base cycles range
        const [minCycles, maxCycles] = matchingEntry.cycles.split('-').map(Number);
        const cycles = maxCycles ? 
            `${minCycles + additionalCycles}-${maxCycles + additionalCycles}` :
            (minCycles + additionalCycles).toString();

        return {
            cycles,
            readWrite: matchingEntry.readWrite
        };
    }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) return null;
        
        const word = document.getText(wordRange).toLowerCase();
        const context = this.getInstructionContext(document, position);
        
        // Get base documentation
        if (this.instructionDocs[word]) {
            let documentation = this.instructionDocs[word];
            
            // Add context-specific timing if available
            if (context) {
                const timing = this.calculateTiming(word, context);
                if (timing) {
                    documentation += `\n\nCurrent instruction timing:\n` +
                        `* Cycles: ${timing.cycles}\n` +
                        `* Read/Write: ${timing.readWrite}`;
                }
            }
            
            return new vscode.Hover(
                new vscode.MarkdownString(documentation),
                wordRange
            );
        }
        
        // Handle registers and directives
        if (this.registerDocs[word]) {
            return new vscode.Hover(
                new vscode.MarkdownString(`**${word.toUpperCase()}**\n\n${this.registerDocs[word]}`),
                wordRange
            );
        }
        
        if (this.directiveDocs[word]) {
            return new vscode.Hover(
                new vscode.MarkdownString(`**${word.toUpperCase()}**\n\n${this.directiveDocs[word]}`),
                wordRange
            );
        }
        
        // Check for user-defined symbols
        const symbolInfo = this.getSymbolInfo(document, word);
        if (symbolInfo) {
            return new vscode.Hover(
                new vscode.MarkdownString(symbolInfo),
                wordRange
            );
        }
        
        return null;
    }
    
    private getSymbolInfo(document: vscode.TextDocument, symbolName: string): string | null {
        const mainFilePath = document.uri.fsPath;
        const baseDir = path.dirname(mainFilePath);
        const projectRoot = getProjectRoot(document);
        const fallbackPath = getIncludeFallbackPath(projectRoot);
        // Recursively search for symbol info in main and included files
        const findSymbolRecursive = (filePath: string, baseDir: string, symbolName: string, visited = new Set<string>()): string | null => {
            if (visited.has(filePath)) return null;
            visited.add(filePath);
            let text: string;
            try {
                text = fs.readFileSync(filePath, 'utf8');
            } catch {
                return null;
            }
            const lines = text.split('\n');
            const escapedSymbol = this.escapeRegex(symbolName);
            // Local/global label and EQU
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const labelMatch = line.match(new RegExp(`^\s*(${escapedSymbol})\s*:`, 'i'));
                if (labelMatch) {
                    return `**${symbolName}** (Label)\n\nDefined at line ${i + 1} in ${path.basename(filePath)}`;
                }
                const equMatch = line.match(new RegExp(`^\s*(${escapedSymbol})\s+equ\s+(.+)`, 'i'));
                if (equMatch) {
                    const value = equMatch[2].split(';')[0].trim();
                    return `**${symbolName}** (Constant)\n\nValue: \`${value}\`\nDefined at line ${i + 1} in ${path.basename(filePath)}`;
                }
            }
            // Scan for includes
            for (let i = 0; i < lines.length; i++) {
                const includeMatch = lines[i].match(/^\s*include\s+["']?([^"'\s]+)["']?/i);
                if (includeMatch) {
                    const includePath = includeMatch[1];
                    const resolved = resolveIncludePath(includePath, baseDir, projectRoot, fallbackPath);
                    if (resolved) {
                        const found = findSymbolRecursive(resolved, path.dirname(resolved), symbolName, visited);
                        if (found) return found;
                    }
                }
            }
            return null;
        };
        return findSymbolRecursive(mainFilePath, baseDir, symbolName);
    }
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private getInstructionDocs(instruction: string): string {
        return this.instructionDocs[instruction.toLowerCase()] || '';
    }

    private getInstructionContext(document: vscode.TextDocument, position: vscode.Position): { 
        instruction: string;
        size: string | null;
        operands: string[];
        line: string;
    } | null {
        const line = document.lineAt(position.line).text;
        const word = document.getText(document.getWordRangeAtPosition(position));
        
        // Match instruction and its operands
        const instructionMatch = line.match(new RegExp(`\\b${this.escapeRegex(word)}(?:\\.(b|w|l))?\\s+([^;]+)`, 'i'));
        if (!instructionMatch) return null;

        const size = this.parseInstructionSize(line);
        const operandsPart = instructionMatch[instructionMatch.length - 1];
        const operands = operandsPart.split(',').map(op => op.trim());

        return {
            instruction: word.toLowerCase(),
            size: size || 'w', // Default to word size if not specified
            operands,
            line
        };
    }
}