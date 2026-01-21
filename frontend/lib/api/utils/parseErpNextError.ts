/**
 * Parse ERPNext error responses to extract clean, user-friendly error messages
 * 
 * ERPNext error formats:
 * 1. New structured format:
 *    { "success": false, "message": "Validation Error", "error": "specific error message" }
 * 2. Old exception format:
 *    { "exception": "frappe.exceptions.PermissionError: ...", "exc_type": "PermissionError", ... }
 */
export function parseErpNextError(errorText: string, defaultMessage: string = 'An error occurred'): string {
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
          if (typeof firstMessage === 'object' && firstMessage.message) {
            return firstMessage.message;
          }
          if (typeof firstMessage === 'string') {
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
      if (typeof errorData.message === 'string') {
        return errorData.message;
      }
      if (typeof errorData.message === 'object') {
        return errorData.message.exc_message || 
               errorData.message.message || 
               JSON.stringify(errorData.message);
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
    return errorText.length > 200 ? `${errorText.substring(0, 200)}...` : errorText || defaultMessage;
  }
}
