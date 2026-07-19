'use client';

import type { LoyaltyConfig } from 'src/lib/shop-settings-service';
import type {
  RewardInput,
  MemberSummary,
  LoyaltyReward,
  LoyaltyRedemption,
} from 'src/lib/loyalty-service';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { RedemptionQueue } from './redemption-queue';
import { RewardFormDialog } from './reward-form-dialog';
import { MemberLedgerDialog } from './member-ledger-dialog';
import {
  createRewardAdmin,
  deleteRewardAdmin,
  updateRewardAdmin,
  updateLoyaltyConfigAdmin,
} from './loyalty-actions';

// ----------------------------------------------------------------------

type Props = {
  initialLoyaltyConfig: LoyaltyConfig;
  initialMembers: MemberSummary[];
  initialRewards: LoyaltyReward[];
  initialPendingRedemptions: LoyaltyRedemption[];
};

type TabValue = 'settings' | 'members' | 'rewards' | 'redemptions';

export function AdminLoyaltyView({
  initialLoyaltyConfig,
  initialMembers,
  initialRewards,
  initialPendingRedemptions,
}: Props) {
  const [tab, setTab] = useState<TabValue>('settings');

  const [config, setConfig] = useState(initialLoyaltyConfig);
  const [savingConfig, setSavingConfig] = useState(false);

  const [members] = useState(initialMembers);
  const [ledgerMember, setLedgerMember] = useState<MemberSummary | null>(null);

  const [rewards, setRewards] = useState(initialRewards);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardSubmitting, setRewardSubmitting] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const saved = await updateLoyaltyConfigAdmin(config);
      setConfig(saved.loyalty);
      toast.success('บันทึกการตั้งค่าเก็บดาวแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingConfig(false);
    }
  };

  const openCreateReward = () => {
    setEditingReward(null);
    setRewardError(null);
    setRewardDialogOpen(true);
  };

  const openEditReward = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setRewardError(null);
    setRewardDialogOpen(true);
  };

  const handleSubmitReward = async (values: RewardInput) => {
    setRewardSubmitting(true);
    setRewardError(null);
    try {
      if (editingReward) {
        const updated = await updateRewardAdmin(editingReward.id, values);
        setRewards((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await createRewardAdmin(values);
        setRewards((prev) => [...prev, created]);
      }
      setRewardDialogOpen(false);
    } catch (error) {
      setRewardError(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setRewardSubmitting(false);
    }
  };

  const handleDeleteReward = async (reward: LoyaltyReward) => {
    const confirmed = await confirm({
      content: `ลบของรางวัล "${reward.name}" ใช่หรือไม่?`,
      confirmLabel: 'ลบ',
    });
    if (!confirmed) return;

    try {
      await deleteRewardAdmin(reward.id);
      setRewards((prev) => prev.filter((r) => r.id !== reward.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        สะสมดาว
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        ตั้งค่าระบบเก็บดาว ดูรายชื่อสมาชิก จัดการของรางวัล และอนุมัติคำขอแลกของรางวัล
      </Typography>

      <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 3 }}>
        <Tab value="settings" label="ตั้งค่า" />
        <Tab value="members" label="สมาชิก" />
        <Tab value="rewards" label="ของรางวัล" />
        <Tab
          value="redemptions"
          label={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <span>คำขอแลกของรางวัล</span>
              {initialPendingRedemptions.length > 0 && (
                <Chip size="small" label={initialPendingRedemptions.length} color="error" />
              )}
            </Stack>
          }
        />
      </Tabs>

      {tab === 'settings' && (
        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6">เปิดใช้งานระบบเก็บดาว</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                เมื่อปิด ลูกค้าจะไม่ได้รับดาวและแลกของรางวัลไม่ได้
              </Typography>
            </Box>
            <Switch
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              inputProps={{ 'aria-label': 'เปิดหรือปิดระบบเก็บดาว' }}
            />
          </Stack>

          <TextField
            label="บาทต่อ 1 ดาว"
            type="number"
            value={config.bahtPerStar}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, bahtPerStar: Number(e.target.value) }))
            }
            helperText="เช่น ตั้ง 100 → ยอดบิลครบ 250 บาท ลูกค้าจะได้ 2 ดาว"
            slotProps={{ htmlInput: { min: 1 } }}
            fullWidth
          />

          <Button
            variant="contained"
            size="large"
            loading={savingConfig}
            onClick={handleSaveConfig}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            sx={{ alignSelf: 'flex-start', px: 4 }}
          >
            บันทึก
          </Button>
        </Stack>
      )}

      {tab === 'members' && (
        <Stack spacing={1.5}>
          {members.length === 0 && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}
            >
              ยังไม่มีสมาชิก
            </Typography>
          )}
          {members.map((member) => (
            <Stack
              key={member.id}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ sm: 'center' }}
              justifyContent="space-between"
              spacing={1.5}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'common.white',
                border: '1px solid',
                borderColor: 'grey.200',
                cursor: 'pointer',
              }}
              onClick={() => setLedgerMember(member)}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1">{member.displayName || member.phone}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {member.phone} · สมัครเมื่อ {fDate(member.createdAt)}
                </Typography>
              </Box>
              <Chip label={`${member.starsBalance} ดาว`} color="warning" sx={{ flexShrink: 0 }} />
            </Stack>
          ))}
        </Stack>
      )}

      {tab === 'rewards' && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" width={22} />}
              onClick={openCreateReward}
            >
              เพิ่มของรางวัล
            </Button>
          </Stack>

          <Stack spacing={1.5}>
            {rewards.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}
              >
                ยังไม่มีของรางวัล
              </Typography>
            )}
            {rewards.map((reward) => (
              <Stack
                key={reward.id}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'common.white',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  opacity: reward.isActive ? 1 : 0.6,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1">{reward.name}</Typography>
                    <Chip size="small" label={`${reward.starsCost} ดาว`} color="warning" />
                    {!reward.isActive && (
                      <Chip size="small" label="ปิดใช้งาน" color="default" variant="outlined" />
                    )}
                  </Stack>
                  {reward.description && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {reward.description}
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <IconButton
                    onClick={() => openEditReward(reward)}
                    aria-label={`แก้ไข ${reward.name}`}
                  >
                    <Iconify icon="solar:notes-bold-duotone" width={20} />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteReward(reward)}
                    aria-label={`ลบ ${reward.name}`}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {tab === 'redemptions' && (
        <Box>
          <Divider sx={{ mb: 2 }} />
          <RedemptionQueue initialRedemptions={initialPendingRedemptions} />
        </Box>
      )}

      <RewardFormDialog
        open={rewardDialogOpen}
        editing={editingReward}
        submitting={rewardSubmitting}
        error={rewardError}
        onClose={() => setRewardDialogOpen(false)}
        onSubmit={handleSubmitReward}
      />

      <MemberLedgerDialog member={ledgerMember} onClose={() => setLedgerMember(null)} />

      {dialog}
    </Box>
  );
}
