import { formatIndonesianTime, formatDateDMY, formatDurationMinutes } from './utils';

/**
 * Core utility to safely send rich embeds to Discord Webhooks in the background.
 * Uses a 6-second timeout and supports both URL images and Base64 multipart image uploads.
 */
async function postToDiscord(
  webhookUrl: string | undefined,
  payload: any,
  screenshotData?: string | null
) {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // If screenshot is base64, send via multipart/form-data so Discord hosts and displays the image
    if (screenshotData && screenshotData.includes('base64,')) {
      const parts = screenshotData.split('base64,');
      const mime = parts[0].replace('data:', '').replace(';', '') || 'image/webp';
      const buffer = Buffer.from(parts[1], 'base64');
      const filename = mime.includes('png') ? 'screenshot.png' : 'screenshot.webp';

      const formData = new FormData();
      const blob = new Blob([buffer], { type: mime });
      formData.append('files[0]', blob, filename);

      if (payload.embeds && payload.embeds[0]) {
        payload.embeds[0].image = { url: `attachment://${filename}` };
      }

      formData.append('payload_json', JSON.stringify(payload));

      const res = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        console.error('Discord webhook multipart response error:', res.status, await res.text());
      }
    } else {
      if (screenshotData && screenshotData.startsWith('http') && payload.embeds && payload.embeds[0]) {
        payload.embeds[0].image = { url: screenshotData };
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.error('Discord webhook json response error:', res.status, await res.text());
      }
    }

    clearTimeout(timeoutId);
  } catch (error) {
    console.error('Discord webhook post error:', error);
  }
}

/**
 * 1. Webhook for DUTY IN (#log-duty-in)
 */
export async function sendDutyInWebhook(data: {
  username: string;
  discord_name: string;
  position_name: string;
  duty_in_time: Date;
  user_note?: string | null;
  screenshot_url?: string | null;
}) {
  const url = process.env.DISCORD_WEBHOOK_DUTY_IN;
  if (!url) return;

  const timeStr = formatIndonesianTime(data.duty_in_time);
  const dateStr = formatDateDMY(data.duty_in_time);

  const embed: any = {
    title: '🟢 [DUTY IN] Anggota Mulai Bertugas',
    color: 0x10B981, // Emerald Green
    description: `Anggota **${data.discord_name}** telah memulai jam tugas duty in-game.`,
    fields: [
      { name: '👤 Nama Anggota', value: `${data.discord_name} (${data.username})`, inline: true },
      { name: '🏷️ Jabatan', value: data.position_name || 'Anggota', inline: true },
      { name: '⏰ Jam Masuk', value: `${timeStr} (${dateStr})`, inline: true },
    ],
    footer: {
      text: 'ASE Duty Attendance System • ASE ROLEPLAY',
    },
    timestamp: new Date().toISOString(),
  };

  if (data.user_note && data.user_note.trim()) {
    embed.fields.push({ name: '📝 Catatan Tugas', value: data.user_note.trim(), inline: false });
  }

  await postToDiscord(
    url,
    {
      username: 'ASE Duty IN Bot',
      embeds: [embed],
    },
    data.screenshot_url
  );
}

/**
 * 2. Webhook for DUTY OUT (#log-duty-out)
 */
export async function sendDutyOutWebhook(data: {
  username: string;
  discord_name: string;
  position_name: string;
  duty_in_time: Date;
  duty_out_time: Date;
  duration_minutes: number;
  user_note?: string | null;
  screenshot_url?: string | null;
}) {
  const url = process.env.DISCORD_WEBHOOK_DUTY_OUT;
  if (!url) return;

  const outTimeStr = formatIndonesianTime(data.duty_out_time);
  const dateStr = formatDateDMY(data.duty_out_time);
  const durationText = formatDurationMinutes(data.duration_minutes);
  const isTargetAchieved = data.duration_minutes >= 180; // 3 hours target

  const embed: any = {
    title: '🔴 [DUTY OUT] Anggota Selesai Bertugas',
    color: 0xEF4444, // Crimson Red
    description: `Anggota **${data.discord_name}** telah mengakhiri sesi bertugas.`,
    fields: [
      { name: '👤 Nama Anggota', value: `${data.discord_name} (${data.username})`, inline: true },
      { name: '🏷️ Jabatan', value: data.position_name || 'Anggota', inline: true },
      { name: '⏱️ Total Durasi', value: `**${durationText}**`, inline: true },
      { name: '⏰ Jam Selesai', value: `${outTimeStr} (${dateStr})`, inline: true },
      {
        name: '🎯 Status Target (3 Jam)',
        value: isTargetAchieved ? '✅ **Target Tercapai**' : '⏳ **Belum Memenuhi Target**',
        inline: true,
      },
    ],
    footer: {
      text: 'ASE Duty Attendance System • ASE ROLEPLAY',
    },
    timestamp: new Date().toISOString(),
  };

  if (data.user_note && data.user_note.trim()) {
    embed.fields.push({ name: '📝 Catatan Akhir', value: data.user_note.trim(), inline: false });
  }

  await postToDiscord(
    url,
    {
      username: 'ASE Duty OUT Bot',
      embeds: [embed],
    },
    data.screenshot_url
  );
}

