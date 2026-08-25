/**
 * 100% Free Client-Side Email & Mailbox Domain Validator
 * Uses Cloudflare DNS-over-HTTPS (DoH) to verify real MX records.
 */

interface CloudflareDnsResponse {
  Status: number;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}

const BLOCKED_DOMAINS = new Set([
  'bla.com', 'test.com', 'example.com', 'asdf.com', 'sample.com', 'fake.com',
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'yopmail.com', 'throwawaymail.com', 'getairmail.com', 'dispostable.com',
  'trashmail.com', 'sharklasers.com', 'nada.ltd', 'mohmal.com'
]);

export async function validateLegitEmail(email: string): Promise<{ isValid: boolean; message?: string }> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Strict Syntax Check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, message: 'INVALID EMAIL FORMAT' };
  }

  const [username, domain] = cleanEmail.split('@');
  if (!domain || !username) {
    return { isValid: false, message: 'INVALID EMAIL STRUCTURE' };
  }

  // 2. Block Known Disposable / Dummy Domains & Patterns
  if (BLOCKED_DOMAINS.has(domain)) {
    return { isValid: false, message: 'DISPOSABLE / FAKE DOMAINS ARE NOT PERMITTED' };
  }

  if (username === domain.split('.')[0] || username.length < 2) {
    return { isValid: false, message: 'SUSPICIOUS EMAIL PATTERN DETECTED' };
  }

  // 3. 100% Free Live MX Record Lookup via Cloudflare DNS over HTTPS
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { 'Accept': 'application/dns-json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as CloudflareDnsResponse;
      // Status 0 = NOERROR, Answer array holds valid MX servers
      if (data.Status !== 0 || !Array.isArray(data.Answer) || data.Answer.length === 0) {
        return { isValid: false, message: `DOMAIN "@${domain.toUpperCase()}" DOES NOT ACCEPT EMAILS (NO MX RECORD)` };
      }
    }
  } catch (err) {
    // Fallback jika network DNS timeout/offline
    console.warn('DNS MX check skipped / timeout:', err);
  }

  return { isValid: true };
}