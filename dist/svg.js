"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPDF417ToSVG = renderPDF417ToSVG;
function renderPDF417ToSVG(matrix, moduleSize = 2) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const width = cols * moduleSize;
    const height = rows * moduleSize;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">`;
    svg += `<rect width="100%" height="100%" fill="white"/>`;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (matrix[y][x]) {
                svg += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
            }
        }
    }
    svg += `</svg>`;
    return svg;
}
