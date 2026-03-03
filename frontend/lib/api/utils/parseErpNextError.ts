/**
 * Parse ERPNext error responses to extract clean, user-friendly error messages
 *
 * ERPNext error formats:
 * 1. New structured format:
 *    { "success": false, "message": "Validation Error", "error": "specific error message" }
 * 2. Old exception format:
 *    { "exception": "frappe.exceptions.PermissionError: ...", "exc_type": "PermissionError", ... }
 */
export function parseErpNextError(
  errorText: string,
  defaultMessage: string = "An error occurred",
): string {
  try {
    const errorData = JSON.parse(errorText);

    // Check for new structured error format first (success: false with error field)
    if (errorData.success === false) {
      // Prefer the 'error' field as it contains the specific error message
      if (errorData.error) {
        return errorData.error;
      }
      // Fallback to 'message' field
      if (errorData.message) {
        return errorData.message;
      }
    }

    // Try to extract from _server_messages (old format)
    if (errorData._server_messages) {
      try {
        const serverMessages = JSON.parse(errorData._server_messages);
        if (Array.isArray(serverMessages) && serverMessages.length > 0) {
          const firstMessage = serverMessages[0];
          if (typeof firstMessage === "object" && firstMessage.message) {
            return firstMessage.message;
          }
          if (typeof firstMessage === "string") {
            try {
              const parsed = JSON.parse(firstMessage);
              if (parsed.message) return parsed.message;
            } catch {
              // If parsing fails, use the string as is
              return firstMessage;
            }
          }
        }
      } catch {
        // If _server_messages parsing fails, continue to other methods
      }
    }

    // Try to extract from exception field (format: "ExceptionType: message")
    if (errorData.exception) {
      const exceptionMatch = errorData.exception.match(/^[^:]+:\s*(.+)$/);
      if (exceptionMatch && exceptionMatch[1]) {
        return exceptionMatch[1].trim();
      }
      // If no colon, use the whole exception string
      return errorData.exception;
    }

    // Try exc_message if present
    if (errorData.exc_message) {
      return errorData.exc_message;
    }

    // Try message field (might be object or string)
    if (errorData.message) {
      if (typeof errorData.message === "string") {
        return errorData.message;
      }
      if (typeof errorData.message === "object") {
        return (
          errorData.message.exc_message ||
          errorData.message.message ||
          JSON.stringify(errorData.message)
        );
      }
    }

    // Fallback to default
    return defaultMessage;
  } catch {
    // If JSON parsing fails, try to extract message from raw text
    // Look for common error patterns
    const exceptionMatch = errorText.match(/"exception"\s*:\s*"([^"]+)"/);
    if (exceptionMatch && exceptionMatch[1]) {
      const exception = exceptionMatch[1];
      const messageMatch = exception.match(/^[^:]+:\s*(.+)$/);
      if (messageMatch && messageMatch[1]) {
        return messageMatch[1].trim();
      }
      return exception;
    }

    // Last resort: return default or raw text (truncated)
    return errorText.length > 200
      ? `${errorText.substring(0, 200)}...`
      : errorText || defaultMessage;
  }
}

/**
 * Turn technical payment/Stripe/ERPNext errors into clear messages for the user.
 * Use this when showing payment errors on the pay page or in the payment API.
 */
export function getPaymentErrorMessage(raw: string): string {
  if (!raw || typeof raw !== "string") {
    return "Something went wrong. Please try again or contact support.";
  }
  const lower = raw.toLowerCase();

  // Stripe / gateway configuration (admin must fix)
  if (
    lower.includes("invalid api key") ||
    lower.includes("invalid api key provided") ||
    (lower.includes("stripe error") && lower.includes("key"))
  ) {
    return "Payment is not set up correctly. Please ask your administrator to check Stripe settings (Stripe Settings in ERPNext).";
  }
  if (
    lower.includes("stripe is not configured") ||
    (lower.includes("not configured") && lower.includes("stripe"))
  ) {
    return "Payment by card is not configured yet. Please ask your administrator to set up Stripe in Stripe Settings.";
  }

  // Payment request state
  if (
    lower.includes("payment request not found") ||
    lower.includes("not found")
  ) {
    return "This payment link is invalid or has expired.";
  }
  if (
    lower.includes("already paid") ||
    lower.includes("already cancelled") ||
    lower.includes("this payment request is already")
  ) {
    return "This payment has already been completed or cancelled.";
  }
  if (lower.includes("amount must be greater than zero")) {
    return "This payment has no amount. Please contact support.";
  }

  // Auth / permission
  if (
    lower.includes("authentication") ||
    lower.includes("permission") ||
    lower.includes("authorization") ||
    lower.includes("log in") ||
    lower.includes("login")
  ) {
    return "Please log in again to continue with this payment.";
  }

  // Generic validation from backend
  if (lower.includes("validationerror") || lower.includes("validation error")) {
    // Keep the part after "Stripe error:" or "ValidationError:" but clean it
    const stripePart = raw.match(/Stripe error:\s*(.+)/i);
    if (stripePart && stripePart[1] && !stripePart[1].includes("*")) {
      return stripePart[1].trim();
    }
    return "The payment could not be processed. Please try again or contact support.";
  }

  // Don’t show raw technical details (e.g. asterisks, stack traces)
  if (raw.includes("***") || raw.length > 150) {
    return "Payment could not be started. Please ask your administrator to check the payment configuration or try again later.";
  }

  return raw;
}
