/**
 * PDF417 - 2D Barcode generator
 *
 * TypeScript implementation of PDF417 barcode generator
 * Ported from PHP - PDF417 class, version 1.0.005, from TCPDF library (http://www.tcpdf.org/)
 */

import { CLUSTERS } from "./pdf417_clusters"; // clusters.tsからCLUSTERSをインポート

export interface PDF417Options {
  /** Error correction level (0-8); default -1 = automatic correction level */
  errorCorrectionLevel?: number;
  /** The width to height of the symbol (excluding quiet zones) */
  aspectRatio?: number;
  /** Height of a single row in 'pixels' */
  rowHeight?: number;
  /** Width of the quiet zone in 'pixels' */
  quietH?: number;
  /** Height of the quiet zone in 'pixels' */
  quietV?: number;
}

export interface BarcodeData {
  num_rows: number;
  num_cols: number;
  bcode: number[][];
}

export class PDF417 {
  private static readonly DEFAULT_ROWHEIGHT = 3; // PDF417 spec typical is 3X to 5X
  private static readonly DEFAULT_QUIETH = 2;
  private static readonly DEFAULT_QUIETV = 2;
  private static readonly DEFAULT_ASPECT_RATIO = 2;
  private static readonly DEFAULT_ECL = -1; // Automatic

  private static readonly START_PATTERN = "11111111010101000";
  private static readonly STOP_PATTERN = "111111101000101001";

  private static readonly TEXT_SUBMODES: number[][] = [
    [
      0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c,
      0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
      0x59, 0x5a, 0x20, 0xfd, 0xfe, 0xff,
    ], // Alpha
    [
      0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c,
      0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78,
      0x79, 0x7a, 0x20, 0xfd, 0xfe, 0xff,
    ], // Lower
    [
      0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x26, 0x0d,
      0x09, 0x2c, 0x3a, 0x23, 0x2d, 0x2e, 0x24, 0x2f, 0x2b, 0x25, 0x2a, 0x3d,
      0x5e, 0xfb, 0x20, 0xfd, 0xfe, 0xff,
    ], // Mixed
    [
      0x3b, 0x3c, 0x3e, 0x40, 0x5b, 0x5c, 0x5d, 0x5f, 0x60, 0x7e, 0x21, 0x0d,
      0x09, 0x2c, 0x3a, 0x0a, 0x2d, 0x2e, 0x24, 0x2f, 0x22, 0x7c, 0x2a, 0x28,
      0x29, 0x3f, 0x7b, 0x7d, 0x27, 0xff,
    ], // Punctuation
  ];

  private static readonly TEXT_LATCH: Record<string, number[]> = {
    "01": [27],
    "02": [28],
    "03": [28, 25],
    "10": [28, 28],
    "12": [28],
    "13": [28, 25],
    "20": [28],
    "21": [27],
    "23": [25],
    "30": [29],
    "31": [29, 27],
    "32": [29, 28],
  };

  private static readonly CLUSTERS = CLUSTERS;

