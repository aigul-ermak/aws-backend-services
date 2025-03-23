import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import API_PATHS from "~/constants/apiPaths";

interface UploadCSVProps {
  importApiUrl: string;
}

const UploadCSV: React.FC<UploadCSVProps> = ({ importApiUrl }) => {
  const [file, setFile] = useState<File | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  console.log("Import API Path:", API_PATHS.import);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = ""; // Clear the file input
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    try {
      const fileName = encodeURIComponent(file.name);
      const url = `${importApiUrl.replace(/\/+$/, "")}/import?name=${fileName}`;

      const authorization_token = localStorage.getItem("authorization_token");

      if (!authorization_token) {
        throw new Error("Authorization token missing in localStorage");
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${authorization_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error getting signed URL: ${response.statusText}`);
      }
      const signedUrl = await response.text();

      // 2. PUT the file directly to S3 using the signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Error uploading file: ${uploadResponse.statusText}`);
      }

      alert("File uploaded successfully!");

      console.log("Uploaded file:", file.name);
      console.log("Signed URL used:", signedUrl);

      removeFile();
    } catch (error) {
      console.error("Upload error:", error);
      alert("File upload failed. Check console for details.");
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
            onClick={() =>
              uploadInputRef.current && uploadInputRef.current.click()
            }
          >
            Import CSV File
          </Button>
        </>
      )}
    </Box>
  );
};

export default UploadCSV;
