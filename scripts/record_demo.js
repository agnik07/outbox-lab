import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const framesDir = path.resolve(__dirname, '../data/frames');
const outputDir = path.resolve(__dirname, '../demo');

if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Clean old frames
fs.readdirSync(framesDir).forEach((file) => fs.unlinkSync(path.join(framesDir, file)));

let frameCount = 0;

async function captureFrame(page, delayMs = 100) {
  frameCount++;
  const framePath = path.join(framesDir, `frame_${String(frameCount).padStart(5, '0')}.png`);
  await page.screenshot({ path: framePath, fullPage: false });
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

async function captureSpan(page, durationMs, fps = 8) {
  const totalFrames = Math.floor((durationMs / 1000) * fps);
  const interval = 1000 / fps;
  for (let i = 0; i < totalFrames; i++) {
    await captureFrame(page, interval);
  }
}

async function clickByText(page, selector, text) {
  await page.evaluate((sel, txt) => {
    const elements = Array.from(document.querySelectorAll(sel));
    const target = elements.find((el) => el.textContent.includes(txt));
    if (target) target.click();
    else throw new Error(`Element ${sel} with text "${txt}" not found`);
  }, selector, text);
}

async function runRecording() {
  console.log('🎬 Starting automated browser demo video recording...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Initial Dashboard View
  console.log('📸 Scene 1: Initial Dashboard View');
  await captureSpan(page, 2000, 5);

  // 2. Schedule Single Email
  console.log('📸 Scene 2: Schedule Single Email for Mitrajit');
  await clickByText(page, 'button', 'Schedule Email');
  await captureSpan(page, 1000, 5);

  await page.type('input[type="email"]', 'mitrajit@example.com', { delay: 40 });
  await captureFrame(page, 200);

  // Clear default subject & type new one
  await page.click('input[placeholder="Email subject..."]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[placeholder="Email subject..."]', '🎉 Welcome to Outbox Lab Scheduler', { delay: 30 });
  await captureFrame(page, 200);

  // Select preset +10 sec
  await clickByText(page, 'button', '+10 sec');
  await captureFrame(page, 500);

  // Submit form
  await page.click('button[type="submit"]');
  console.log('⏳ Watching countdown timer in Scheduled Queue...');
  await captureSpan(page, 12000, 8); // Record full 12s until sent!

  // 3. Schedule Future Email for Server Restart Demo
  console.log('📸 Scene 3: Schedule Future Email for Server Restart Test');
  await clickByText(page, 'button', 'Schedule Email');
  await captureSpan(page, 800, 5);

  await page.click('input[type="email"]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[type="email"]', 'restart_test@example.com', { delay: 40 });

  await page.click('input[placeholder="Email subject..."]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[placeholder="Email subject..."]', '🔄 Server Restart Persistence Test', { delay: 30 });

  await clickByText(page, 'button', '+30 sec');
  await captureFrame(page, 500);
  await page.click('button[type="submit"]');

  await captureSpan(page, 4000, 5);

  // 4. Load Testing & Rate Limiting Batch
  console.log('📸 Scene 4: Load Testing & Rate Limiting (Batch Scheduling)');
  await clickByText(page, 'button', 'Load Test Batch');
  await captureSpan(page, 1000, 5);

  await clickByText(page, 'button', 'Schedule Batch');
  console.log('⚡ Batch scheduled! Capturing rate-limited dispatch...');
  await captureSpan(page, 10000, 8);

  console.log(`✅ Captured total ${frameCount} frames.`);
  await browser.close();

  // Encode frames to MP4 using FFmpeg
  console.log('🎥 Encoding MP4 video via FFmpeg...');
  const mp4Output = path.join(outputDir, 'demo_video.mp4');

  const ffmpegCmd = `ffmpeg -y -framerate 8 -i "${framesDir}/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=1280:-2" "${mp4Output}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  console.log(`🎉 Demo video successfully created: ${mp4Output}`);
}

runRecording().catch((err) => {
  console.error('❌ Error recording demo:', err);
  process.exit(1);
});
