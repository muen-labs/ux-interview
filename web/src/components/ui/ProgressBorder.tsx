import { useRef, useEffect } from 'react'
import { animate, svg, stagger } from 'animejs'

export function ProgressBorder({ speed = 1, color = '#111', color2 = 'var(--secondary)', mode = 'dots', radius = 6, borderWidth = 1 }: { speed?: number; color?: string; color2?: string; mode?: 'dots' | 'line' | 'race' | 'quad'; radius?: number; borderWidth?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || speed === 0) return
    el.innerHTML = ''

    const w = el.offsetWidth
    const h = el.offsetHeight
    if (w < 10 || h < 10) return

    const pathId = 'pb-path-' + Date.now()
    // Inset the motion path by half the border width so it traces the border center,
    // and use the card's corner radius (not a hardcoded small value) to hug the border.
    const m = borderWidth / 2
    const r = Math.min(radius + m, (w - m * 2) / 2, (h - m * 2) / 2)
    const d = 'M ' + (m + r) + ' ' + m +
      ' L ' + (w - m - r) + ' ' + m +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + (w - m) + ' ' + (m + r) +
      ' L ' + (w - m) + ' ' + (h - m - r) +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + (w - m - r) + ' ' + (h - m) +
      ' L ' + (m + r) + ' ' + (h - m) +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + m + ' ' + (h - m - r) +
      ' L ' + m + ' ' + (m + r) +
      ' A ' + r + ' ' + r + ' 0 0 1 ' + (m + r) + ' ' + m + ' Z'

    const svgNS = 'http://www.w3.org/2000/svg'
    const svgEl = document.createElementNS(svgNS, 'svg')
    svgEl.setAttribute('width', String(w))
    svgEl.setAttribute('height', String(h))
    svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h)
    svgEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;'

    // Gradient definition for the line mode stroke
    const defs = document.createElementNS(svgNS, 'defs')
    const gradient = document.createElementNS(svgNS, 'linearGradient')
    gradient.setAttribute('id', 'pb-grad-' + Date.now())
    gradient.setAttribute('x1', '0%')
    gradient.setAttribute('y1', '0%')
    gradient.setAttribute('x2', '100%')
    gradient.setAttribute('y2', '100%')

    const stop1 = document.createElementNS(svgNS, 'stop')
    stop1.setAttribute('offset', '0%')
    stop1.setAttribute('stop-color', color)
    stop1.setAttribute('stop-opacity', '0')

    const stop2 = document.createElementNS(svgNS, 'stop')
    stop2.setAttribute('offset', '100%')
    stop2.setAttribute('stop-color', color)
    stop2.setAttribute('stop-opacity', '1')

    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    defs.appendChild(gradient)

    // Radial gradient for the car
    const carGrad = document.createElementNS(svgNS, 'radialGradient')
    carGrad.setAttribute('id', 'pb-car-' + Date.now())
    carGrad.setAttribute('cx', '50%')
    carGrad.setAttribute('cy', '50%')
    carGrad.setAttribute('r', '50%')

    const cStop1 = document.createElementNS(svgNS, 'stop')
    cStop1.setAttribute('offset', '0%')
    cStop1.setAttribute('stop-color', color)
    cStop1.setAttribute('stop-opacity', '0.08')

    const cStop2 = document.createElementNS(svgNS, 'stop')
    cStop2.setAttribute('offset', '100%')
    cStop2.setAttribute('stop-color', color)
    cStop2.setAttribute('stop-opacity', '0')

    carGrad.appendChild(cStop1)
    carGrad.appendChild(cStop2)
    defs.appendChild(carGrad)
    svgEl.appendChild(defs)

    const path = document.createElementNS(svgNS, 'path')
    path.setAttribute('id', pathId)
    path.setAttribute('d', d)
    path.setAttribute('fill', 'none')
    svgEl.appendChild(path)
    el.appendChild(svgEl)

    const dur = speed === 1 ? 4000 : 8000

    if (mode === 'dots') {
      const count = speed === 1 ? 8 : 4
      const dots: HTMLElement[] = []
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('div')
        dot.style.cssText = 'position:absolute;border-radius:50%;width:4px;height:4px;background:#111;pointer-events:none;'
        el.appendChild(dot)
        dots.push(dot)
      }
      animate(dots, {
        easing: 'linear',
        duration: dur,
        loop: true,
        delay: stagger(dur / count),
        ...svg.createMotionPath('#' + pathId),
      })
    }

    if (mode === 'line') {
      // Visible path that draws itself
      const drawPath = document.createElementNS(svgNS, 'path')
      drawPath.setAttribute('d', d)
      drawPath.setAttribute('fill', 'none')
      drawPath.setAttribute('stroke', 'url(#' + gradient.getAttribute('id') + ')')
      drawPath.setAttribute('stroke-width', '2')
      drawPath.setAttribute('stroke-linecap', 'round')
      drawPath.setAttribute('opacity', '0.25')
      svgEl.appendChild(drawPath)

      const gradId = carGrad.getAttribute('id')
      // Car element that travels along path
      const traveler = document.createElementNS(svgNS, 'circle')
      traveler.setAttribute('r', '48')
      traveler.setAttribute('fill', 'url(#' + gradId + ')')
      traveler.setAttribute('opacity', '1')
      svgEl.appendChild(traveler)

      animate(traveler, {
        easing: 'linear',
        duration: dur,
        loop: true,
        ...svg.createMotionPath('#' + pathId),
      })

      // Line drawing - travels alongside the car
      animate(svg.createDrawable(drawPath), {
        draw: ['0 0', '0 1'],
        easing: 'linear',
        duration: dur,
        loop: true,
        onBegin: function() {
          const parent = el.parentElement
          if (parent) {
            parent.style.borderColor = '#FFF0F0'
          }
        },
      })
    }

    if (mode === 'race') {
      // Two cars racing - pink starts, blue starts 1s later, they wait for each other
      const dur = speed === 1 ? 4000 : 8000
      const blueDelay = 1000

      // Radial gradient for pink car
      const pinkGrad = document.createElementNS(svgNS, 'radialGradient')
      pinkGrad.setAttribute('id', 'pink-car-' + Date.now())
      pinkGrad.setAttribute('cx', '50%'); pinkGrad.setAttribute('cy', '50%'); pinkGrad.setAttribute('r', '50%')
      const ps1 = document.createElementNS(svgNS, 'stop'); ps1.setAttribute('offset', '0%'); ps1.setAttribute('stop-color', color); ps1.setAttribute('stop-opacity', '0.2')
      const ps2 = document.createElementNS(svgNS, 'stop'); ps2.setAttribute('offset', '100%'); ps2.setAttribute('stop-color', color); ps2.setAttribute('stop-opacity', '0')
      pinkGrad.appendChild(ps1); pinkGrad.appendChild(ps2); defs.appendChild(pinkGrad)

      // Radial gradient for blue car
      const blueGrad = document.createElementNS(svgNS, 'radialGradient')
      blueGrad.setAttribute('id', 'blue-car-' + Date.now())
      blueGrad.setAttribute('cx', '50%'); blueGrad.setAttribute('cy', '50%'); blueGrad.setAttribute('r', '50%')
      const bs1 = document.createElementNS(svgNS, 'stop'); bs1.setAttribute('offset', '0%'); bs1.setAttribute('stop-color', color2); bs1.setAttribute('stop-opacity', '0.2')
      const bs2 = document.createElementNS(svgNS, 'stop'); bs2.setAttribute('offset', '100%'); bs2.setAttribute('stop-color', color2); bs2.setAttribute('stop-opacity', '0')
      blueGrad.appendChild(bs1); blueGrad.appendChild(bs2); defs.appendChild(blueGrad)
      svgEl.appendChild(defs)

      const pinkGroup = document.createElementNS(svgNS, 'g')
      const pinkGlow = document.createElementNS(svgNS, 'circle')
      pinkGlow.setAttribute('r', '48'); pinkGlow.setAttribute('fill', 'url(#' + pinkGrad.getAttribute('id') + ')'); pinkGlow.setAttribute('opacity', '1')
      pinkGroup.appendChild(pinkGlow)
      const pinkDot = document.createElementNS(svgNS, 'circle'); pinkDot.setAttribute('r', '2'); pinkDot.setAttribute('fill', color); pinkDot.setAttribute('opacity', '1')
      pinkGroup.appendChild(pinkDot)
      svgEl.appendChild(pinkGroup)

      const blueGroup = document.createElementNS(svgNS, 'g')
      const blueGlow = document.createElementNS(svgNS, 'circle')
      blueGlow.setAttribute('r', '48'); blueGlow.setAttribute('fill', 'url(#' + blueGrad.getAttribute('id') + ')'); blueGlow.setAttribute('opacity', '1')
      blueGroup.appendChild(blueGlow)
      const blueDot = document.createElementNS(svgNS, 'circle'); blueDot.setAttribute('r', '2'); blueDot.setAttribute('fill', color2); blueDot.setAttribute('opacity', '1')
      blueGroup.appendChild(blueDot)
      svgEl.appendChild(blueGroup)

      let pinkDone = false
      let blueDone = false
      function restartBoth() {
        pinkDone = false; blueDone = false
        animePink.restart()
        animeBlue.restart()
      }

      const animePink = animate(pinkGroup, {
        easing: 'linear', duration: dur,
        ...svg.createMotionPath('#' + pathId),
        onComplete: function() {
          pinkDone = true
          if (blueDone) restartBoth()
          else animePink.pause()
        },
      })

      const animeBlue = animate(blueGroup, {
        easing: 'linear', duration: dur,
        delay: blueDelay,
        ...svg.createMotionPath('#' + pathId),
        onComplete: function() {
          blueDone = true
          if (pinkDone) restartBoth()
          else animeBlue.pause()
        },
      })
    }

    if (mode === 'quad') {
      const dur = speed === 1 ? 4000 : 8000
      const cars: { el: SVGElement; done: boolean; anim: any }[] = []
      const colors = [color, color2, color, color2]
      const delays = [0, 1000, 2000, 3000]

      for (let i = 0; i < 4; i++) {
        const grad = document.createElementNS(svgNS, 'radialGradient')
        const gid = 'quad-car-' + i + '-' + Date.now()
        grad.setAttribute('id', gid); grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%')
        const s1 = document.createElementNS(svgNS, 'stop'); s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', colors[i]); s1.setAttribute('stop-opacity', '0.08')
        const s2 = document.createElementNS(svgNS, 'stop'); s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', colors[i]); s2.setAttribute('stop-opacity', '0')
        grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad)

        const group = document.createElementNS(svgNS, 'g')

        const glow = document.createElementNS(svgNS, 'circle')
        glow.setAttribute('r', '48'); glow.setAttribute('fill', 'url(#' + gid + ')'); glow.setAttribute('opacity', '1')
        group.appendChild(glow)

        const dot = document.createElementNS(svgNS, 'circle')
        dot.setAttribute('r', '2'); dot.setAttribute('fill', colors[i]); dot.setAttribute('opacity', '1')
        group.appendChild(dot)

        svgEl.appendChild(group)

        const data: { el: SVGElement; done: boolean; anim: any } = { el: group, done: false, anim: null as any }
        cars.push(data)
      }
      svgEl.appendChild(defs)

      function allDone() { return cars.every(c => c.done) }
      function resetDone() { cars.forEach(c => { c.done = false }) }

      for (let i = 0; i < 4; i++) {
        const idx = i
        cars[i].anim = animate(cars[i].el, {
          easing: 'linear', duration: dur,
          delay: delays[i],
          ...svg.createMotionPath('#' + pathId),
          onComplete: function() {
            cars[idx].done = true
            if (allDone()) {
              resetDone()
              cars.forEach(c => c.anim.restart())
            } else {
              cars[idx].anim.pause()
            }
          },
        })
      }
    }

    return () => { el.innerHTML = '' }
  }, [speed, color, color2, mode])

  if (speed === 0) return null

  return (
    <div ref={containerRef} style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
      borderRadius: 'inherit', overflow: 'visible',
    }} />
  )
}

export default ProgressBorder