/**
 * 3. Webhook for LEAVE REQUESTS & APPROVALS (#pengajuan-izin)
 */
export async function sendLeaveWebhook(data: {
  type: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  discord_name: string;
  position_name: string;
  leave_type: string;
  start_date: Date | string;
  end_date: Date | string;
  reason: string;
  admin_note?: string | null;
}) {
  const url = process.env.DISCORD_WEBHOOK_LEAVES;
  if (!url) return;

  const startStr = formatDateDMY(data.start_date);
  const endStr = formatDateDMY(data.end_date);

  let title = '📋 [IZIN] Pengajuan Izin Baru';
  let color = 0xF59E0B; // Amber
  let statusText = '⏳ **Menunggu Persetujuan Admin**';

  if (data.type === 'APPROVED') {
    title = '✅ [IZIN] Pengajuan Izin Disetujui';
    color = 0x10B981; // Green
    statusText = '🟢 **DISETUJUI OLEH ADMIN**';
  } else if (data.type === 'REJECTED') {
    title = '❌ [IZIN] Pengajuan Izin Ditolak';
    color = 0xEF4444; // Red
    statusText = '🔴 **DITOLAK OLEH ADMIN**';
  }

  const embed: any = {
    title,
    color,
    fields: [
      { name: '👤 Nama Anggota', value: data.discord_name, inline: true },
      { name: '🏷️ Jabatan', value: data.position_name || 'Anggota', inline: true },
      { name: '📌 Jenis Izin', value: `**${data.leave_type}**`, inline: true },
      { name: '📅 Periode Izin (DD/MM/YYYY)', value: `**${startStr}** s/d **${endStr}**`, inline: true },
      { name: '📊 Status Pengajuan', value: statusText, inline: true },
      { name: '📝 Alasan Pengajuan', value: data.reason || '-', inline: false },
    ],
    footer: {
      text: 'ASE Duty Attendance System • ASE ROLEPLAY',
    },
    timestamp: new Date().toISOString(),
  };

  if (data.admin_note && data.admin_note.trim()) {
    embed.fields.push({ name: '💬 Catatan Admin', value: data.admin_note.trim(), inline: false });
  }

  await postToDiscord(url, {
    username: 'ASE Izin & Cuti Bot',
    embeds: [embed],
  });
}

/**
 * 4. Webhook for DAILY REPORTS (#laporan-kegiatan)
 */
export async function sendReportWebhook(data: {
  discord_name: string;
  position_name: string;
  title: string;
  category: string;
  content: string;
  screenshot_count: number;
}) {
  const url = process.env.DISCORD_WEBHOOK_REPORTS;
  if (!url) return;

  const dateStr = formatDateDMY(new Date());
  const timeStr = formatIndonesianTime(new Date());

  const embed: any = {
    title: `📑 [LAPORAN] ${data.title}`,
    color: 0x3B82F6, // Blue
    description: data.content,
    fields: [
      { name: '👤 Pelapor', value: data.discord_name, inline: true },
      { name: '🏷️ Jabatan', value: data.position_name || 'Anggota', inline: true },
      { name: '🏷️ Kategori', value: `**${data.category}**`, inline: true },
      { name: '📸 Bukti Foto', value: `${data.screenshot_count} Foto Terlampir`, inline: true },
      { name: '⏰ Waktu Lapor', value: `${timeStr} (${dateStr})`, inline: true },
    ],
    footer: {
      text: 'ASE Duty Attendance System • ASE ROLEPLAY',
    },
    timestamp: new Date().toISOString(),
  };

  await postToDiscord(url, {
    username: 'ASE Laporan Kerja Bot',
    embeds: [embed],
  });
}
