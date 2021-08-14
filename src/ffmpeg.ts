/**
 * Reencode audio & video without creating files first
 *
 * Requirements: ffmpeg, ether via a manual installation or via ffmpeg-static
 *
 * If you need more complex features like an output-stream you can check the older, more complex example:
 * https://github.com/fent/node-ytdl-core/blob/cc6720f9387088d6253acc71c8a49000544d4d2a/example/ffmpeg.js
 */

// Buildin with nodejs
import cp from "child_process";
import readline from "readline";
// External modules
import ytdl from "ytdl-core";
import ffmpeg from "ffmpeg-static";
import { videoFormat } from "ytdl-core";
// Global constants

export function downloadVideoCustom(
  videoUrl: string,
  videoOutputPath: string,
  videoDownloadQuality?: string
) {
  return new Promise(async (resolve) => {
    const tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: Infinity },
      video: { downloaded: 0, total: Infinity },
      merged: { frame: 0, speed: "0x", fps: 0 },
    };

    let formats: videoFormat[] = [];
    try {
      formats = (await ytdl.getInfo(videoUrl)).formats;
    } catch (e) {
      console.log(e);
    }
    let videoFilterQuality: string | number | string[] | number[] | undefined;
    if (videoDownloadQuality) {
      for (let format of formats) {
        if (
          format.qualityLabel &&
          format.qualityLabel.match(videoDownloadQuality)
        ) {
          console.log(format.qualityLabel.match(videoDownloadQuality));
          videoFilterQuality = format.qualityLabel;
        }
      }
    }

    if (!videoFilterQuality && formats.length > 1) {
      videoFilterQuality = formats[1].qualityLabel;
    }

    const audio = ytdl(videoUrl, { quality: "highestaudio" }).on(
      "progress",
      (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
      }
    );
    let video;
    console.log(videoFilterQuality);
    video = ytdl(videoUrl, {
      filter: (format) => format.qualityLabel === videoFilterQuality,
    }).on("progress", (_, downloaded, total) => {
      tracker.video = { downloaded, total };
    });

    // Prepare the progress bar
    let progressbarHandle: any = null;
    const progressbarInterval = 1000;
    const showProgress = () => {
      readline.cursorTo(process.stdout, 0);
      const toMB = (i: number) => (i / 1024 / 1024).toFixed(2);
      const { video, audio, start, merged } = tracker;
      const videoProgress = (video.downloaded / video.total) * 100;
      const audioProgress = (audio.downloaded / audio.total) * 100;
      const progressTotal = (videoProgress + audioProgress) / 2;
      const downloadedMB = toMB(video.downloaded + audio.downloaded);
      const totalMB = toMB(video.total + audio.total);
      document.title = `Youtube Downloader - ${videoOutputPath
        .split("/")
        .pop()} | Fortschritt: ${progressTotal.toFixed(
        2
      )}% | ${downloadedMB}MB / ${totalMB}MB`;
      process.stdout.write(`Audio  | ${audioProgress.toFixed(2)}% processed `);
      process.stdout.write(
        `(${toMB(audio.downloaded)}MB of ${toMB(
          tracker.audio.total
        )}MB).${" ".repeat(10)}\n`
      );

      process.stdout.write(`Video  | ${videoProgress.toFixed(2)}% processed `);
      process.stdout.write(
        `(${toMB(video.downloaded)}MB of ${toMB(video.total)}MB).${" ".repeat(
          10
        )}\n`
      );

      process.stdout.write(`Merged | processing frame ${merged.frame} `);
      process.stdout.write(
        `(at ${merged.fps} fps => ${merged.speed}).${" ".repeat(10)}\n`
      );

      process.stdout.write(
        `running for: ${((Date.now() - start) / 1000 / 60).toFixed(2)} Minutes.`
      );
      readline.moveCursor(process.stdout, 0, -3);
    };

    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(
      ffmpeg,
      [
        // Remove ffmpeg's console spamming
        "-loglevel",
        "8",
        "-hide_banner",
        // Redirect/Enable progress messages
        "-progress",
        "pipe:3",
        // Set inputs
        "-i",
        "pipe:4",
        "-i",
        "pipe:5",
        // Map audio & video from streams
        "-map",
        "0:a",
        "-map",
        "1:v",
        // Keep encoding
        "-c:v",
        "copy",
        // Define output file
        videoOutputPath,
      ],
      {
        windowsHide: true,
        stdio: [
          /* Standard: stdin, stdout, stderr */
          "inherit",
          "inherit",
          "inherit",
          /* Custom: pipe:3, pipe:4, pipe:5 */
          "pipe",
          "pipe",
          "pipe",
        ],
      }
    );
    ffmpegProcess.on("close", () => {
      console.log("done");
      // Cleanup
      document.title = "Youtube Downloader";
      process.stdout.write("\n\n\n\n");
      clearInterval(progressbarHandle);
      resolve(true);
    });

    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    ffmpegProcess.stdio[3] &&
      ffmpegProcess.stdio[3].on("data", (chunk: any) => {
        // Start the progress bar
        if (!progressbarHandle)
          progressbarHandle = setInterval(showProgress, progressbarInterval);
        // Parse the param=value list returned by ffmpeg
        const lines = chunk.toString().trim().split("\n");
        const args: any = {};
        for (const l of lines) {
          const [key, value] = l.split("=");
          args[key.trim()] = value.trim();
        }
        tracker.merged = args;
      });
    audio.pipe(ffmpegProcess.stdio[4] as NodeJS.WritableStream);
    video.pipe((ffmpegProcess.stdio as any)[5] as NodeJS.WritableStream);
  });
}
