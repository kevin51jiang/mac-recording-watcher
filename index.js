import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { moveFile } from "move-file";
import { time } from "console";

const watchFolder = "/Users/kjiang/Desktop/quicktimeRaw/";
const outputFolder = "/Users/kjiang/Desktop/output/";
const errorFolder = "/Users/kjiang/Desktop/error/";

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
        .output(outputFolder + fileNameNoExtension + ".mp4")
        .run();
    } else {
      // move to output dir
      console.log("Not .mov, moving to output dir");
      await moveFile(
        rawPath,
        outputFolder + Date.now().valueOf() + "." + extension
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
