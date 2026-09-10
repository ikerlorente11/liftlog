import { describe, expect, it } from 'vitest'
import type { Measurement } from '../types'
import {
  DEFAULT_CONFIG, DEFAULT_FIELDS, addField, addSource, fieldKeyFor, isMassField, isPercentOfWeightField, moveField, moveSource,
  parseConfig, removeField, removeSource, restoreField, restoreSource, serializeConfig, sourceIdFor, updateSource, visibleFields, visibleSources,
} from './measurementConfig'

const ms: Measurement[] = [
  { id: '1', key: 'chest', value: 105, date: 1, source: 'home' },
  { id: '2', key: 'chest', value: 106, date: 2, source: 'home' },
  { id: '3', key: 'weight', value: 90, date: 2, source: 'official' },
]

describe('configuración de medidas: lectura', () => {
  it('sin configuración usa la de serie y sobrevive a JSON roto', () => {
    expect(parseConfig(null)).toBe(DEFAULT_CONFIG)
    expect(parseConfig('{')).toBe(DEFAULT_CONFIG)
    expect(parseConfig(serializeConfig(DEFAULT_CONFIG))).toEqual(DEFAULT_CONFIG)
  })
  it('el peso siempre vuelve aunque falte en el JSON', () => {
    const cfg = parseConfig(JSON.stringify({ fields: DEFAULT_FIELDS.filter((f) => f.key !== 'weight'), sources: [] }))
    expect(cfg.fields[0].key).toBe('weight')
    expect(cfg.sources).toEqual(DEFAULT_CONFIG.sources)
  })
})

describe('campos', () => {
  it('quitar sin datos elimina; con datos oculta y se recupera', () => {
    const a = removeField(DEFAULT_CONFIG, 'neck', ms)
    expect(a.kept).toBe(0)
    expect(a.cfg.fields.find((f) => f.key === 'neck')).toBeUndefined()
    const b = removeField(DEFAULT_CONFIG, 'chest', ms)
    expect(b.kept).toBe(2)
    expect(visibleFields(b.cfg, 'perimeter').some((f) => f.key === 'chest')).toBe(false)
    expect(restoreField(b.cfg, 'chest')).toEqual(DEFAULT_CONFIG)
  })
  it('el peso no se puede quitar', () => {
    expect(removeField(DEFAULT_CONFIG, 'weight', []).error).toBeTruthy()
  })
  it('composición también es configurable y conserva la semántica de unidades', () => {
    const r = removeField(DEFAULT_CONFIG, 'visceral_fat', [])
    expect(visibleFields(r.cfg, 'composition').some((f) => f.key === 'visceral_fat')).toBe(false)
    const added = addField(r.cfg, { label: 'Masa ósea Tanita', group: 'composition', unit: 'kg' })
    expect(added.key).toBe('custom_masa_osea_tanita')
    expect(isMassField(added.cfg, added.key)).toBe(true)
    expect(isPercentOfWeightField(added.cfg, added.key)).toBe(true)
    expect(isPercentOfWeightField(added.cfg, 'weight')).toBe(false)
    expect(isPercentOfWeightField(added.cfg, 'bmr')).toBe(false)
  })
  it('añadir por nombre reutiliza la clave de serie y recupera ocultos sin duplicar', () => {
    expect(fieldKeyFor(' cuello ')).toBe('neck')
    expect(fieldKeyFor('Glúteo')).toBe('glutes')
    const sinCuello = removeField(DEFAULT_CONFIG, 'neck', ms).cfg
    const back = addField(sinCuello, { label: 'Cuello', group: 'perimeter', unit: 'cm' })
    expect(back.cfg.fields.at(-1)).toEqual(DEFAULT_FIELDS.find((f) => f.key === 'neck'))
    const oculto = removeField(DEFAULT_CONFIG, 'chest', ms).cfg
    const rec = addField(oculto, { label: 'pecho', group: 'perimeter', unit: 'cm' })
    expect(rec.cfg.fields.filter((f) => f.key === 'chest')).toHaveLength(1)
    expect(rec.cfg.fields.find((f) => f.key === 'chest')?.hidden).toBeUndefined()
    expect(addField(DEFAULT_CONFIG, { label: 'Pecho', group: 'perimeter', unit: 'cm' }).error).toMatch(/ya está/)
  })
  it('reordena dentro del grupo y deja los ocultos al final', () => {
    const oculto = removeField(DEFAULT_CONFIG, 'chest', ms).cfg
    const moved = moveField(oculto, 'shoulders', -1)
    const per = visibleFields(moved, 'perimeter').map((f) => f.key)
    expect(per.slice(0, 2)).toEqual(['shoulders', 'neck'])
    expect(visibleFields(moved, 'composition')).toEqual(visibleFields(DEFAULT_CONFIG, 'composition'))
    expect(moved.fields.at(-1)?.key).toBe('chest')
    expect(moveField(DEFAULT_CONFIG, 'weight', -1)).toBe(DEFAULT_CONFIG)
  })
})

describe('orígenes', () => {
  it('se añaden con color propio, se renombran y se recolorean', () => {
    const r = addSource(DEFAULT_CONFIG, { label: 'Gimnasio (InBody)' })
    expect(r.id).toBe('src_gimnasio_inbody')
    const s = r.cfg.sources.at(-1)!
    expect(s.color).toBe('#2ecc71')
    const up = updateSource(r.cfg, s.id, { label: 'InBody', color: '#ff5c5c' })
    expect(up.sources.at(-1)).toEqual({ id: s.id, label: 'InBody', color: '#ff5c5c' })
    expect(sourceIdFor('nutricionista')).toBe('official')
    expect(addSource(DEFAULT_CONFIG, { label: 'Nutricionista' }).error).toMatch(/ya existe/)
  })
  it('quitar con datos oculta, sin datos elimina, y nunca se queda sin orígenes', () => {
    const a = removeSource(DEFAULT_CONFIG, 'official', ms)
    expect(a.kept).toBe(1)
    expect(visibleSources(a.cfg).map((s) => s.id)).toEqual(['home'])
    expect(removeSource(a.cfg, 'home', []).error).toBeTruthy()
    expect(restoreSource(a.cfg, 'official')).toEqual(DEFAULT_CONFIG)
    const b = removeSource(DEFAULT_CONFIG, 'home', [])
    expect(b.cfg.sources.map((s) => s.id)).toEqual(['official'])
  })
  it('reordena orígenes visibles', () => {
    expect(visibleSources(moveSource(DEFAULT_CONFIG, 'official', -1)).map((s) => s.id)).toEqual(['official', 'home'])
  })
})
