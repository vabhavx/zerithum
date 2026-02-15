
/**
 * Validates a URL to prevent SSRF attacks.
 * Checks for valid protocol (http/https) and ensures the hostname
 * is not a private IP address or localhost.
 *
 * @param url The URL to validate
 * @returns true if the URL is considered safe, false otherwise
 */
export function validateReceiptUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Protocol check - strictly allow only http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname;

    // Block localhost
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return false;
    }

    // Remove brackets for IPv6 if present
    const cleanHostname = hostname.replace(/^\[|\]$/g, '');

    // Check for private IPs
    if (isPrivateIP(cleanHostname)) {
        return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

function isPrivateIP(ip: string): boolean {
    // IPv4 Check
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Regex);

    if (match) {
        const parts = match.slice(1).map(Number);
        // invalid IP parts
        if (parts.some(p => p > 255)) return false;

        const [a, b, c, d] = parts;

        // 10.0.0.0/8
        if (a === 10) return true;

        // 172.16.0.0/12
        if (a === 172 && b >= 16 && b <= 31) return true;

        // 192.168.0.0/16
        if (a === 192 && b === 168) return true;

        // 127.0.0.0/8 (Loopback)
        if (a === 127) return true;

        // 169.254.0.0/16 (Link-local)
        if (a === 169 && b === 254) return true;

        // 0.0.0.0/8
        if (a === 0) return true;

        return false;
    }

    // IPv6 Check
    // Loopback
    if (ip === '::1') return true;

    // Unique Local (fc00::/7) -> fc00... or fd00...
    if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;

    // Link Local (fe80::/10)
    if (ip.toLowerCase().startsWith('fe80')) return true;

    // Mapped IPv4 (::ffff:127.0.0.1)
    if (ip.toLowerCase().includes('::ffff:')) {
        return true; // Block all mapped IPv4 for safety or check the suffix
    }

    return false;
}
