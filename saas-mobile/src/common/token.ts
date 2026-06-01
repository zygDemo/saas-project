class TokenUtil {
  normalize(token: string) {
    return String(token || "").replace(/^Bearer\s+/i, "").trim();
  }

  buildAuthorization(token: string) {
    const pureToken = this.normalize(token);
    return pureToken ? `Bearer ${pureToken}` : "";
  }
}

export const tokenUtil = new TokenUtil();
