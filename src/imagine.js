#!/usr/bin/env node

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { exit } from "process";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const instructions = `imag.in.e - a tool for manipulating images

Usage:

imagine complement <infile> [outfile] - converts image pixels to complementary colors

Examples:
  imagine complement input.png output.png
`;

function run() {
  if (args.length < 2) {
    console.log(instructions);
    exit(1);
  }
  else {
    const command = args[0];

    if (command === "complement") {
      processComplement();
    }
  }
}

async function processComplement() {
  const fileToConvert = args[1];
  logMessage(`Processing ${fileToConvert} to complement...`);

  try {
    const file = fs.readFileSync(path.resolve(fileToConvert));
    const { data: raw, info } = await sharp(file)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const before = new Uint8Array(raw.buffer);
    const pixels = new Uint8Array(info.size);

    for (let i = 0; i < info.size; i += info.channels) {
      const r = before[i];
      const g = before[i + 1];
      const b = before[i + 2];
      const a = info.channels === 4 ? before[i + 3] : 255;

      const newR = 255 - r;
      const newG = 255 - g;
      const newB = 255 - b;

      if (info.channels === 3) {
        pixels[i] = newR;
        pixels[i + 1] = newG;
        pixels[i + 2] = newB;
      }
      else {
        pixels[i] = newR;
        pixels[i + 1] = newG;
        pixels[i + 2] = newB;
        pixels[i + 3] = a;
      }
    }

    const image = sharp(pixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels,
      },
    }).toColorspace("srgb").png({ palette: true, compressionLevel: 9 });

    const fileName = fileToConvert.substring(fileToConvert.lastIndexOf("/") + 1, fileToConvert.lastIndexOf("."));
    fs.mkdir(`${__dirname}/../out`, { recursive: true }, (err) => {
      if (err) throw err;
    });

    await image.toFile(`${__dirname}/../out/${fileName}.png`)
      .then(data => {
        logMessage(
          `Converted ${fileToConvert} (${file.buffer.byteLength} bytes, ${raw.buffer.byteLength} raw bytes) to complementary ${fileName}.png (${data.size} bytes)`
        );
        exit(0);
      })
      .catch((err) => {
        if (err) throw err;
      });
  }
  catch (err) {
    logError(err, "complement");
    exit(1);
  }
}

function logError(err, mode) {
  const m =
    mode === "complement" ? " - Converting to complement" : "";
  console.log("[%s] %s", "imag.in.e" + m, err.message);
  console.log(err);
}

function logMessage(msg) {
  console.log("[%s] %s", "imag.in.e", msg);
}

run();