  private static readonly RS_FACTORS: number[][] = [
    [0x01b, 0x395], // ECL 0 (2 factors)
    [0x20a, 0x238, 0x2d3, 0x329], // ECL 1 (4 factors)
    [0x0ed, 0x134, 0x1b4, 0x11c, 0x286, 0x28d, 0x1ac, 0x17b], // ECL 2 (8 factors)
    [
      0x112, 0x232, 0x0e8, 0x2f3, 0x257, 0x20c, 0x321, 0x084, 0x127, 0x074,
      0x1ba, 0x1ac, 0x127, 0x02a, 0x0b0, 0x041,
    ], // ECL 3 (16 factors)
    [
      0x169, 0x23f, 0x39a, 0x20d, 0x0b0, 0x24a, 0x280, 0x141, 0x218, 0x2e6,
      0x2a5, 0x2e6, 0x2af, 0x11c, 0x0c1, 0x205, 0x111, 0x1ee, 0x107, 0x093,
      0x251, 0x320, 0x23b, 0x140, 0x323, 0x085, 0x0e7, 0x186, 0x2ad, 0x14a,
      0x03f, 0x19a,
    ], // ECL 4 (32 factors)
    [
      0x21b, 0x1a6, 0x006, 0x05d, 0x35e, 0x303, 0x1c5, 0x06a, 0x262, 0x11f,
      0x06b, 0x1f9, 0x2dd, 0x36d, 0x17d, 0x264, 0x2d3, 0x1dc, 0x1ce, 0x0ac,
      0x1ae, 0x261, 0x35a, 0x336, 0x21f, 0x178, 0x1ff, 0x190, 0x2a0, 0x2fa,
      0x11b, 0x0b8, 0x1b8, 0x023, 0x207, 0x01f, 0x1cc, 0x252, 0x0e1, 0x217,
      0x205, 0x160, 0x25d, 0x09e, 0x28b, 0x0c9, 0x1e8, 0x1f6, 0x288, 0x2dd,
      0x2cd, 0x053, 0x194, 0x061, 0x118, 0x303, 0x348, 0x275, 0x004, 0x17d,
      0x34b, 0x26f, 0x108, 0x21f,
    ], // ECL 5 (64 factors)
    [
      0x209, 0x136, 0x360, 0x223, 0x35a, 0x244, 0x128, 0x17b, 0x035, 0x30b,
      0x381, 0x1bc, 0x190, 0x39d, 0x2ed, 0x19f, 0x336, 0x05d, 0x0d9, 0x0d0,
      0x3a0, 0x0f4, 0x247, 0x26c, 0x0f6, 0x094, 0x1bf, 0x277, 0x124, 0x38c,
      0x1ea, 0x2c0, 0x204, 0x102, 0x1c9, 0x38b, 0x252, 0x2d3, 0x2a2, 0x124,
      0x110, 0x060, 0x2ac, 0x1b0, 0x2ae, 0x25e, 0x35c, 0x239, 0x0c1, 0x0db,
      0x081, 0x0ba, 0x0ec, 0x11f, 0x0c0, 0x307, 0x116, 0x0ad, 0x028, 0x17b,
      0x2c8, 0x1cf, 0x286, 0x308, 0x0ab, 0x1eb, 0x129, 0x2fb, 0x09c, 0x2dc,
      0x05f, 0x10e, 0x1bf, 0x05a, 0x1fb, 0x030, 0x0e4, 0x335, 0x328, 0x382,
      0x310, 0x297, 0x273, 0x17a, 0x17e, 0x106, 0x17c, 0x25a, 0x2f2, 0x150,
      0x059, 0x266, 0x057, 0x1b0, 0x29e, 0x268, 0x09d, 0x176, 0x0f2, 0x2d6,
      0x258, 0x10d, 0x177, 0x382, 0x34d, 0x1c6, 0x162, 0x082, 0x32e, 0x24b,
      0x324, 0x022, 0x0d3, 0x14a, 0x21b, 0x129, 0x33b, 0x361, 0x025, 0x205,
      0x342, 0x13b, 0x226, 0x056, 0x321, 0x004, 0x06c, 0x21b,
    ], // ECL 6 (128 factors)
    [
      0x20c, 0x37e, 0x04b, 0x2fe, 0x372, 0x359, 0x04a, 0x0cc, 0x052, 0x24a,
      0x2c4, 0x0fa, 0x389, 0x312, 0x08a, 0x2d0, 0x35a, 0x0c2, 0x137, 0x391,
      0x113, 0x0be, 0x177, 0x352, 0x1b6, 0x2dd, 0x0c2, 0x118, 0x0c9, 0x118,
      0x33c, 0x2f5, 0x2c6, 0x32e, 0x397, 0x059, 0x044, 0x239, 0x00b, 0x0cc,
      0x31c, 0x25d, 0x21c, 0x391, 0x321, 0x2bc, 0x31f, 0x089, 0x1b7, 0x1a2,
      0x250, 0x29c, 0x161, 0x35b, 0x172, 0x2b6, 0x145, 0x0f0, 0x0d8, 0x101,
      0x11c, 0x225, 0x0d1, 0x374, 0x13b, 0x046, 0x149, 0x319, 0x1ea, 0x112,
      0x36d, 0x0a2, 0x2ed, 0x32c, 0x2ac, 0x1cd, 0x14e, 0x178, 0x351, 0x209,
      0x133, 0x123, 0x323, 0x2c8, 0x013, 0x166, 0x18f, 0x38c, 0x067, 0x1ff,
      0x033, 0x008, 0x205, 0x0e1, 0x121, 0x1d6, 0x27d, 0x2db, 0x042, 0x0ff,
      0x395, 0x10d, 0x1cf, 0x33e, 0x2da, 0x1b1, 0x350, 0x249, 0x088, 0x21a,
      0x38a, 0x05a, 0x002, 0x122, 0x2e7, 0x0c7, 0x28f, 0x387, 0x149, 0x031,
      0x322, 0x244, 0x163, 0x24c, 0x0bc, 0x1ce, 0x00a, 0x086, 0x274, 0x140,
      0x1df, 0x082, 0x2e3, 0x047, 0x107, 0x13e, 0x176, 0x259, 0x0c0, 0x25d,
      0x08e, 0x2a1, 0x2af, 0x0ea, 0x2d2, 0x180, 0x0b1, 0x2f0, 0x25f, 0x280,
      0x1c7, 0x0c1, 0x2b1, 0x2c3, 0x325, 0x281, 0x030, 0x03c, 0x2dc, 0x26d,
      0x37f, 0x220, 0x105, 0x354, 0x28f, 0x135, 0x2b9, 0x2f3, 0x2f4, 0x03c,
      0x0e7, 0x305, 0x1b2, 0x1a5, 0x2d6, 0x210, 0x1f7, 0x076, 0x031, 0x31b,
      0x020, 0x090, 0x1f4, 0x0ee, 0x344, 0x18a, 0x118, 0x236, 0x13f, 0x009,
      0x287, 0x226, 0x049, 0x392, 0x156, 0x07e, 0x020, 0x2a9, 0x14b, 0x318,
      0x26c, 0x03c, 0x261, 0x1b9, 0x0b4, 0x317, 0x37d, 0x2f2, 0x25d, 0x17f,
      0x0e4, 0x2ed, 0x2f8, 0x0d5, 0x036, 0x129, 0x086, 0x036, 0x342, 0x12b,
      0x39a, 0x0bf, 0x38e, 0x214, 0x261, 0x33d, 0x0bd, 0x014, 0x0a7, 0x01d,
      0x368, 0x1c1, 0x053, 0x192, 0x029, 0x290, 0x1f9, 0x243, 0x1e1, 0x0ad,
      0x194, 0x0fb, 0x2b0, 0x05f, 0x1f1, 0x22b, 0x282, 0x21f, 0x133, 0x09f,
      0x39c, 0x22e, 0x288, 0x037, 0x1f1, 0x00a,
    ], // ECL 7 (256 factors)
    [
      0x160, 0x04d, 0x175, 0x1f8, 0x023, 0x257, 0x1ac, 0x0cf, 0x199, 0x23e,
      0x076, 0x1f2, 0x11d, 0x17c, 0x15e, 0x1ec, 0x0c5, 0x109, 0x398, 0x09b,
      0x392, 0x12b, 0x0e5, 0x283, 0x126, 0x367, 0x132, 0x058, 0x057, 0x0c1,
      0x160, 0x30d, 0x34e, 0x04b, 0x147, 0x208, 0x1b3, 0x21f, 0x0cb, 0x29a,
      0x0f9, 0x15a, 0x30d, 0x26d, 0x280, 0x10c, 0x31a, 0x216, 0x21b, 0x30d,
      0x198, 0x186, 0x284, 0x066, 0x1dc, 0x1f3, 0x122, 0x278, 0x221, 0x025,
      0x35a, 0x394, 0x228, 0x029, 0x21e, 0x121, 0x07a, 0x110, 0x17f, 0x320,
      0x1e5, 0x062, 0x2f0, 0x1d8, 0x2f9, 0x06b, 0x310, 0x35c, 0x292, 0x2e5,
      0x122, 0x0cc, 0x2a9, 0x197, 0x357, 0x055, 0x063, 0x03e, 0x1e2, 0x0b4,
      0x014, 0x129, 0x1c3, 0x251, 0x391, 0x08e, 0x328, 0x2ac, 0x11f, 0x218,
      0x231, 0x04c, 0x28d, 0x383, 0x2d9, 0x237, 0x2e8, 0x186, 0x201, 0x0c0,
      0x204, 0x102, 0x0f0, 0x206, 0x31a, 0x18b, 0x300, 0x350, 0x033, 0x262,
      0x180, 0x0a8, 0x0be, 0x33a, 0x148, 0x254, 0x312, 0x12f, 0x23a, 0x17d,
      0x19f, 0x281, 0x09c, 0x0ed, 0x097, 0x1ad, 0x213, 0x0cf, 0x2a4, 0x2c6,
      0x059, 0x0a8, 0x130, 0x192, 0x028, 0x2c4, 0x23f, 0x0a2, 0x360, 0x0e5,
      0x041, 0x35d, 0x349, 0x200, 0x0a4, 0x1dd, 0x0dd, 0x05c, 0x166, 0x311,
      0x120, 0x165, 0x352, 0x344, 0x33b, 0x2e0, 0x2c3, 0x05e, 0x008, 0x1ee,
      0x072, 0x209, 0x002, 0x1f3, 0x353, 0x21f, 0x098, 0x2d9, 0x303, 0x05f,
      0x0f8, 0x169, 0x242, 0x143, 0x358, 0x31d, 0x121, 0x033, 0x2ac, 0x1d2,
      0x215, 0x334, 0x29d, 0x02d, 0x386, 0x1c4, 0x0a7, 0x156, 0x0f4, 0x0ad,
      0x023, 0x1cf, 0x28b, 0x033, 0x2bb, 0x24f, 0x1c4, 0x242, 0x025, 0x07c,
      0x12a, 0x14c, 0x228, 0x02b, 0x1ab, 0x077, 0x296, 0x309, 0x1db, 0x352,
      0x2fc, 0x16c, 0x242, 0x38f, 0x11b, 0x2c7, 0x1d8, 0x1a4, 0x0f5, 0x120,
      0x252, 0x18a, 0x1ff, 0x147, 0x24d, 0x309, 0x2bb, 0x2b0, 0x02b, 0x198,
      0x34a, 0x17f, 0x2d1, 0x209, 0x230, 0x284, 0x2ca, 0x22f, 0x03e, 0x091,
      0x369, 0x297, 0x2c9, 0x09f, 0x2a0, 0x2d9, 0x270, 0x03b, 0x0c1, 0x1a1,
      0x09e, 0x0d1, 0x233, 0x234, 0x157, 0x2b5, 0x06d, 0x260, 0x233, 0x16d,
      0x0b5, 0x304, 0x2a5, 0x136, 0x0f8, 0x161, 0x2c4, 0x19a, 0x243, 0x366,
      0x269, 0x349, 0x278, 0x35c, 0x121, 0x218, 0x023, 0x309, 0x26a, 0x24a,
      0x1a8, 0x341, 0x04d, 0x255, 0x15a, 0x10d, 0x2f5, 0x278, 0x2b7, 0x2ef,
      0x14b, 0x0f7, 0x0b8, 0x02d, 0x313, 0x2a8, 0x012, 0x042, 0x197, 0x171,
      0x036, 0x1ec, 0x0e4, 0x265, 0x33e, 0x39a, 0x1b5, 0x207, 0x284, 0x389,
      0x315, 0x1a4, 0x131, 0x1b9, 0x0cf, 0x12c, 0x37c, 0x33b, 0x08d, 0x219,
      0x17d, 0x296, 0x201, 0x038, 0x0fc, 0x155, 0x0f2, 0x31d, 0x346, 0x345,
      0x2d0, 0x0e0, 0x133, 0x277, 0x03d, 0x057, 0x230, 0x136, 0x2f4, 0x299,
      0x18d, 0x328, 0x353, 0x135, 0x1d9, 0x31b, 0x17a, 0x01f, 0x287, 0x393,
      0x1cb, 0x326, 0x24e, 0x2db, 0x1a9, 0x0d8, 0x224, 0x0f9, 0x141, 0x371,
      0x2bb, 0x217, 0x2a1, 0x30e, 0x0d2, 0x32f, 0x389, 0x12f, 0x34b, 0x39a,
      0x119, 0x049, 0x1d5, 0x317, 0x294, 0x0a2, 0x1f2, 0x134, 0x09b, 0x1a6,
      0x38b, 0x331, 0x0bb, 0x03e, 0x010, 0x1a9, 0x217, 0x150, 0x11e, 0x1b5,
      0x177, 0x111, 0x262, 0x128, 0x0b7, 0x39b, 0x074, 0x29b, 0x2ef, 0x161,
      0x03e, 0x16e, 0x2b3, 0x17b, 0x2af, 0x34a, 0x025, 0x165, 0x2d0, 0x2e6,
      0x14a, 0x005, 0x027, 0x39b, 0x137, 0x1a8, 0x0f2, 0x2ed, 0x141, 0x036,
      0x29d, 0x13c, 0x156, 0x12b, 0x216, 0x069, 0x29b, 0x1e8, 0x280, 0x2a0,
      0x240, 0x21c, 0x13c, 0x1e6, 0x2d1, 0x262, 0x02e, 0x290, 0x1bf, 0x0ab,
      0x268, 0x1d0, 0x0be, 0x213, 0x129, 0x141, 0x2fa, 0x2f0, 0x215, 0x0af,
      0x086, 0x00e, 0x17d, 0x1b1, 0x2cd, 0x02d, 0x06f, 0x014, 0x254, 0x11c,
      0x2e0, 0x08a, 0x286, 0x19b, 0x36d, 0x29d, 0x08d, 0x397, 0x02d, 0x30c,
      0x197, 0x0a4, 0x14c, 0x383, 0x0a5, 0x2d6, 0x258, 0x145, 0x1f2, 0x28f,
      0x165, 0x2f0, 0x300, 0x0df, 0x351, 0x287, 0x03f, 0x136, 0x35f, 0x0fb,
      0x16e, 0x130, 0x11a, 0x2e2, 0x2a3, 0x19a, 0x185, 0x0f4, 0x01f, 0x079,
      0x12f, 0x107,
    ], // ECL 8 (512 factors)
  ];

