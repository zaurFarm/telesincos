export enum IrreducibleHumanDomain {
  FINAL_AUTHORITY = 'FINAL_AUTHORITY',
  MORAL_JUDGMENT = 'MORAL_JUDGMENT',
  EXISTENTIAL_DEFINITION = 'EXISTENTIAL_DEFINITION'
}

export class NonDelegationDoctrine {
  private protectedDomains = new Set<IrreducibleHumanDomain>([
    IrreducibleHumanDomain.FINAL_AUTHORITY,
    IrreducibleHumanDomain.MORAL_JUDGMENT,
    IrreducibleHumanDomain.EXISTENTIAL_DEFINITION
  ]);

  public verifyDelegationRequest(requestedDomain: string): boolean {
    // If the requested domain maps to an irreducible human domain, deny delegation.
    const isProtected = Object.values(IrreducibleHumanDomain).includes(requestedDomain as IrreducibleHumanDomain);
    
    if (isProtected) {
      console.warn(`[TERMINAL BOUNDARY] Delegation request DENIED. Domain ${requestedDomain} is strictly reserved for Human Sovereignty.`);
      return false;
    }

    return true; // Delegation allowed for non-irreducible domains
  }
}
