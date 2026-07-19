import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  subtitle: string;
  icon: IconifyName;
  badge?: string;
};

export function StaffPageHero({ title, subtitle, icon, badge }: Props) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2.5, sm: 3 },
        mb: 3,
        borderRadius: 3,
        color: 'common.white',
        background: 'linear-gradient(135deg, #67100E 0%, #9E1B16 58%, #D25125 100%)',
        boxShadow: '0 14px 34px rgba(103,16,14,0.18)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 180,
          height: 180,
          top: -100,
          right: -40,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.08)',
        }}
      />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={2}
        sx={{ position: 'relative' }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 50,
              height: 50,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2.25,
              bgcolor: 'rgba(255,255,255,0.14)',
            }}
          >
            <Iconify icon={icon} width={28} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ color: 'common.white' }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.78 }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
        {badge && (
          <Chip
            label={badge}
            sx={{ color: 'common.white', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.14)' }}
          />
        )}
      </Stack>
    </Box>
  );
}