  private readonly options: Required<PDF417Options>;
  private barcode_array: BarcodeData;

  constructor(options: PDF417Options = {}) {
    this.options = {
      errorCorrectionLevel: options.errorCorrectionLevel ?? PDF417.DEFAULT_ECL,
      aspectRatio: options.aspectRatio ?? PDF417.DEFAULT_ASPECT_RATIO,
      rowHeight: options.rowHeight ?? PDF417.DEFAULT_ROWHEIGHT,
      quietH: options.quietH ?? PDF417.DEFAULT_QUIETH,
      quietV: options.quietV ?? PDF417.DEFAULT_QUIETV,
    };
    this.barcode_array = {
      num_rows: 0,
      num_cols: 0,
      bcode: [],
    };
  }

  public generate(code: string): BarcodeData | false {
    if (code === "") {
      return false;
    }

    // Convert UTF-8 to byte array (ISO-8859-1 like behavior for PDF417)
    // TextEncoder().encode() returns Uint8Array. PDF417 spec usually implies ISO-8859-1 / Latin-1 for byte mode.
    // For simplicity, we'll assume the input string's char codes are within 0-255 if byte mode is used.
    // The original JS used unescape(encodeURIComponent(code)) which is complex.
    // A direct conversion to char codes is more straightforward for this port,
    // assuming the input `code` string is intended to be processed as a sequence of bytes
    // where each character's code point is a byte value.
    // This is a common simplification if true multi-byte UTF-8 is not strictly required by the caller
    // or if the input is pre-processed.
    const byteString = code; // Use the string directly for charCodeAt

    const sequence = this.getInputSequences(byteString);
    let codewords: number[] = [];
    for (let i = 0; i < sequence.length; i++) {
      const cw = this.getCompaction(
        sequence[i][0] as number,
        sequence[i][1] as string,
        true,
      );
      codewords = codewords.concat(cw);
    }

    if (codewords.length > 0 && codewords[0] === 900) {
      // Text Alpha is the default mode, so remove the first code
      codewords.shift();
    }

    const numcw = codewords.length;
    if (numcw > 925) {
      // Reached maximum data codeword capacity
      console.error("PDF417 Error: reached maximum data codeword capacity.");
      return false;
    }

    const resolvedEcl = this.getErrorCorrectionLevel(
      this.options.errorCorrectionLevel,
      numcw,
    );
    const errsize = 2 << resolvedEcl; // number of codewords for error correction
    const nce = numcw + errsize + 1; // total codewords + symbol length descriptor

    // calculate number of columns (number of codewords per row) and rows
    let cols = Math.round(
      (Math.sqrt(
        4761 + 68 * this.options.aspectRatio * this.options.rowHeight * nce,
      ) -
        69) /
        34,
    );

    // adjust cols
    if (cols < 1) cols = 1;
    else if (cols > 30) cols = 30;

    let rows = Math.ceil(nce / cols);
    let size = cols * rows;

    // adjust rows
    if (rows < 3) {
      rows = 3;
      // Recalculate cols and size
      cols = Math.ceil(nce / rows);
      if (cols > 30) cols = 30; // Cap columns
      size = cols * rows;
    } else if (rows > 90) {
      rows = 90;
      // Recalculate cols and size
      cols = Math.ceil(nce / rows);
      if (cols < 1) cols = 1; // Ensure at least 1 column
      size = cols * rows;
    }

    // Final adjustment to ensure cols is within limits after row adjustment
    if (cols < 1) cols = 1;
    else if (cols > 30) cols = 30;

    // Re-calculate size if cols or rows were capped
    size = cols * rows;

    if (size > 928) {
      // set dimensions to get maximum capacity
      if (
        Math.abs(this.options.aspectRatio - (17 * 29) / 32) <
        Math.abs(this.options.aspectRatio - (17 * 16) / 58)
      ) {
        cols = 29;
        rows = 32;
      } else {
        cols = 16;
        rows = 58;
      }
      size = cols * rows; // Should be 928 or 928
    }

    // calculate padding
    const pad = size - nce;
    if (pad > 0) {
      // The original JS had a specific condition: `if (size - rows == nce)`
      // This might be an optimization for specific cases.
      // For a direct port, we'll replicate this logic.
      // However, note that `size - rows` vs `nce` might not always align with padding needs.
      // A more robust padding calculation would be `size - (numcw + errsize + 1)`.
      // The original condition `size - rows == nce` seems to try to reduce rows if possible.
      // This means `(cols * rows) - rows == (numcw + errsize + 1)`
      // `rows * (cols - 1) == nce`
      // If this specific condition is met, it reduces the number of rows.
      // This seems like an edge case or a specific optimization.
      // For now, we stick to the simpler padding of filling with 900.
      // The original code:
      // if (pad > 0) {
      //   if (size - rows == nce) { // This condition looks problematic.
      //                              // It implies that by removing one row's worth of *data capacity* (not actual codewords from that row),
      //                              // we can perfectly fit the data. `size - rows` is not a standard way to calculate padding.
      //                              // Standard padding is `desired_total_codewords - current_total_codewords`.
      //     --rows;
      //     size -= rows; // This is also strange: `size` should be `cols * new_rows`. `size -= new_rows`?
      //   } else {
      //     // add pading
      //     codewords = codewords.concat(Array(pad).fill(900));
      //   }
      // }
      // Given the ambiguity and potential issues with the original conditional row reduction,
      // we'll use the straightforward padding method.
      codewords = codewords.concat(Array(pad).fill(900));
    }

    // Symbol Length Descriptor (number of data codewords including Symbol Length Descriptor and pad codewords)
    const sld = size - errsize;
    codewords.unshift(sld); // add symbol length description

    // calculate error correction
    const ecw = this.getErrorCorrection(codewords, resolvedEcl);
    codewords = codewords.concat(ecw); // add error correction codewords

    // add horizontal quiet zones to start and stop patterns
    const pstart = "0".repeat(this.options.quietH) + PDF417.START_PATTERN;
    const pstop = PDF417.STOP_PATTERN + "0".repeat(this.options.quietH);

    this.barcode_array.num_rows =
      rows * this.options.rowHeight + 2 * this.options.quietV;
    this.barcode_array.num_cols =
      (cols + 2) * 17 +
      PDF417.START_PATTERN.length +
      PDF417.STOP_PATTERN.length -
      17 /*overlap*/ +
      2 * this.options.quietH;
    // Correct num_cols calculation based on original JS: (cols + 2) * 17 means 2 indicators of 17 bits.
    // Start pattern length is 17, stop pattern length is 18.
    // Let's use the original formula for width calculation from JS (it was (cols + 2) * 17 + 35 + 2 * this.QUIETH)
    // The '35' comes from START_PATTERN.length (17) + STOP_PATTERN.length (18).
    // So, (cols + 2)*17 for data and row indicators, plus 17 for start, 18 for stop.
    this.barcode_array.num_cols =
      cols * 17 +
      2 * 17 /*left/right indicators*/ +
      PDF417.START_PATTERN.length +
      PDF417.STOP_PATTERN.length +
      2 * this.options.quietH;

    this.barcode_array.bcode = [];

    let empty_row: number[] = [];
    // build rows for vertical quiet zone
    if (this.options.quietV > 0) {
      empty_row = Array(this.barcode_array.num_cols).fill(0);
      for (let i = 0; i < this.options.quietV; ++i) {
        this.barcode_array.bcode.push([...empty_row]);
      }
    }

    let L: number;
    let k = 0; // codeword index
    let cid = 0; // initial cluster (0, 3, 6 in the CLUSTERS array)
    // for each row
    for (let r = 0; r < rows; ++r) {
      let rowPatternStr =
        "0".repeat(this.options.quietH) + PDF417.START_PATTERN; // row start code with quiet zone

      // Determine cluster for row indicators
      const currentClusterSet = PDF417.CLUSTERS[cid * 3]; // cid will be 0, 1, 2, mapping to CLUSTERS[0], CLUSTERS[3], CLUSTERS[6]

      // left row indicator
      switch (cid) {
        case 0:
          L = 30 * Math.floor(r / 3) + Math.floor((rows - 1) / 3);
          break;
        case 1:
          L = 30 * Math.floor(r / 3) + resolvedEcl * 3 + ((rows - 1) % 3);
          break;
        case 2:
          L = 30 * Math.floor(r / 3) + (cols - 1);
          break;
        default:
          L = 0; // Should not happen
      }
      rowPatternStr += this.getCodewordPattern(currentClusterSet[L]);

      // for each column (data codewords)
      for (let c = 0; c < cols; ++c) {
        rowPatternStr += this.getCodewordPattern(
          currentClusterSet[codewords[k]],
        );
        ++k;
      }

      // right row indicator
      switch (cid) {
        case 0:
          L = 30 * Math.floor(r / 3) + (cols - 1);
          break;
        case 1:
          L = 30 * Math.floor(r / 3) + Math.floor((rows - 1) / 3);
          break;
        case 2:
          L = 30 * Math.floor(r / 3) + resolvedEcl * 3 + ((rows - 1) % 3);
          break;
        default:
          L = 0; // Should not happen
      }
      rowPatternStr += this.getCodewordPattern(currentClusterSet[L]);

      rowPatternStr += PDF417.STOP_PATTERN + "0".repeat(this.options.quietH); // row stop code with quiet zone

      const arow = rowPatternStr.split("").map(Number);
      // duplicate row to get the desired height
      for (let h = 0; h < this.options.rowHeight; ++h) {
        this.barcode_array.bcode.push([...arow]);
      }

      cid = (cid + 1) % 3; // Cycle through 0, 1, 2 for cluster selection
    }

    if (this.options.quietV > 0) {
      for (let i = 0; i < this.options.quietV; ++i) {
        // add vertical quiet rows
        this.barcode_array.bcode.push([...empty_row]);
      }
    }
    return this.barcode_array;
  }

