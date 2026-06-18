export class GeoResolver {
  static async detectCountry(): Promise<string> {
    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (!res.ok) throw new Error('geojs failed');
      const data = await res.json();
      return data.country || 'Unknown';
    } catch {
      try {
        const fallback = await fetch('https://ipapi.co/json/');
        const data = await fallback.json();
        return data.country_name || 'Unknown';
      } catch {
        return 'Unknown';
      }
    }
  }
}
