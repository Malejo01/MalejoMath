import { vi, describe, it, expect, beforeEach } from 'vitest'
import { GET as getGrades } from '@/app/api/curriculum/grades/route'
import { GET as getSubjects } from '@/app/api/curriculum/subjects/route'
import { GET as getTopics } from '@/app/api/curriculum/topics/route'
import { sql } from '@/lib/db'

// Mock database helper
vi.mock('@/lib/db', () => ({
  sql: vi.fn(),
}))

describe('Curriculum API Route Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/curriculum/grades', () => {
    it('should return 400 if nivel parameter is missing', async () => {
      const req = new Request('http://localhost/api/curriculum/grades')
      const res = await getGrades(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Parámetro nivel requerido')
    })

    it('should return grades array on success', async () => {
      const mockRows = [{ grado: '1er Año' }, { grado: '2do Año' }]
      vi.mocked(sql).mockResolvedValueOnce(mockRows)

      const req = new Request('http://localhost/api/curriculum/grades?nivel=Secundario')
      const res = await getGrades(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.grades).toEqual(['1er Año', '2do Año'])
      expect(sql).toHaveBeenCalledTimes(1)
    })
  })

  describe('GET /api/curriculum/subjects', () => {
    it('should return 400 if parameters are missing', async () => {
      const req = new Request('http://localhost/api/curriculum/subjects?nivel=Secundario')
      const res = await getSubjects(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Parámetros nivel y grado requeridos')
    })

    it('should return subjects array on success', async () => {
      const mockRows = [{ materia: 'Biología' }, { materia: 'Física' }]
      vi.mocked(sql).mockResolvedValueOnce(mockRows)

      const req = new Request('http://localhost/api/curriculum/subjects?nivel=Secundario&grado=1er+Año')
      const res = await getSubjects(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.subjects).toEqual(['Biología', 'Física'])
      expect(sql).toHaveBeenCalledTimes(1)
    })
  })

  describe('GET /api/curriculum/topics', () => {
    it('should return 400 if parameters are missing', async () => {
      const req = new Request('http://localhost/api/curriculum/topics?nivel=Secundario&grado=1er+Año')
      const res = await getTopics(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBe('Parámetros nivel, grado y materia requeridos')
    })

    it('should return axes structure on success', async () => {
      const mockRows = [
        { eje: 'Eje 1', temas: ['Tema 1.1', 'Tema 1.2'] },
        { eje: 'Eje 2', temas: ['Tema 2.1'] }
      ]
      vi.mocked(sql).mockResolvedValueOnce(mockRows)

      const req = new Request('http://localhost/api/curriculum/topics?nivel=Secundario&grado=1er+Año&materia=Biolog%C3%ADa')
      const res = await getTopics(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.axes).toEqual([
        { eje: 'Eje 1', temas: ['Tema 1.1', 'Tema 1.2'] },
        { eje: 'Eje 2', temas: ['Tema 2.1'] }
      ])
      expect(sql).toHaveBeenCalledTimes(1)
    })
  })
})
