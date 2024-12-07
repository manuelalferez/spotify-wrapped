"use client";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Upload, FileText, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface SpotifyData {
  ts: string;
  platform: string;
  ms_played: number;
  conn_country: string;
  master_metadata_track_name: string;
  master_metadata_album_artist_name: string;
  master_metadata_album_album_name: string;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  reason_start: string;
  reason_end: string;
  episode_name: string;
  episode_show_name: string;
}

interface PlatformCount {
  [key: string]: number;
}

interface ChartDataType {
  platformData: Array<{ name: string; value: number }>;
  countryData: Array<{ country: string; hours: number }>;
  artistData: Array<{ artist: string; hours: number }>;
  albumData: Array<{ album: string; hours: number }>;
  listeningData: Array<{ month: string; hours: number }>;
  listeningBehavior: {
    totalSkips: number;
    shuffleUsage: number;
    offlineListening: number;
    totalTracks: number;
  };
  topPodcasts: Array<{ show: string; hours: number }>;
  hourlyListening: Array<{ hour: number; hours: number }>;
}

const PLATFORM_COLORS = {
  Computer: "#1DB954",
  Phone: "#20E160",
  Other: "#15C642",
} as const;

export default function CombineJSONToCSV() {
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const processData = (csvData: SpotifyData[]) => {
    // Platform distribution
    const platformCounts = csvData.reduce((acc: PlatformCount, curr) => {
      const platform = curr.platform.toLowerCase();
      let groupedPlatform;
      if (
        platform.includes("macos") ||
        platform.includes("darwin") ||
        platform.includes("os x") ||
        platform.includes("linux") ||
        platform.includes("windows")
      ) {
        groupedPlatform = "Computer";
      } else if (
        platform.includes("ios") ||
        platform.includes("iphone") ||
        platform.includes("ipad") ||
        platform.includes("android")
      ) {
        groupedPlatform = "Phone";
      } else {
        groupedPlatform = "Other";
      }
      acc[groupedPlatform] = (acc[groupedPlatform] || 0) + 1;
      return acc;
    }, {});

    const platformData = Object.entries(platformCounts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    // Country data
    const countryPlaytime = csvData.reduce(
      (acc: Record<string, number>, curr) => {
        acc[curr.conn_country] = (acc[curr.conn_country] || 0) + curr.ms_played;
        return acc;
      },
      {}
    );

    const countryData = Object.entries(countryPlaytime)
      .map(([country, ms]) => ({
        country,
        hours: Number((Number(ms) / (1000 * 60 * 60)).toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Artist data
    const artistPlaytime = csvData.reduce(
      (acc: Record<string, number>, curr) => {
        if (curr.master_metadata_album_artist_name) {
          acc[curr.master_metadata_album_artist_name] =
            (acc[curr.master_metadata_album_artist_name] || 0) + curr.ms_played;
        }
        return acc;
      },
      {}
    );

    const artistData = Object.entries(artistPlaytime)
      .map(([artist, ms]) => ({
        artist,
        hours: Number((Number(ms) / (1000 * 60 * 60)).toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
    // Album data
    const albumPlaytime = csvData.reduce(
      (acc: Record<string, number>, curr) => {
        if (curr.master_metadata_album_album_name) {
          acc[curr.master_metadata_album_album_name] =
            (acc[curr.master_metadata_album_album_name] || 0) + curr.ms_played;
        }
        return acc;
      },
      {}
    );

    const albumData = Object.entries(albumPlaytime)
      .map(([album, ms]) => ({
        album,
        hours: Number((Number(ms) / (1000 * 60 * 60)).toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    // Timeline data
    const timeData = csvData.reduce((acc: Record<string, number>, curr) => {
      const monthYear = new Date(curr.ts).toISOString().slice(0, 7);
      acc[monthYear] = (acc[monthYear] || 0) + curr.ms_played;
      return acc;
    }, {});

    const listeningData = Object.entries(timeData)
      .map(([monthYear, ms]) => ({
        month: monthYear,
        hours: Number((Number(ms) / (1000 * 60 * 60)).toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Listening behavior stats
    const listeningBehavior = {
      totalSkips: csvData.filter((item) => item.skipped).length,
      shuffleUsage: csvData.filter((item) => item.shuffle).length,
      offlineListening: csvData.filter((item) => item.offline).length,
      totalTracks: csvData.length,
    };

    // Podcast data
    const podcastData = csvData
      .filter((item) => item.episode_show_name)
      .reduce((acc: Record<string, number>, curr) => {
        acc[curr.episode_show_name] =
          (acc[curr.episode_show_name] || 0) + curr.ms_played;
        return acc;
      }, {});

    const topPodcasts = Object.entries(podcastData)
      .map(([show, ms]) => ({
        show,
        hours: Number((Number(ms) / (1000 * 60 * 60)).toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Time of day analysis
    const timeOfDayData = csvData.reduce(
      (acc: Record<string, number>, curr) => {
        const hour = new Date(curr.ts).getHours();
        acc[hour] = (acc[hour] || 0) + curr.ms_played;
        return acc;
      },
      {}
    );

    const hourlyListening = Object.entries(timeOfDayData)
      .map(([hour, ms]) => ({
        hour: parseInt(hour),
        hours: Number((Number(ms) / (1000 * 60 * 60)).toFixed(2)),
      }))
      .sort((a, b) => a.hour - b.hour);

    return {
      platformData,
      countryData,
      artistData,
      albumData,
      listeningData,
      listeningBehavior,
      topPodcasts,
      hourlyListening,
    };
  };

  const handleFiles = (files: FileList) => {
    if (!files || files.length === 0) {
      showError("Please choose at least one JSON file");
      return;
    }

    setUploadedFiles(Array.from(files).map((file) => file.name));

    const combinedData: SpotifyData[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          combinedData.push(...jsonData.flat());
        } catch {
          showError(`Invalid JSON format in file: ${file.name}`);
        }

        filesProcessed++;

        if (filesProcessed === files.length) {
          setChartData(processData(combinedData));
        }
      };
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-10">
        <Card className="bg-[#121212] border-none">
          <CardHeader className="flex items-center justify-center gap-3 bg-[#181818] rounded-xl p-5 mb-8 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-16 w-16"
              fill="#1DB954"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <CardTitle className="text-white text-4xl font-extrabold m-0 tracking-tight">
              Spotify Wrapped{" "}
              <span className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] bg-clip-text text-transparent">
                Dive Deep Into Your Music Journey
              </span>
            </CardTitle>
            <p className="text-gray-400 text-lg mt-4 max-w-3xl text-center leading-relaxed">
              Want to go beyond basic Spotify Wrapped? Unlock rich insights and
              detailed analytics about your musical journey, discovering
              patterns you never knew existed.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Key Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#282828] p-8 rounded-lg hover:bg-[#303030] transition-colors duration-200">
                  <h3 className="text-[#1DB954] font-semibold mb-2 text-2xl">
                    Timeline
                  </h3>
                  <p className="text-white mb-4 text-xl">
                    Visualize your listening history over time to discover
                    patterns and trends in your music consumption
                  </p>
                  <img
                    src="https://ik.imagekit.io/manuelalferez/manuel/SCR-20241207-jvef_gIV_iWyIp.png?updatedAt=1733564956559"
                    alt="Platform distribution visualization"
                    className="w-full h-80 object-contain rounded-lg"
                  />
                </div>
                <div className="bg-[#282828] p-8 rounded-lg hover:bg-[#303030] transition-colors duration-200">
                  <h3 className="text-[#1DB954] font-semibold mb-2 text-2xl">
                    Listening Behavior
                  </h3>
                  <p className="text-white mb-4 text-xl">
                    Understand your listening habits including shuffle usage,
                    skips, and offline listening patterns
                  </p>
                  <img
                    src="https://ik.imagekit.io/manuelalferez/manuel/SCR-20241207-jvxg_RP2wN-JRw.png?updatedAt=1733564946471"
                    alt="Listening behavior visualization"
                    className="w-full h-80 object-contain rounded-lg"
                  />
                </div>
                <div className="bg-[#282828] p-8 rounded-lg hover:bg-[#303030] transition-colors duration-200">
                  <h3 className="text-[#1DB954] font-semibold mb-2 text-2xl">
                    Top Artists
                  </h3>
                  <p className="text-white mb-4 text-xl">
                    Explore your most-listened artists and see how many hours
                    you have spent with your favorite musicians
                  </p>
                  <img
                    src="https://ik.imagekit.io/manuelalferez/manuel/SCR-20241207-jvpf_JOCBTIYBh.png?updatedAt=1733564946141"
                    alt="Top artists visualization"
                    className="w-full h-80 object-contain rounded-lg"
                  />
                </div>
                <div className="bg-[#282828] p-8 rounded-lg hover:bg-[#303030] transition-colors duration-200">
                  <h3 className="text-[#1DB954] font-semibold mb-2 text-2xl">
                    Hourly Activity
                  </h3>
                  <p className="text-white mb-4 text-xl">
                    See when you listen to music most throughout the day with an
                    hour-by-hour breakdown
                  </p>
                  <img
                    src="https://ik.imagekit.io/manuelalferez/manuel/SCR-20241207-jwjg_i1BsW4JKA.png?updatedAt=1733564946584"
                    alt="Hourly activity visualization"
                    className="w-full h-80 object-contain rounded-lg"
                  />
                </div>
                <div className="bg-[#282828] p-8 rounded-lg hover:bg-[#303030] transition-colors duration-200">
                  <h3 className="text-[#1DB954] font-semibold mb-2 text-2xl">
                    Top Platforms
                  </h3>
                  <p className="text-white mb-4 text-xl">
                    Analyze which devices and platforms you use most frequently
                    for your music streaming experience
                  </p>
                  <img
                    src="https://ik.imagekit.io/manuelalferez/manuel/SCR-20241207-jvgi_V39iU2-WB.png?updatedAt=1733564946298"
                    alt="Top platforms visualization"
                    className="w-full h-80 object-contain rounded-lg"
                  />
                </div>
                <div className="bg-gradient-to-br from-[#1DB954] to-[#15843C] p-8 rounded-lg hover:from-[#1EC75A] hover:to-[#178F41] transition-all duration-200">
                  <h3 className="text-white font-semibold mb-4 text-4xl">
                    And much more...
                  </h3>
                  <p className="text-white mb-6 text-xl">
                    Discover your podcast favorites and see where in the world
                    you listen most
                  </p>
                  <div className="w-full h-80 flex items-center justify-center">
                    <div className="flex flex-wrap gap-4 justify-center items-center">
                      <div className="animate-[bounce_2s_ease-in-out_infinite]">
                        <span className="text-8xl text-white">🎵</span>
                      </div>
                      <div className="animate-[bounce_3s_ease-in-out_infinite]">
                        <span className="text-5xl text-white">🎶</span>
                      </div>
                      <div className="animate-[bounce_2.5s_ease-in-out_infinite]">
                        <span className="text-7xl text-white">♪</span>
                      </div>
                      <div className="animate-[bounce_1.8s_ease-in-out_infinite]">
                        <span className="text-4xl text-white">♫</span>
                      </div>
                      <div className="animate-[bounce_2.2s_ease-in-out_infinite]">
                        <span className="text-6xl text-white">🎵</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardContent className="space-y-6">
            <Card className="bg-[#181818] border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader
                className="cursor-pointer flex justify-between items-center"
                onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
              >
                <div className="flex-1 flex items-center justify-between w-full">
                  <CardTitle className="text-[#1DB954] text-2xl font-bold flex items-center justify-between w-full px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 bg-[#1DB954] rounded-full"></div>
                      How to Get Your Data
                    </div>
                    {isInstructionsOpen ? (
                      <ChevronUp className="h-6 w-6 text-[#1DB954]" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-[#1DB954]" />
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              {isInstructionsOpen && (
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col items-start gap-4 p-4 rounded-lg bg-[#282828] hover:bg-[#303030] transition-colors duration-200">
                      <div className="flex items-start gap-4 w-full">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold">
                          1
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1 text-xl">
                            Request Your Data
                          </h3>
                          <p className="text-gray-300 text-lg">
                            Visit{" "}
                            <a
                              href="https://www.spotify.com/us/account/privacy/"
                              target="_blank"
                              className="text-[#1DB954] hover:underline"
                            >
                              Spotify Privacy Settings
                            </a>{" "}
                            and request &quot;Extended streaming history&quot;
                          </p>
                        </div>
                      </div>
                      <img
                        src="https://ik.imagekit.io/manuelalferez/manuel/spotify-step1_qrFfv09IZ.png?updatedAt=1733563838241"
                        alt="How to request Spotify data step 1"
                        className="w-3/4 mx-auto rounded-lg"
                      />
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-lg bg-[#282828] hover:bg-[#303030] transition-colors duration-200">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1 text-xl">
                          Wait for Email
                        </h3>
                        <p className="text-gray-300 text-lg">
                          You will receive an email from Spotify within 1-3 days
                          with a download link for your data
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-4 p-4 rounded-lg bg-[#282828] hover:bg-[#303030] transition-colors duration-200">
                      <div className="flex items-start gap-4 w-full">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold">
                          3
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1 text-xl">
                            Upload Your Files
                          </h3>
                          <p className="text-gray-300 text-lg">
                            Download and extract the ZIP file, then upload the
                            JSON files below to visualize your listening history
                          </p>
                        </div>
                      </div>
                      <img
                        src="https://ik.imagekit.io/manuelalferez/manuel/files-spotify_mq_jkyL3M.png"
                        alt="How to request Spotify data step 3"
                        className="w-3/4 mx-auto rounded-lg"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </CardContent>

          <CardContent>
            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="space-y-2">
              <Label className="text-gray-300">Upload JSON Files</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-[#1DB954] bg-[#1DB95420]"
                    : "border-gray-600 hover:border-[#1DB954] hover:bg-[#1DB95410]"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("jsonFiles")?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-[#1DB954]" />
                <p className="text-gray-300">
                  Drag & drop your JSON files here, or click to select
                </p>
                <Input
                  type="file"
                  id="jsonFiles"
                  accept=".json"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files!)}
                />
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300">Uploaded Files</Label>
                <ScrollArea className="h-[100px] w-full rounded-md border border-gray-800 bg-[#181818] p-4">
                  <div className="space-y-2">
                    {uploadedFiles.map((filename, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-gray-400"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{filename}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {chartData && (
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-8 bg-[#282828]">
                  {[
                    "timeline",
                    "platforms",
                    "countries",
                    "artists",
                    "albums",
                    "behavior",
                    "podcasts",
                    "hourly",
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="text-gray-400 data-[state=active]:bg-[#1DB954] data-[state=active]:text-white"
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="timeline" className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.listeningData}>
                      <XAxis
                        dataKey="month"
                        interval={10}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.toLocaleString("default", {
                            month: "short",
                          })} ${date.getFullYear()}`;
                        }}
                        stroke="#fff"
                        padding={{ left: 20, right: 20 }}
                      />
                      <YAxis
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#fff" },
                        }}
                        stroke="#fff"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#282828",
                          border: "none",
                          color: "#fff",
                        }}
                        formatter={(value: number) => [
                          `${value.toFixed(1)} hours`,
                          "Listening time",
                        ]}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return `${date.toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}`;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="#1DB954"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="platforms" className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.platformData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({ name, value }) => `${name}: ${value} hours`}
                      >
                        {chartData.platformData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              PLATFORM_COLORS[
                                entry.name as keyof typeof PLATFORM_COLORS
                              ] || PLATFORM_COLORS.Other
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#f5f5f5",
                          border: "none",
                          color: "#000",
                          fill: "#000",
                          fontWeight: "bold",
                        }}
                        formatter={(value) => [
                          `${value} hours`,
                          "Listening time",
                        ]}
                        labelStyle={{ color: "#000" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="countries" className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.countryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                      <XAxis dataKey="country" stroke="#fff" />
                      <YAxis
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#fff" },
                        }}
                        stroke="#fff"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#282828",
                          border: "none",
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          `${value} hours`,
                          "Listening time",
                        ]}
                      />
                      <Bar dataKey="hours" fill="#1DB954" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="artists" className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.artistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                      <XAxis dataKey="artist" stroke="#fff" />
                      <YAxis
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#fff" },
                        }}
                        stroke="#fff"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#282828",
                          border: "none",
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          `${value} hours`,
                          "Listening time",
                        ]}
                      />
                      <Bar dataKey="hours" fill="#1DB954" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="albums" className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.albumData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                      <XAxis dataKey="album" stroke="#fff" />
                      <YAxis
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#fff" },
                        }}
                        stroke="#fff"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#282828",
                          border: "none",
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          `${value} hours`,
                          "Listening time",
                        ]}
                      />
                      <Bar dataKey="hours" fill="#1DB954" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="behavior" className="h-[400px]">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    <Card className="bg-[#181818] border-none shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[#1DB954] text-2xl font-bold flex items-center gap-2">
                          <div className="w-1 h-8 bg-[#1DB954] rounded-full"></div>
                          Listening Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex-1 min-w-[200px] p-4 rounded-lg bg-[#282828] hover:bg-[#303030] transition-colors duration-200">
                            <h3 className="text-gray-300 text-sm font-medium mb-1">
                              Skip Rate
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <p className="text-3xl font-bold text-white">
                                {(
                                  (chartData.listeningBehavior.totalSkips /
                                    chartData.listeningBehavior.totalTracks) *
                                  100
                                ).toFixed(1)}
                              </p>
                              <span className="text-[#1DB954] text-xl">%</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[200px] p-4 rounded-lg bg-[#282828] hover:bg-[#303030] transition-colors duration-200">
                            <h3 className="text-gray-300 text-sm font-medium mb-1">
                              Shuffle Usage
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <p className="text-3xl font-bold text-white">
                                {(
                                  (chartData.listeningBehavior.shuffleUsage /
                                    chartData.listeningBehavior.totalTracks) *
                                  100
                                ).toFixed(1)}
                              </p>
                              <span className="text-[#1DB954] text-xl">%</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[200px] p-4 rounded-lg bg-[#282828] hover:bg-[#303030] transition-colors duration-200">
                            <h3 className="text-gray-300 text-sm font-medium mb-1">
                              Offline Listening
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <p className="text-3xl font-bold text-white">
                                {(
                                  (chartData.listeningBehavior
                                    .offlineListening /
                                    chartData.listeningBehavior.totalTracks) *
                                  100
                                ).toFixed(1)}
                              </p>
                              <span className="text-[#1DB954] text-xl">%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="podcasts" className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.topPodcasts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                      <XAxis dataKey="show" stroke="#fff" />
                      <YAxis
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#fff" },
                        }}
                        stroke="#fff"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#282828",
                          border: "none",
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          `${value} hours`,
                          "Listening time",
                        ]}
                      />
                      <Bar dataKey="hours" fill="#1DB954" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="hourly" className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.hourlyListening}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(hour) => `${hour}:00`}
                        label={{
                          value: "Hour of Day",
                          position: "bottom",
                          fill: "#fff",
                        }}
                        stroke="#fff"
                      />
                      <YAxis
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#fff" },
                        }}
                        stroke="#fff"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#282828",
                          border: "none",
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          `${value} hours`,
                          "Listening time",
                        ]}
                        labelFormatter={(hour) =>
                          `${hour}:00 - ${(hour + 1) % 24}:00`
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="#1DB954"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
      <footer className="bg-[#121212] text-white p-10 text-center mt-8 rounded-xl border border-gray-800 shadow-sm">
        <div>
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 mx-auto mb-4"
            fill="#1DB954"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <p className="font-medium my-2 text-gray-300">
            Created by{" "}
            <a
              href="https://www.manuelalferez.com/"
              target="_blank"
              className="text-[#1DB954] hover:opacity-70 transition-opacity underline"
            >
              Manuel Alférez
            </a>
          </p>
          <p className="my-2 text-gray-500">
            Copyright © 2024 - All rights reserved
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <a
            href="https://twitter.com/manuelalferez"
            target="_blank"
            className="text-gray-500 hover:text-[#1DB954] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
