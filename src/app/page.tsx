"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Upload, FileText } from "lucide-react";
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
  Computer: "#000000",
  Phone: "#147EFB",
  Other: "#808080",
} as const;

export default function CombineJSONToCSV() {
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartDataType | null>(null);

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
      {},
    );

    const countryData = Object.entries(countryPlaytime)
      .map(([country, ms]) => ({
        country,
        hours: Number((Number(ms) / (1000 * 60 * 60)).toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    // Artist data
    const artistPlaytime = csvData.reduce(
      (acc: Record<string, number>, curr) => {
        if (curr.master_metadata_album_artist_name) {
          acc[curr.master_metadata_album_artist_name] =
            (acc[curr.master_metadata_album_artist_name] || 0) + curr.ms_played;
        }
        return acc;
      },
      {},
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
      {},
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
      {},
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

  const combineAndConvert = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

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
        } catch (err) {
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

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Spotify Wrapper (the useful one)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="jsonFiles">Upload JSON Files</Label>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Button asChild variant="outline" className="w-full">
                <label
                  htmlFor="jsonFiles"
                  className="cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose Files
                  <Input
                    type="file"
                    id="jsonFiles"
                    accept=".json"
                    multiple
                    className="hidden"
                    onChange={combineAndConvert}
                  />
                </label>
              </Button>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files</Label>
              <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {uploadedFiles.map((filename, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{filename}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {chartData && (
            <Tabs defaultValue="platforms" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
                <TabsTrigger value="countries">Countries</TabsTrigger>
                <TabsTrigger value="artists">Top Artists</TabsTrigger>
                <TabsTrigger value="albums">Top Albums</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="hourly">Daily Pattern</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.listeningData}>
                    <XAxis
                      dataKey="month"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #ccc",
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
                      stroke="#8884d8"
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
                    <Tooltip formatter={(value) => [`${value} hours`]} />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="countries" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.countryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value} hours`,
                        "Listening time",
                      ]}
                    />
                    <Bar dataKey="hours" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="artists" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.artistData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="artist" />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value} hours`,
                        "Listening time",
                      ]}
                    />
                    <Bar dataKey="hours" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="albums" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.albumData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="album" />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value} hours`,
                        "Listening time",
                      ]}
                    />
                    <Bar dataKey="hours" fill="#9884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="behavior" className="h-[400px]">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle>Listening Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3>Skip Rate</h3>
                          <p>
                            {(
                              (chartData.listeningBehavior.totalSkips /
                                chartData.listeningBehavior.totalTracks) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                        <div>
                          <h3>Shuffle Usage</h3>
                          <p>
                            {(
                              (chartData.listeningBehavior.shuffleUsage /
                                chartData.listeningBehavior.totalTracks) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                        <div>
                          <h3>Offline Listening</h3>
                          <p>
                            {(
                              (chartData.listeningBehavior.offlineListening /
                                chartData.listeningBehavior.totalTracks) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="podcasts" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topPodcasts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="show" />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${value} hours`,
                        "Listening time",
                      ]}
                    />
                    <Bar dataKey="hours" fill="#ff7eb6" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="hourly" className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.hourlyListening}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(hour) => `${hour}:00`}
                      label={{ value: "Hour of Day", position: "bottom" }}
                    />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
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
                      stroke="#ffa600"
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
  );
}
