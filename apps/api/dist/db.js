"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.checkDb = checkDb;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
async function checkDb() {
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=db.js.map