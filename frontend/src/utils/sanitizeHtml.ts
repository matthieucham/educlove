import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to only allow safe formatting tags used by TipTap editor.
 * Allowed tags: p, strong, em, s (paragraph, bold, italic, strikethrough)
 * All other tags and attributes are stripped.
 */
export const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 's', 'br'],
        ALLOWED_ATTR: [], // No attributes allowed
        KEEP_CONTENT: true, // Keep text content even if tags are removed
    });
};
