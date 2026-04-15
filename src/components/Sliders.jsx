function Slider({ label, value, min, max, step, onChange, display }) {
  return (
    <div className="slider-row">
      <span className="slider-label">{label}</span>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      <span className="slider-value">{display}</span>
    </div>
  );
}

export default function Sliders({
  closePrice, stockPrice,
  sliderStock, onSliderStock,
  remainingDays0, maxDays,
  sliderDays, onSliderDays,
  sliderIVDelta, onSliderIVDelta,
}) {
  const stockMin = Math.max(1, Math.round(stockPrice * 0.5));
  const stockMax = Math.round(stockPrice * 1.5);

  // Stock slider: position tracks closePrice when null
  const stockVal = sliderStock ?? closePrice;

  // Days slider: position tracks leg 0 remaining days when null
  const daysVal = sliderDays ?? remainingDays0;

  return (
    <div className="sliders-section">
      {/* Stock: what-if close price; range centered on current stockPrice */}
      <Slider
        label="股价"
        value={stockVal}
        min={stockMin}
        max={stockMax}
        step={0.5}
        onChange={onSliderStock}
        display={`$${stockVal.toFixed(2)}`}
      />
      {/* Days: remaining days for leg 0; leg 1 preserves calendar spread gap */}
      <Slider
        label="天数"
        value={daysVal}
        min={0}
        max={maxDays}
        step={1}
        onChange={onSliderDays}
        display={`${daysVal} 天`}
      />
      {/* IV delta: +/- pp applied equally to both legs' IV (preserves per-leg difference) */}
      <Slider
        label="IV 变动"
        value={sliderIVDelta}
        min={-30}
        max={30}
        step={0.5}
        onChange={onSliderIVDelta}
        display={sliderIVDelta === 0 ? '±0%' : `${sliderIVDelta > 0 ? '+' : ''}${sliderIVDelta.toFixed(1)}%`}
      />
    </div>
  );
}
