(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CellPrep = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RATES = Object.freeze({ cd11b: 0.03, cd49b: 0.015, cd45r: 0.015 });

  function normalizeInput(value) {
    return String(value == null ? '' : value).trim().replace(/[０-９．]/g, function (char) {
      return char === '．' ? '.' : String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    });
  }

  function calculate(value, exponent) {
    const normalized = normalizeInput(value);
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
    if (exponent !== 6 && exponent !== 7) return null;
    const coefficient = Number(normalized);
    const millionCells = coefficient * Math.pow(10, exponent - 6);
    const cellCount = millionCells * 1e6;
    if (!Number.isFinite(cellCount) || cellCount <= 0 || cellCount > Number.MAX_SAFE_INTEGER) return null;
    const cd11bUl = millionCells * RATES.cd11b;
    const cd49bUl = millionCells * RATES.cd49b;
    const cd45rUl = millionCells * RATES.cd45r;
    const antibodyTotalUl = millionCells * (RATES.cd11b + RATES.cd49b + RATES.cd45r);
    const beadUl = antibodyTotalUl * 2;
    // N / (200 million cells/mL) × 1000 μL/mL = millionCells × 5 μL.
    const antibodyBufferUl = millionCells * 5;
    const beadBufferUl = millionCells * 10;
    return {
      cellCount, millionCells, cd11bUl, cd49bUl, cd45rUl,
      antibodyTotalUl, beadUl, antibodyBufferUl, beadBufferUl
    };
  }

  function formatVolume(value) {
    if (!Number.isFinite(value) || value < 0) return '—';
    // Round a decimal string to avoid binary floating-point surprises at x.xx5.
    const parts = String(value).split('e');
    const shifted = Number(parts[0] + 'e' + (Number(parts[1] || 0) + 2));
    const rounded = Math.round(shifted) / 100;
    return rounded.toFixed(2);
  }

  function formatCount(value) {
    if (!Number.isFinite(value)) return '—';
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function createCopyText(result) {
    if (!result) return '';
    return [
      'CellPrep · T 细胞磁珠分选',
      '细胞总数：' + formatCount(result.cellCount) + ' 个',
      '', '01 抗体孵育',
      '0.5% BSA/PBS：' + formatVolume(result.antibodyBufferUl) + ' μL',
      'CD11b：' + formatVolume(result.cd11bUl) + ' μL',
      'CD49b：' + formatVolume(result.cd49bUl) + ' μL',
      'CD45R：' + formatVolume(result.cd45rUl) + ' μL',
      '抗体合计：' + formatVolume(result.antibodyTotalUl) + ' μL',
      '', '02 磁珠孵育',
      '0.5% BSA/PBS：' + formatVolume(result.beadBufferUl) + ' μL',
      '磁珠：' + formatVolume(result.beadUl) + ' μL（抗体合计 × 2）',
      '', '显示保留两位小数；合计按未舍入值计算。'
    ].join('\n');
  }

  return { RATES, normalizeInput, calculate, formatVolume, formatCount, createCopyText };
});