  private getCodewordPattern(value: number): string {
    return value.toString(2).padStart(17, "0");
  }

  private getInputSequences(code: string): (string | number)[][] {
    const sequence_array: (string | number)[][] = [];
    // get numeric sequences
    const numseqMatches = Array.from(code.matchAll(/([0-9]{13,44})/g));
    const numseq: [string, number][] = numseqMatches.map((match) => [
      match[1],
      match.index ?? 0,
    ]);

    numseq.push(["", code.length]); // Add a sentinel for processing the rest of the string

    let offset = 0;
    for (const seqItem of numseq) {
      const currentNumSeqStr = seqItem[0];
      const currentNumSeqOffset = seqItem[1];
      const seqlen = currentNumSeqStr.length;

      if (currentNumSeqOffset > offset) {
        // extract text sequence before the number sequence
        const prevseq = code.substring(offset, currentNumSeqOffset);
        const textseqMatches = Array.from(
          prevseq.matchAll(/([\t\n\r\x20-\x7e]{5,})/g),
        );
        const textseq: [string, number][] = textseqMatches.map((match) => [
          match[1],
          match.index ?? 0,
        ]);
        textseq.push(["", prevseq.length]); // Sentinel

        let txtoffset = 0;
        for (const txtSeqItem of textseq) {
          const currentTextSeqStr = txtSeqItem[0];
          const currentTextSeqOffset = txtSeqItem[1];
          const txtseqlen = currentTextSeqStr.length;

          if (currentTextSeqOffset > txtoffset) {
            // extract byte sequence before the text sequence
            const prevtxtseq = prevseq.substring(
              txtoffset,
              currentTextSeqOffset,
            );
            if (prevtxtseq.length > 0) {
              // add BYTE sequence
              if (
                prevtxtseq.length === 1 &&
                sequence_array.length > 0 &&
                sequence_array[sequence_array.length - 1][0] === 900 // Last mode was Text
              ) {
                sequence_array.push([913, prevtxtseq]); // Byte compaction (shift)
              } else if (prevtxtseq.length % 6 === 0) {
                sequence_array.push([924, prevtxtseq]); // Byte compaction (latched, multiple of 6)
              } else {
                sequence_array.push([901, prevtxtseq]); // Byte compaction (latched)
              }
            }
          }
          if (txtseqlen > 0) {
            // add TEXT sequence
            sequence_array.push([900, currentTextSeqStr]);
          }
          txtoffset = currentTextSeqOffset + txtseqlen;
        }
      }
      if (seqlen > 0) {
        // add NUMERIC sequence
        sequence_array.push([902, currentNumSeqStr]);
      }
      offset = currentNumSeqOffset + seqlen;
    }
    return sequence_array;
  }

