import { validationResult, matchedData } from "express-validator";

/**
 * Centralized validation error handler middleware
 * Returns 400 Bad Request with validation errors if validation fails
 * Processes errors from express-validator and formats them consistently
 */
export function validate(req, res, next){
	const errors = validationResult(req);
	if(!errors.isEmpty()){
		return res.status(400).json({ errors: errors.array()});
	}
	req.validData = matchedData(req);
	next();
}