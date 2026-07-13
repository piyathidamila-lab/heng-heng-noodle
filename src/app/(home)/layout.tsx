import Box from '@mui/material/Box';

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        bgcolor: { xs: 'common.white', sm: 'grey.200' },
      }}
    >
      <Box
        sx={{
          width: 1,
          maxWidth: 480,
          minHeight: '100dvh',
          bgcolor: 'common.white',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: { xs: 'none', sm: '0 24px 64px rgba(0,0,0,0.18)' },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