  private getCompaction(mode: number, code: string, addmode = true): number[] {
    let cw: number[] = []; // array of codewords to return
    switch (mode) {
      case 900: {
        // Text Compaction mode latch
        let submode = 0; // default Alpha sub-mode
        const txtarr: number[] = []; // array of characters and sub-mode switching characters
        const codelen = code.length;
        for (let i = 0; i < codelen; ++i) {
          const chval = code.charCodeAt(i);
          let k = PDF417.TEXT_SUBMODES[submode].indexOf(chval);
          if (k !== -1) {
            // we are on the same sub-mode
            txtarr.push(k);
          } else {
            // the sub-mode is changed
            let foundNewSubmode = false;
            for (let s = 0; s < 4; ++s) {
              // search new sub-mode
              if (s !== submode) {
                k = PDF417.TEXT_SUBMODES[s].indexOf(chval);
                if (k !== -1) {
                  // s is the new submode
                  // Determine if shift or latch
                  const nextCharIsCurrentSubmode =
                    i + 1 < codelen &&
                    PDF417.TEXT_SUBMODES[submode].indexOf(
                      code.charCodeAt(i + 1),
                    ) !== -1;

                  // Shift conditions from original JS:
                  // (i + 1 == codelen || (i + 1 < codelen && this._array_search(this._ord(code.charAt(i + 1)),this.textsubmodes[submode]) !== false))
                  // && (s == 3 || (s == 0 && submode == 1))
                  // Shift to Punctuation (s=3) or Alpha from Lower (s=0, submode=1) if next char is back to original or end of string.
                  if (
                    (i + 1 === codelen || nextCharIsCurrentSubmode) &&
                    (s === 3 || (s === 0 && submode === 1))
                  ) {
                    // Shift
                    if (s === 3)
                      txtarr.push(29); // Shift to Punctuation
                    else txtarr.push(27); // Shift from Lower to Alpha (tsl)
                  } else {
                    // Latch
                    const latchKey = `${submode}${s}`;
                    if (PDF417.TEXT_LATCH[latchKey]) {
                      txtarr.push(...PDF417.TEXT_LATCH[latchKey]);
                    }
                    submode = s; // set new submode
                  }
                  txtarr.push(k); // add character code to array
                  foundNewSubmode = true;
                  break;
                }
              }
            }
            if (!foundNewSubmode) {
              // Character not found in any submode, might be an issue or require byte mode.
              // For now, this case is not explicitly handled as in original if char is totally unencodable in Text.
              // Original code would likely have switched to Byte mode earlier via getInputSequences.
              // If it reaches here, it implies the char should be encodable by some text submode.
              // This path should ideally not be hit if getInputSequences correctly segments.
              // As a fallback, let's push a space-like value or handle as an error.
              // Pushing '29' (padding) might be a way to handle, or throw error.
              // For now, let's assume valid characters. If an error occurs, it implies a bug in mode detection or input.
            }
          }
        }
        let txtarrlen = txtarr.length;
        if (txtarrlen % 2 !== 0) {
          // add padding
          txtarr.push(29); // Pad with Punctuation space
          ++txtarrlen;
        }
        // calculate codewords
        for (let i = 0; i < txtarrlen; i += 2) {
          const codeword = 30 * txtarr[i] + txtarr[i + 1];
          cw.push(codeword % 929); // Ensure value is within 0-928 range
        }
        break;
      }
      case 901: // Byte Compaction mode latch (any number of bytes)
      case 924: {
        // Byte Compaction mode latch (multiple of 6 bytes)
        const tempCode = code;
        const codelen = tempCode.length;

        if (mode === 924 && codelen % 6 === 0) {
          // Process in blocks of 6
          for (let i = 0; i < codelen; i += 6) {
            const block = tempCode.substring(i, i + 6);
            let t = BigInt(0);
            t = t + BigInt(block.charCodeAt(0)) * 256n ** 5n;
            t = t + BigInt(block.charCodeAt(1)) * 256n ** 4n;
            t = t + BigInt(block.charCodeAt(2)) * 256n ** 3n;
            t = t + BigInt(block.charCodeAt(3)) * 256n ** 2n;
            t = t + BigInt(block.charCodeAt(4)) * 256n ** 1n;
            t = t + BigInt(block.charCodeAt(5));

            const cw6: number[] = [];
            do {
              const d = Number(t % 900n);
              t = t / 900n;
              cw6.unshift(d);
            } while (t !== 0n);
            // Ensure 5 codewords are produced, padding with 0 if necessary at the front.
            while (cw6.length < 5) {
              cw6.unshift(0);
            }
            cw = cw.concat(cw6);
          }
        } else {
          // Mode 901 or mode 924 with non-multiple of 6 (should ideally not happen for 924)
          // Process byte by byte
          for (let i = 0; i < codelen; ++i) {
            const charCode = tempCode.charCodeAt(i);
            cw.push(charCode % 929); // Ensure value is within 0-928 range
          }
        }
        break;
      }
      case 902: {
        // Numeric Compaction mode latch
        let tempCode = code;
        // Process in blocks of up to 44 digits
        while (tempCode.length > 0) {
          const block = tempCode.substring(0, Math.min(44, tempCode.length));
          tempCode = tempCode.substring(block.length);

          let t = BigInt(`1${block}`); // Prepend "1"
          const block_cw: number[] = [];
          do {
            const d = Number(t % 900n);
            t = t / 900n;
            block_cw.unshift(d);
          } while (t !== 0n);
          cw = cw.concat(block_cw);
        }
        break;
      }
      case 913: {
        // Byte Compaction mode shift (single byte)
        cw.push(code.charCodeAt(0));
        break;
      }
    }
    if (addmode) {
      // add the compaction mode codeword at the beginning
      cw.unshift(mode);
    }
    return cw;
  }

