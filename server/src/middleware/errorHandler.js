import { error, httpStatusForCode } from "../utils/response.js";

export class AppError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status]
   * @param {object} [details]
   */
  constructor(code, message, status, details) {
    super(message);
    this.code = code;
    this.status = status || httpStatusForCode(code);
    this.details = details;
  }
}

export function notFoundHandler(_req, res) {
  return error(res, "NOT_FOUND", "Ressource nicht gefunden.", 404);
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return error(res, err.code, err.message, err.status, err.details);
  }
  console.error(err);
  return error(res, "INTERNAL_ERROR", "Ein Fehler ist aufgetreten.", 500);
}
