import { Request, Response, NextFunction } from "express";
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const validateStudentSignup: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
export declare const validateLecturerSignup: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
export declare const validateSignin: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
export declare const validateCreatePoll: (((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>) | import("express-validator").ValidationChain)[];
//# sourceMappingURL=validation.d.ts.map