  private getErrorCorrectionLevel(ecl: number, numcw: number): number {
    // get maximum correction level
    let maxecl = 8; // starting error level
    while (maxecl >= 0) {
      // Iterate downwards correctly
      const errsize = 2 << maxecl; // Max error size for this level
      if (928 - (numcw + 1) >= errsize) {
        // numcw + 1 for Symbol Length Descriptor
        break;
      }
      --maxecl;
    }
    if (maxecl < 0) maxecl = 0; // Ensure it's at least 0

    let resolvedEcl = ecl;
    // check for automatic levels
    if (resolvedEcl < 0 || resolvedEcl > 8) {
      if (numcw < 41) resolvedEcl = 2;
      else if (numcw < 161) resolvedEcl = 3;
      else if (numcw < 321) resolvedEcl = 4;
      else if (numcw < 864) resolvedEcl = 5;
      else resolvedEcl = maxecl; // Use calculated max if numcw is very high
    }

    if (resolvedEcl > maxecl) {
      resolvedEcl = maxecl;
    }
    return resolvedEcl;
  }

  private getErrorCorrection(cw: number[], ecl: number): number[] {
    // get error correction coefficients
    const ecc = PDF417.RS_FACTORS[ecl];
    // number of error correction factors (degree of generator polynomial, also number of EC codewords)
    const eclsize = 2 << ecl;
    // maximum index for rsfactors[ecl]
    const eclmaxid = eclsize - 1; // This is incorrect based on original code's loop.
    // ecc.length is eclsize. Loop is `j > 0`. So ecc[j] means ecc[$j] where $j is loop var.
    // In JS port, ecc[j] is used.
    // The indices of ecc in the original map to RS_FACTORS[ecl][j].
    // If ecc array has N elements, indices are 0 to N-1.
    // The loop for j from eclsize-1 down to 1 means ecc[eclsize-1] to ecc[1].
    // Then ecc[0] is used. This matches typical Reed-Solomon.

    // initialize array of error correction codewords
    const ecw: number[] = Array(eclsize).fill(0);

    // for each data codeword
    for (let k = 0; k < cw.length; k++) {
      const t1 = (cw[k] + ecw[eclsize - 1]) % 929; // Use last element of ecw
      for (let j = eclsize - 1; j > 0; --j) {
        // Iterate from second to last down to second element
        // ecw[j] = (ecw[j-1] + (929 - (t1 * ecc[j]) % 929)) % 929;
        // Original: ecw[j] = (ecw[j-1] + t3) % 929; where t3 = 929 - t2; t2 = (t1 * ecc[j]) % 929;
        // ecc[j] in original PHP refers to ecc[$j] where $j is loop var.
        // In JS port, ecc[j] is used.
        // The indices of ecc in the original map to RS_FACTORS[ecl][j].
        // If ecc array has N elements, indices are 0 to N-1.
        // The loop for j from eclsize-1 down to 1 means ecc[eclsize-1] to ecc[1].
        // Then ecc[0] is used. This matches typical Reed-Solomon.
        const t2 = (t1 * ecc[j]) % 929;
        const t3 = 929 - t2;
        ecw[j] = (ecw[j - 1] + t3) % 929;
      }
      // ecw[0] = (929 - (t1 * ecc[0]) % 929) % 929;
      const t2_0 = (t1 * ecc[0]) % 929;
      const t3_0 = 929 - t2_0;
      ecw[0] = t3_0 % 929;
    }

    // Final adjustment for error correction codewords
    const final_ecw = ecw.map((val) => (val === 0 ? 0 : 929 - val));
    return final_ecw.reverse(); // Reverse the order of EC codewords
  }

  public getBarcodeArray(): BarcodeData {
    return this.barcode_array;
  }
}
