import { Favicon } from "../src/favicon.js";

describe("Favicon", () => {
  
  describe("Favicon.discover", () => {
    test("discovers large icon with priority", async () => {
      // Mock fetch to return HTML with multiple icon types
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html>
<head>
    <link rel="icon" sizes="16x16" href="/favicon-16.png">
    <link rel="icon" sizes="192x192" href="/favicon-192.png">
</head>
</html>`
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBe("https://example.com/favicon-192.png");
    });

    test("discovers MS Tile image", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html>
<head>
    <meta name="msapplication-TileImage" href="/mstile-144x144.png">
</head>
</html>`
        })
        .mockResolvedValueOnce({
          text: async () => "tile content"
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBe("https://example.com/mstile-144x144.png");
    });

    test("discovers Safari mask icon", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html>
<head>
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
</head>
</html>`
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBe("https://example.com/safari-pinned-tab.svg");
    });

    test("falls back to /favicon.ico when no links found", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html><head><title>Test</title></head></html>`
        })
        .mockResolvedValueOnce({
          text: async () => "ICO content"
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBe("https://example.com/favicon.ico");
    });

    test("respects priority order", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html>
<head>
    <link rel="icon" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" sizes="192x192" href="/favicon-192.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <meta name="msapplication-TileImage" content="/mstile.png">
</head>
</html>`
        });

      const favicon = await Favicon.discover('https://example.com');
      // Order: 0=large icon, 1=Apple touch 180x180, 2=MS Tile
      expect(favicon).toBe("https://example.com/favicon-192.png");
    });

    test("handles fetch errors gracefully", async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          text: async () => "ICO content"
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBe("https://example.com/favicon.ico");
    });

    test("handles parse errors gracefully", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => "<<>><invalid html"
        })
        .mockResolvedValueOnce({
          text: async () => "ICO content"
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBe("https://example.com/favicon.ico");
    });

    test("rejects non-HTTP(S) URLs via safeURL", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html>
<head>
    <link rel="icon" href="javascript:alert(1)">
</head>
</html>`
        })
        .mockResolvedValueOnce({
          text: async () => "ICO content"
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBeUndefined();
    });

    test("handles relative URLs correctly", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html>
<head>
    <link rel="icon" href="/assets/favicon.ico">
</head>
</html>`
        });

      const favicon = await Favicon.discover('https://example.com/blog');
      expect(favicon).toBe("https://example.com/assets/favicon.ico");
    });

    test("accepts custom fetch options", async () => {
      const fetchOptions = { headers: { 'User-Agent': 'Test' } };
      
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html>
<head>
    <link rel="icon" href="/favicon.ico">
</head>
</html>`
        });

      await Favicon.discover('https://example.com', fetchOptions);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com',
        fetchOptions
      );
    });

    test("handles missing favicon.ico fallback", async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          text: async () => `<html><head></head></html>`
        })
        .mockResolvedValueOnce({
          text: async () => "ICO content"
        });

      const favicon = await Favicon.discover('https://example.com');
      expect(favicon).toBe("https://example.com/favicon.ico");
    });
  });

  describe("Favicon.searches priority order", () => {
    test("searches are sorted by order field", () => {
      for (let i = 1; i < Favicon.searches.length; i++) {
        expect(Favicon.searches[i].order).toBeGreaterThanOrEqual(
          Favicon.searches[i - 1].order
        );
      }
    });

    test("large icons have highest priority", () => {
      const largeIcon = Favicon.searches.find(s => s.type === "large icon");
      expect(largeIcon.order).toBe(0);
    });
  });
});