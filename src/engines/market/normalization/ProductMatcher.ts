export class ProductMatcher {
  static normalize(rawName: string): string {
    const lower = rawName.toLowerCase();
    if (lower.includes('vpx') || lower.includes('вейп икс') || lower.includes('vape x')) {
      return 'vape_x';
    }
    if (lower.includes('hqd') && lower.includes('cuvie')) {
      return 'hqd_cuvie';
    }
    return rawName.replace(/\s+/g, '_').toLowerCase();
  }
}
