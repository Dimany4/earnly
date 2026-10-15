import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingPage, { metadata } from "@/app/page";
import { metadata as rootMetadata } from "@/app/layout";

describe("landing images and sharing metadata", () => {
  it("optimizes every landing image and reserves image dimensions", () => {
    const html = renderToStaticMarkup(<LandingPage />);
    const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
    expect(images).toHaveLength(8);
    for (const image of images) {
      expect(image).toContain('data-nimg="1"');
      expect(image).toMatch(/width="\d+"/);
      expect(image).toMatch(/height="\d+"/);
      expect(image).toContain("srcSet=");
    }

    const hero = images.find((image) => image.includes("hero-campus"))!;
    expect(hero).toContain('width="2000"');
    expect(hero).toContain('height="1500"');
    expect(hero).toContain('h-[320px]');
    expect(hero).toContain('sm:h-[420px]');
    expect(hero).toContain('lg:h-[500px]');
    expect(hero).toContain("595px");
    expect(hero).not.toContain('loading="lazy"');
    expect(html).toMatch(/<link[^>]*rel="preload"[^>]*as="image"[^>]*hero-campus/);

    const lowerPhoto = images.find((image) => image.includes("students-lawn"))!;
    expect(lowerPhoto).toContain('loading="lazy"');
    expect(lowerPhoto).toContain('h-[340px]');
    expect(lowerPhoto).toContain('sm:h-[420px]');
  });

  it("defines landing-specific copy and social images with an absolute public base", () => {
    expect(metadata.title).toBe("Earnly — earn while you learn");
    expect(metadata.description).toMatch(/paid tasks, jobs and internships/);
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      title: metadata.title,
      description: metadata.description,
      images: [{ url: "/img/hero-campus.jpg", alt: expect.any(String) }],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [{ url: "/img/hero-campus.jpg", alt: expect.any(String) }],
    });
    expect(rootMetadata.metadataBase).toBeInstanceOf(URL);
    expect(new URL("/img/hero-campus.jpg", rootMetadata.metadataBase!).protocol).toMatch(/^https?:$/);
  });
});
