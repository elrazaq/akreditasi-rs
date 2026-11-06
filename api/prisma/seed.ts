import { PrismaClient, Role, DocumentCategory, PokjaGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface InstrumentItem {
  sheet: string;
  no: string;
  kelompok: string;
  standar: string;
  nomorEp: string;
  deskripsi: string;
  kodeR: string;
  kodeD: string;
  kodeO: string;
  kodeW: string;
  kodeS: string;
  kelengkapanBukti: string;
  skoring: string;
  halamanPdf: string;
  statusKesiapan: string;
  picUnit: string;
  targetSelesai: string;
  catatanTindakLanjut: string;
}

const POKJA_DEFINITIONS: Record<string, { nama: string; kelompok: PokjaGroup; urutan: number }> = {
  TKRS: { nama: 'Tata Kelola Rumah Sakit', kelompok: PokjaGroup.TATA_KELOLA, urutan: 1 },
  KPS: { nama: 'Kualifikasi dan Pendidikan Staf', kelompok: PokjaGroup.MANAJEMEN, urutan: 2 },
  MFK: { nama: 'Manajemen Fasilitas dan Keselamatan', kelompok: PokjaGroup.MANAJEMEN, urutan: 3 },
  PMKP: { nama: 'Peningkatan Mutu dan Keselamatan Pasien', kelompok: PokjaGroup.MANAJEMEN, urutan: 4 },
  MRMIK: { nama: 'Manajemen Rekam Medis dan Informasi Kesehatan', kelompok: PokjaGroup.MANAJEMEN, urutan: 5 },
  PPI: { nama: 'Pencegahan dan Pengendalian Infeksi', kelompok: PokjaGroup.MANAJEMEN, urutan: 6 },
  PPK: { nama: 'Pendidikan dalam Pelayanan Kesehatan', kelompok: PokjaGroup.MANAJEMEN, urutan: 7 },
  AKP: { nama: 'Akses dan Kontinuitas Pelayanan', kelompok: PokjaGroup.PELAYANAN, urutan: 8 },
  HPK: { nama: 'Hak Pasien dan Keluarga', kelompok: PokjaGroup.PELAYANAN, urutan: 9 },
  PP: { nama: 'Pengkajian Pasien', kelompok: PokjaGroup.PELAYANAN, urutan: 10 },
  PAP: { nama: 'Pelayanan dan Asuhan Pasien', kelompok: PokjaGroup.PELAYANAN, urutan: 11 },
  PAB: { nama: 'Pelayanan Anestesi dan Bedah', kelompok: PokjaGroup.PELAYANAN, urutan: 12 },
  PKPO: { nama: 'Pelayanan Kefarmasian dan Penggunaan Obat', kelompok: PokjaGroup.PELAYANAN, urutan: 13 },
  KE: { nama: 'Komunikasi dan Edukasi', kelompok: PokjaGroup.PELAYANAN, urutan: 14 },
  SKP: { nama: 'Sasaran Keselamatan Pasien', kelompok: PokjaGroup.PELAYANAN, urutan: 15 },
  PROGNAS: { nama: 'Program Nasional', kelompok: PokjaGroup.PROGNAS, urutan: 16 }
};

async function main() {
  console.log('🌱 Starting official Kemenkes Kepdirjen Yankes 2024 database seeding...');

  // 1. Clean existing records in dependency order
  console.log('🧹 Cleaning existing tables...');
  await prisma.auditLog.deleteMany();
  await prisma.documentAnnotation.deleteMany();
  await prisma.documentDraft.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.elemenPenilaian.deleteMany();
  await prisma.standar.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pokja.deleteMany();

  // 2. Read instruments JSON
  const jsonPath = path.join(__dirname, 'instruments.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`instruments.json not found at ${jsonPath}`);
  }
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const items: InstrumentItem[] = JSON.parse(rawData);
  console.log(`📋 Loaded ${items.length} assessment elements from instruments.json`);

  // 3. Create Pokja records
  const pokjaMap = new Map<string, string>(); // kode -> id
  for (const [kode, meta] of Object.entries(POKJA_DEFINITIONS)) {
    const created = await prisma.pokja.create({
      data: {
        kode,
        nama: meta.nama,
        kelompok: meta.kelompok,
        urutan: meta.urutan
      }
    });
    pokjaMap.set(kode, created.id);
  }
  console.log(`✅ Created ${pokjaMap.size} Pokja master records.`);

  // 4. Create default users
  const salt = await bcrypt.genSalt(10);
  const passwordSuperadmin = await bcrypt.hash('AdminSTARKES2027!', salt);
  const passwordVerifikator = await bcrypt.hash('Verifikator2027!', salt);

  await prisma.user.create({
    data: {
      nama: 'Super Administrator RSUD Bintan',
      email: 'admin@rsudbintan.id',
      passwordHash: passwordSuperadmin,
      role: Role.SUPERADMIN
    }
  });

  await prisma.user.create({
    data: {
      nama: 'dr. Verifikator Komite Mutu',
      email: 'verifikator@rsudbintan.id',
      passwordHash: passwordVerifikator,
      role: Role.VERIFIKATOR
    }
  });

  for (const [kode, meta] of Object.entries(POKJA_DEFINITIONS)) {
    const pokjaId = pokjaMap.get(kode);
    const pwd = await bcrypt.hash(`Pokja${kode}2027!`, salt);
    await prisma.user.create({
      data: {
        nama: `PIC Pokja ${kode} (${meta.nama})`,
        email: `pokja.${kode.toLowerCase()}@rsudbintan.id`,
        passwordHash: pwd,
        role: Role.POKJA,
        assignedPokjaId: pokjaId
      }
    });
  }
  console.log('✅ Created Superadmin, Verifikator, and 16 Pokja PIC users.');

  // 5. Group elements by Standard
  const standardMap = new Map<string, { pokjaKode: string; standarKode: string; items: InstrumentItem[] }>();
  for (const item of items) {
    const trimmedStd = item.standar.trim();
    const pokjaKode = trimmedStd.split(' ')[0].toUpperCase();
    if (!standardMap.has(trimmedStd)) {
      standardMap.set(trimmedStd, {
        pokjaKode,
        standarKode: trimmedStd,
        items: []
      });
    }
    standardMap.get(trimmedStd)!.items.push(item);
  }

  console.log(`📦 Found ${standardMap.size} unique Standar across 16 Pokjas.`);

  // 6. Insert Standar and ElemenPenilaian records
  let standarCount = 0;
  let epCount = 0;

  for (const [stdKode, group] of standardMap.entries()) {
    const pokjaId = pokjaMap.get(group.pokjaKode);
    if (!pokjaId) {
      console.warn(`Warning: Pokja ${group.pokjaKode} not recognized for standar ${stdKode}`);
      continue;
    }

    standarCount++;
    const standarRecord = await prisma.standar.create({
      data: {
        pokjaId,
        kode: stdKode,
        judul: `Standar ${stdKode}`,
        urutan: standarCount
      }
    });

    // Prepare EPs for this standard, tracking unique epCode
    const seenEpCodes = new Map<string, number>();

    const epsToCreate = group.items.map((epItem, idx) => {
      const isR = epItem.kodeR.includes('✓') || epItem.kodeR.trim() !== '';
      const isD = epItem.kodeD.includes('✓') || epItem.kodeD.trim() !== '';
      const isO = epItem.kodeO.includes('✓') || epItem.kodeO.trim() !== '';
      const isW = epItem.kodeW.includes('✓') || epItem.kodeW.trim() !== '';
      const isS = epItem.kodeS.includes('✓') || epItem.kodeS.trim() !== '';

      const cats: DocumentCategory[] = [];
      if (isR) cats.push(DocumentCategory.REGULASI);
      if (isD) cats.push(DocumentCategory.BUKTI);
      if (isO) cats.push(DocumentCategory.OBSERVASI);
      if (isW) cats.push(DocumentCategory.WAWANCARA);
      if (isS) cats.push(DocumentCategory.SIMULASI);
      if (cats.length === 0) cats.push(DocumentCategory.BUKTI);

      const baseEpNumber = epItem.nomorEp.trim();
      let epCode = `${stdKode} EP ${baseEpNumber}`;
      let finalEpNumber = baseEpNumber;

      const currentCount = seenEpCodes.get(epCode) || 0;
      if (currentCount > 0) {
        finalEpNumber = `${baseEpNumber}.${currentCount + 1}`;
        epCode = `${stdKode} EP ${finalEpNumber}`;
      }
      seenEpCodes.set(`${stdKode} EP ${baseEpNumber}`, currentCount + 1);

      return {
        standarId: standarRecord.id,
        kode: epCode,
        nomorEp: finalEpNumber,
        deskripsi: epItem.deskripsi || epCode,
        jenisDokumen: cats,
        urutan: idx + 1,
        kelengkapanBukti: epItem.kelengkapanBukti || null,
        skoring: epItem.skoring || '10 - 0',
        halamanPdf: epItem.halamanPdf || null,
        kodeR: isR,
        kodeD: isD,
        kodeO: isO,
        kodeW: isW,
        kodeS: isS,
        statusKesiapan: epItem.statusKesiapan || 'Belum dinilai',
        picUnit: epItem.picUnit || null,
        targetSelesai: epItem.targetSelesai || null,
        catatanTindakLanjut: epItem.catatanTindakLanjut || null
      };
    });

    await prisma.elemenPenilaian.createMany({
      data: epsToCreate
    });

    epCount += epsToCreate.length;
  }

  console.log(`🎉 Seeding complete! Successfully seeded ${standarCount} standards and all ${epCount} assessment elements into Neon PostgreSQL.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
