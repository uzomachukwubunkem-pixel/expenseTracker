import { ZodError } from 'zod';
export const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req[source]);
            req[source] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.issues,
                });
                return;
            }
            next(error);
        }
    };
};
