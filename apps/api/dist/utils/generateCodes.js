"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJoinCode = generateJoinCode;
exports.generateSecurityCode = generateSecurityCode;
function generateJoinCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function generateSecurityCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}
//# sourceMappingURL=generateCodes.js.map