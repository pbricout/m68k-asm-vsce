import * as vscode from 'vscode';

export class M68kHoverProvider implements vscode.HoverProvider {
    
    private instructionDocs: { [key: string]: string } = {
        // Data Movement Instructions
        'move': 'MOVE - Copy data from source to destination\nSyntax: MOVE.size source,destination',
        'movea': 'MOVEA - Move address to address register\nSyntax: MOVEA.size source,An',
        'movem': 'MOVEM - Move multiple registers\nSyntax: MOVEM.size register_list,destination',
        'movep': 'MOVEP - Move peripheral data\nSyntax: MOVEP.size Dn,d(An) or MOVEP.size d(An),Dn',
        'moveq': 'MOVEQ - Move quick (8-bit immediate to 32-bit register)\nSyntax: MOVEQ #data,Dn',
        'lea': 'LEA - Load effective address\nSyntax: LEA source,An',
        'pea': 'PEA - Push effective address\nSyntax: PEA source',
        'swap': 'SWAP - Swap register halves\nSyntax: SWAP Dn',
        'exg': 'EXG - Exchange registers\nSyntax: EXG Rx,Ry',
        
        // Arithmetic Instructions
        'add': 'ADD - Add binary\nSyntax: ADD.size source,destination',
        'adda': 'ADDA - Add address\nSyntax: ADDA.size source,An',
        'addi': 'ADDI - Add immediate\nSyntax: ADDI.size #data,destination',
        'addq': 'ADDQ - Add quick (3-bit immediate)\nSyntax: ADDQ.size #data,destination',
        'addx': 'ADDX - Add extended (with carry)\nSyntax: ADDX.size source,destination',
        'sub': 'SUB - Subtract binary\nSyntax: SUB.size source,destination',
        'suba': 'SUBA - Subtract address\nSyntax: SUBA.size source,An',
        'subi': 'SUBI - Subtract immediate\nSyntax: SUBI.size #data,destination',
        'subq': 'SUBQ - Subtract quick (3-bit immediate)\nSyntax: SUBQ.size #data,destination',
        'subx': 'SUBX - Subtract extended (with borrow)\nSyntax: SUBX.size source,destination',
        'muls': 'MULS - Multiply signed\nSyntax: MULS.w source,Dn',
        'mulu': 'MULU - Multiply unsigned\nSyntax: MULU.w source,Dn',
        'divs': 'DIVS - Divide signed\nSyntax: DIVS.w source,Dn',
        'divu': 'DIVU - Divide unsigned\nSyntax: DIVU.w source,Dn',
        'neg': 'NEG - Negate\nSyntax: NEG.size destination',
        'negx': 'NEGX - Negate with extend\nSyntax: NEGX.size destination',
        'clr': 'CLR - Clear operand\nSyntax: CLR.size destination',
        'ext': 'EXT - Sign extend\nSyntax: EXT.size Dn',
        
        // Logical Instructions
        'and': 'AND - Logical AND\nSyntax: AND.size source,destination',
        'andi': 'ANDI - AND immediate\nSyntax: ANDI.size #data,destination',
        'or': 'OR - Logical inclusive OR\nSyntax: OR.size source,destination',
        'ori': 'ORI - OR immediate\nSyntax: ORI.size #data,destination',
        'eor': 'EOR - Logical exclusive OR\nSyntax: EOR.size source,destination',
        'eori': 'EORI - EOR immediate\nSyntax: EORI.size #data,destination',
        'not': 'NOT - Logical complement\nSyntax: NOT.size destination',
        
        // Shift and Rotate Instructions
        'asl': 'ASL - Arithmetic shift left\nSyntax: ASL.size #count,Dn or ASL.size Dn,Dn',
        'asr': 'ASR - Arithmetic shift right\nSyntax: ASR.size #count,Dn or ASR.size Dn,Dn',
        'lsl': 'LSL - Logical shift left\nSyntax: LSL.size #count,Dn or LSL.size Dn,Dn',
        'lsr': 'LSR - Logical shift right\nSyntax: LSR.size #count,Dn or LSR.size Dn,Dn',
        'rol': 'ROL - Rotate left\nSyntax: ROL.size #count,Dn or ROL.size Dn,Dn',
        'ror': 'ROR - Rotate right\nSyntax: ROR.size #count,Dn or ROR.size Dn,Dn',
        'roxl': 'ROXL - Rotate left with extend\nSyntax: ROXL.size #count,Dn or ROXL.size Dn,Dn',
        'roxr': 'ROXR - Rotate right with extend\nSyntax: ROXR.size #count,Dn or ROXR.size Dn,Dn',
        
        // Compare Instructions
        'cmp': 'CMP - Compare\nSyntax: CMP.size source,destination',
        'cmpa': 'CMPA - Compare address\nSyntax: CMPA.size source,An',
        'cmpi': 'CMPI - Compare immediate\nSyntax: CMPI.size #data,destination',
        'cmpm': 'CMPM - Compare memory\nSyntax: CMPM.size (An)+,(An)+',
        'tst': 'TST - Test operand\nSyntax: TST.size destination',
        
        // Branch Instructions
        'bra': 'BRA - Branch always\nSyntax: BRA label',
        'bsr': 'BSR - Branch to subroutine\nSyntax: BSR label',
        'bcc': 'BCC - Branch if carry clear\nSyntax: BCC label',
        'bcs': 'BCS - Branch if carry set\nSyntax: BCS label',
        'beq': 'BEQ - Branch if equal\nSyntax: BEQ label',
        'bne': 'BNE - Branch if not equal\nSyntax: BNE label',
        'bge': 'BGE - Branch if greater or equal\nSyntax: BGE label',
        'bgt': 'BGT - Branch if greater than\nSyntax: BGT label',
        'ble': 'BLE - Branch if less or equal\nSyntax: BLE label',
        'blt': 'BLT - Branch if less than\nSyntax: BLT label',
        'bhi': 'BHI - Branch if higher\nSyntax: BHI label',
        'bls': 'BLS - Branch if lower or same\nSyntax: BLS label',
        'bpl': 'BPL - Branch if plus\nSyntax: BPL label',
        'bmi': 'BMI - Branch if minus\nSyntax: BMI label',
        'bvc': 'BVC - Branch if overflow clear\nSyntax: BVC label',
        'bvs': 'BVS - Branch if overflow set\nSyntax: BVS label',
        
        // Jump Instructions
        'jmp': 'JMP - Jump\nSyntax: JMP destination',
        'jsr': 'JSR - Jump to subroutine\nSyntax: JSR destination',
        'rts': 'RTS - Return from subroutine\nSyntax: RTS',
        'rtr': 'RTR - Return and restore condition codes\nSyntax: RTR',
        'rte': 'RTE - Return from exception\nSyntax: RTE',
        
        // Bit Manipulation Instructions
        'btst': 'BTST - Test bit\nSyntax: BTST #bit,destination or BTST Dn,destination',
        'bset': 'BSET - Test bit and set\nSyntax: BSET #bit,destination or BSET Dn,destination',
        'bclr': 'BCLR - Test bit and clear\nSyntax: BCLR #bit,destination or BCLR Dn,destination',
        'bchg': 'BCHG - Test bit and change\nSyntax: BCHG #bit,destination or BCHG Dn,destination',
        
        // System Control Instructions
        'trap': 'TRAP - Trap\nSyntax: TRAP #vector',
        'trapv': 'TRAPV - Trap on overflow\nSyntax: TRAPV',
        'chk': 'CHK - Check register against bounds\nSyntax: CHK source,Dn',
        'stop': 'STOP - Load status register and stop\nSyntax: STOP #data',
        'reset': 'RESET - Reset external devices\nSyntax: RESET',
        'nop': 'NOP - No operation\nSyntax: NOP',
        'illegal': 'ILLEGAL - Illegal instruction\nSyntax: ILLEGAL'
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
    
    provideHover(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        
        const word = document.getText(wordRange).toLowerCase();
        
        // Check for instruction documentation
        if (this.instructionDocs[word]) {
            return new vscode.Hover(
                new vscode.MarkdownString(`**${word.toUpperCase()}**\n\n${this.instructionDocs[word]}`),
                wordRange
            );
        }
        
        // Check for register documentation
        if (this.registerDocs[word]) {
            return new vscode.Hover(
                new vscode.MarkdownString(`**${word.toUpperCase()}**\n\n${this.registerDocs[word]}`),
                wordRange
            );
        }
        
        // Check for directive documentation
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
        const text = document.getText();
        const lines = text.split('\n');
        
        const escapedSymbol = this.escapeRegex(symbolName);
        
        // Look for label definition
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const labelMatch = line.match(new RegExp(`^\\s*(${escapedSymbol})\\s*:`, 'i'));
            if (labelMatch) {
                return `**${symbolName}** (Label)\n\nDefined at line ${i + 1}`;
            }
            
            // Look for EQU definition
            const equMatch = line.match(new RegExp(`^\\s*(${escapedSymbol})\\s+equ\\s+(.+)`, 'i'));
            if (equMatch) {
                const value = equMatch[2].split(';')[0].trim(); // Remove comment
                return `**${symbolName}** (Constant)\n\nValue: \`${value}\`\nDefined at line ${i + 1}`;
            }
        }
        
        return null;
    }
      private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}