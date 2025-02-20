import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { moveFile } from "move-file";
import { time } from "console";

const watchFolder = "/Users/kjiang/Desktop/rec/raw/";
const outputFolder = "/Users/kjiang/Desktop/rec/output/";
const errorFolder = "/Users/kjiang/Desktop/rec/error/";

const sanitizeFileName = (fileName) => {

  // If it's a PNG file, only keep the part before .png and the extension
  if (fileName.toLowerCase().includes(".png")) {
    // Match everything up to .png (case insensitive) and add .png back
    return ".png";
  }
  return fileName;
};

const convertFile = async (rawPath) => {
  console.log(`Found new file ${rawPath}`);
  const fileName = path.basename(rawPath);
  const extension = path.extname(fileName);
  // won't work for stuff like .tar.gz but we don't have that problem here
  const fileNameNoExtension = fileName.replace(/\.[^/.]+$/, "");
  try {
    if (fileName.includes(".mov")) {
      // convert using ffmpeg
      console.log("converting to mp4");
      const timestamp = Date.now().valueOf();
      ffmpeg()
        .on("start", () => console.log("Spawned ffmpeg for " + fileName))
        .on("progress", (progress) =>
          console.log("Processing: " + progress.percent + "% done")
        )
        .on("end", () => {
          console.log("done moving " + fileName);
          fs.unlink(rawPath, (err) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log("done deleting", fileName);
          });
        })
        .input(rawPath)
        .output(outputFolder + timestamp + ".mp4")
        .run();
    } else {
      // move to output dir with sanitized filename
      console.log("Not .mov, moving to output dir", fileName);
      const sanitizedFileExtension = sanitizeFileName(fileName);
      await moveFile(
        rawPath,
        outputFolder + Date.now().valueOf() +  sanitizedFileExtension
      );
    }
  } catch (e) {
    console.log("Error, moving to error folder: ", e, rawPath);
    await moveFile(rawPath, errorFolder + fileName);
    console.log("done");
  } finally {
    console.log("done processing ", fileName);
  }
};

// One-liner for current directory
chokidar.watch(watchFolder).on("add", (path) => convertFile(path));
