import {
  User,
  PokjaSummary,
  PokjaDetail,
  ElemenPenilaian,
  DocumentItem,
  DocumentCategory,
  DocumentStatus,
} from '../types';

const API_BASE = '/api';

type LoadingListener = (isLoading: boolean) => void;

class ApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private activeRequests = 0;
  private loadingListeners = new Set<LoadingListener>();

  subscribeLoading(listener: LoadingListener): () => void {
    this.loadingListeners.add(listener);
    listener(this.activeRequests > 0);
    return () => {
      this.loadingListeners.delete(listener);
    };
  }

  private notifyLoading() {
    const isLoading = this.activeRequests > 0;
    this.loadingListeners.forEach((fn) => {
      try {
        fn(isLoading);
      } catch {}
    });
    window.dispatchEvent(new CustomEvent('app:loading', { detail: { isLoading } }));
  }

  startLoading() {
    this.activeRequests++;
    this.notifyLoading();
  }

  stopLoading() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.notifyLoading();
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  clearCache() {
    this.cache.clear();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, useCache = false): Promise<T> {
    const isGet = !options.method || options.method === 'GET';
    const now = Date.now();

    if (isGet && useCache && this.cache.has(endpoint)) {
      const entry = this.cache.get(endpoint)!;
      if (now - entry.timestamp < 30000) {
        return entry.data as T;
      }
    }

    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    this.startLoading();
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      let data: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || `Server HTTP Error ${res.status}` };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan pada permintaan server.');
      }

      if (isGet && useCache) {
        this.cache.set(endpoint, { data, timestamp: Date.now() });
      }

      return data as T;
    } finally {
      this.stopLoading();
    }
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    this.clearCache();
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me', {}, true);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  // Pokja
  async getPokjas(): Promise<{ pokjas: PokjaSummary[] }> {
    return this.request<{ pokjas: PokjaSummary[] }>('/pokja', {}, true);
  }

  async getPokjaDetail(id: string): Promise<{ pokja: PokjaDetail }> {
    return this.request<{ pokja: PokjaDetail }>(`/pokja/${id}`, {}, true);
  }

  async getEPDetail(epId: string): Promise<{ ep: ElemenPenilaian }> {
    return this.request<{ ep: ElemenPenilaian }>(`/pokja/ep/${epId}`, {}, false);
  }

  async search(q: string): Promise<{
    results: {
      pokjas: Array<{ id: string; kode: string; nama: string }>;
      eps: Array<{
        id: string;
        kode: string;
        deskripsi: string;
        standar: {
          id: string;
          kode: string;
          pokja: { id: string; kode: string; nama: string };
        };
      }>;
    };
  }> {
    return this.request(`/pokja/search?q=${encodeURIComponent(q)}`, {}, false);
  }

  // Documents
  async createDocument(
    epId: string,
    judul: string,
    kategori: DocumentCategory
  ): Promise<{ message: string; document: DocumentItem }> {
    this.clearCache();
    return this.request<{ message: string; document: DocumentItem }>('/documents', {
      method: 'POST',
      body: JSON.stringify({ epId, judul, kategori }),
    });
  }

  async getDocumentDetail(id: string): Promise<{ document: DocumentItem }> {
    return this.request<{ document: DocumentItem }>(`/documents/${id}`, {}, true);
  }

  async getDocuments(params: {
    status?: DocumentStatus;
    pokjaId?: string;
    search?: string;
  } = {}): Promise<{ total: number; documents: DocumentItem[] }> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.pokjaId) query.set('pokjaId', params.pokjaId);
    if (params.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ total: number; documents: DocumentItem[] }>(`/documents${qs}`);
  }

  async getAuditLogs(params: {
    limit?: number;
    offset?: number;
    aksi?: string;
  } = {}): Promise<{ total: number; logs: any[] }> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    if (params.aksi) query.set('aksi', params.aksi);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ total: number; logs: any[] }>(`/audit-logs${qs}`);
  }

  async uploadVersion(
    documentId: string,
    file: File,
    catatan?: string
  ): Promise<{ message: string; version: any }> {
    this.clearCache();
    const formData = new FormData();
    formData.append('file', file);
    if (catatan) {
      formData.append('catatan', catatan);
    }

    return this.request<{ message: string; version: any }>(`/documents/${documentId}/upload`, {
      method: 'POST',
      body: formData,
    });
  }

  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    catatan?: string
  ): Promise<{ message: string; document: DocumentItem }> {
    this.clearCache();
    return this.request<{ message: string; document: DocumentItem }>(`/documents/${documentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, catatan }),
    });
  }

  async deleteDocument(documentId: string): Promise<{ message: string }> {
    this.clearCache();
    return this.request<{ message: string }>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async addAnnotation(
    documentId: string,
    data: {
      documentVersionId: string;
      pageNumber: number;
      tipe: string;
      catatanRevisi: string;
    }
  ): Promise<{ message: string; annotation: any }> {
    this.clearCache();
    return this.request<{ message: string; annotation: any }>(`/documents/${documentId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveDraft(
    documentId: string,
    contentHtml: string,
    contentJson?: any
  ): Promise<{ message: string; draft: any }> {
    return this.request<{ message: string; draft: any }>(`/documents/${documentId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ contentHtml, contentJson }),
    });
  }

  async publishDraft(
    documentId: string,
    contentHtml: string,
    catatan?: string
  ): Promise<{ message: string; version: any }> {
    this.clearCache();
    return this.request<{ message: string; version: any }>(`/documents/${documentId}/publish-draft`, {
      method: 'POST',
      body: JSON.stringify({ contentHtml, catatan }),
    });
  }

  async ocrDocument(
    versionId: string
  ): Promise<{ message: string; method: string; rawText: string; html: string }> {
    this.clearCache();
    return this.request<{ message: string; method: string; rawText: string; html: string }>(
      `/documents/version/${versionId}/ocr`,
      {
        method: 'POST',
      }
    );
  }
  async getStreamTicket(versionId: string): Promise<string> {
    const res = await this.request<{ ticket: string }>(`/documents/version/${versionId}/ticket`, {
      method: 'POST',
    });
    return res.ticket;
  }
}

export const api = new ApiClient();

