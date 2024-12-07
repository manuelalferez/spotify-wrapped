import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spotify Wrapped",
  description:
    "A comprehensive dashboard for analyzing your Spotify listening habits, including charts and statistics for artists, albums, platforms, and listening behavior.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI1NiAyNTYiPjxwYXRoIGZpbGw9IiMxRUQ3NjAiIGQ9Ik0xMjggMEM1Ny4zMDggMCAwIDU3LjMwOSAwIDEyOGMwIDcwLjY5NiA1Ny4zMDkgMTI4IDEyOCAxMjhjNzAuNjk3IDAgMTI4LTU3LjMwNCAxMjgtMTI4QzI1NiA1Ny4zMTQgMTk4LjY5Ny4wMDcgMTI3Ljk5OC4wMDd6bTU4LjY5OSAxODQuNjE0Yy0yLjI5MyAzLjc2LTcuMjE1IDQuOTUyLTEwLjk3NSAyLjY0NGMtMzAuMDUzLTE4LjM1Ny02Ny44ODUtMjIuNTE1LTExMi40NC0xMi4zMzVhNy45OCA3Ljk4IDAgMCAxLTkuNTUyLTYuMDA3YTcuOTcgNy45NyAwIDAgMSA2LTkuNTUzYzQ4Ljc2LTExLjE0IDkwLjU4My02LjM0NCAxMjQuMzIzIDE0LjI3NmMzLjc2IDIuMzA4IDQuOTUyIDcuMjE1IDIuNjQ0IDEwLjk3NW0xNS42NjctMzQuODUzYy0yLjg5IDQuNjk1LTkuMDM0IDYuMTc4LTEzLjcyNiAzLjI4OWMtMzQuNDA2LTIxLjE0OC04Ni44NTMtMjcuMjczLTEyNy41NDgtMTQuOTJjLTUuMjc4IDEuNTk0LTEwLjg1Mi0xLjM4LTEyLjQ1NC02LjY0OWMtMS41OS01LjI3OCAxLjM4Ni0xMC44NDIgNi42NTUtMTIuNDQ2YzQ2LjQ4NS0xNC4xMDYgMTA0LjI3NS03LjI3MyAxNDMuNzg3IDE3LjAwN2M0LjY5MiAyLjg5IDYuMTc1IDkuMDM0IDMuMjg2IDEzLjcyem0xLjM0NS0zNi4yOTNDMTYyLjQ1NyA4OC45NjQgOTQuMzk0IDg2LjcxIDU1LjAwNyA5OC42NjZjLTYuMzI1IDEuOTE4LTEzLjAxNC0xLjY1My0xNC45My03Ljk3OGMtMS45MTctNi4zMjggMS42NS0xMy4wMTIgNy45OC0xNC45MzVDOTMuMjcgNjIuMDI3IDE2OC40MzQgNjQuNjggMjE1LjkyOSA5Mi44NzZjNS43MDIgMy4zNzYgNy41NjYgMTAuNzI0IDQuMTg4IDE2LjQwNWMtMy4zNjIgNS42OS0xMC43MyA3LjU2NS0xNi40IDQuMTg3eiIvPjwvc3ZnPg==",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-medium antialiased">{children}</body>
    </html>
  );
}
