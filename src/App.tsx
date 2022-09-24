import React, { useState, MouseEvent, ChangeEvent } from 'react';
import Plot from 'react-plotly.js';
import { Stats, newStats, calculateStats } from './Stats';

const PRECISION = 2

function App() {
  const urlSearchParams = new URLSearchParams(window?.location?.search);
  const urlParam = urlSearchParams.get('url')
  const [url, setUrl] = useState<string>(urlParam ?? "")
  const [sampleSize, setSampleSize] = useState<number>(100)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [stats, setStats] = useState<Stats>(newStats())
  const [progress, setProgress] = useState<number>(0)

  function resetState() {
    setResponseTimes(() => [])
    setProgress(() => 0)
    setStats(() => newStats())
  }

  function urlOnChange(event: ChangeEvent<HTMLInputElement>) {
    setUrl(() => event.target.value)
  }

  function sampleSizeOnChange(event: ChangeEvent<HTMLInputElement>) {
    setSampleSize(() => +event.target.value)
  }

  function updateUrlSearch() {
    const { origin, pathname } = window.location
    const newUrl = `${origin}${pathname}?url=${encodeURI(url)}`

    window.history.replaceState({}, "", newUrl)
  }

  async function onClick(event: MouseEvent<HTMLButtonElement>) {
    if (!url.startsWith("https://")) {
      alert("URL must start with https://")
      return
    }

    const data: number[] = []
    const requestInit: RequestInit = {
      mode: "no-cors",
      cache: "no-store",
    }

    resetState()
    updateUrlSearch()

    for (let i = 0; i < sampleSize; i++) {
      const startTimeMs = performance.now()
      await fetch(url, requestInit)
      const stopTimeMs = performance.now()
      const timeMs = stopTimeMs - startTimeMs

      data.push(timeMs)

      setResponseTimes((prevState) => [...prevState, timeMs])
      setProgress(() => (data.length / sampleSize) * 100)
      setStats(() => calculateStats(data))
    }
  }

  const plot = {
    layout: {
      title: "Response Time Distribution",
      xaxis: {
        title: "Response Time (ms)"
      },
      yaxis: {
        title: "Total Responses"
      },
    },
    useResizeHandler: true
  }

  return (
    <div className="col-12 col-md-8">
      <div className="p-3 mb-3 border bg-white">
        <div className="row mb-3">
          <label className="col-sm-4 col-form-label">URL</label>
          <div className="col-sm-8">
            <input className="form-control" type="text" value={url} onChange={urlOnChange} placeholder="Enter URL..."></input>
          </div>
        </div>
        <div className="row mb-3">
          <label className="col-sm-4 col-form-label">Sample Size</label>
          <div className="col-sm-8">
            <input className="form-control" type="number" value={sampleSize} onChange={sampleSizeOnChange} min={1}></input>
          </div>
        </div>
        <button className="form-control btn btn-primary mb-3" onClick={onClick}>Start</button>
        <progress className="w-100" value={progress} max="100"></progress>
      </div>

      <div className="border mb-3 bg-white">
        <Plot
          className='w-100'
          data={[
            {
              x: responseTimes,
              type: 'histogram',
            }
          ]}
          layout={plot.layout}
          useResizeHandler={plot.useResizeHandler}
        ></Plot>
      </div>

      <table className="table table-bordered table-striped bg-white">
        <thead>
          <tr>
            <th>Sample Size</th>
            <th>Mean (ms)</th>
            <th>Min (ms)</th>
            <th>Max (ms)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{stats?.size}</td>
            <td>{stats?.mean.toFixed(PRECISION)}</td>
            <td>{stats?.min.toFixed(PRECISION)}</td>
            <td>{stats?.max.toFixed(PRECISION)}</td>
          </tr>
        </tbody>
      </table>

      <table className="table table-bordered table-striped bg-white">
        <thead>
          <tr>
            <th>Percentile</th>
            <th>Response Time (ms)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats?.percentiles).map(([k, v], i) => (
            <tr key={i}>
              <td>{k}</td>
              <td>{v.toFixed(PRECISION)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table table-bordered table-striped bg-white">
        <thead>
          <tr>
            <th>Response Times (ms)</th>
          </tr>
        </thead>
        <tbody>
          {responseTimes.map((responseTime, i) => (
            <tr key={i}>
              <td>{responseTime.toFixed(PRECISION)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
