import { describe, expect, it } from "vitest";
import { PDF417 } from "./pdf417";
import { renderPDF417ToSVG } from "./svg";

describe("PDF417", () => {
  it("should create a new instance with default options", () => {
    const pdf417 = new PDF417();
    expect(pdf417).toBeInstanceOf(PDF417);
  });

  it("should create a new instance with custom options", () => {
    const options = {
      errorCorrectionLevel: 2,
      aspectRatio: 3,
      rowHeight: 4,
      quietH: 3,
      quietV: 3,
    };
    const pdf417 = new PDF417(options);
    expect(pdf417).toBeInstanceOf(PDF417);
  });

  it("should generate barcode data for a simple text", () => {
    const pdf417 = new PDF417();
    const result = pdf417.generate("Hello World");
    expect(result).not.toBe(false);
    if (result) {
      expect(result).toHaveProperty("num_rows");
      expect(result).toHaveProperty("num_cols");
      expect(result).toHaveProperty("bcode");
      expect(Array.isArray(result.bcode)).toBe(true);
    }
  });

  it("should return false for empty input", () => {
    const pdf417 = new PDF417();
    const result = pdf417.generate("");
    expect(result).toBe(false);
  });

  it("should handle special characters", () => {
    const pdf417 = new PDF417();
    const result = pdf417.generate("Hello! @#$%^&*()");
    expect(result).not.toBe(false);
    if (result) {
      expect(result).toHaveProperty("bcode");
      expect(Array.isArray(result.bcode)).toBe(true);
    }
  });

  it("should handle long text input", () => {
    const pdf417 = new PDF417();
    const longText = "A".repeat(1000);
    const result = pdf417.generate(longText);
    expect(result).not.toBe(false);
    if (result) {
      expect(result).toHaveProperty("bcode");
      expect(Array.isArray(result.bcode)).toBe(true);
      expect(result.bcode.length).toBeGreaterThan(0);
    }
  });

  it("should handle different error correction levels", () => {
    const text = "Test Data";
    const levels = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    for (const level of levels) {
      const pdf417 = new PDF417({ errorCorrectionLevel: level });
      const result = pdf417.generate(text);
      expect(result).not.toBe(false);
      if (result) {
        expect(result).toHaveProperty("bcode");
        expect(Array.isArray(result.bcode)).toBe(true);
      }
    }
  });

  it("should handle numeric data", () => {
    const pdf417 = new PDF417();
    const numericData = "1234567890";
    const result = pdf417.generate(numericData);
    expect(result).not.toBe(false);
    if (result) {
      expect(result).toHaveProperty("bcode");
      expect(Array.isArray(result.bcode)).toBe(true);
    }
  });

  it("should handle invalid options gracefully", () => {
    const invalidOptions = {
      errorCorrectionLevel: 9,
      aspectRatio: 0.5,
      rowHeight: 1,
      quietH: 0,
      quietV: 0,
    };
    const pdf417 = new PDF417(invalidOptions);
    const result = pdf417.generate("Test");
    expect(result).not.toBe(false);
    if (result) {
      expect(result).toHaveProperty("bcode");
      expect(Array.isArray(result.bcode)).toBe(true);
    }
  });

  it("should handle mixed content (numbers, letters, special characters)", () => {
    const pdf417 = new PDF417();
    const mixedContent = "ABC123!@#$%^&*()_+";
    const result = pdf417.generate(mixedContent);
    expect(result).not.toBe(false);
    if (result) {
      expect(result).toHaveProperty("bcode");
      expect(Array.isArray(result.bcode)).toBe(true);
    }
  });
});

describe("SVG rendering", () => {
  it("should generate SVG from PDF417 bcode", () => {
    const pdf417 = new PDF417();
    const result = pdf417.generate("test svg");
    expect(result).not.toBe(false);
    if (result) {
      const svg = renderPDF417ToSVG(result.bcode);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg.includes("<rect")).toBe(true);
      expect(svg.includes('fill="black"')).toBe(true);
    }
  });
});
