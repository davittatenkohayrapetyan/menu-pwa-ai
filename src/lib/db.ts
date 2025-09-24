import Dexie, { Table } from 'dexie';

export interface OfflineMenu {
  id?: number;
  menuId: string;
  name: string;
  imageUrl?: string;
  description?: string;
  imageBlob?: Blob;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface OfflineMenuItem {
  id?: number;
  itemId: string;
  menuId: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  nutrition?: string;
  aiEnriched: boolean;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface OfflinePendingUpload {
  id?: number;
  type: 'menu' | 'menuItem';
  data: Record<string, unknown>;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  createdAt: Date;
  retryCount: number;
}

export class MenuDatabase extends Dexie {
  menus!: Table<OfflineMenu>;
  menuItems!: Table<OfflineMenuItem>;
  pendingUploads!: Table<OfflinePendingUpload>;

  constructor() {
    super('MenuPWADatabase');
    
    this.version(1).stores({
      menus: '++id, menuId, name, createdAt, synced',
      menuItems: '++id, itemId, menuId, name, category, createdAt, synced',
      pendingUploads: '++id, type, endpoint, createdAt, retryCount'
    });
  }

  async addPendingUpload(upload: Omit<OfflinePendingUpload, 'id' | 'createdAt' | 'retryCount'>) {
    return await this.pendingUploads.add({
      ...upload,
      createdAt: new Date(),
      retryCount: 0
    });
  }

  async getPendingUploads() {
    return await this.pendingUploads.orderBy('createdAt').toArray();
  }

  async removePendingUpload(id: number) {
    return await this.pendingUploads.delete(id);
  }

  async syncWhenOnline() {
    if (!navigator.onLine) return;

    const pending = await this.getPendingUploads();
    
    for (const upload of pending) {
      try {
        const response = await fetch(upload.endpoint, {
          method: upload.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(upload.data)
        });

        if (response.ok) {
          await this.removePendingUpload(upload.id!);
          
          // Update synced status
          if (upload.type === 'menu' && upload.data.id) {
            await this.menus.where('menuId').equals(upload.data.id as string).modify({ synced: true });
          } else if (upload.type === 'menuItem' && upload.data.id) {
            await this.menuItems.where('itemId').equals(upload.data.id as string).modify({ synced: true });
          }
        } else {
          // Increment retry count
          await this.pendingUploads.update(upload.id!, { retryCount: upload.retryCount + 1 });
        }
      } catch (error) {
        console.error('Sync failed for upload:', upload, error);
        await this.pendingUploads.update(upload.id!, { retryCount: upload.retryCount + 1 });
      }
    }
  }
}

export const db = new MenuDatabase();