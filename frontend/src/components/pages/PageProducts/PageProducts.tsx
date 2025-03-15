import Products from "~/components/pages/PageProducts/components/Products";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import UploadCSV from "~/components/UploadCSV";

export default function PageProducts() {
  const importApiUrl =
    "https://obyvp4e5m7.execute-api.us-east-1.amazonaws.com/prod/import";

  return (
    <Box py={3}>
      <Typography variant="h4" gutterBottom>
        Welcome to My Store
      </Typography>
      <Box mb={3}>
        <UploadCSV importApiUrl={importApiUrl} />
      </Box>
      <Products />
    </Box>
  );
}
