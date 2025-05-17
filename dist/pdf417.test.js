"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pdf417_1 = require("./pdf417");
const svg_1 = require("./svg");
(0, vitest_1.describe)("PDF417", () => {
    (0, vitest_1.it)("should create a new instance with default options", () => {
        const pdf417 = new pdf417_1.PDF417();
        (0, vitest_1.expect)(pdf417).toBeInstanceOf(pdf417_1.PDF417);
    });
    (0, vitest_1.it)("should create a new instance with custom options", () => {
        const options = {
            errorCorrectionLevel: 2,
            aspectRatio: 3,
            rowHeight: 4,
            quietH: 3,
            quietV: 3,
        };
        const pdf417 = new pdf417_1.PDF417(options);
        (0, vitest_1.expect)(pdf417).toBeInstanceOf(pdf417_1.PDF417);
    });
    (0, vitest_1.it)("should generate barcode data for a simple text", () => {
        const pdf417 = new pdf417_1.PDF417();
        const result = pdf417.generate("Hello World");
        (0, vitest_1.expect)(result).not.toBe(false);
        if (result) {
            (0, vitest_1.expect)(result).toHaveProperty("num_rows");
            (0, vitest_1.expect)(result).toHaveProperty("num_cols");
            (0, vitest_1.expect)(result).toHaveProperty("bcode");
            (0, vitest_1.expect)(Array.isArray(result.bcode)).toBe(true);
        }
    });
    (0, vitest_1.it)("should return false for empty input", () => {
        const pdf417 = new pdf417_1.PDF417();
        const result = pdf417.generate("");
        (0, vitest_1.expect)(result).toBe(false);
    });
    (0, vitest_1.it)("should handle special characters", () => {
        const pdf417 = new pdf417_1.PDF417();
        const result = pdf417.generate("Hello! @#$%^&*()");
        (0, vitest_1.expect)(result).not.toBe(false);
        if (result) {
            (0, vitest_1.expect)(result).toHaveProperty("bcode");
            (0, vitest_1.expect)(Array.isArray(result.bcode)).toBe(true);
        }
    });
    (0, vitest_1.it)("should handle long text input", () => {
        const pdf417 = new pdf417_1.PDF417();
        const longText = "A".repeat(1000);
        const result = pdf417.generate(longText);
        (0, vitest_1.expect)(result).not.toBe(false);
        if (result) {
            (0, vitest_1.expect)(result).toHaveProperty("bcode");
            (0, vitest_1.expect)(Array.isArray(result.bcode)).toBe(true);
            (0, vitest_1.expect)(result.bcode.length).toBeGreaterThan(0);
        }
    });
    (0, vitest_1.it)("should handle different error correction levels", () => {
        const text = "Test Data";
        const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        levels.forEach((level) => {
            const pdf417 = new pdf417_1.PDF417({ errorCorrectionLevel: level });
            const result = pdf417.generate(text);
            (0, vitest_1.expect)(result).not.toBe(false);
            if (result) {
                (0, vitest_1.expect)(result).toHaveProperty("bcode");
                (0, vitest_1.expect)(Array.isArray(result.bcode)).toBe(true);
            }
        });
    });
    (0, vitest_1.it)("should handle numeric data", () => {
        const pdf417 = new pdf417_1.PDF417();
        const numericData = "1234567890";
        const result = pdf417.generate(numericData);
        (0, vitest_1.expect)(result).not.toBe(false);
        if (result) {
            (0, vitest_1.expect)(result).toHaveProperty("bcode");
            (0, vitest_1.expect)(Array.isArray(result.bcode)).toBe(true);
        }
    });
    (0, vitest_1.it)("should handle invalid options gracefully", () => {
        const invalidOptions = {
            errorCorrectionLevel: 9,
            aspectRatio: 0.5,
            rowHeight: 1,
            quietH: 0,
            quietV: 0,
        };
        const pdf417 = new pdf417_1.PDF417(invalidOptions);
        const result = pdf417.generate("Test");
        (0, vitest_1.expect)(result).not.toBe(false);
        if (result) {
            (0, vitest_1.expect)(result).toHaveProperty("bcode");
            (0, vitest_1.expect)(Array.isArray(result.bcode)).toBe(true);
        }
    });
    (0, vitest_1.it)("should handle mixed content (numbers, letters, special characters)", () => {
        const pdf417 = new pdf417_1.PDF417();
        const mixedContent = "ABC123!@#$%^&*()_+";
        const result = pdf417.generate(mixedContent);
        (0, vitest_1.expect)(result).not.toBe(false);
        if (result) {
            (0, vitest_1.expect)(result).toHaveProperty("bcode");
            (0, vitest_1.expect)(Array.isArray(result.bcode)).toBe(true);
        }
    });
});
(0, vitest_1.describe)("SVG rendering", () => {
    (0, vitest_1.it)("should generate SVG from PDF417 bcode", () => {
        const pdf417 = new pdf417_1.PDF417();
        const result = pdf417.generate("SVGテスト");
        (0, vitest_1.expect)(result).not.toBe(false);
        if (result) {
            const svg = (0, svg_1.renderPDF417ToSVG)(result.bcode);
            (0, vitest_1.expect)(svg.startsWith("<svg")).toBe(true);
            (0, vitest_1.expect)(svg.includes("<rect")).toBe(true);
            (0, vitest_1.expect)(svg.includes('fill="black"')).toBe(true);
        }
    });
});
