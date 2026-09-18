import type { CertificateCheckResult } from "@/types/app/signers";

/**
 * Opens a PKCS#12 (.p12 / .pfx) file with a PIN in the browser, so the mock
 * ตรวจสอบ Certificate answers from the file the user actually attached. The
 * real backend does this itself; drop this along with the mock branch.
 *
 * node-forge is loaded on demand — it is only needed once someone uploads a
 * certificate, and it is far too big to sit in the page bundle.
 */
export async function readCertificate(
  file: File,
  pin: string,
): Promise<CertificateCheckResult> {
  const forge = (await import("node-forge")).default;
  const bytes = new Uint8Array(await file.arrayBuffer());

  let p12;
  try {
    const der = forge.asn1.fromDer(forge.util.createBuffer(bytes));
    // throws "Invalid password" when the MAC doesn't verify
    p12 = forge.pkcs12.pkcs12FromAsn1(der, pin);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      reason: /password|mac/i.test(message) ? "PIN" : "FILE",
    };
  }

  const bags = p12.getBags({ bagType: forge.pki.oids.certBag })[
    forge.pki.oids.certBag
  ];
  const cert = bags?.[0]?.cert;
  if (!cert) return { valid: false, reason: "FILE" };

  const commonName = cert.subject.getField("CN") as { value: string } | null;
  return {
    valid: true,
    subject: commonName?.value ?? file.name,
    validTo: cert.validity.notAfter.toISOString(),
  };
}
