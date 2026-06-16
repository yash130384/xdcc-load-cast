import React from 'react';
import { formatBytes } from './utils.js';

function SpeedChart({ itemId, history }) {
  if (!history || history.length < 2) return null;

  const height = 45;
  const width = 300;
  
  const maxSpeed = Math.max(...history, 1024 * 1024);
  
  const points = history.map((speed, index) => {
    const x = (index / (history.length - 1)) * width;
    const y = height - (speed / maxSpeed) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  const pathData = `M ${points.join(' L ')}`;
  
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;
  const gradId = `speedGrad-${itemId.replace(/[^a-zA-Z0-9-]/g, '')}`;

  return (
    <div className="download-speed-chart-container" style={{ 
      marginTop: '0.65rem', 
      marginBottom: '0.65rem', 
      width: '100%', 
      height: '50px', 
      position: 'relative',
      background: 'rgba(0, 0, 0, 0.15)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.03)',
      padding: '4px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3,3" />
        
        <path d={areaData} fill={`url(#${gradId})`} />
        
        <path 
          d={pathData} 
          fill="none" 
          stroke="var(--accent-cyan)" 
          strokeWidth="1.25" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ filter: 'drop-shadow(0px 0px 4px rgba(0, 242, 254, 0.3))' }}
        />
      </svg>
      <span style={{ 
        position: 'absolute', 
        top: '4px', 
        left: '6px', 
        fontSize: '0.62rem', 
        fontWeight: 'bold',
        color: 'var(--text-muted)', 
        background: 'rgba(10, 11, 16, 0.75)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '1px 5px',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)'
      }}>
        Max: {formatBytes(maxSpeed)}/s
      </span>
      <span style={{ 
        position: 'absolute', 
        bottom: '4px', 
        right: '6px', 
        fontSize: '0.62rem', 
        fontWeight: 'bold',
        color: 'var(--accent-cyan)', 
        background: 'rgba(10, 11, 16, 0.75)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(0, 242, 254, 0.15)',
        padding: '1px 5px',
        borderRadius: '4px',
        fontFamily: 'var(--font-mono)'
      }}>
        {formatBytes(history[history.length - 1])}/s
      </span>
    </div>
  );
}

export default SpeedChart;