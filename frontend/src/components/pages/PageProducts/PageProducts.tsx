import Products from "~/components/pages/PageProducts/components/Products";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import UploadCSV from "~/components/UploadCSV";

export default function PageProducts() {
  const importApiUrl =
    "https://dwu01n7cwk.execute-api.us-east-1.amazonaws.com/prod/";

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
