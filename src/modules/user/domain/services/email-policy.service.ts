export class EmailPolicyService {
  private allowedDomains = ["itapecerica.sp.gov.br", "itapecerica.gov.br"];

  isInstitutional(email: string): boolean {
    const domain = email.split("@")[1]?.toLowerCase();

    if (!domain) return false;

    return this.allowedDomains.includes(domain);
  }
}
