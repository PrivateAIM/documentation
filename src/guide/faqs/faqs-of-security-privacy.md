# Security & Privacy

### What are the main security features of FLAME?

FLAME implements multiple security layers to protect sensitive medical data:
1. **Privacy-Preserving Analysis**: 
Analyzes data without transferring sensitive information outside organizations.
2. **Code Approval & Verification**: An analysis algorithms is manually reviewed and approved before execution.
3. **Encryption**: Uses several methods of encryption (Paillier, RSA keys, envelope).
Only previously registered participants can access results.
4. **Analysis Execution Security**: Analysis runs in isolated Docker containers.
5. **Access Control**:
   * Role-Based Access Control for different user types.
   * Identity provider integration (OIDC).
   * Keycloak authentication at Hub and Node level.
   * Permission-based authorization.
6. **Data Security**: Data remains on local nodes and is not transferred to central Hub.
7. **Standards Compliance**:
   * Alignment with Medical Informatics Initiative (MII) standards.
   * Integration with Data Integration Centers (DIC).
   * FHIR compliance.
