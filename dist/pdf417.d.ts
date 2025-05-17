/**
 * PDF417 - 2D Barcode generator
 *
 * TypeScript implementation of PDF417 barcode generator
 */
export interface PDF417Options {
    rowHeight?: number;
    quietH?: number;
    quietV?: number;
    errorCorrectionLevel?: number;
}
export declare class PDF417 {
    private static readonly ROWHEIGHT;
    private static readonly QUIETH;
    private static readonly QUIETV;
    private static readonly START_PATTERN;
    private static readonly STOP_PATTERN;
    private static readonly ERROR_CORRECTION_LEVEL;
    private static readonly TEXT_SUBMODES;
    private static readonly TEXT_LATCH;
    private options;
    private barcodeArray;
    constructor(options?: PDF417Options);
    /**
     * Generate PDF417 barcode
     * @param data Data to encode
     * @returns 2D array representing the barcode
     */
    generate(data: string): number[][];
    /**
     * Initialize barcode array with quiet zones
     */
    private initializeBarcodeArray;
    /**
     * Encode data into codewords
     * @param data Data to encode
     * @returns Array of codewords
     */
    private encodeData;
    /**
     * Find the best mode for a character
     * @param char Character code
     * @returns Best mode index
     */
    private findBestMode;
    /**
     * Get mode change codewords
     * @param fromMode Current mode
     * @param toMode Target mode
     * @returns Array of codewords for mode change
     */
    private getModeChange;
    /**
     * Get codeword for a character in a specific mode
     * @param char Character code
     * @param mode Current mode
     * @returns Codeword or null if not found
     */
    private getCodeword;
    /**
     * Add start pattern to barcode
     */
    private addStartPattern;
    /**
     * Add codewords to barcode
     * @param codewords Array of codewords
     */
    private addCodewords;
    /**
     * Add a single codeword to a row
     * @param row Row index
     * @param col Column index
     * @param codeword Codeword to add
     */
    private addCodewordToRow;
    /**
     * Convert codeword to binary pattern
     * @param codeword Codeword to convert
     * @returns Binary pattern
     */
    codewordToPattern(codeword: number): number[];
    /**
     * Generate error correction codewords
     * @param codewords Data codewords
     * @returns Error correction codewords
     */
    private generateErrorCorrectionCodewords;
    /**
     * Get error correction generator polynomial
     * @param level Error correction level
     * @returns Generator polynomial coefficients
     */
    private getErrorCorrectionGenerator;
    /**
     * Add stop pattern to barcode
     */
    private addStopPattern;
    /**
     * Get the barcode array
     * @returns 2D array representing the barcode
     */
    getBarcodeArray(): number[][];
    /**
     * Get the barcode as a string
     * @returns String representation of the barcode
     */
    toString(): string;
}
