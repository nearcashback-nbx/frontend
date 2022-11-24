import { Box, CircularProgress, Typography } from "@mui/material";

type LoadingProps = {
  title: string;
};

const Loading = (props: LoadingProps): JSX.Element => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        flexGrow: 1
      }}
    >
      <Box sx={{ marginY: 1 }}>
        <CircularProgress />
      </Box>
      <Box sx={{ marginY: 1 }}>
        <Typography variant="body1">{props.title}</Typography>
      </Box>
    </Box>
  );
};

export default Loading;
