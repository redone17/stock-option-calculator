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
      <span className="slider-value">{display ?? value}</span>
    </div>
  );
}

export default function Sliders({
  stockPrice, sliderStock, onSliderStock,
  daysToExpiry, sliderDays, onSliderDays,
  avgIV, sliderIV, onSliderIV,
}) {
  const stockMin = Math.max(1, Math.round(stockPrice * 0.5));
  const stockMax = Math.round(stockPrice * 1.5);

  return (
    <div className="sliders-section">
      <Slider
        label="股价"
        value={sliderStock ?? stockPrice}
        min={stockMin}
        max={stockMax}
        step={0.5}
        onChange={onSliderStock}
        display={`$${(sliderStock ?? stockPrice).toFixed(2)}`}
      />
      <Slider
        label="天数"
        value={sliderDays ?? daysToExpiry}
        min={0}
        max={Math.max(1, daysToExpiry)}
        step={1}
        onChange={onSliderDays}
        display={`${sliderDays ?? daysToExpiry} 天`}
      />
      <Slider
        label="IV"
        value={sliderIV ?? avgIV}
        min={5}
        max={150}
        step={0.5}
        onChange={onSliderIV}
        display={`${(sliderIV ?? avgIV).toFixed(1)}%`}
      />
    </div>
  );
}
