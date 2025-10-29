import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchCounties, updateCounty, importCSV, exportCSVUrl } from './api'
import { toPng } from 'html-to-image'

function useSvgLoader() {
  const [svgMarkup, setSvgMarkup] = useState('')
  useEffect(() => {
    fetch('/kansas-counties.svg').then(r => r.text()).then(setSvgMarkup)
  }, [])
  return svgMarkup
}

export default function App() {
  const [counties, setCounties] = useState([])
  const [colors, setColors] = useState({ hasContact: '#9EC9FF', noContact: '#D1D5DB', stroke: '#374151' })
  const svgMarkup = useSvgLoader()
  const mapRef = useRef(null)
  const tooltipRef = useRef(null)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: '' })

  useEffect(() => {
    fetchCounties().then(data => setCounties(data.counties))
  }, [])

  const byId = useMemo(() => Object.fromEntries(counties.map(c => [c.id, c])), [counties])
  const covered = counties.filter(c => !!c.contact && (c.contact.name || c.contact.email || c.contact.phone)).length

  useEffect(() => {
    // Colorize counties after SVG is in DOM
    const root = mapRef.current
    if (!root) return
    const svg = root.querySelector('svg')
    if (!svg) return
    svg.querySelectorAll('[fill]').forEach(el => el.setAttribute('fill', '')) // wipe authoring fills
    svg.querySelectorAll('path, polygon').forEach(el => {
      const id = el.getAttribute('id')
      if (!id) return
      const county = byId[id]
      const has = !!(county && county.contact && (county.contact.name || county.contact.email || county.contact.phone))
      el.setAttribute('fill', has ? colors.hasContact : colors.noContact)
      el.setAttribute('stroke', colors.stroke)
      el.setAttribute('stroke-width', '0.75')
      el.style.cursor = 'pointer'
      el.onmouseenter = (e) => {
        setTooltip({ show: true, x: e.clientX, y: e.clientY, text: id })
      }
      el.onmouseleave = () => setTooltip(s => ({ ...s, show: false }))
      el.onclick = () => {
        const existing = byId[id]?.contact || {}
        const name = prompt(`Contact name for ${id} (leave blank to clear)`, existing.name || '')
        if (name === null) return
        const phone = name ? prompt(`Phone for ${id}`, existing.phone || '') : ''
        if (phone === null && name !== '') return
        const email = name ? prompt(`Email for ${id}`, existing.email || '') : ''
        if (email === null && name !== '') return
        updateCounty(id, name ? { name, phone, email } : {}).then(() => {
          setCounties(cs => cs.map(c => c.id === id ? { id, contact: name ? { name, phone, email } : null } : c))
        }).catch(() => alert('Update failed'))
      }
    })
  }, [svgMarkup, byId, colors])

  function handleRowToggle(c) {
    const on = !!(c.contact && (c.contact.name || c.contact.email || c.contact.phone))
    if (on) {
      updateCounty(c.id, {}).then(() => setCounties(cs => cs.map(x => x.id === c.id ? { id: c.id, contact: null } : x)))
    } else {
      const name = prompt(`Contact name for ${c.id}`) || ''
      const phone = prompt(`Phone for ${c.id}`) || ''
      const email = prompt(`Email for ${c.id}`) || ''
      updateCounty(c.id, { name, phone, email }).then(() => setCounties(cs => cs.map(x => x.id === c.id ? { id: c.id, contact: { name, phone, email } } : x)))
    }
  }

  async function exportPng() {
    if (!mapRef.current) return
    try {
      const dataUrl = await toPng(mapRef.current)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'kansas-map.png'
      a.click()
    } catch (e) {
      alert('Export failed')
    }
  }

  async function handleImportCsv(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importCSV(file)
      const data = await fetchCounties()
      setCounties(data.counties)
      alert('Import complete')
    } catch (err) {
      alert('Import failed')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>KS Counties Contact Map</h1>
        <div className="legend">
          <span className="swatch" style={{ background: colors.hasContact }}></span> Has contact
          <span className="swatch" style={{ background: colors.noContact }}></span> No contact
          <span style={{ marginLeft: '.75rem' }}>{covered}/{counties.length} covered</span>
        </div>
      </div>

      <div className="inline" style={{ gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <label className="color-inputs">Has contact color <input type="color" value={colors.hasContact} onChange={e => setColors(s => ({ ...s, hasContact: e.target.value }))} /></label>
        <label className="color-inputs">No contact color <input type="color" value={colors.noContact} onChange={e => setColors(s => ({ ...s, noContact: e.target.value }))} /></label>
        <label className="color-inputs">Stroke <input type="color" value={colors.stroke} onChange={e => setColors(s => ({ ...s, stroke: e.target.value }))} /></label>
        <button className="btn" onClick={exportPng}>Export PNG</button>
        <a className="btn" href={exportCSVUrl()}>Export CSV</a>
        <label className="btn" htmlFor="csv-import" style={{ cursor: 'pointer' }}>Import CSV</label>
        <input id="csv-import" type="file" accept=".csv" onChange={handleImportCsv} style={{ display: 'none' }} />
      </div>

      <div className="panel">
        <div className="map-wrap" ref={mapRef}>
          <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          {tooltip.show && (
            <div ref={tooltipRef} className="tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
              {tooltip.text}
            </div>
          )}
        </div>

        <aside className="sidebar">
          {counties.map(c => {
            const has = !!(c.contact && (c.contact.name || c.contact.email || c.contact.phone))
            return (
              <div className="county-row" key={c.id}>
                <strong>{c.id}</strong>
                <div className="inline">
                  {has && (
                    <span title={`${c.contact?.name || ''} ${c.contact?.phone || ''} ${c.contact?.email || ''}`}>✅</span>
                  )}
                  <button className="btn" onClick={() => handleRowToggle(c)}>
                    {has ? 'Clear' : 'Set'}
                  </button>
                </div>
              </div>
            )
          })}
        </aside>
      </div>
    </div>
  )
}
