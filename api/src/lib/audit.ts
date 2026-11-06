import prisma from './prisma.js';

export interface LogAuditParams {
  userId?: string | null;
  aksi: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function logAudit({
  userId,
  aksi,
  targetType,
  targetId,
  metadata,
  ipAddress,
}: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        aksi,
        targetType,
        targetId: targetId ?? null,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (err) {
    // Fail-safe: audit logging must not crash main transaction
    console.error('Failed to write audit log:', err);
    return null;
  }
}

