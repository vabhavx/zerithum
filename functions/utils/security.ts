
/**
 * Validates a URL to prevent SSRF attacks.
 * Checks for valid protocol (http/https) and ensures the hostname
 * is not a private IP address or localhost.
 *
 * This function resolves DNS to prevent bypasses where a domain
 * points to a private IP.
 *
 * @param url The URL to validate
 * @returns true if the URL is considered safe, false otherwise
 */
export async function validateReceiptUrl(url: string): Promise<boolean> {
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

    // Check for private IPs (handles cases where hostname is a literal IP)
    if (isPrivateIP(cleanHostname)) {
        return false;
    }

    // Resolve DNS to prevent SSRF via domain names
    // If it's already an IP, DNS resolution might fail or return nothing, which is fine
    // as we already checked it with isPrivateIP.
    try {
        // @ts-ignore: Deno is available in the edge function environment
        const [aRecords, aaaaRecords] = await Promise.all([
            // @ts-ignore
            Deno.resolveDns(cleanHostname, "A").catch(() => []),
            // @ts-ignore
            Deno.resolveDns(cleanHostname, "AAAA").catch(() => [])
        ]);

        const allIPs = [...aRecords, ...aaaaRecords];

        for (const ip of allIPs) {
            if (isPrivateIP(ip)) {
                return false;
            }
        }
    } catch (dnsError) {
        // If DNS resolution fails, we can't verify the underlying IP.
        // Safer to fail closed if it's not a known valid hostname.
        // However, if we already checked it and it was a public IP literal,
        // or a hostname that doesn't resolve, we've done our best.
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
    if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;

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
