#!/usr/bin/env bun

import { chromium } from "playwright";
import { YOUTUBE_IDS } from "../example/videoCatalog";

const demoUrl = Bun.argv[2];

if (!demoUrl) {
  console.error("Usage: bun run test:example:live -- http://127.0.0.1:<port>/");
  process.exit(2);
}

const browser = await chromium.launch({ headless: true });
const failures: string[] = [];

try {
  const page = await browser.newPage({
    viewport: { width: 430, height: 932 },
  });
  await page.goto(demoUrl, { waitUntil: "domcontentloaded" });

  const player = page.getByTestId("youtube-player");
  const iframe = page.locator('iframe[title="YouTube video player"]');
  const feed = page.getByRole("feed", { name: "Swipe feed" });
  const unmute = page.getByRole("button", { name: "Unmute" });

  await player.waitFor({ state: "attached", timeout: 15_000 });
  await iframe.waitFor({ state: "attached", timeout: 15_000 });
  const initialIframe = await iframe.elementHandle();
  const initialSrc = await iframe.getAttribute("src");

  for (const [index, youtubeId] of YOUTUBE_IDS.entries()) {
    if (index > 0) await feed.press("ArrowDown");

    await page.waitForFunction(
      ({ expectedId }) => {
        const element = document.querySelector<HTMLElement>('[data-testid="youtube-player"]');
        if (!element || element.dataset.loadedYoutubeId !== expectedId) return false;
        return element.dataset.playerState === "1" || Boolean(element.dataset.playerError);
      },
      { expectedId: youtubeId },
      { timeout: 15_000 },
    );

    const youtubeFrame = page.frames().find((frame) => frame.url().startsWith("https://www.youtube.com/embed/"));
    if (!youtubeFrame) throw new Error("YouTube iframe did not attach");

    const video = youtubeFrame.locator("video");
    await video.waitFor({ state: "attached", timeout: 15_000 });

    const [iframeCount, currentIframe, currentSrc, state, error, dimensions] = await Promise.all([
      iframe.count(),
      iframe.elementHandle(),
      iframe.getAttribute("src"),
      player.getAttribute("data-player-state"),
      player.getAttribute("data-player-error"),
      video.evaluate((element) => ({
        width: element.videoWidth,
        height: element.videoHeight,
      })),
    ]);
    const sameIframe = Boolean(
      initialIframe
      && currentIframe
      && await currentIframe.evaluate((node, original) => node === original, initialIframe),
    );

    if (iframeCount !== 1) failures.push(`${index + 1}: expected one iframe, found ${iframeCount}`);
    if (!sameIframe || currentSrc !== initialSrc) failures.push(`${index + 1}: iframe was recreated`);
    if (error) failures.push(`${index + 1}: ${youtubeId} failed with YouTube error ${error}`);
    if (!error && state !== "1") failures.push(`${index + 1}: ${youtubeId} did not reach playing state`);
    if (dimensions.width >= dimensions.height) {
      failures.push(`${index + 1}: ${youtubeId} is ${dimensions.width}x${dimensions.height}, so YouTube letterboxes it`);
    }

    const portrait = dimensions.height > dimensions.width;
    console.log(`${error || !portrait ? "✗" : "✓"} ${index + 1}/${YOUTUBE_IDS.length} ${youtubeId}${error ? ` error=${error}` : ` playing ${dimensions.width}x${dimensions.height}`}`);

    if (index === 0) {
      await unmute.click();
      await page.waitForFunction(() => {
        const button = document.querySelector<HTMLButtonElement>('button img[alt="Mute"]');
        return Boolean(button);
      });
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error("\nLive YouTube regression check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\nAll ${YOUTUBE_IDS.length} portrait videos played through one stable, unmuted iframe.`);
