import { MenuDatabase } from '../db'

// Mock Dexie
jest.mock('dexie', () => {
  return {
    __esModule: true,
    default: class MockDexie {
      version() {
        return {
          stores: jest.fn().mockReturnThis(),
        }
      }
    },
    Table: class MockTable {},
  }
})

describe('MenuDatabase', () => {
  let db: MenuDatabase

  beforeEach(() => {
    db = new MenuDatabase()
    // Mock the table methods with proper types
    
    db.pendingUploads = {
      add: jest.fn(),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(),
      })),
      delete: jest.fn(),
      update: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          modify: jest.fn(),
        })),
      })),
    } as unknown as typeof db.pendingUploads

    db.menus = {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          modify: jest.fn(),
        })),
      })),
    } as unknown as typeof db.menus

    db.menuItems = {
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          modify: jest.fn(),
        })),
      })),
    } as unknown as typeof db.menuItems
  })

  describe('addPendingUpload', () => {
    it('adds a pending upload with correct structure', async () => {
      const upload = {
        type: 'menu' as const,
        data: { name: 'Test Menu' },
        endpoint: '/api/menus',
        method: 'POST' as const,
      }

      ;(db.pendingUploads.add as jest.Mock).mockResolvedValue(1)

      const result = await db.addPendingUpload(upload)

      expect(db.pendingUploads.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'menu',
          data: { name: 'Test Menu' },
          endpoint: '/api/menus',
          method: 'POST',
          retryCount: 0,
          createdAt: expect.any(Date),
        })
      )
      expect(result).toBe(1)
    })
  })

  describe('getPendingUploads', () => {
    it('returns pending uploads ordered by creation date', async () => {
      const mockUploads = [
        {
          id: 1,
          type: 'menu' as const,
          data: {},
          endpoint: '/api/menus',
          method: 'POST' as const,
          createdAt: new Date(),
          retryCount: 0,
        },
      ]

      const mockToArray = jest.fn().mockResolvedValue(mockUploads)
      const mockOrderBy = jest.fn().mockReturnValue({ toArray: mockToArray })
      db.pendingUploads.orderBy = mockOrderBy

      const result = await db.getPendingUploads()

      expect(mockOrderBy).toHaveBeenCalledWith('createdAt')
      expect(result).toEqual(mockUploads)
    })
  })

  describe('removePendingUpload', () => {
    it('deletes a pending upload by id', async () => {
      ;(db.pendingUploads.delete as jest.Mock).mockResolvedValue(undefined)

      await db.removePendingUpload(1)

      expect(db.pendingUploads.delete).toHaveBeenCalledWith(1)
    })
  })

  describe('syncWhenOnline', () => {
    beforeEach(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })
      
      // Mock fetch
      global.fetch = jest.fn()
      
      // Mock console.error to suppress expected error logs in tests
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('does not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      await db.syncWhenOnline()

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('syncs pending uploads when online', async () => {
      const mockUploads = [
        {
          id: 1,
          type: 'menu' as const,
          data: { id: 'menu-1', name: 'Test Menu' },
          endpoint: '/api/menus',
          method: 'POST' as const,
          createdAt: new Date(),
          retryCount: 0,
        },
      ]

      const mockToArray = jest.fn().mockResolvedValue(mockUploads)
      const mockOrderBy = jest.fn().mockReturnValue({ toArray: mockToArray })
      db.pendingUploads.orderBy = mockOrderBy
      ;(db.pendingUploads.delete as jest.Mock).mockResolvedValue(undefined)

      const mockModify = jest.fn().mockResolvedValue(undefined)
      const mockEquals = jest.fn().mockReturnValue({ modify: mockModify })
      const mockWhere = jest.fn().mockReturnValue({ equals: mockEquals })
      db.menus.where = mockWhere

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      })

      await db.syncWhenOnline()

      expect(global.fetch).toHaveBeenCalledWith('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUploads[0].data),
      })
      expect(db.pendingUploads.delete).toHaveBeenCalledWith(1)
      expect(mockWhere).toHaveBeenCalledWith('menuId')
      expect(mockEquals).toHaveBeenCalledWith('menu-1')
      expect(mockModify).toHaveBeenCalledWith({ synced: true })
    })

    it('increments retry count on failed sync', async () => {
      const mockUploads = [
        {
          id: 1,
          type: 'menu' as const,
          data: {},
          endpoint: '/api/menus',
          method: 'POST' as const,
          createdAt: new Date(),
          retryCount: 0,
        },
      ]

      const mockToArray = jest.fn().mockResolvedValue(mockUploads)
      const mockOrderBy = jest.fn().mockReturnValue({ toArray: mockToArray })
      db.pendingUploads.orderBy = mockOrderBy
      ;(db.pendingUploads.update as jest.Mock).mockResolvedValue(undefined)

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      })

      await db.syncWhenOnline()

      expect(db.pendingUploads.update).toHaveBeenCalledWith(1, { retryCount: 1 })
    })

    it('handles network errors gracefully', async () => {
      const mockUploads = [
        {
          id: 1,
          type: 'menu' as const,
          data: {},
          endpoint: '/api/menus',
          method: 'POST' as const,
          createdAt: new Date(),
          retryCount: 0,
        },
      ]

      const mockToArray = jest.fn().mockResolvedValue(mockUploads)
      const mockOrderBy = jest.fn().mockReturnValue({ toArray: mockToArray })
      db.pendingUploads.orderBy = mockOrderBy
      ;(db.pendingUploads.update as jest.Mock).mockResolvedValue(undefined)

      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      await db.syncWhenOnline()

      expect(db.pendingUploads.update).toHaveBeenCalledWith(1, { retryCount: 1 })
    })
  })
})
