export function getRandomDevice() {
  const devices = [
    {
      deviceModel: "Samsung Galaxy S21",
      systemVersion: "Android 13",
      appVersion: "10.5.1",
      langCode: "ru",
      systemLangCode: "ru"
    },
    {
      deviceModel: "Xiaomi Redmi Note 12",
      systemVersion: "Android 12",
      appVersion: "10.4.2",
      langCode: "ru",
      systemLangCode: "ru"
    },
    {
      deviceModel: "iPhone 13",
      systemVersion: "iOS 17.0",
      appVersion: "10.5",
      langCode: "ru",
      systemLangCode: "ru"
    }
  ];

  return devices[Math.floor(Math.random() * devices.length)];
}