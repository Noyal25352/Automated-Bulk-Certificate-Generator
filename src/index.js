import { loadImage, GlobalFonts } from "@napi-rs/canvas";
import path from "path";
import xlsx from "xlsx";
import ora from "ora";
import fs from "fs";

let workbook;
try {
  workbook = xlsx.readFile("input/data.xlsx");
} catch (error) {
  console.error("Error: File not found or cannot be read.");
}

const fontPath = path.join("input/fonts/bell-mt-bold.ttf");
await GlobalFonts.registerFromPath(fontPath, "bell-mt-bold");

const backgroundPath = path.join("input/template/template.png");
const backgroundImage = await loadImage(backgroundPath);
const { width, height } = backgroundImage;

import { genCert } from "./certificateGenerator.js";

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const jsonData = xlsx.utils.sheet_to_json(worksheet);

const BATCH_SIZE = 5;
const failedCertificates = [];
const seenPairs = new Set();

for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
  const batch = jsonData.slice(i, i + BATCH_SIZE);
  await Promise.all(
    batch.map(async (row) => {
      try {
        const rowName = row.Name;
        const rowCollege = row.college;

        const spinner = ora(`Generating certificate for ${rowName}`).start();
        const pairKey = `${rowName}|${rowCollege}`;
        if (seenPairs.has(pairKey)) {
          failedCertificates.push({
            name: rowName,
            college: rowCollege,
            reason: "Duplicate name and college combination",
          });
          spinner.fail(`Skipped duplicate certificate for ${rowName}`);
          return;
        }
        seenPairs.add(pairKey);

        const certificate = await genCert(
          rowName,
          rowCollege,
          width,
          height,
          backgroundImage
        );

        const folder = "certificate";
        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder);
        }
        const filename = `${folder}/${rowName} - ${rowCollege}.png`;
        fs.writeFileSync(filename, certificate);
        spinner.succeed(`Certificate for ${rowName} generated.`);
      } catch (error) {
        console.error(`Failed to generate certificate for ${row.Name}:`, error);
        fs.appendFileSync(
          "error.log",
          `Failed to generate certificate for ${row.Name}: ${error}\n`
        );
        failedCertificates.push({
          name: row.Name,
          college: row.college,
          reason: error.message,
        });
      }
    })
  );
}

if (failedCertificates.length > 0) {
  console.log("\nSkipped certificates:");
  failedCertificates.forEach(({ name, college, reason }) => {
    console.log(`- ${name} (${college}): ${reason}`);
  });
}
