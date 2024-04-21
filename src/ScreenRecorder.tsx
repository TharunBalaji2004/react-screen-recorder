import React, { useState, useEffect } from "react";
import toast from "react-hot-toast"; 

const ScreenRecorder: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoQuality, setVideoQuality] = useState<string>("hd");
  const [recordedBlob, setRecordedBlob] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    window.onbeforeunload = function() {
      return "Do you want to refresh the window?"
    }
  }, []);

  useEffect(() => {
    if (!isRecording) {
        setTimer(0)
    } else {
        setInterval(() => {
            setTimer(prevTimer => prevTimer + 1);
        }, 1000);
    }
  }, [isRecording]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleScreenShare = () => {
    if (!isRecording) {
      navigator.mediaDevices
        .getDisplayMedia(getVideoConstraints(videoQuality))
        .then((stream) => {
          setStream(stream)
          toast.success("Screen sharing started");
        })
        .catch((err) => {
          console.error("Error accessing screen:", err)
          toast.error("Error accessing screen. Please try again.")
        });
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
    }
  };

  const handleDownload = () => {
    if (recordedBlob) {
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear().toString();
      const hours = currentDate.getHours().toString().padStart(2, "0");
      const minutes = currentDate.getMinutes().toString().padStart(2, "0");

      const fileName = `${day}-${month}-${year} ${hours}-${minutes} recorded-video.webm`;

      const a = document.createElement("a");
      a.href = recordedBlob;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const startRecording = () => {
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(url); // Store the blob URL
        console.log("URL: ", url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecorder(mediaRecorder);
      toast.success("Recording started");
    } else {
      toast.error("No stream to record. Please start screen sharing first.");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setIsRecording(false);
      setRecorder(null);
    }
  };

  const getVideoConstraints = (quality: string) => {
    let constraints: MediaStreamConstraints = {
      video: true,
      audio: { noiseSuppression: false, echoCancellation: false },
    };

    if (quality === "hd") {
      constraints.video = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };
    } else if (quality === "sd") {
      constraints.video = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
    } else if (quality === "ld") {
      constraints.video = {
        width: { ideal: 640 },
        height: { ideal: 480 },
      };
    }

    return constraints;
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVideoQuality(e.target.value);
  };

  return (
    <>
    <div className="h-screen flex flex-col justify-center items-center">
      <div className="flex gap-5 items-center">
        <select
          value={videoQuality}
          onChange={handleQualityChange}
          className="px-4 py-2 rounded-full"
        >
          <option value="hd">High Quality (HD)</option>
          <option value="sd">Standard Quality (SD)</option>
          <option value="ld">Low Quality (LD)</option>
        </select>
        <button
          onClick={toggleScreenShare}
          className="inline-block rounded-full border border-indigo-600 bg-indigo-600 px-12 py-3 text-lg font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
        >
          {isRecording ? "Stop Sharing" : "Start Sharing"}
        </button>
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`inline-block rounded-full border border-indigo-600 bg-indigo-600 px-12 py-3 text-lg font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500 ${
            isRecording && "opacity-50 cursor-not-allowed"
          }`}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className={`inline-block rounded-full border border-indigo-600 bg-indigo-600 px-12 py-3 text-lg font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500 ${
            !isRecording && "opacity-50 cursor-not-allowed"
          }`}
        >
          Stop Recording
        </button>
      </div>
      <div className="mt-5">
        {isRecording && (
          <div className="mt-5 flex flex-col items-center">
            <p>Recording Time: {formatTime(timer)}</p>
          </div>
        )}
        {recordedBlob && (
          <div className="flex flex-col items-center gap-5">
            <button
              onClick={handleDownload}
              className="inline-block rounded-full border border-indigo-600 bg-indigo-600 px-12 py-3 text-lg font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:outline-none focus:ring active:text-indigo-500"
            >
              Download Recording
            </button>
            <video controls src={recordedBlob} className="w-[60rem]" />
          </div>
        )}
      </div>
    </div>
    </>
  );
  
};

export default ScreenRecorder;
