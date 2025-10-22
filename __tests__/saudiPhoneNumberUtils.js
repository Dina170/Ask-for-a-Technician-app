// Phone number utility functions
function normalizeSaudiPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('+966')) {
        // +966 format - ensure it has correct length
        if (cleaned.length === 13) {
            return cleaned;
        }
    } else if (cleaned.startsWith('966')) {
        // 966 format without +
        if (cleaned.length === 12) {
            return '+' + cleaned;
        }
    } else if (cleaned.startsWith('05')) {
        // 05XXXXXXXX format
        if (cleaned.length === 10) {
            return '+966' + cleaned.substring(1);
        }
    } else if (cleaned.startsWith('5')) {
        // 5XXXXXXXX format
        if (cleaned.length === 9) {
            return '+966' + cleaned;
        }
    }
    
    return null; // Invalid format
}

function validateSaudiPhoneNumber(phoneNumber) {
    const normalized = normalizeSaudiPhoneNumber(phoneNumber);
    
    if (!normalized) {
        return false;
    }
    
    // Saudi mobile numbers start with 5 and are 9 digits after country code
    const phoneRegex = /^\+9665[0-9]{8}$/;
    return phoneRegex.test(normalized);
}
