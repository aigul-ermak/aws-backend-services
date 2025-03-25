import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

interface UploadCSVProps {
  importApiUrl: string;
}

const UploadCSV: React.FC<UploadCSVProps> = ({ importApiUrl }) => {
  const [file, setFile] = useState<File | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  console.log("Import API Path:", importApiUrl);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    try {
      const fileName = encodeURIComponent(file.name);
      const url = `${importApiUrl.replace(/\/+$/, "")}/import?name=${fileName}`;

      const authorization_token = localStorage.getItem("authorization_token");

      console.log("Using Authorization token:", authorization_token);
      console.log("Uploading file:", file.name);
      console.log("Requesting signed URL from:", url);

      if (!authorization_token) {
        throw new Error("Authorization token missing in localStorage");
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${authorization_token}`,
        },
      });

      console.log("Signed URL fetch response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Error getting signed URL: ${response.statusText} - ${errorText}`
        );
      }

      const signedUrl = await response.text();

      console.log("Received signed URL:", signedUrl);

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      console.log("Upload to S3 response status:", uploadResponse.status);

      if (!uploadResponse.ok) {
        throw new Error(`Error uploading file: ${uploadResponse.statusText}`);
      }

      alert("File uploaded successfully!");
      console.log("Uploaded file:", file.name);

      removeFile();
    } catch (error: any) {
      console.error("Upload error:", error);

      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        alert(
          "CORS issue: Make sure the API Gateway returns proper CORS headers."
        );
      } else {
        alert("Upload failed: " + error.message);
      }
    }
  };

  return (
    <Box>
      {file ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            size="small"
            color="warning"
            variant="contained"
            onClick={removeFile}
          >
            Remove file
          </Button>
          <Button
            size="small"
            color="secondary"
            variant="contained"
            onClick={uploadFile}
          >
            Upload file
          </Button>
        </div>
      ) : (
        <>
          <input
            hidden
            type="file"
            accept=".csv"
            onChange={onFileChange}
            ref={uploadInputRef}
          />
          <Button
            size="small"
            color="primary"
            variant="contained"
            onClick={() => uploadInputRef.current?.click()}
          >
            Import CSV File
          </Button>
        </>
      )}
    </Box>
  );
};

export default UploadCSV;
