import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Table as TableIcon,
  Save,
  Printer,
  Sparkles,
  FileCheck2,
  Undo,
  Redo,
  Building2,
  FileText,
  ClipboardList,
  Minus,
  CheckCircle2,
  Loader2,
  ZoomIn,
  ZoomOut,
  ScanText,
} from 'lucide-react';
import { DocumentItem, DocumentVersion } from '../../types';
import { api } from '../../api/client';

interface WordDocumentEditorProps {
  document: DocumentItem;
  version?: DocumentVersion;
  onRefresh: () => void;
  onClose: () => void;
}

export const WordDocumentEditor: React.FC<WordDocumentEditorProps> = ({
  document: doc,
  version,
  onRefresh,
  onClose,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [, setContentHtml] = useState<string>('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fontFamily, setFontFamily] = useState<string>("'Times New Roman', Times, serif");
  const [fontSize, setFontSize] = useState<string>('3'); // 3 = 12pt (standard)

  // Inisialisasi konten: ambil dari draft DB jika ada, atau buat template standar dokumen
  useEffect(() => {
    let initialContent = doc.draft?.contentHtml || '';
    if (!initialContent.trim()) {
      initialContent = `
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; color: #0f172a;">
            ${doc.judul}
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 11pt; color: #475569;">
            Kategori: ${doc.kategori} | Standar Akreditasi STARKES Kemenkes RI
          </p>
          <hr style="border: 0; border-top: 1.5px solid #0f172a; margin: 16px 0;" />
        </div>
        <p style="text-align: justify; line-height: 1.6;">
          Silakan ketik atau tempel isi dokumen regulasi, kebijakan, panduan, atau prosedur kerja rumah sakit di sini. Anda dapat menyisipkan KOP Resmi RSUD Bintan, format Keputusan Direktur (SK), atau format SPO resmi melalui tombol template di atas.
        </p>
      `;
    }
    setContentHtml(initialContent);
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      updateStats();
    }
    if (doc.draft?.updatedAt) {
      setLastSavedTime(new Date(doc.draft.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [doc.id]);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
      updateStats();
      setSaveStatus('idle');
    }
  };

  // Rich Text Execution Commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setContentHtml(editorRef.current.innerHTML);
      updateStats();
    }
  };

  // Sisipkan KOP Resmi RSUD Bintan
  const insertKopSurat = () => {
    const kopHtml = `
      <div style="border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 24px; text-align: center; font-family: 'Times New Roman', serif;">
        <table style="width: 100%; border: none; margin: 0; border-collapse: collapse;">
          <tr style="border: none;">
            <td style="width: 15%; text-align: center; vertical-align: middle; border: none; padding: 0;">
              <div style="font-size: 38pt; line-height: 1;">🏛️</div>
            </td>
            <td style="width: 85%; text-align: center; vertical-align: middle; border: none; padding: 0;">
              <h3 style="margin: 0; font-size: 13pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; color: #0f172a;">
                PEMERINTAH KABUPATEN BINTAN
              </h3>
              <h2 style="margin: 2px 0; font-size: 15pt; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #0f172a;">
                RUMAH SAKIT UMUM DAERAH BINTAN
              </h2>
              <p style="margin: 2px 0 0 0; font-size: 9pt; color: #334155;">
                Jl. Ketapang No. 1 Kijang Kota, Bintan Timur, Kepulauan Riau 29151
              </p>
              <p style="margin: 0; font-size: 9pt; color: #334155;">
                Telepon: (0771) 463150 | Email: rsud@bintankab.go.id | Website: rsudbintan.id
              </p>
            </td>
          </tr>
        </table>
      </div>
      <p><br></p>
    `;
    execCmd('insertHTML', kopHtml);
  };

  // Sisipkan Template SK Direktur STARKES
  const insertTemplateSK = () => {
    const skHtml = `
      <div style="text-align: center; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
        <h3 style="margin: 0; font-size: 12pt; font-weight: bold; text-transform: uppercase;">
          KEPUTUSAN DIREKTUR RUMAH SAKIT UMUM DAERAH BINTAN
        </h3>
        <p style="margin: 2px 0; font-size: 11pt; font-weight: bold;">
          NOMOR: 445 / SK-DIR / RSUD / 2024 / 001
        </p>
        <h4 style="margin: 12px 0 4px 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">
          TENTANG
        </h4>
        <h4 style="margin: 0 0 16px 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">
          ${doc.judul}
        </h4>
        <h4 style="margin: 10px 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">
          DIREKTUR RUMAH SAKIT UMUM DAERAH BINTAN,
        </h4>
      </div>
      <table style="width: 100%; border: none; font-size: 11pt; line-height: 1.6; border-collapse: collapse;">
        <tr style="border: none; vertical-align: top;">
          <td style="width: 18%; border: none; font-weight: bold;">Menimbang</td>
          <td style="width: 4%; border: none;">:</td>
          <td style="width: 78%; border: none; text-align: justify;">
            a. Bahwa dalam rangka meningkatkan mutu pelayanan dan keselamatan pasien di RSUD Bintan;<br>
            b. Bahwa untuk memenuhi Standar Akreditasi Rumah Sakit Kemenkes RI (STARKES 2024);<br>
            c. Bahwa berdasarkan pertimbangan a dan b di atas, perlu ditetapkan Keputusan Direktur.
          </td>
        </tr>
        <tr style="border: none; vertical-align: top;">
          <td style="border: none; font-weight: bold;">Mengingat</td>
          <td style="border: none;">:</td>
          <td style="border: none; text-align: justify;">
            1. Undang-Undang Republik Indonesia Nomor 17 Tahun 2023 tentang Kesehatan;<br>
            2. Keputusan Menteri Kesehatan RI tentang Standar Akreditasi Rumah Sakit (STARKES).
          </td>
        </tr>
      </table>
      <div style="text-align: center; margin: 16px 0 8px 0; font-weight: bold; font-size: 11pt;">
        MEMUTUSKAN :
      </div>
      <table style="width: 100%; border: none; font-size: 11pt; line-height: 1.6; border-collapse: collapse;">
        <tr style="border: none; vertical-align: top;">
          <td style="width: 18%; border: none; font-weight: bold;">Menetapkan</td>
          <td style="width: 4%; border: none;">:</td>
          <td style="width: 78%; border: none; font-weight: bold;">
            KEPUTUSAN DIREKTUR RSUD BINTAN TENTANG ${doc.judul}.
          </td>
        </tr>
        <tr style="border: none; vertical-align: top;">
          <td style="border: none; font-weight: bold;">KESATU</td>
          <td style="border: none;">:</td>
          <td style="border: none; text-align: justify;">
            Memberlakukan kebijakan ini sebagai pedoman resmi pelaksanaan pelayanan di seluruh unit kerja RSUD Bintan.
          </td>
        </tr>
        <tr style="border: none; vertical-align: top;">
          <td style="border: none; font-weight: bold;">KEDUA</td>
          <td style="border: none;">:</td>
          <td style="border: none; text-align: justify;">
            Keputusan ini mulai berlaku sejak tanggal ditetapkan, dengan ketentuan apabila dikemudian hari terdapat kekeliruan akan diperbaiki sebagaimana mestinya.
          </td>
        </tr>
      </table>
      <div style="margin-top: 36px; float: right; width: 45%; text-align: center; font-size: 11pt;">
        <p style="margin: 0;">Ditetapkan di: Kijang</p>
        <p style="margin: 2px 0 40px 0;">Pada tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin: 0; font-weight: bold; text-decoration: underline;">dr. Direktur RSUD Bintan, Sp.A</p>
        <p style="margin: 0; font-size: 10pt;">NIP. 19780512 200501 1 008</p>
      </div>
      <div style="clear: both;"></div>
      <p><br></p>
    `;
    execCmd('insertHTML', skHtml);
  };

  // Sisipkan Format Standar Prosedur Operasional (SPO) STARKES
  const insertTemplateSPO = () => {
    const spoHtml = `
      <table style="width: 100%; border: 1.5px solid #0f172a; border-collapse: collapse; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
        <tr>
          <td rowspan="2" style="width: 25%; text-align: center; border: 1px solid #0f172a; padding: 10px;">
            <div style="font-size: 28pt;">🏛️</div>
            <strong style="font-size: 10pt; text-transform: uppercase; display: block; margin-top: 4px;">RSUD BINTAN</strong>
          </td>
          <td style="width: 45%; text-align: center; border: 1px solid #0f172a; padding: 8px;">
            <h3 style="margin: 0; font-size: 11pt; font-weight: bold; text-transform: uppercase;">
              ${doc.judul}
            </h3>
          </td>
          <td style="width: 30%; border: 1px solid #0f172a; padding: 6px; font-size: 9.5pt;">
            <strong>No. Dokumen:</strong> SPO/RSUD/001<br>
            <strong>No. Revisi:</strong> 00<br>
            <strong>Halaman:</strong> 1/1
          </td>
        </tr>
        <tr>
          <td style="text-align: center; border: 1px solid #0f172a; padding: 6px; font-size: 11pt; font-weight: bold; background: #f8fafc;">
            STANDAR PROSEDUR OPERASIONAL (SPO)
          </td>
          <td style="border: 1px solid #0f172a; padding: 6px; font-size: 9.5pt;">
            <strong>Tanggal Terbit:</strong> ${new Date().toLocaleDateString('id-ID')}<br>
            <strong>Ditetapkan oleh:</strong> Direktur RSUD Bintan
          </td>
        </tr>
      </table>
      <table style="width: 100%; border: 1px solid #0f172a; border-collapse: collapse; font-size: 11pt; line-height: 1.5; font-family: 'Times New Roman', serif;">
        <tr>
          <td style="width: 25%; border: 1px solid #0f172a; padding: 8px; font-weight: bold; background: #f8fafc;">PENGERTIAN</td>
          <td style="width: 75%; border: 1px solid #0f172a; padding: 8px; text-align: justify;">
            Definisi dan cakupan resmi dari prosedur yang diberlakukan di rumah sakit.
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #0f172a; padding: 8px; font-weight: bold; background: #f8fafc;">TUJUAN</td>
          <td style="border: 1px solid #0f172a; padding: 8px; text-align: justify;">
            Sebagai acuan langkah-langkah penerapan prosedur guna memastikan kepatuhan mutu dan keselamatan pasien.
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #0f172a; padding: 8px; font-weight: bold; background: #f8fafc;">KEBIJAKAN</td>
          <td style="border: 1px solid #0f172a; padding: 8px; text-align: justify;">
            SK Direktur RSUD Bintan Nomor 445/SK-DIR/2024 tentang Kebijakan Pelayanan Rumah Sakit.
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #0f172a; padding: 8px; font-weight: bold; background: #f8fafc;">PROSEDUR</td>
          <td style="border: 1px solid #0f172a; padding: 8px; text-align: justify;">
            1. Petugas melakukan identifikasi pasien sebelum tindakan.<br>
            2. Petugas menjelaskan maksud dan tujuan prosedur kepada pasien/keluarga.<br>
            3. Petugas melaksanakan tindakan sesuai panduan klinis.<br>
            4. Petugas mendokumentasikan hasil tindakan pada berkas rekam medis.
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid #0f172a; padding: 8px; font-weight: bold; background: #f8fafc;">UNIT TERKAIT</td>
          <td style="border: 1px solid #0f172a; padding: 8px; text-align: justify;">
            Instalasi Rawat Inap, Rawat Jalan, IGD, ICU, dan Komite Mutu & Akreditasi.
          </td>
        </tr>
      </table>
      <p><br></p>
    `;
    execCmd('insertHTML', spoHtml);
  };

  // Sisipkan Tabel Data
  const insertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1; font-family: 'Times New Roman', serif;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #94a3b8; padding: 8px 12px; text-align: center; width: 10%;">No</th>
            <th style="border: 1px solid #94a3b8; padding: 8px 12px; text-align: left; width: 45%;">Indikator Penilaian STARKES</th>
            <th style="border: 1px solid #94a3b8; padding: 8px 12px; text-align: left; width: 45%;">Bukti Pelaksanaan / Dokumen</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center;">1</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Regulasi Kebijakan</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">SK Direktur & Panduan Pelayanan</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center;">2</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Bukti Pelaksanaan Kegiatan</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Laporan Notula Rapat, Sertifikat, Absensi</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    execCmd('insertHTML', tableHtml);
  };

  // Simpan Draf ke Database (PUT /api/documents/:id/draft)
  const handleSaveDraft = async () => {
    if (!editorRef.current) return;
    try {
      setIsSavingDraft(true);
      setSaveStatus('saving');
      const html = editorRef.current.innerHTML;
      await api.saveDraft(doc.id, html);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      onRefresh();
    } catch (err: any) {
      setSaveStatus('error');
      alert(err.message || 'Gagal menyimpan draf dokumen.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Terbitkan Versi Baru Dokumen Resmi (POST /api/documents/:id/publish-draft)
  const handlePublishVersion = async () => {
    if (!editorRef.current) return;
    const confirmPub = window.confirm(
      'Apakah Anda yakin ingin menerbitkan dokumen ini sebagai Versi Baru resmi?\n\nDokumen akan disimpan dan dikirimkan ke Antrean Verifikasi untuk ditelaah oleh Verifikator.'
    );
    if (!confirmPub) return;

    try {
      setIsPublishing(true);
      const html = editorRef.current.innerHTML;
      const res = await api.publishDraft(doc.id, html, 'Diterbitkan melalui Editor Dokumen In-App (Word Mode)');
      alert(`Berhasil! Versi v${res.version.versionNumber} telah diterbitkan dan masuk ke antrean verifikasi.`);
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal menerbitkan versi baru dokumen.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Cetak Dokumen / Ekspor ke PDF via Browser
  const handlePrintDocument = () => {
    if (!editorRef.current) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Izinkan pop-up peramban untuk mencetak dokumen.');
      return;
    }

    const docHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${doc.judul} - RSUD Bintan</title>
        <style>
          @page {
            size: A4;
            margin: 25mm 20mm;
          }
          body {
            font-family: ${fontFamily};
            font-size: 12pt;
            line-height: 1.6;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
          }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #334155; padding: 8px 12px; }
          th { background: #f8fafc; font-weight: bold; }
          h1, h2, h3, h4 { color: #0f172a; margin-top: 14px; margin-bottom: 6px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${editorRef.current.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docHtml);
    printWindow.document.close();
  };

  // Ekstraksi Teks OCR dari file PDF/gambar ke Editor Word
  const handleExtractOCR = async () => {
    if (!version || !version.id || version.id.startsWith('draft-')) {
      alert('Tidak ada berkas fisik PDF terunggah pada dokumen ini untuk diproses OCR.');
      return;
    }

    const confirmRun = window.confirm(
      'Mulai ekstraksi OCR dari berkas PDF?\n\nTeks hasil pembacaan OCR akan dimasukkan langsung ke lembar kerja Word untuk Anda edit.'
    );
    if (!confirmRun) return;

    try {
      setIsOcrLoading(true);
      const res = await api.ocrDocument(version.id);
      if (res.html && editorRef.current) {
        editorRef.current.innerHTML = res.html;
        setContentHtml(res.html);
        updateStats();
        setSaveStatus('saved');
        alert(`Berhasil! Teks dokumen telah diekstraksi (${res.method}). Silakan perbaiki atau sunting isi dokumen.`);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengekstrak OCR dari berkas dokumen.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-200/90 overflow-hidden select-none">
      {/* MS Word Ribbon Header */}
      <div className="bg-white border-b border-slate-200/90 p-2.5 flex flex-col gap-2 flex-shrink-0 shadow-xs">
        {/* Row 1: Word Actions & Document Templates */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Quick Insert Templates */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Template STARKES:</span>
            </span>

            <button
              type="button"
              onClick={insertKopSurat}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Sisipkan KOP Resmi RSUD Bintan"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>KOP RSUD</span>
            </button>

            <button
              type="button"
              onClick={insertTemplateSK}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Sisipkan Format SK Direktur Akreditasi"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Format SK Direktur</span>
            </button>

            <button
              type="button"
              onClick={insertTemplateSPO}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Sisipkan Format Standar Prosedur Operasional (SPO)"
            >
              <ClipboardList className="w-3.5 h-3.5 text-cyan-600" />
              <span>Format SPO</span>
            </button>

            <button
              type="button"
              onClick={insertTable}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Sisipkan Tabel Penilaian"
            >
              <TableIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Sisipkan Tabel</span>
            </button>

            {version && !version.id.startsWith('draft-') && (
              <button
                type="button"
                onClick={handleExtractOCR}
                disabled={isOcrLoading}
                className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Pindai dan ekstrak seluruh teks dari berkas PDF ke dalam lembar kerja Word (OCR Engine)"
              >
                {isOcrLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                ) : (
                  <ScanText className="w-3.5 h-3.5 text-violet-600" />
                )}
                <span>{isOcrLoading ? 'Memindai OCR...' : 'Ekstrak Teks OCR'}</span>
              </button>
            )}
          </div>

          {/* Primary Operations: Save Draft, Print PDF, Publish Version */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Simpan Draf Dokumen ke Database"
            >
              {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-600" />}
              <span>{isSavingDraft ? 'Menyimpan...' : 'Simpan Draf'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintDocument}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Cetak atau Ekspor langsung ke format PDF resmi"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cetak / Ekspor PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePublishVersion}
              disabled={isPublishing}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-glow-teal disabled:opacity-50"
              title="Terbitkan draf ini sebagai versi dokumen resmi baru"
            >
              {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
              <span>{isPublishing ? 'Menerbitkan...' : 'Terbitkan Versi Baru'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Standard MS Word Formatting Ribbon */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-slate-700">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => execCmd('undo')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('redo')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Heading / Style Selector */}
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'p') execCmd('formatBlock', '<p>');
              else if (val === 'h1') execCmd('formatBlock', '<h1>');
              else if (val === 'h2') execCmd('formatBlock', '<h2>');
              else if (val === 'h3') execCmd('formatBlock', '<h3>');
            }}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-medium"
          >
            <option value="p">Normal (Teks)</option>
            <option value="h1">Judul Utama Dokumen</option>
            <option value="h2">Heading 1 (BAB / Standar)</option>
            <option value="h3">Heading 2 (Pasal / Prosedur)</option>
          </select>

          {/* Font Family Selector */}
          <select
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              execCmd('fontName', e.target.value);
            }}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-serif"
          >
            <option value="'Times New Roman', Times, serif">Times New Roman (Resmi)</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Calibri, sans-serif">Calibri</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="Georgia, serif">Georgia</option>
          </select>

          {/* Font Size Selector */}
          <select
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              execCmd('fontSize', e.target.value);
            }}
            className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
          >
            <option value="1">10 pt</option>
            <option value="2">11 pt</option>
            <option value="3">12 pt (Standar)</option>
            <option value="4">14 pt</option>
            <option value="5">18 pt</option>
            <option value="6">24 pt</option>
          </select>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Formatting Buttons */}
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer font-bold"
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer italic"
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer underline"
            title="Garis Bawah (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer line-through"
            title="Coretan"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Text Color Picker */}
          <div className="flex items-center gap-1">
            {[
              { color: '#0f172a', title: 'Hitam' },
              { color: '#1e3a8a', title: 'Biru Medis' },
              { color: '#047857', title: 'Hijau' },
              { color: '#b91c1c', title: 'Merah' },
            ].map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => execCmd('foreColor', c.color)}
                className="w-4 h-4 rounded-full border border-slate-300 transition hover:scale-110 cursor-pointer"
                style={{ backgroundColor: c.color }}
                title={`Warna: ${c.title}`}
              />
            ))}
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Alignments */}
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Rata Kiri"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Rata Tengah"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Rata Kanan"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyFull')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer bg-teal-50 text-teal-800"
            title="Rata Kiri Kanan (Justify - Standar Dokumen Rumah Sakit)"
          >
            <AlignJustify className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* Lists */}
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Daftar Bernomor (1, 2, 3)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Daftar Poin"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('outdent')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Kurangi Indentasi"
          >
            <Outdent className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('indent')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Tambah Indentasi"
          >
            <Indent className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Garis Pembatas Horizontal"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Word Ruler Simulation */}
      <div className="bg-slate-100 border-b border-slate-300 h-5 px-8 flex items-center justify-between text-[9px] font-mono text-slate-400 select-none flex-shrink-0">
        <div className="flex items-center gap-8 w-full max-w-[850px] mx-auto px-12">
          <span>| 0</span>
          <span>| 2</span>
          <span>| 4</span>
          <span>| 6</span>
          <span>| 8</span>
          <span>| 10</span>
          <span>| 12</span>
          <span>| 14</span>
          <span>| 16</span>
          <span>| 18 cm (A4 Paper Width)</span>
        </div>
      </div>

      {/* Editor Body: Simulated A4 Paper */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
          }}
          className="w-full max-w-[850px] min-h-[1123px] bg-white shadow-2xl p-12 md:p-16 border border-slate-300 ring-1 ring-slate-200 rounded-xs flex flex-col justify-between"
        >
          {/* Editable Content */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            suppressContentEditableWarning
            style={{
              fontFamily: fontFamily,
              fontSize: '12pt',
              lineHeight: 1.6,
              color: '#0f172a',
            }}
            className="outline-none min-h-[900px] prose prose-slate max-w-none text-justify"
          />

          {/* Paper Footer Marker */}
          <div className="pt-8 mt-12 border-t border-slate-200 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Dokumen Akreditasi STARKES Kemenkes RI 2024</span>
            <span>Halaman 1 / RSUD Bintan</span>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar (MS Word Style) */}
      <div className="bg-slate-800 text-white text-[11px] px-4 py-1.5 flex items-center justify-between flex-shrink-0 font-mono">
        <div className="flex items-center gap-4">
          <span>Halaman 1 dari 1</span>
          <span>{wordCount} Kata</span>
          <span>{charCount} Karakter</span>
          {saveStatus === 'saved' && (
            <span className="text-emerald-300 flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" />
              <span>Draf tersimpan di database ({lastSavedTime})</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-amber-300 flex items-center gap-1 font-sans">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Menyimpan draf...</span>
            </span>
          )}
          {saveStatus === 'idle' && lastSavedTime && (
            <span className="text-slate-400 font-sans">
              Terakhir disimpan: {lastSavedTime}
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="hover:text-teal-400 p-0.5 cursor-pointer"
            title="Perkecil Kanvas"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center">{zoomLevel}%</span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="hover:text-teal-400 p-0.5 cursor-pointer"
            title="Perbesar Kanvas"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(100)}
            className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 cursor-pointer"
            title="Reset Zoom ke 100%"
          >
            100%
          </button>
        </div>
      </div>
    </div>
  );
};
