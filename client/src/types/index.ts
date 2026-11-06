export type Role = 'SUPERADMIN' | 'POKJA' | 'VERIFIKATOR';

export type NavTab = 'dashboard' | 'pokja' | 'documents' | 'verification' | 'audit' | 'users';

export type PokjaGroup = 'TATA_KELOLA' | 'PELAYANAN' | 'MANAJEMEN' | 'PROGNAS';

export type DocumentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISED';

export type DocumentCategory = 'REGULASI' | 'BUKTI' | 'OBSERVASI' | 'WAWANCARA' | 'SIMULASI';

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Role;
  assignedPokjaId?: string | null;
  assignedPokja?: {
    id: string;
    kode: string;
    nama: string;
    kelompok?: PokjaGroup;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PokjaStats {
  totalDocuments: number;
  approved: number;
  submitted: number;
  revised: number;
  draft: number;
  complianceRate: number;
}

export interface PokjaSummary {
  id: string;
  kode: string;
  nama: string;
  kelompok: PokjaGroup;
  urutan: number;
  totalStandar: number;
  totalEp: number;
  stats: PokjaStats;
}

export interface ElemenPenilaian {
  id: string;
  standarId: string;
  kode: string;
  nomorEp?: string | null;
  deskripsi: string;
  jenisDokumen: DocumentCategory[];
  urutan: number;
  kelengkapanBukti?: string | null;
  skoring?: string | null;
  halamanPdf?: string | null;
  kodeR?: boolean;
  kodeD?: boolean;
  kodeO?: boolean;
  kodeW?: boolean;
  kodeS?: boolean;
  statusKesiapan?: string;
  picUnit?: string | null;
  targetSelesai?: string | null;
  catatanTindakLanjut?: string | null;
  documents?: DocumentItem[];
  standar?: {
    id: string;
    kode: string;
    judul: string;
    pokja: {
      id: string;
      kode: string;
      nama: string;
    };
  };
}

export interface StandarItem {
  id: string;
  pokjaId: string;
  kode: string;
  judul: string;
  urutan: number;
  elemenPenilaian: ElemenPenilaian[];
}

export interface PokjaDetail {
  id: string;
  kode: string;
  nama: string;
  kelompok: PokjaGroup;
  urutan: number;
  standars: StandarItem[];
}

export interface DocumentAnnotation {
  id: string;
  documentVersionId: string;
  pageNumber: number;
  tipe: string;
  koordinatJson: string;
  catatanRevisi: string;
  createdById: string;
  createdAt: string;
  createdBy: {
    id: string;
    nama: string;
    role: Role;
  };
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  fileUrl: string;
  cloudinaryPublicId?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  catatan?: string | null;
  uploadedById: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    nama: string;
    role: Role;
  };
  annotations?: DocumentAnnotation[];
  _count?: {
    annotations: number;
  };
}

export interface DocumentItem {
  id: string;
  epId: string;
  judul: string;
  kategori: DocumentCategory;
  status: DocumentStatus;
  catatanReview?: string | null;
  createdById: string;
  createdAt?: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    nama: string;
    email: string;
    role: Role;
  };
  versions: DocumentVersion[];
  draft?: {
    id: string;
    contentHtml?: string;
    contentJson?: string | null;
    updatedAt: string;
  } | null;
  elemenPenilaian?: {
    kode: string;
    deskripsi: string;
    standar?: {
      kode: string;
      judul: string;
      pokja?: {
        id: string;
        kode: string;
        nama: string;
      };
    };
  };
}
