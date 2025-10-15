"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const errorHandler = (err, req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: "Internal server error",
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
    });
};
exports.notFound = notFound;
//# sourceMappingURL=errorHandler.js.map